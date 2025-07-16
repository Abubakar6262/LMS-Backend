const mongoose = require("mongoose");

// Review schema
const reviewSchema = new mongoose.Schema({
  user: {
    type: Object,
    required: true
  },
  rating: {
    type: Number,
    default: 0
  },
  comment: {
    type: String,
    required: true
  },
  replies: [
    {
      user: {
        type: Object,
        required: true
      },
      reply: {
        type: String,
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ]
});


// Resource link schema
const linkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  }
});

// Question/comment schema
const commentSchema = new mongoose.Schema({
  user: {
    type: Object,
    required: true
  },
  comment: {
    type: String,
    required: true
  },
  commentReplies: {
    type: Object,
    default: {}
  }
});

// Course content data schema
const courseDataSchema = new mongoose.Schema({
  videoUrl: {
    type: String,
    required: true
  },
  videoThumbnail: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  videoSection: {
    type: String,
    required: true
  },
  description: String,
  videoLength: Number,
  videoPlayer: String,
  links: [linkSchema],
  suggestion: String,
  questions: [commentSchema]
});

// Main course schema
const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true 
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true 
  },
  estimatedPrice: Number,
  thumbnail: {
    public_id: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    }
  },
  tags: {
    type: String,
    required: true
  },
  courseLevel: {
    type: String,
    required: true
  },
  demoUrl: {
    type: String,
    required: true
  },
  benefits: [{ title: { type: String, required: true } }],
  prerequisites: [{ title: { type: String, required: true } }],
  reviews: [reviewSchema],
  courseData: [courseDataSchema],
  rating: {
    type: Number,
    default: 0
  },
  purchased: {
    type: Number,
    default: 0
  }
}, { timestamps: true }); 


module.exports = mongoose.model('Course', courseSchema);
