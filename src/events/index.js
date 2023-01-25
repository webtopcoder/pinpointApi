const EventEmitter = new (require("events").EventEmitter)();
const logger = require("@configs/logger");
const { emailService } = require("@services");
const notificationService = require("@services/notification.service");

const userEvents = {
  USER_ONLINE: "user.online",
  SEND_INVITE: "user.sendInvite",
  SEND_NOTIFICATION: "user.sendNotification",
};

const authEvents = {
  RESET_PASSWORD: "auth.resetPassword",
  VERIFY_EMAIL: "auth.verifyEmail",
};

const events = {
  ...userEvents,
  ...authEvents,
};

Object.keys(events).forEach((event) => {
  EventEmitter.on(events[event], async (data) => {
    try {
      switch (events[event]) {
        case events.USER_ONLINE:
          // await userOnlineService.lastActiveUpdateOrCreate({ user_id: data._id });
          break;
        case events.VERIFY_EMAIL:
          await emailService.sendVerificationEmail(data);
          break;
        case events.RESET_PASSWORD:
          await emailService.sendResetPasswordEmail(data);
          break;
        case events.SEND_INVITE:
          await emailService.sendInviteEmail(data);
          break;
        case events.SEND_NOTIFICATION:
          await notificationService.sendNotification(data);
          break;
        default:
          logger.error("Event not found");
      }
    } catch (error) {
      logger.error(error);
    }
  });
});

module.exports = {
  EventEmitter,
  events,
};
