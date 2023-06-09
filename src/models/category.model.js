const { toJSON } = require("./plugins");
const softDelete = require("mongoose-delete");

module.exports = ({ Schema, Types, model }, mongoosePaginate) => {
  const Category = new Schema(
    {
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

  Category.virtual("subCategories", {
    ref: "SubCategory",
    localField: "_id",
    foreignField: "category",
  });

  // Category.plugin(softDelete, {
  //   deletedBy: true,
  //   deletedAt: true,
  //   overrideMethods: "all",
  // });
  Category.plugin(toJSON);
  Category.plugin(mongoosePaginate);

  /**
   * @typedef Category
   */
  return model("Category", Category);
};
