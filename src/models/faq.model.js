const { toJSON } = require("./plugins");
const softDelete = require("mongoose-delete");

module.exports = ({ Schema, model }, mongoosePaginate) => {
  const FAQ = new Schema(
    {
      question: {
        type: String,
        required: true,
      },
      answer: {
        type: String,
        required: true,
      },
      isArchived: {
        type: Boolean,
        default: false,
      },
    },
    {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
    }
  );

  // FAQ.plugin(softDelete, {
  //   deletedBy: true,
  //   deletedAt: true,
  //   overrideMethods: "all",
  // });
  FAQ.plugin(toJSON);
  FAQ.plugin(mongoosePaginate);

  /**
   * @typedef FAQ
   */
  return model("FAQ", FAQ);
};
