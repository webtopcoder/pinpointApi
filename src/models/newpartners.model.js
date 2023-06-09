const { toJSON } = require("./plugins");
const softDelete = require("mongoose-delete");

module.exports = ({ Schema, Types, model }, mongoosePaginate) => {
  const Newpartners = new Schema(
    {
      username: {
        type: String,
        required: true,
      },
      category: {
        type: Types.ObjectId,
        ref: "Category",
      },
      content: {
        type: String,
        required: true,
      },
      city: { type: String },
      state: { type: String },
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

  // Newpartners.plugin(softDelete, {
  //   deletedBy: true,
  //   deletedAt: true,
  //   overrideMethods: "all",
  // });
  Newpartners.plugin(toJSON);
  Newpartners.plugin(mongoosePaginate);

  /**
   * @typedef Newpartners
   */
  return model("Newpartners", Newpartners);
};
