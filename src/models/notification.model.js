const { toJSON } = require("./plugins");
const softDelete = require("mongoose-delete");

module.exports = ({ Schema, Types, model }, mongoosePaginate) => {
  const Notification = new Schema(
    {
      title: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      actor: {
        type: Types.ObjectId,
        ref: "User",
      }, // who did the action
      recipient: {
        type: Types.ObjectId,
        ref: "User",
      }, // who will receive the notification
      is_read: {
        type: Boolean,
        default: false,
      },
      type: {
        type: String,
        enum: ["follow", "like", "comment", "mention"],
        required: true,
      },
      url: {
        type: String,
      },
    },
    {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
    }
  );

  Notification.pre("save", async function (next) {
    console.log({ notification: this });
    next();
  });

  Notification.plugin(softDelete, {
    deletedBy: true,
    deletedAt: true,
    overrideMethods: "all",
  });
  Notification.plugin(toJSON);
  Notification.plugin(mongoosePaginate);

  /**
   * @typedef Notification
   */
  return model("Notification", Notification);
};
