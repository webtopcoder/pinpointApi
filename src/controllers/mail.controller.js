const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const ApiError = require("@utils/ApiError");
const { mailService, userService } = require("@services");
const pick = require("../utils/pick");
const { uploadMedia } = require("../services/media.service");
const followService = require("../services/follow.service");
const path = require("path");
const { EventEmitter, events } = require("../events");
const { ObjectID } = require("bson");

const compose = catchAsync(async (req, res) => {
  const { to, subject, message, isNotice } = req.body;
  const from = req.user._id;
  let to_user;
  let mailsToSend;

  const files = await Promise.all(
    req.files.map(async (file) => {
      const media = await uploadMedia(file, req.user._id);
      return media._id;
    })
  );

  if (!isNotice) {
    if (to === "admin") {
      to_user = await userService.queryUsers(
        { role: "admin" },
        {
          pagination: false,
        }
      );
    }
    else {
      to_user = await userService.queryUsers(
        { username: to.split(",").map((name) => new Object(name)) },
        {
          pagination: false,
        }
      );

      if (to_user.totalResults === 0) {
        return res.json({
          success: false,
          msg: "Not exist user or user email",
        });
      }
    }
    mailsToSend = to_user.results.map((user) => {
      return {
        from,
        isNotice: false,
        to: user._id,
        role: user.role,
        files,
        subject,
        message,
      };
    });
  }
  else {
    mailsToSend = await followService
      .getFollowers(req.user._id, {}, {})
      .then((follows) => {
        return follows.results.map((follow) => {
          return {
            from,
            to: follow.follower._id,
            role: follow.follower.role,
            isNotice: true,
            files,
            subject,
            message,
          };
        });
      });
  }
  await mailService.createMail(isNotice, mailsToSend);

  return res.json({ success: true, msg: "Sent successfully!" });
});


const composebyAdmin = catchAsync(async (req, res) => {

  const { to, subject, message, isNotice } = req.body;
  const from = req.user._id;
  let to_user;
  let filter;
  let mailsToSend;

  const files = await Promise.all(
    req.files.map(async (file) => {
      const media = await uploadMedia(file, req.user._id);
      return media._id;
    })
  );

  if (!isNotice) {
    to_user = await userService.queryUsers(
      { username: to.split(",").map((name) => name) },
      {
        pagination: false,
      }
    );

    if (to_user.totalResults === 0) {
      return res.json({
        success: false,
        msg: "Not exist user or user email",
      });
    }

    mailsToSend = to_user.results.map((user) => {
      return {
        from,
        isNotice: false,
        to: user._id,
        role: user.role,
        files,
        subject,
        message,
      };
    });
  } else {

    switch (isNotice) {
      case 'users':
        filter = { role: 'user', status: 'active' }
        break;
      case 'partners':
        filter = { role: 'partner', status: 'active' }
        break;
      default:
        filter = { role: { $ne: 'admin' }, status: 'active' }
    }

    to_user = await userService.queryUsers(
      filter,
      {
        pagination: false,
      }
    );

    mailsToSend = to_user.results.map((user) => {
      return {
        from,
        isNotice: false,
        to: user._id,
        role: user.role,
        files,
        subject,
        message,
      };
    });
  }

  console.log(mailsToSend)
  await mailService.createMail(isNotice, mailsToSend);

  return res.json({ success: true, msg: "Sent successfully!" });
});

const composeEmail = catchAsync(async (req, res) => {
  const { to, template } = req.body;
  let emails;

  emails = to.map((item) => {
    return {
      email: item,
      template: template,
    };
  });

  await mailService.createEmailing(emails);

  to.map((item) => {
    EventEmitter.emit(events.COMPOSE_EMAILING, { email: item, template: template });
  });

  return res.json({ success: true, msg: "Sent successfully!" });
});

