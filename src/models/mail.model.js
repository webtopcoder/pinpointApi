const { toJSON, diffHistory } = require("./plugins");
const softDelete = require("mongoose-delete");

module.exports = ({ Schema, Types, model }, mongoosePaginate) => {
  const Mail = new Schema(
    {
      from: {
        type: Types.ObjectId,
        ref: "User",
      },
      isNotice: {
        type: Boolean,
        default: false,
      },
      to: {
        type: Types.ObjectId,
        ref: "User",
      },
      role: {
        type: String,
        enum: ["user", "partner", "admin"],
      },
      to_invite_email: {
        type: String,
      },
      invite_count: {
        type: Number,
        default: 0,
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
