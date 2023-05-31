const EventEmitter = new (require("events").EventEmitter)();
const logger = require("@configs/logger");
const { emailService } = require("@services");
const notificationService = require("@services/notification.service");

const userEvents = {
  USER_ONLINE: "user.online",
  SEND_INVITE: "user.sendInvite",
  SEND_NOTIFICATION: "user.sendNotification",
  ADMIN_SEND_MAIL: "admin.sendMail",
  SEND_ADDITION_USER: "user.sendAdditionUser",
  PARTNER_STATUS: "user.sendStatus",
};

const authEvents = {
  RESET_PASSWORD: "auth.resetPassword",
  VERIFY_EMAIL: "auth.verifyEmail",
  COMPOSE_EMAILING: "auth.composeemailing",
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
        case events.COMPOSE_EMAILING:
          await emailService.sendComposeEmail(data);
          break;
        case events.SEND_ADDITION_USER:
          await emailService.sendAdditionUserEmail(data);
          break;
        case events.RESET_PASSWORD:
          await emailService.sendResetPasswordEmail(data);
          break;
        case events.SEND_INVITE:
          await emailService.sendInviteEmail(data);
          break;
        case events.PARTNER_STATUS:
          await emailService.sendPartnerStatus(data);
          break;
        case events.SEND_NOTIFICATION:
          await notificationService.sendNotification(data);
          break;
        case events.ADMIN_SEND_MAIL:
          await emailService.sendMailFromAdmin(data);
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
