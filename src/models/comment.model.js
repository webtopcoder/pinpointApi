const { toJSON, diffHistory } = require("./plugins");
const softDelete = require("mongoose-delete");

module.exports = ({ Schema, Types, model }, mongoosePaginate) => {
  const Comment = new Schema(
    {
      userId: {
        type: Types.ObjectId,
        ref: "User",
      },
      type: {
        type: String,
      },
      typeId: {
        type: Types.ObjectId,
      },
      parentId: {
        type: Types.ObjectId,
        default: null
      },
      body: {
        type: String,
      },
      like: {
        type: Types.ObjectId,
        ref: "Like",
      },
      images: {
        type: [
          {
            type: Types.ObjectId,
            ref: "Media",
          },
        ],
      },
      status: {
        type: String,
        enum: ["active", "deleted"],
        default: "active",
      },
      isActive: {
        type: Boolean,
        default: true,
      },
    },
    {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
    }
  );

  // Comment.plugin(softDelete, {
  //   deletedBy: true,
  //   deletedAt: true,
  //   overrideMethods: "all",
  // });
  Comment.plugin(toJSON);
  Comment.plugin(mongoosePaginate);

  /**
   * @typedef Comment
   */
  return model("Comment", Comment);
};
