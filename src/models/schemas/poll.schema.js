const mongoose = require("mongoose-fill");

const PollSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: { type: [String], required: true, minlength: 4, maxlength: 4 },
    votes: { type: [Number], required: true, default: [0, 0, 0, 0] },
  },
  { _id: false }
);

module.exports = PollSchema;
