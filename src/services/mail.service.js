const httpStatus = require("http-status"),
  { User, Mail, MailReply, Media, Emailing } = require("@models"),
  ApiError = require("@utils/ApiError"),
  customLabels = require("@utils/customLabels"),
  defaultSort = require("@utils/defaultSort");
const { EventEmitter, events } = require("../events");
const userService = require("./user.service");
const mongoose = require("mongoose-fill");
const { ObjectID } = require("bson");

const createMail = async (notice = false, mailBody) => {

  const createdMails = await Mail.create(mailBody);
  const sendingUser = Array.isArray(mailBody)
    ? mailBody[0].from
    : mailBody.from;

  const from_user = await userService.getUserById(sendingUser);
  if (Array.isArray(createdMails)) {
    createdMails.map((item) => {
      EventEmitter.emit(events.SEND_NOTIFICATION, {
        recipient: item.to,
        actor: item.from,
        type: !notice ? "mail" : 'notice',
        title: !notice ? "New Message" : "New Notice",
        description: !notice ? `You have received a new message from ${from_user.businessname}` : `You have received a new notice from ${from_user.businessname}`,
        url: item.role === "admin" ? "/message/inbox" : `/${item.role}/message`,
      });
    });
  }
};

const createEmailing = async (mailBody) => {
  await Emailing.create(mailBody);
};

const createReply = async (mailBody) => {
  const createdReply = await MailReply.create(mailBody);
  const from_user = await userService.getUserById(mailBody.from);
  const to_user = await userService.getUserById(mailBody.to);
  EventEmitter.emit(events.SEND_NOTIFICATION, {
    recipient: mailBody.to,
    actor: mailBody.from,
    type: "reply",
    title: "New Reply Message",
    description: `You have received a new reply message from ${from_user.businessname}`,
    url: `/${to_user.role}/message`,
  });

  const mail = await Mail.findById(createdReply.reply);
  if (!mail) {
    throw new ApiError(httpStatus.NOT_FOUND, "Mail not found");
  }
  Object.assign(mail, { reply: true });
  await mail.save();

  return createdReply;
};

const getMailById = async (mailId) => {
  return Mail.findById(mailId);
};

const queryReplyMails = async (flag, filter, options) => {

  flag ? await MailReply.updateMany(filter, { $set: { is_read: true } }) : ''

  const replyMails = await MailReply.paginate({ reply: filter.reply }, {
    customLabels,
    ...options,
  });

  return replyMails;
};

const queryreplyfromSent = async (user_id) => {

  const allreply = await Mail.find({ "reply": true }).select('_id');

  const allreplyIDs = allreply.reduce((acc, reply) => {
    acc.push(reply._id)
    return acc;
  }, []);

  const replyMails = await MailReply.find({ 'to': user_id, 'reply': { $in: allreplyIDs } }).select('from');

  const fromIDs = replyMails.reduce((acc, reply) => {
    acc.push(reply.from)
    return acc;
  }, []);

  return fromIDs;
};

const getUnReadMessages = async (filter, options) => {
  const unreadMessages = await Mail.paginate(filter, {
    customLabels,
    sort: defaultSort,
    ...options,
  });
  return unreadMessages;
};

const MarkAll = async (userid) => {
  await Mail.updateMany({ "to": userid }, { $set: { is_read: true } })
  const result = Mail.find({ "to": userid, is_read: false });
  return result;
};

const getEmailsForCount = async (userid) => {
  const inbox = await Mail.countDocuments({ $or: [{ $and: [{ to: new ObjectID(userid), to_is_deleted: false }] }, { $and: [{ from: new ObjectID(userid) }, { reply: true }, { from_is_deleted: false }] }] });
  const sent = await Mail.countDocuments({ from: userid, type: 'usual', isNotice: false, from_is_deleted: false, sent_is_deleted: false });
  const invite = await Mail.countDocuments({ from: userid, type: 'invite', from_is_deleted: false });
  const trash = await Mail.countDocuments({ $or: [{ to: userid }, { from: userid }], from_is_deleted: true });

  return { inbox, sent, invite, trash };
};

