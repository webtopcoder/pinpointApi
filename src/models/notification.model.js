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
      flag: {
        type: String,
        default: null,
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
        enum: [
          "follow",
          "like",
          "mention",
          "mail",
          "addLocation",
          "addEvent",
          "shoutout",
          "review",
          "post",
          "reply",
          "notice",
          "comment",
          "LocationActive",
          "checkIn",
          "location",
          "signup",
          "contact"
        ],
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
    let { actor, recipient, type, flag } = notification;
    if (type !== "contact" && type !== "signup") {
      actor = actor._id.toString();
      recipient = recipient._id.toString();
      switch (type) {
        case "follow":
          await Action.follow(actor, recipient, flag, notification);
          break;
        case "mail":
          await Action.mail(actor, recipient, notification);
          break;
        case "notice":
          await Action.notice(actor, recipient, notification);
          break;
        case "addLocation":
          await Action.addLocation(actor, recipient, notification);
          break;
        case "shoutout":
          await Action.shoutout(actor, recipient, notification);
          break;
        case "post":
          await Action.post(actor, recipient, notification);
          break;
        default:
          await Action.defaultNotification(actor, recipient, notification);
          break;
      }
    }

  });

  // Notification.plugin(softDelete, {
  //   deletedBy: true,
  //   deletedAt: true,
  //   overrideMethods: "all",
  // });
  Notification.plugin(toJSON);
  Notification.plugin(mongoosePaginate);

  /**
   * @typedef Notification
   */
  return model("Notification", Notification);
};
