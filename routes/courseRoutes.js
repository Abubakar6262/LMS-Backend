const expres = require("express");
const courseRouter = expres.Router();
const { isAuthenticated, validateUserRole } = require("../middlewares/Auth");
const {
  uploadCourse,
  getCourseById,
  updateCourse
} = require("../controllers/courseControllers");

// test route
courseRouter.get("/", (req, res) => {
  return res.status(200).json({
    message: "Route working success"
  });
});

// Create Course
courseRouter.post("/create-course",isAuthenticated, validateUserRole("admin"),uploadCourse);

// get course by id
courseRouter.get("/get-course/:id",isAuthenticated,getCourseById);

// Update course By id
courseRouter.put("/update-course/:id",isAuthenticated,validateUserRole("admin"),updateCourse);

module.exports = courseRouter;
