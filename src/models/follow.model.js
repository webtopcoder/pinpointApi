const { toJSON, diffHistory } = require("./plugins");
const softDelete = require("mongoose-delete");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

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
      status: {
        type: String,
        enum: ["pending", "decline", "active", "requesting"],
        default: "pending",
      },
    },
    {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
    }
  );

  // Follow.plugin(softDelete, {
  //   deletedBy: true,
  //   deletedAt: true,
  //   overrideMethods: "all",
  // });
  Follow.plugin(toJSON);
  Follow.plugin(mongoosePaginate);
  Follow.plugin(aggregatePaginate);

  /**
   * @typedef Follow
   */
  return model("Follow", Follow);
};
