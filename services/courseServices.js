const { CatchAsyncError } = require("../middlewares/CatchAsyncErrors");
const courseModel = require("../models/courseModel");

const createCourse = CatchAsyncError(async (data, res) => {
  const course = await courseModel.create(data);
  res.status(201).json({
    success: true,
    message: "Course created successfully",
    course
  });
});

module.exports = { createCourse };