const queryMails = async (filter, options) => {
  const pipeline = [];
  pipeline.push({
    $match: filter,
  });

  const aggregateMail = Mail.aggregate([
    ...pipeline,
    {
      $lookup: {
        from: "mailreplies",
        localField: "_id",
        foreignField: "reply",
        as: "replies",
      },
    },
    {
      $lookup: {
        from: Media.collection.name,
        localField: "files",
        foreignField: "_id",
        as: "files",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "from",
        foreignField: "_id",
        pipeline: [
          {
            $addFields: {
              name: {
                $concat: ["$firstName", " ", "$lastName"],
              },
            },
          },
          {
            $lookup: {
              from: Media.collection.name,
              let: { avatar: "$profile.avatar" },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ["$_id", "$$avatar"] },
                  },
                },
              ],
              as: "profile.avatar",
            },
          },
          {
            $unwind: {
              path: "$profile.avatar",
            },
          },
        ],
        as: "from",
      },
    },
    {
      $unwind: {
        path: "$from",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "to",
        foreignField: "_id",
        pipeline: [
          {
            $addFields: {
              name: {
                $concat: ["$firstName", " ", "$lastName"],
              },
            },
          },
          {
            $lookup: {
              from: Media.collection.name,
              let: { avatar: "$profile.avatar" },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ["$_id", "$$avatar"] },
                  },
                },
              ],
              as: "profile.avatar",
            },
          },
          {
            $unwind: {
              path: "$profile.avatar",
            },
          },
        ],
        as: "to",
      },
    },
    {
      $unwind: {
        path: "$to",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        repliesCount: {
          $size: "$replies",
        },
      },
    },
  ])

  const mails = await Mail.aggregatePaginate(aggregateMail, {
    customLabels,
    ...options,
  });
  return mails;
};

const updateMail = async (mailId, updateBody, userId) => {

  await MailReply.updateMany([{ "reply": mailId, "to": new ObjectID(userId) }], { $set: { is_read: true } })

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

  const mail = await createMail(false, { ...mailBody, type: "invite" });

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

const getPendingInvites = async (filter, options) => {

  const mails = await Mail.paginate(filter, {
    ...options,
    customLabels,
    sort: defaultSort,
  });

  return mails;
};

const queryEmailings = async (filter, options) => {
  const emails = await Emailing.paginate(filter, {
    ...options,
    customLabels,
  });

  return emails;
};


const getIsReadEmails = async (userId) => {

  const mails = await Mail.find({
    to: userId,
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

const getEmailById = async (emailId) => {
  const result = await Emailing.findById(emailId);
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Email not found");
  }

  return result;
};

const deleteEmailingById = async (emailId) => {
  const result = await getEmailById(emailId);
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "result not found");
  }
  await result.delete();
  return result;
};

const deleteInviteById = async (mailID) => {
  const result = await Mail.findById(mailID);
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "result not found");
  }
  await result.delete();
  return result;
};

const resendEmailingById = async (emailId) => {
  const result = await getEmailById(emailId);
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "result not found");
  }
  EventEmitter.emit(events.COMPOSE_EMAILING, { email: result.email, template: result.template });
};

const bulkActionEmailing = async (selectedIds, status) => {
  const objectMailIds = selectedIds.map((id) => mongoose.Types.ObjectId(id));
  if (status === "deleted") {
    objectMailIds.map(async item => {
      await deleteEmailingById(item)
    });
  }
  else {
    objectMailIds.map(async item => {
      const result = await getEmailById(item);
      EventEmitter.emit(events.COMPOSE_EMAILING, { email: result.email, template: result.template });
    });
  }
};

const bulkInvite = async (mailIds, status) => {
  const objectMailIds = mailIds.map((id) => mongoose.Types.ObjectId(id));
  if (status === "deleted") {
    objectMailIds.map(async item => {
      await deleteInviteById(item)
    });
  }
  else {
    objectMailIds.map(async item => {
      await resendInvite(item)
    });
  }
};



module.exports = {
  createMail,
  createReply,
  queryMails,
  updateMail,
  invite,
  resendInvite,
  getPendingInvites,
  getIsReadEmails,
  getUnReadMessages,
  getMailById,
  bulkDelete,
  bulkUpdate,
  queryReplyMails,
  queryreplyfromSent,
  createEmailing,
  queryEmailings,
  deleteEmailingById,
  getEmailById,
  resendEmailingById,
  bulkActionEmailing,
  MarkAll,
  getEmailsForCount,
  bulkInvite,
  deleteInviteById
};
