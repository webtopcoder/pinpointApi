const { toJSON } = require("./plugins");
const softDelete = require("mongoose-delete");

module.exports = ({ Schema, Types, model }, mongoosePaginate) => {
  const Post = new Schema(
    {
      from: {
        type: Types.ObjectId,
        ref: "User",
      },
      to: {
        type: Types.ObjectId,
        ref: "User",
      },
      content: { type: String, default: "" },
      images: {
        type: [
          {
            type: Types.ObjectId,
            ref: "Media",
          },
        ],
      },
      shoutlist: {
        type: [
          {
            type: Types.ObjectId,
            ref: "User",
          },
        ],
        default: [],
      },
      like: {
        type: Types.ObjectId,
        ref: "Like",
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

  // Post.plugin(softDelete, {
  //   deletedBy: true,
  //   deletedAt: true,
  //   overrideMethods: "all",
  // });

  Post.plugin(toJSON);
  Post.plugin(mongoosePaginate);

  /**
   * @typedef Post
   */
  return model("Post", Post);
};
