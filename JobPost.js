const mongoose = require("mongoose")
const Schema = mongoose.Schema

const JobSchema = new Schema(
  {
    _id: Number,
    title: String,
    link: String,
    datePosted: String,
    description: { type: String },
  },
  { usePushEach: true }
)

module.exports = mongoose.model("job", JobSchema)
