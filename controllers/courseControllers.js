const { CatchAsyncError } = require("../middlewares/CatchAsyncErrors");
const { createCourse } = require("../services/courseServices");
const courseModel = require("../models/courseModel")
const ErrorHandler = require("../utils/ErrorHandler");
const cloudinary = require("cloudinary").v2

// const uploadCourse = CatchAsyncError(async (req, res, next) => {
//     try {
//         const data = req.body;
//         const thumbnail = data.thumbnail;

//         if (thumbnail) {
//             const mycloud = await cloudinary.uploader.upload(thumbnail, {
//                 foldar: "lms/course/thumbnail"
//             })
//         }

//         createCourse(data, res, next)

//     } catch (error) {
//         return next(new ErrorHandler(error.message, 500));
//     }
// })

const uploadCourse = CatchAsyncError(async (req, res, next) => {
    try {
        const data = req.body;
        let { thumbnail } = data;

        // Validate required fields
        if (!data.title || !data.description || !data.price || !thumbnail || !data.tags || !data.courseLevel || !data.demoUrl) {
            return next(new ErrorHandler("Missing required fields", 400));
        }

        // Upload thumbnail to Cloudinary if it's a URL or base64 string
        if (thumbnail && typeof thumbnail === "object" && thumbnail.url) {
            const mycloud = await cloudinary.uploader.upload(thumbnail.url, {
                folder: "lms/course/thumbnail"
            });

            data.thumbnail = {
                public_id: mycloud.public_id,
                url: mycloud.secure_url
            };
        }

        // Proceed to service for DB creation
        createCourse(data, res, next);

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
})

// get Course By Id
const getCourseById = CatchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    const course = await courseModel.findById(id).select(
        "-courseData.videoUrl -courseData.questions -courseData.suggestion"
    );

    if (!course) {
        return next(new ErrorHandler("Course not found", 404));
    }

    res.status(200).json({
        success: true,
        course
    });
});

// Update course By Id
const updateCourse = CatchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const data = req.body;
    const newThumbnail = data.thumbnail;

    const course = await courseModel.findById(id);
    if (!course) {
        return next(new ErrorHandler("Course not found", 404));
    }

    // Check if thumbnail is being updated
    if (newThumbnail && typeof newThumbnail === "object" && newThumbnail.url) {
        // Remove old image if needed (optional)
        if (course.thumbnail && course.thumbnail.public_id) {
            await cloudinary.uploader.destroy(course.thumbnail.public_id);
        }

        const mycloud = await cloudinary.uploader.upload(newThumbnail.url, {
            folder: "lms/course/thumbnail"
        });

        data.thumbnail = {
            public_id: mycloud.public_id,
            url: mycloud.secure_url
        };
    }

    const updatedCourse = await courseModel.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        message: "Course updated successfully",
        course: updatedCourse
    });
});

// Add question
const addQuestion = CatchAsyncError(async (req, res, next) => {
    try {
        const { courseId, videoTitle, question } = req.body;
        const user = req.user;

        // Validate input
        if (!courseId || !videoTitle || !question) {
            return next(new ErrorHandler("All fields are required", 400));
        }

        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return next(new ErrorHandler("Invalid course ID", 400));
        }

        const course = await courseModel.findById(courseId);
        if (!course) {
            return next(new ErrorHandler("Course not found", 404));
        }

        const video = course.courseData.find(
            (item) => item.title.trim().toLowerCase() === videoTitle.trim().toLowerCase()
        );

        if (!video) {
            return next(new ErrorHandler("Video section not found", 404));
        }

        const newQuestion = {
            user: {
                _id: user._id,
                name: user.name
            },
            comment: question,
            commentReplies: {}
        };

        video.questions.push(newQuestion);
        await course.save();

        res.status(200).json({
            success: true,
            message: "Question added successfully",
            videoSection: video.title,
            questions: video.questions
        })
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }

})

const addAnswer = CatchAsyncError(async (req, res, next) => {
    try {
        const { courseId, videoTitle, questionId, answer } = req.body;
        const user = req.user;

        if (!courseId || !videoTitle || !questionId || !answer) {
            return next(new ErrorHandler("All fields are required", 400));
        }

        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return next(new ErrorHandler("Invalid course ID", 400));
        }

        const course = await courseModel.findById(courseId);
        if (!course) {
            return next(new ErrorHandler("Course not found", 404));
        }

        // Find the video section
        const video = course.courseData.find(
            (item) => item.title.trim().toLowerCase() === videoTitle.trim().toLowerCase()
        );

        if (!video) {
            return next(new ErrorHandler("Video section not found", 404));
        }

        // Find the question
        const question = video.questions.find(
            (q) => q._id.toString() === questionId
        );

        if (!question) {
            return next(new ErrorHandler("Question not found", 404));
        }

        // Set the reply
        question.commentReplies = {
            reply: answer,
            replier: user.name,
            repliedAt: new Date()
        };

        await course.save();

        res.status(200).json({
            success: true,
            message: "Answer added successfully",
            reply: question.commentReplies
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500))
    }
})


// add Review in course
const addReview = CatchAsyncError(async (req, res, next) => {
    try {
        const userCourseList = req.user?.courses;
        const courseId = req.params.id;

        const courseExists = userCourseList?.some(
            (course) => course._id.toString() === courseId
        );

        if (!courseExists) {
            return next(new ErrorHandler("You are not eligible to access this course", 403));
        }

        const { review, rating } = req.body;

        const course = await courseModel.findById(courseId);
        if (!course) {
            return next(new ErrorHandler("Course not found", 404));
        }

        // Optional: Check if user has already reviewed
        const alreadyReviewed = course.reviews.find(
            (rev) => rev.user._id?.toString() === req.user._id.toString()
        );
        if (alreadyReviewed) {
            return next(new ErrorHandler("You have already reviewed this course", 400));
        }

        const reviewData = {
            user: {
                _id: req.user._id,
                name: req.user.name,
                email: req.user.email,
            },
            comment: review,
            rating,
        };

        course.reviews.push(reviewData);

        // Update average rating
        const avgRating =
            course.reviews.reduce((acc, rev) => acc + rev.rating, 0) /
            course.reviews.length;
        course.rating = avgRating;

        await course.save();

        res.status(200).json({
            success: true,
            message: "Review added successfully",
            course,
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// add replay to review
const replyToReview = CatchAsyncError(async (req, res, next) => {
    const { courseId, reviewId } = req.params;
    const { reply } = req.body;

    if (!reply) {
        return next(new ErrorHandler("Reply text is required", 400));
    }

    const course = await courseModel.findById(courseId);
    if (!course) {
        return next(new ErrorHandler("Course not found", 404));
    }

    const review = course.reviews.id(reviewId);
    if (!review) {
        return next(new ErrorHandler("Review not found", 404));
    }

    const replyData = {
        user: {
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email
        },
        reply
    };

    review.replies = review.replies || [];
    review.replies.push(replyData);

    await course.save();

    res.status(200).json({
        success: true,
        message: "Reply added to review successfully",
        review
    });
});
module.exports = {
    uploadCourse,
    getCourseById,
    updateCourse,
    addQuestion,
    addAnswer,
    addReview,
    replyToReview
}
