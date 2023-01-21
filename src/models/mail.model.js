const { toJSON, diffHistory } = require("./plugins");
const softDelete = require("mongoose-delete");

module.exports = ({ Schema, Types, model }, mongoosePaginate) => {
  const Mail = new Schema(
    {
      from: {
        type: Types.ObjectId,
        ref: "User",
      },
      to: {
        type: Types.ObjectId,
        ref: "User",
      },
      subject: { type: String },
      message: { type: String },
      files: {
        type: [
          {
            type: Types.ObjectId,
            ref: "Media",
          },
        ],
        default: [],
      },
      type: { type: String, default: "usual", enum: ["usual", "invite"] },
      to_is_deleted: { type: Boolean, default: false },
      from_is_deleted: { type: Boolean, default: false },
      is_read: { type: Boolean, default: false },
    },
    {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
    }
  );

  Mail.plugin(softDelete, {
    deletedBy: true,
    deletedAt: true,
    overrideMethods: "all",
  });
  Mail.plugin(toJSON);
  Mail.plugin(mongoosePaginate);

  /**
   * @typedef Mail
   */
  return model("Mail", Mail);
};
