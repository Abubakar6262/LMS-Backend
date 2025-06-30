const expres = require("express");
const { isAuthenticated } = require("../middlewares/Auth");
const { uploadCourse } = require("../controllers/courseControllers");
const courseRouter = expres.Router();


courseRouter.get("/", (req, res) => {
    return res.status(200).json({
        message: "Route working success"
    })
})

// create Course
courseRouter.post("/create-course", isAuthenticated.validateUserRole("admin"), uploadCourse)

module.exports = courseRouter