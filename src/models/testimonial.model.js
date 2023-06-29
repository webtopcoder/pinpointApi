const { toJSON } = require("./plugins");
const softDelete = require("mongoose-delete");

module.exports = ({ Schema, Types, model }, mongoosePaginate) => {
  const Testimonial = new Schema(
    {
      username: {
        type: String,
        required: true,
      },
      occupation: {
        type: String,
        required: true,
      },
      content: {
        type: String,
        required: true,
      },
      image: {
        type: Schema.Types.ObjectId,
        ref: "Media",
        default: null,
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

  // Testimonial.plugin(softDelete, {
  //   deletedBy: true,
  //   deletedAt: true,
  //   overrideMethods: "all",
  // });
  Testimonial.plugin(toJSON);
  Testimonial.plugin(mongoosePaginate);

  /**
   * @typedef Testimonial
   */
  return model("Testimonial", Testimonial);
};
