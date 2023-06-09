const { toJSON } = require("./plugins");
const softDelete = require("mongoose-delete");

module.exports = ({ Schema, Types, model }, mongoosePaginate) => {
  const Setting = new Schema(
    {
      key: {
        type: String,
        required: true,
      },
      value: {
        type: Schema.Types.Mixed,
        required: true,
      },
      extra: [
        {
          type: Types.ObjectId,
          ref: "Additionaluser",
        },
      ],
      user: {
        type: Types.ObjectId,
        ref: "User",
      },
    },
    {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
    }
  );

  // Setting.plugin(softDelete, {
  //   deletedBy: true,
  //   deletedAt: true,
  //   overrideMethods: "all",
  // });
  Setting.plugin(toJSON);
  Setting.plugin(mongoosePaginate);

  /**
   * @typedef Setting
   */
  return model("Setting", Setting);
};
