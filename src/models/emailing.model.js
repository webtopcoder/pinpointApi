const { toJSON, diffHistory } = require("./plugins");
const softDelete = require("mongoose-delete");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

module.exports = ({ Schema, Types, model }, mongoosePaginate) => {
  const Emailing = new Schema(
    {
      template: {
        type: String,
        enum: ["local", "global", "grandfather"],
      },
      email: {
        type: String,
      },
      status: { type: Boolean, default: false },
    },
    {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
    }
  );

  // Emailing.plugin(softDelete, {
  //   deletedBy: true,
  //   deletedAt: true,
  //   overrideMethods: "all",
  // });
  Emailing.plugin(toJSON);
  Emailing.plugin(mongoosePaginate);
  Emailing.plugin(aggregatePaginate);

  /**
   * @typedef Emailing
   */
  return model("Emailing", Emailing);
};
