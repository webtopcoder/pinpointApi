const mongoose = require("mongoose-fill");

const PollSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, default: "" },
    options: {
      type: [String],
      required: true,
      minlength: 4,
      maxlength: 4,
      default: Array(4).fill(""),
    },
    votes: { type: [Number], required: true, default: Array(4).fill(0) },
  },
  { _id: false }
);

module.exports = PollSchema;
