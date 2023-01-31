const { toJSON } = require("./plugins");
const softDelete = require("mongoose-delete");

module.exports = ({ Schema, Types, model }, mongoosePaginate) => {
  const Partnership = new Schema(
    {
      price: {
        type: String,
        required: true,
      },
      currency: {
        type: String,
        required: true,
      },
      applyIn: {
        years: { type: String, required: true },
        months: { type: String, required: true },
        weeks: { type: String, required: true },
      },
    },
    {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
    }
  );

  Partnership.plugin(softDelete, {
    deletedBy: true,
    deletedAt: true,
    overrideMethods: "all",
  });
  Partnership.plugin(toJSON);
  Partnership.plugin(mongoosePaginate);

  /**
   * @typedef Partnership
   */
  return model("Partnership", Partnership);
};
