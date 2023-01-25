const { toJSON } = require("./plugins");
const softDelete = require("mongoose-delete");
const { Action } = require("../socket/socket");

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
        enum: ["follow", "like", "comment", "mention", "mail"],
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

  Notification.post("save", async function () {
    const notification = this.toJSON();
    let { actor, recipient, type } = notification;
    actor = actor._id.toString();
    recipient = recipient._id.toString();
    switch (type) {
      case "follow":
        await Action.follow(actor, recipient);
        break;
      case "mail":
        await Action.mail(actor, recipient);
        break;
      default:
        break;
    }
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
