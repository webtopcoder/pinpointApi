const httpStatus = require("http-status"),
  { User, Mail } = require("@models"),
  ApiError = require("@utils/ApiError"),
  customLabels = require("@utils/customLabels"),
  defaultSort = require("@utils/defaultSort");
const { EventEmitter, events } = require("../events");

const createMail = async (mailBody) => {
  const mail = await Mail.create(mailBody);
  return mail;
};

const queryMails = async (filter, options) => {
  const mails = await Mail.paginate(filter, {
    customLabels,
    sort: defaultSort,
    ...options,
  });
  return mails;
};

const updateMail = async (mailId, updateBody) => {
  const mail = await Mail.findById(mailId);
  if (!mail) {
    throw new ApiError(httpStatus.NOT_FOUND, "Mail not found");
  }
  Object.assign(mail, updateBody);
  await mail.save();
  return mail;
};

const invite = async (mailBody) => {
  const mail = await createMail({ ...mailBody, type: "invite" });

  EventEmitter.emit(events.SEND_INVITE, {
    senderId: mailBody.from,
    inviteTo: mailBody.to_invite_email,
    message: mailBody.message,
  });
  return mail;
};

const resendInvite = async (mailId) => {
  const mail = await Mail.findById(mailId);
  if (!mail || mail.type !== "invite") {
    throw new ApiError(httpStatus.NOT_FOUND, "Mail not found");
  }

  EventEmitter.emit(events.SEND_INVITE, {
    senderId: mail.from,
    inviteTo: mail.to_invite_email,
  });

  return mail;
};

module.exports = {
  createMail,
  queryMails,
  updateMail,
  invite,
  resendInvite,
};
