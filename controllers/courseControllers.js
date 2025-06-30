const { CatchAsyncError } = require("../middlewares/CatchAsyncErrors");
const { createCourse } = require("../services/courseServices");
const ErrorHandler = require("../utils/ErrorHandler");
const cloudinary = require("cloudinary").v2

const uploadCourse = CatchAsyncError(async (req, res, next) => {
    try {
        const data = req.body;
        const thumbnail = data.thumbnail;

        if (thumbnail) {
            const mycloud = await cloudinary.uploader.upload(thumbnail, {
                foldar: "lms/course/thumbnail"
            })
        }

        createCourse(data, res, next)

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
})


module.exports = {
    uploadCourse,
}