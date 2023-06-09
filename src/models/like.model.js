const { toJSON, diffHistory } = require("./plugins");
const softDelete = require("mongoose-delete");

module.exports = ({ Schema, Types, model }, mongoosePaginate) => {
  const Like = new Schema(
    {
      count: { type: Number, default: 0 },
      users: [
        {
          type: Types.ObjectId,
          ref: "User",
        },
      ],
    },
    {
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
    }
  );

  // Like.plugin(softDelete, {
  //   deletedBy: true,
  //   deletedAt: true,
  //   overrideMethods: "all",
  // });
  Like.plugin(toJSON);
  Like.plugin(mongoosePaginate);

  /**
   * @typedef Like
   */
  return model("Like", Like);
};