const reply = catchAsync(async (req, res) => {

  const files = await Promise.all(
    req.files.map(async (file) => {
      const media = await uploadMedia(file, req.user._id);
      return media._id;
    })
  );

  await mailService.createReply({ ...req.body, files });

  let options = pick(req.query, ["sort", "limit", "page"]);
  let filter = pick(req.query, ["q", "isActive", "type", "is_read"]);

  filter = {
    reply: req.body.reply,
  };

  options.limit = 10000;
  options.sort = "-createdAt";

  options.populate = [
    "files",
    "from",
    "to",
    {
      path: "from",
      populate: {
        path: "profile",
        populate: {
          path: "avatar",
        },
      },
    },
    {
      path: "to",
      populate: {
        path: "profile",
        populate: {
          path: "avatar",
        },
      },
    },
  ];
  const result = await mailService.queryReplyMails(false, filter, options);

  return res.json({ result: result, msg: "Reply successfully!" });
});

const getEmailsForCount = catchAsync(async (req, res) => {
  const result = await mailService.getEmailsForCount(req.user._id);
  res.send(result);
});

const getInbox = catchAsync(async (req, res) => {
  let filter = pick(req.query, ["q", "isActive", "type", "is_read"]);
  let options = pick(req.query, ["sort", "limit", "page"]);
  if (options.sort) {
    options.sort = Object.fromEntries(
      options.sort.split(",").map((field) => field.split(":"))
    );
  } else {
    options.sort = "-createdAt";
  }

  options.userID = req.user._id

  filter = { $or: [{ $and: [{ to: new ObjectID(req.user._id), to_is_deleted: false }] }, { $and: [{ from: new ObjectID(req.user._id) }, { reply: true }, { from_is_deleted: false }] }] };
  if (filter.q) {
    const query = filter.q;
    delete filter.q;
    filter = {
      ...filter,
      $or: [
        { email: { $regex: query, $options: "i" } },
        {
          subject: { $regex: query, $options: "i" },
        },
      ],
    };
  }
  options.populate = [
    "files",
    "from",
    "to",
    {
      path: "from",
      populate: {
        path: "profile",
        populate: {
          path: "avatar",
        },
      },
    },
    {
      path: "to",
      populate: {
        path: "profile",
        populate: {
          path: "avatar",
        },
      },
    },
  ];

  const result = await mailService.queryMails(filter, options);
  res.send(result);
});

const getInboxById = catchAsync(async (req, res) => {

  let filter = pick(req.params, ["id"]);
  let options = pick(req.query, ["sort", "limit", "page"]);
  options.populate = [
    "files",
    "from",
    "to",
    {
      path: "from",
      populate: {
        path: "profile",
        populate: {
          path: "avatar",
        },
      },
    },
    {
      path: "to",
      populate: {
        path: "profile",
        populate: {
          path: "avatar",
        },
      },
    },
  ];

  const result = await mailService.queryMails({ _id: new ObjectID(filter.id) }, options);
  res.send(result);
});

const getEmailing = catchAsync(async (req, res) => {

  let filter = pick(req.query, ["q", "status"]);
  let options = pick(req.query, ["sort", "limit", "page"]);
  if (options.sort) {
    options.sort = Object.fromEntries(
      options.sort.split(",").map((field) => field.split(":"))
    );
  } else {
    options.sort = "-updatedAt";
  }

  if (filter.q) {
    const query = filter.q;
    delete filter.q;
    filter = {
      ...filter,
      $or: [
        { email: { $regex: query, $options: "i" } },
        {
          template: { $regex: query, $options: "i" },
        },
      ],
    };
  }

  const result = await mailService.queryEmailings(filter, options);
  res.send(result);
});

