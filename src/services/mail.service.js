const httpStatus = require("http-status"),
  { User, Mail } = require("@models"),
  ApiError = require("@utils/ApiError"),
  customLabels = require("@utils/customLabels"),
  defaultSort = require("@utils/defaultSort");
const { EventEmitter, events } = require("../events");
const userService = require("./user.service");
const mongoose = require("mongoose-fill");

const createMail = async (mailBody) => {
  const mail = await Mail.create(mailBody);
  return mail;
};

const getMailById = async (mailId) => {
  return Mail.findById(mailId);
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
  const to_user = await userService.getUserByEmail(mailBody.to_invite_email);
  if (to_user) {
    throw new ApiError(httpStatus.CONFLICT, "User with this email exists");
  }

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

  const to_user = await userService.getUserByEmail(mail.to_invite_email);
  if (to_user) {
    throw new ApiError(httpStatus.CONFLICT, "User with this email exists");
  }

  await updateMail(mailId, {
    invite_count: mail.invite_count + 1,
  });

  EventEmitter.emit(events.SEND_INVITE, {
    senderId: mail.from,
    inviteTo: mail.to_invite_email,
  });

  return mail;
};

const getPendingInvites = async (userId) => {
  const mails = await queryMails({
    from: userId,
    type: "invite",
    is_read: false,
    from_is_deleted: false,
  });
  return mails;
};

const bulkDelete = async (mailIds, userId) => {
  const objectMailIds = mailIds.map((id) => mongoose.Types.ObjectId(id));
  const objectUserId = mongoose.Types.ObjectId(userId);
  const mails = await Mail.find({
    _id: { $in: objectMailIds },
    $or: [{ to: objectUserId }, { from: objectUserId }],
  });

  const bulkOps = mails.map((mail) => {
    if (mail.to == userId) {
      return {
        updateOne: {
          filter: { _id: mail._id },
          update: { $set: { to_is_deleted: true } },
        },
      };
    }

    if (mail.from == userId) {
      return {
        updateOne: {
          filter: { _id: mail._id },
          update: { $set: { from_is_deleted: true } },
        },
      };
    }
  });

  Mail.bulkWrite(bulkOps, (err, result) => {
    if (err) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err);
    }
  });
};

const bulkUpdate = async (mailIds, updateBody, userId) => {
  const objectMailIds = mailIds.map((id) => mongoose.Types.ObjectId(id));
  const objectUserId = mongoose.Types.ObjectId(userId);
  const mails = await Mail.find({
    _id: { $in: objectMailIds },
    $or: [{ to: objectUserId }, { from: objectUserId }],
  });

  console.log({ mails });

  const bulkOps = mails.map((mail) => {
    return {
      updateOne: {
        filter: { _id: mail._id },
        update: updateBody,
      },
    };
  });

  Mail.bulkWrite(bulkOps, (err, result) => {
    if (err) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err);
    }
  });
};

module.exports = {
  createMail,
  queryMails,
  updateMail,
  invite,
  resendInvite,
  getPendingInvites,
  getMailById,
  bulkDelete,
  bulkUpdate,
};
