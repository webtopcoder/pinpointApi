const { toJSON, diffHistory } = require("./plugins");
const softDelete = require("mongoose-delete");

module.exports = ({ Schema, Types, model }, mongoosePaginate) => {
  const Review = new Schema(
    {
      location: {
        type: Types.ObjectId,
        ref: "Location",
        required: true,
      },
      text: {
        type: String,
      },
      images: {
        type: [
          {
            type: Types.ObjectId,
            ref: "Media",
          },
        ],
      },
      
      like: {
        type: Types.ObjectId,
        ref: "Like",
      },
      rating: {
        type: Number,
        required: true,
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
      user: {
        type: Types.ObjectId,
        ref: "User",
        required: true,
      },
    },
    {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
    }
  );

  // Review.plugin(softDelete, {
  //   deletedBy: true,
  //   deletedAt: true,
  //   overrideMethods: "all",
  // });
  Review.plugin(toJSON);
  Review.plugin(mongoosePaginate);

  /**
   * @typedef Review
   */
  return model("Review", Review);
};