const getSent = catchAsync(async (req, res) => {
  let filter = pick(req.query, [
    "q",
    "isActive",
    "type",
    "is_read",
    "isNotice",
  ]);
  let options = pick(req.query, ["sort", "limit", "page"]);
  if (options.sort) {
    options.sort = Object.fromEntries(
      options.sort.split(",").map((field) => field.split(":"))
    );
  } else {
    options.sort = "createdAt";
  }

  filter = {
    from: new ObjectID(req.user._id),
    from_is_deleted: false,
    sent_is_deleted: false,
    type: "usual",
    isNotice: false,
    ...filter,
  };
  options.userID = req.user._id

  if (filter.q) {
    const query = filter.q;
    delete filter.q;
    filter = {
      ...filter,
      $or: [
        { email: { $regex: query, $options: "i" } },
        {
          subject: { $regex: query, $options: "i" },
        },
      ],
    };
  }
  options.populate = [
    "files",
    "from",
    "to",
    {
      path: "from",
      populate: {
        path: "profile",
        populate: {
          path: "avatar",
        },
      },
    },
    {
      path: "to",
      populate: {
        path: "profile",
        populate: {
          path: "avatar",
        },
      },
    },
  ];

  const result = await mailService.queryMails(filter, options);

  res.send(result);
});


const getSentById = catchAsync(async (req, res) => {

  let filter = pick(req.params, ["id"]);
  let options = pick(req.query, ["sort", "limit", "page"]);
  options.populate = [
    "files",
    "from",
    "to",
    {
      path: "from",
      populate: {
        path: "profile",
        populate: {
          path: "avatar",
        },
      },
    },
    {
      path: "to",
      populate: {
        path: "profile",
        populate: {
          path: "avatar",
        },
      },
    },
  ];

  const result = await mailService.queryMails({ _id: new ObjectID(filter.id) }, options);
  res.send(result);
});

const deleteMail = catchAsync(async (req, res) => {
  const { mailId } = req.params;
  const userId = req.user._id;
  let mail = await mailService.getMailById(mailId);
  mail = mail.toJSON();

  if (!mail || (mail.to != userId && mail.from != userId)) {
    console.log({
      mail,
      userId,
    });
    throw new ApiError(httpStatus.NOT_FOUND, "Mail not found");
  }

  if (mail.to == userId) {
    await mailService.updateMail(mailId, {
      to_is_deleted: true,
    });
  }

  if (mail.from == userId) {
    await mailService.updateMail(mailId, {
      from_is_deleted: true,
    });
  }

  // await mailService.updateReplyMail({ to: userId }, {
  //   to_is_deleted: true,
  // });

  res.send({ success: true, message: "Deleted successfully!" });
});

const deleteSentMail = catchAsync(async (req, res) => {
  const { mailId } = req.params;
  let mail = await mailService.getMailById(mailId);
  mail = mail.toJSON();

  await mailService.updateMail(mailId, {
    sent_is_deleted: true,
  });

  res.send({ success: true, message: "Deleted successfully!" });
});

const deleteEmailing = catchAsync(async (req, res) => {
  await mailService.deleteEmailingById(req.params.emailId);
  res.status(httpStatus.NO_CONTENT).send();
});

const resentEmailing = catchAsync(async (req, res) => {
  await mailService.resendEmailingById(req.params.emailId);
  res.status(httpStatus.NO_CONTENT).send();
});

const readMail = catchAsync(async (req, res) => {
  const { mailId } = req.params;
  const userId = req.user._id;
  const mail = await mailService.getMailById(mailId);
  if (!mail || mail.to !== userId || mail.from !== userId) {
    throw new ApiError(httpStatus.NOT_FOUND, "Mail not found");
  }

  await mailService.updateMail(mailId, {
    is_read: true,
  });
  res.send({ success: true, msg: "Read successfully!", data: mail });
});

const invite = catchAsync(async (req, res) => {
  const { email, message } = req.body;
  const from = req.user._id;

  await mailService.invite({
    from,
    to_invite_email: email,
    message,
  });

  return res.json({ success: true, msg: "Invite sent successfully!" });
});

const getReplyById = catchAsync(async (req, res) => {

  const { replyId } = req.params;

  let options = pick(req.query, ["sort", "limit", "page"]);
  let filter = pick(req.query, ["q", "isActive", "type", "is_read"]);
  options.limit = 10000;

  filter = {
    reply: replyId,
    to: new ObjectID(req.user._id)
  };

  options.sort = "createdAt";

  options.populate = [
    "files",
    "from",
    "to",
    {
      path: "from",
      populate: {
        path: "profile",
        populate: {
          path: "avatar",
        },
      },
    },
    {
      path: "to",
      populate: {
        path: "profile",
        populate: {
          path: "avatar",
        },
      },
    },
  ];

  const result = await mailService.queryReplyMails(true, filter, options);

  res.send(result);
});

