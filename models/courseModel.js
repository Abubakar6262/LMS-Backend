const mongoose = require("mongoose")


const courseSchema = new mongoose.Schema({
   title: {
      type: String,
      require: [true, "Please enter course tile"],
      minlenght: [3, "Title must has at leat three char"]
   },
   description: {
      type: String,

   }
      

})


module.exports = mongoose.model("course", courseSchema)