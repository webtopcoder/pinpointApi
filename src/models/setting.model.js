const { toJSON } = require("./plugins");
const softDelete = require("mongoose-delete");

module.exports = ({ Schema, model }, mongoosePaginate) => {
  const Setting = new Schema(
    {
      key: {
        type: String,
        required: true,
      },
      value: {
        type: String,
        required: true,
      },
    },
    {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
    }
  );

  Setting.plugin(softDelete, {
    deletedBy: true,
    deletedAt: true,
    overrideMethods: "all",
  });
  Setting.plugin(toJSON);
  Setting.plugin(mongoosePaginate);

  /**
   * @typedef Setting
   */
  return model("Setting", Setting);
};
