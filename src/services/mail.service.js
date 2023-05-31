const httpStatus = require("http-status"),
  { User, Mail, MailReply, Media } = require("@models"),
  ApiError = require("@utils/ApiError"),
  customLabels = require("@utils/customLabels"),
  defaultSort = require("@utils/defaultSort");
const { EventEmitter, events } = require("../events");
const userService = require("./user.service");
const mongoose = require("mongoose-fill");
const { ObjectID } = require("bson");

const createMail = async (mailBody) => {
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
        type: "mail",
        title: "New message",
        description: `You have a new message from @${from_user.username}`,
        url: `/${item.role}/message`,
      });
    });
  }
};

const createEmailing = async (mailBody) => {
  mailBody.to.map((item) => {
    EventEmitter.emit(events.SEND_NOTIFICATION, {
      recipient: item.to,
      actor: item.from,
      type: "mail",
      title: "New message",
      description: `You have a new message from @${from_user.username}`,
      url: `/${item.role}/message`,
    });
  });
};



const createReply = async (mailBody) => {
  const createdReply = await MailReply.create(mailBody);
  const from_user = await userService.getUserById(mailBody.from);
  const to_user = await userService.getUserById(mailBody.to);
  EventEmitter.emit(events.SEND_NOTIFICATION, {
    recipient: mailBody.to,
    actor: mailBody.from,
    type: "reply",
    title: "New message",
    description: `You have a new message from @${from_user.username}`,
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
        pipeline: [
          {
            $match: {
              to: new ObjectID(options.userID),
              is_read: false,
            },
          },
        ],
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
    sort: defaultSort,
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

const getPendingInvites = async (filter, options) => {

  const mails = await Mail.paginate(filter, {
    ...options,
    customLabels,
    sort: defaultSort,
  });

  return mails;
};

const getIsReadEmails = async (userId) => {
  const mails = await queryMails({
    to: userId,
    is_read: false,
    from_is_deleted: false,
  }, {
    userID: userId
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

module.exports = {
  createMail,
  createReply,
  queryMails,
  updateMail,
  invite,
  resendInvite,
  getPendingInvites,
  getIsReadEmails,
  getMailById,
  bulkDelete,
  bulkUpdate,
  queryReplyMails,
  queryreplyfromSent,
  createEmailing
};