const getInvitation = catchAsync(async (req, res) => {
  let filter = pick(req.query, ["q", "isActive", "type", "is_read"]);
  let options = pick(req.query, ["sort", "limit", "page"]);
  if (options.sort) {
    options.sort = Object.fromEntries(
      options.sort.split(",").map((field) => field.split(":"))
    );
  } else {
    options.sort = "-createdAt";
  }

  filter.to_invite_email = req.user.email;
  filter.to_invite_is_deleted = false;
  if (filter.q) {
    const query = filter.q;
    delete filter.q;
    filter = {
      ...filter,
      $or: [
        { email: { $regex: query, $options: "i" } },
        {
          subject: { $regex: query, $options: "i" },
        },
      ],
    };
  }
  options.populate = [
    "files",
    "from",
    "to",
    {
      path: "from",
      populate: {
        path: "profile",
        populate: {
          path: "avatar",
        },
      },
    },
    {
      path: "to",
      populate: {
        path: "profile",
        populate: {
          path: "avatar",
        },
      },
    },
  ];
  const result = await mailService.queryMailsReply(filter, options);
  res.send(result);
});

const resendInvite = catchAsync(async (req, res) => {
  const { mailId } = req.params;
  const mail = await mailService.getMailById(mailId);
  if (!mail || mail.from != req.user._id) {
    throw new ApiError(httpStatus.NOT_FOUND, "Mail not found");
  }

  await mailService.resendInvite(mailId);

  return res.json({ success: true, msg: "Invite sent successfully!" });
});

const getNotices = catchAsync(async (req, res) => {
  let filter = pick(req.query, ["q", "isActive", "type", "is_read"]);
  let options = pick(req.query, ["sort", "limit", "page"]);
  if (options.sort) {
    options.sort = Object.fromEntries(
      options.sort.split(",").map((field) => field.split(":"))
    );
  } else {
    options.sort = "-createdAt";
  }

  options.userID = req.user._id
  filter.from = new ObjectID(req.user._id);
  filter.from_is_deleted = false;
  filter.isNotice = true;
  if (filter.q) {
    const query = filter.q;
    delete filter.q;
    filter = {
      ...filter,
      $or: [
        { email: { $regex: query, $options: "i" } },
        {
          subject: { $regex: query, $options: "i" },
        },
      ],
    };
  }

  options.populate = [
    "files",
    "from",
    "to",
    {
      path: "from",
      populate: {
        path: "profile",
        populate: {
          path: "avatar",
        },
      },
    },
    {
      path: "to",
      populate: {
        path: "profile",
        populate: {
          path: "avatar",
        },
      },
    },
  ];

  const result = await mailService.queryMails(filter, options);
  res.send(result);
});

const getPendingInvites = catchAsync(async (req, res) => {

  let filter = pick(req.query, ["q", "isActive", "type", "is_read"]);
  let options = pick(req.query, ["sort", "limit", "page"]);

  filter.from = req.user._id;
  filter.type = 'invite';
  filter.is_read = false;
  filter.from_is_deleted = false;

  const result = await mailService.getPendingInvites(filter, options);
  res.send(result);
});

const getIsReadEmails = catchAsync(async (req, res) => {
  const result = await mailService.getIsReadEmails(req.user._id);
  res.send(result);

});

const getUnReadMessages = catchAsync(async (req, res) => {

  let filter = pick(req.query, []);
  let options = pick(req.query, ["limit", "page", "sort"]);
  if (filter.q) {
    filter.title = { $regex: filter.q, $options: "i" };
    delete filter.q;
  }

  filter = {
    ...filter,
    to: new ObjectID(req.user._id),
    is_read: false,
    to_is_deleted: false
  };
  options.sort = "-createdAt"

  options.populate = [
    "files",
    "from",
    "to",
    {
      path: "from",
      populate: {
        path: "profile",
        populate: {
          path: "avatar",
        },
      },
    },
    {
      path: "to",
      populate: {
        path: "profile",
        populate: {
          path: "avatar",
        },
      },
    },
  ];

  const result = await mailService.getUnReadMessages(filter, options);
  res.send(result);
});

