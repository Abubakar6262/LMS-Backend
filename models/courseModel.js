const mongoose = require("mongoose")

const reviewSchema = new mongoose.Schema({
   user: Object,
   rating: {
      type: Number,
      default: 0
   },
   comment: String
})

const linkSchema = new mongoose.Schema({
   title: String,
   url: String
})

const commentSchema = new mongoose.Schema({
   user: Object,
   comment: String,
   commentReplies: Object
})

const courseDataSchea = new mongoose.Schema({
   videoUrl: String,
   videoThumbnail: String,
   title: String,
   videoSection: String,
   description: String,
   videoLength: Number,
   videoPlayer: String,
   links: [linkSchema],
   suggestion: String,
   questions: [commentSchema]
})

const courseSchema = new mongoose.Schema({
   title: {
      type: String,
      require: true
   },
   description: {
      type: String,
      require: true
   },
   price: {
      type: Number,
      return: true
   },
   estimatedPrice: {
      type: Number,
   },
   thumbnail: {
      publick_id: {
         type: String,
         require: true
      },
      url: {
         type: String,
         require: true
      }
   },
   tags: {
      type: String,
      require: true
   },
   courseLevel: {
      type: String,
      require: true
   },
   demoUrl: {
      type: String,
      require: true
   },
   benefits: [{ title: String }],
   prerequisites: [{ title: String }],
   reviews: [reviewSchema],
   courseData: [courseDataSchea],
   rating: {
      type: Number,
      default: 0
   },
   purchased: {
      type: Number,
      default: 0
   }


})


module.exports = mongoose.model("course", courseSchema)