const { toJSON, diffHistory } = require("./plugins");
const softDelete = require("mongoose-delete");

module.exports = ({ Schema, Types, model }, mongoosePaginate) => {
  const SubCategory = new Schema(
    {
      category: {
        type: Types.ObjectId,
        ref: "Category",
      },
      name: { type: String, required: true },
      image: {
        type: Types.ObjectId,
        ref: "Media",
      },
    },
    {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
    }
  );

  // SubCategory.plugin(softDelete, {
  //   deletedBy: true,
  //   deletedAt: true,
  //   overrideMethods: "all",
  // });
  SubCategory.plugin(toJSON);
  SubCategory.plugin(mongoosePaginate);

  /**
   * @typedef SubCategory
   */
  return model("SubCategory", SubCategory);
};
