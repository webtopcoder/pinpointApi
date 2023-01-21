const { toJSON, diffHistory } = require("./plugins");
const softDelete = require("mongoose-delete");

module.exports = ({ Schema, Types, model }, mongoosePaginate) => {
  const Media = new Schema(
    {
      filepath: {
        type: String,
        required: true,
      },

      public_id: {
        type: String,
        default: "",
      }, // Cloudinary public id

      size: {
        type: String,
        default: "",
      },

      mimetype: {
        type: String,
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

  Media.plugin(softDelete, {
    deletedBy: true,
    deletedAt: true,
    overrideMethods: "all",
  });
  Media.plugin(toJSON);
  Media.plugin(mongoosePaginate);

  /**
   * @typedef Media
   */
  return model("Media", Media);
};