const MarkAll = catchAsync(async (req, res) => {
  const result = await mailService.MarkAll(req.user._id);
  res.send(result);
});

const updateMail = catchAsync(async (req, res) => {
  const { mailId } = req.params;
  const userId = req.user._id;
  let mail = await mailService.getMailById(mailId);
  mail = mail.toJSON();

  if (!mail || (mail.to != userId && mail.from != userId)) {
    console.log({
      mail,
      userId,
    });
    throw new ApiError(httpStatus.NOT_FOUND, "Mail not found");
  }

  await mailService.updateMail(mailId, req.body, userId);

  return res.json({ success: true, message: "Mail updated successfully!" });
});

const bulkActions = catchAsync(async (req, res) => {
  const { action, mailIds } = req.body;
  const userId = req.user._id;

  if (action === "delete") {
    await mailService.bulkDelete(mailIds, userId);
  }

  if (action === "read") {
    await mailService.bulkUpdate(mailIds, { $set: { is_read: true } }, userId);
  }

  if (action === "unread") {
    await mailService.bulkUpdate(mailIds, { $set: { is_read: false } }, userId);
  }

  return res.json({ success: true, message: "Action performed successfully!" });
});

const bulkActionsEmailing = catchAsync(async (req, res) => {
  const { action, selectedIds } = req.body;
  await mailService.bulkActionEmailing(selectedIds, action);
  return res.json({ success: true, message: "Action performed successfully!" });
});

const bulkInvite = catchAsync(async (req, res) => {
  const { action, mailIds } = req.body;
  await mailService.bulkInvite(mailIds, action);
  return res.json({ success: true, message: "Action performed successfully!" });
})

const sendMessageByAdmin = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const user = await userService.getUserById(userId);
  let mailsToSend;

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  const { to, subject, message } = req.body;
  const from = req.user._id;
  const files = await Promise.all(
    req.files.map(async (file) => {
      const media = await uploadMedia(file, req.user._id);
      return media._id;
    })
  );

  mailsToSend = [{
    from,
    isNotice: false,
    to,
    role: user.role,
    files,
    subject,
    message,
  }];

  await mailService.createMail(false, mailsToSend);

  return res
    .status(httpStatus.CREATED)
    .json({ success: true, msg: "Message sent successfully!" });
});

const composeMessageByAdmin = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const user = await userService.getUserById(userId);
  let mailsToSend;

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  const { to, subject, message } = req.body;
  const from = req.user._id;
  const files = await Promise.all(
    req.files.map(async (file) => {
      const media = await uploadMedia(file, req.user._id);
      return media._id;
    })
  );

  mailsToSend = [{
    from,
    isNotice: false,
    to,
    role: user.role,
    files,
    subject,
    message,
  }];

  console.log(mailsToSend)

  await mailService.createMail(mailsToSend);

  return res
    .status(httpStatus.CREATED)
    .json({ success: true, msg: "Message sent successfully!" });
});

module.exports = {
  compose,
  composebyAdmin,
  reply,
  getInbox,
  getInboxById,
  getSent,
  deleteMail,
  readMail,
  invite,
  resendInvite,
  getNotices,
  getInvitation,
  getPendingInvites,
  getIsReadEmails,
  getUnReadMessages,
  updateMail,
  bulkActions,
  sendMessageByAdmin,
  composeMessageByAdmin,
  getReplyById,
  composeEmail,
  getEmailing,
  deleteEmailing,
  resentEmailing,
  bulkActionsEmailing,
  MarkAll,
  bulkInvite,
  getEmailsForCount,
  deleteSentMail,
  getSentById
};
