const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const ApiError = require("@utils/ApiError");
const { mailService, userService } = require("@services");
const pick = require("../utils/pick");
const { uploadMedia } = require("../services/media.service");
const { ObjectId } = require("bson");

const compose = catchAsync(async (req, res) => {
  const { to, subject, message, isNotice } = req.body;
  const from = req.user._id;
  let to_user;
  const files = await Promise.all(
    req.files.map(async (file) => {
      const media = await uploadMedia(file, req.user._id);
      return media._id;
    })
  );
  if (!isNotice) {
    to_user = await userService.queryUsers(
      { _id: to.split(",").map((id) => new Object(id)) },
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

    const mailsToSend = to_user.results.map((user) => {
      return {
        from,
        to: user._id,
        files,
        subject,
        message,
      };
    });

    await mailService.createMail(mailsToSend);
    return res.json({ success: true, msg: "Sent successfully!" });
  }

  const mail = await mailService.createMail({
    from,
    files,
    isNotice: true,
    subject,
    message,
  });

  await mailService.createMail(mail);

  return res.json({ success: true, msg: "Sent successfully!" });
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

  filter.to = req.user._id;
  filter.to_is_deleted = false;
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
    "from.profile.avatar",
    "to.profile.avatar",
  ];
  const result = await mailService.queryMails(filter, options);
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
    options.sort = "-createdAt";
  }

  filter = {
    from: req.user._id,
    from_is_deleted: false,
    type: "usual",
    isNotice: false,
    ...filter,
  };

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
    "from.profile.avatar",
    "to.profile.avatar",
  ];
  const result = await mailService.queryMails(filter, options);
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

  res.send({ success: true, message: "Deleted successfully!" });
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
    "from.profile.avatar",
    "to.profile.avatar",
  ];
  const result = await mailService.queryMails(filter, options);
  res.send(result);
});

const resendInvite = catchAsync(async (req, res) => {
  const { mailId } = req.params;
  const mail = await mailService.getMailById(mailId);
  if (!mail || mail.to_invite_email === null || mail.from !== req.user._id) {
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

  filter.to = req.user._id;
  filter.to_is_deleted = false;
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
    "from.profile.avatar",
    "to.profile.avatar",
  ];
  const result = await mailService.queryMails(filter, options);
  res.send(result);
});

const getPendingInvites = catchAsync(async (req, res) => {
  const result = await mailService.getPendingInvites(req.user._id);
  res.send(result);
});

const updateMail = catchAsync(async (req, res) => {
  const { mailId } = req.params;
  const mail = await mailService.getMailById(mailId);
  if (!mail || mail.to !== req.user._id || mail.from !== req.user._id) {
    throw new ApiError(httpStatus.NOT_FOUND, "Mail not found");
  }

  await mailService.updateMail(mailId, req.body);

  return res.json({ success: true, msg: "Mail updated successfully!" });
});

module.exports = {
  compose,
  getInbox,
  getSent,
  deleteMail,
  readMail,
  invite,
  resendInvite,
  getNotices,
  getInvitation,
  getPendingInvites,
  updateMail,
};
