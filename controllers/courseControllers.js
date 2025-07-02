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

module.exports = {
    uploadCourse,
    getCourseById,
    updateCourse
}
