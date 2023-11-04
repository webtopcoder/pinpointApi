const { toJSON, diffHistory } = require("./plugins");
const softDelete = require("mongoose-delete");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

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
        enum: ["user", "partner", "admin", "eventhost"],
      },
      to_invite_email: {
        type: String,
      },
      invite_count: {
        type: Number,
        default: 0,
      },
      parent: {
        type: Types.ObjectId,
        ref: "Mail"
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
      sent_is_deleted: { type: Boolean, default: false },
      from_is_deleted: { type: Boolean, default: false },
      is_star: { type: Boolean, default: false },
      reply: { type: Boolean, default: false },
      is_read: { type: Boolean, default: false },
    },
    {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
    }
  );

  // Mail.plugin(softDelete, {
  //   deletedBy: true,
  //   deletedAt: true,
  //   overrideMethods: "all",
  // });
  Mail.plugin(toJSON);
  Mail.plugin(mongoosePaginate);
  Mail.plugin(aggregatePaginate);

  /**
   * @typedef Mail
   */
  return model("Mail", Mail);
};
