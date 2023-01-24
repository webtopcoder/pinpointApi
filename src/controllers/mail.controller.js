const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const ApiError = require("@utils/ApiError");
const { mailService, userService } = require("@services");
const pick = require("../utils/pick");

const compose = catchAsync(async (req, res) => {
  const { to, subject, message } = req.body;
  const from = req.user._id;
  const to_user = await userService.queryUsers(
    {
      $or: [
        { username: { $in: to.split(",") } },
        { email: { $in: to.split(",") } },
      ],
    },
    {
      pagination: false,
    }
  );
  if (!to_user || to_user.length === 0) {
    return res.json({
      success: false,
      msg: "Not exist user or user email",
    });
  }

  // TODO: upload files
  const mailsToSend = to_user.map((user) => {
    return {
      from,
      to: user._id,
      subject,
      message,
    };
  });

  await mailService.createMail(mailsToSend);
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
  options.populate = ["files", "from"];
  const result = await mailService.queryMails(filter, options);
  res.send(result);
});

const getSent = catchAsync(async (req, res) => {
  let filter = pick(req.query, ["q", "isActive", "type", "is_read"]);
  let options = pick(req.query, ["sort", "limit", "page"]);
  if (options.sort) {
    options.sort = Object.fromEntries(
      options.sort.split(",").map((field) => field.split(":"))
    );
  } else {
    options.sort = "-createdAt";
  }

  filter.from = req.user._id;
  filter.from_is_deleted = false;
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
  options.populate = ["files", "to"];
  const result = await mailService.queryMails(filter, options);
  res.send(result);
});

const deleteMail = catchAsync(async (req, res) => {
  const { mailId } = req.params;
  const userId = req.user._id;
  const mail = await mailService.getMailById(mailId);
  if (!mail || mail.to !== userId || mail.from !== userId) {
    throw new ApiError(httpStatus.NOT_FOUND, "Mail not found");
  }

  if (mail.to === userId) {
    await mailService.updateMail(mailId, {
      to_is_deleted: true,
    });
  }
  if (mail.from === userId) {
    await mailService.updateMail(mailId, {
      from_is_deleted: true,
    });
  }
  res.send({ success: true, msg: "Deleted successfully!" });
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
  res.send({ success: true, msg: "Read successfully!" });
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

const resendInvite = catchAsync(async (req, res) => {
  const { mailId } = req.params;
  const mail = await mailService.getMailById(mailId);
  if (!mail || mail.to_invite_email === null || mail.from !== req.user._id) {
    throw new ApiError(httpStatus.NOT_FOUND, "Mail not found");
  }

  await mailService.resendInvite(mailId);

  return res.json({ success: true, msg: "Invite sent successfully!" });
});

module.exports = {
  compose,
  getInbox,
  getSent,
  deleteMail,
  readMail,
  invite,
  resendInvite,
};
