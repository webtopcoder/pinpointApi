const httpStatus = require("http-status"),
  { Notification } = require("../models"),
  customLabels = require("../utils/customLabels"),
  defaultSort = require("../utils/defaultSort"),
  ApiError = require("../utils/ApiError");

const getPrevNotification = async ({ actor, recipient, type }) => {
  const notification = await Notification.findOne({ actor, recipient, type });
  return notification;
};

const createNotification = async (notificationBody) => {
  const prevNotification = await getPrevNotification(notificationBody);
  if (prevNotification) {
    const updatedNotification = await updateNotificationById(
      prevNotification._id,
      notificationBody
    );
    return updatedNotification;
  }
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
  await notification.delete();
  return notification;
};

module.exports = {
  createNotification,
  queryNotifications,
  getNotificationById,
  updateNotificationById,
  deleteNotificationById,
};
