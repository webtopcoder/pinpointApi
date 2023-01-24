const httpStatus = require("http-status"),
  { Notification } = require("../models"),
  customLabels = require("../utils/customLabels"),
  defaultSort = require("../utils/defaultSort"),
  ApiError = require("../utils/ApiError");

const createNotification = async (notificationBody) => {
  const notification = await Notification.create(notificationBody);
  return notification;
};

const queryNotifications = async (filter, options) => {
  const notifications = await Notification.paginate(filter, {
    customLabels,
    sort: defaultSort,
    ...options,
  });
  return notifications;
};

const getNotificationById = async (id, populate) => {
  const notification = await Notification.findById(id).populate(populate);
  if (!notification) {
    throw new ApiError(httpStatus.NOT_FOUND, "Notification not found");
  }
  return notification;
};

const updateNotificationById = async (notificationId, updateBody) => {
  const notification = await getNotificationById(notificationId);
  if (!notification) {
    throw new ApiError(httpStatus.NOT_FOUND, "Notification not found");
  }
  Object.assign(notification, updateBody);
  await notification.save();
  return notification;
};

const deleteNotificationById = async (notificationId) => {
  const notification = await getNotificationById(notificationId);
  if (!notification) {
    throw new ApiError(httpStatus.NOT_FOUND, "Notification not found");
  }
  await notification.remove();
  return notification;
};

module.exports = {
  createNotification,
  queryNotifications,
  getNotificationById,
  updateNotificationById,
  deleteNotificationById,
};
