const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const ApiError = require("@utils/ApiError");
const { notificationService } = require("@services");
const pick = require("../utils/pick");

const getNotificationById = catchAsync(async (req, res) => {
  const notification = await notificationService.getNotificationById(
    req.params.id
  );
  if (!notification) {
    throw new ApiError(httpStatus.NOT_FOUND, "Notification not found");
  }
  res.send(notification);
});

const getNotifications = catchAsync(async (req, res) => {
  let filter = pick(req.query, ["is_read"]);
  let options = pick(req.query, ["limit", "page", "sort"]);
  if (filter.q) {
    filter.title = { $regex: filter.q, $options: "i" };
    delete filter.q;
  }
  filter = {
    ...filter,
    recipient: req.user._id,
  };

  if (!req.query.is_read)
    filter.is_read = false;

  options.sort = "-createdAt"
  options.populate = [
    "recipient",
    "actor",
    { path: "actor", populate: "profile.avatar" },
    { path: "recipient", populate: "profile.avatar" },
  ];

  console.log(filter)
  const result = await notificationService.queryNotifications(filter, options);
  res.send(result);
});

const clearNotifications = catchAsync(async (req, res) => {

  const result = await notificationService.clearNotifications(req.user._id);

  res.send(result);
});


const markAsRead = catchAsync(async (req, res) => {
  await notificationService.updateNotificationById(req.params.id, {
    is_read: true,
  });

  res.send({ "success": true });
});

const update = catchAsync(async (req, res) => {
  if (req.params.flag === "mark")
    await notificationService.updateNotificationById(req.params.id, {
      is_read: true,
    });
  else await notificationService.deleteNotificationById(req.params.id);

  res.send({ "success": true });
});

const updateAll = catchAsync(async (req, res) => {
  if (req.params.flag === "mark")
    await notificationService.clearNotifications(req.user._id);
  else await notificationService.deleteNotifications(req.user._id);

  res.send({ "success": true });
});

module.exports = {
  getNotificationById,
  getNotifications,
  markAsRead,
  clearNotifications,
  update,
  updateAll
};
