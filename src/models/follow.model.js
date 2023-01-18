const { toJSON, diffHistory } = require("./plugins");
const softDelete = require("mongoose-delete");

module.exports = ({ Schema, Types, model }, mongoosePaginate) => {
  const Follow = new Schema(
    {
      follower: {
        type: Types.ObjectId,
        ref: "User",
      },
      following: {
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

  Follow.plugin(softDelete, {
    deletedBy: true,
    deletedAt: true,
    overrideMethods: "all",
  });
  Follow.plugin(toJSON);
  Follow.plugin(mongoosePaginate);

  /**
   * @typedef Follow
   */
  return model("Follow", Follow);
};
