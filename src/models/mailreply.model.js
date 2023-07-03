const { toJSON, diffHistory } = require("./plugins");
const softDelete = require("mongoose-delete");

module.exports = ({ Schema, Types, model }, mongoosePaginate) => {
  const Mailreply = new Schema(
    {
      from: {
        type: Types.ObjectId,
        ref: "User",
      },
      to: {
        type: Types.ObjectId,
        ref: "User",
      },
      reply: {
        type: Types.ObjectId,
        ref: "Mail",
      },
      role: {
        type: String,
        enum: ["user", "partner", "admin", "eventhost"],
      },
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

  // Mailreply.plugin(softDelete, {
  //   deletedBy: true,
  //   deletedAt: true,
  //   overrideMethods: "all",
  // });
  Mailreply.plugin(toJSON);
  Mailreply.plugin(mongoosePaginate);

  /**
   * @typedef Mailreply
   */
  return model("Mailreply", Mailreply);
};
