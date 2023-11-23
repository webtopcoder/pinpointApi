const mongoose = require("mongoose-fill");

// const PollSchema = new mongoose.Schema(
//   {
//     question: { type: String, required: true, default: "" },
//     options: {
//       type: [String],
//       required: true,
//       minlength: 1,
//       maxlength: 10,
//       default: Array(4).fill(""),
//     },
//     votes: { type: [Number], required: true, default: Array(4).fill(0) },
//     usersVoted: {
//       type: [
//         {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "User",
//         },
//       ],
//       required: true,
//       default: [],
//     },
//   },
//   { _id: false }
// );

// module.exports = PollSchema;


const PollSchema = new mongoose.Schema(
  {
    question: { type: String },
    options: {
      type: [
        {
          optionText: { type: String },
          votes: { type: Number, default: 0 },
        },
      ],
      required: true,
      validate: [
        {
          validator: function (opts) {
            return opts.length >= 0 && opts.length <= 10;
          },
          message: "Options should be between 1 and 10",
        },
      ],
    },
    usersVoted: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Method to update votes for an option
PollSchema.methods.voteForOption = async function (optionIndex) {
  if (optionIndex >= 0 && optionIndex < this.options.length) {
    this.options[optionIndex].votes += 1;
    await this.save();
    return this;
  } else {
    throw new Error("Invalid option index");
  }
};


module.exports = PollSchema;
