const { toJSON, diffHistory } = require("./plugins");
const softDelete = require("mongoose-delete");

module.exports = ({ Schema, Types, model }, mongoosePaginate) => {
  const Category = new Schema(
    {
      name: { type: String, required: true },
    },
    {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
    }
  );

  Category.plugin(softDelete, {
    deletedBy: true,
    deletedAt: true,
    overrideMethods: "all",
  });
  Category.plugin(toJSON);
  Category.plugin(mongoosePaginate);

  /**
   * @typedef Category
   */
  return model("Category", Category);
};
