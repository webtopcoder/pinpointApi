const { toJSON } = require("./plugins");
const softDelete = require("mongoose-delete");

module.exports = ({ Schema, Types, model }, mongoosePaginate) => {
  const Shoutout = new Schema(
    {
      from: {
        type: Types.ObjectId,
        ref: "User",
      },
      to: {
        type: Types.ObjectId,
        ref: "User",
      },
      post: {
        type: Types.ObjectId,
        ref: "Post",
      },
      status: {
        type: String,
        enum: ["active", "pending", "deleted"],
        default: "active",
      },
    },

    {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
    }
  );

  // Shoutout.plugin(softDelete, {
  //   deletedBy: true,
  //   deletedAt: true,
  //   overrideMethods: "all",
  // });
  Shoutout.plugin(toJSON);
  Shoutout.plugin(mongoosePaginate);

  /**
   * @typedef Shoutout
   */
  return model("Shoutout", Shoutout);
};
