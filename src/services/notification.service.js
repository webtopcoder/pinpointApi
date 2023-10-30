const httpStatus = require("http-status"),
  { Notification } = require("../models"),
  customLabels = require("../utils/customLabels"),
  defaultSort = require("../utils/defaultSort"),
  ApiError = require("../utils/ApiError");

const createNotification = async (notificationBody) => {
  const notification = await Notification.create(notificationBody);
  return notification;
};

const getPrevNotification = async ({ actor, recipient, type }) => {
  const notification = await Notification.findOne({ actor, recipient, type });
  return notification;
};

const sendNotification = async (notificationBody) => {
  let notification;
  notification = await createNotification(notificationBody);

  // const prevNotification = await getPrevNotification(notificationBody);
  // if (prevNotification) {
  //   notification = Object.assign(prevNotification, notificationBody);
  //   await notification.save();
  // } else {
  //   notification = await createNotification(notificationBody);
  // }

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

const clearNotifications = async (userid) => {
  await Notification.updateMany({ "recipient": userid }, { $set: { is_read: true } })
  const result = Notification.find({ "recipient": userid, is_read: false })
  return result;
};

const deleteNotifications = async (userid) => {
  const result = await Notification.deleteMany({ "recipient": userid })
  return result;
};

const getNotificationById = async (id, populate) => {
  const notification = await Notification.findById(id).populate(populate);
  if (!notification) {
    throw new ApiError(httpStatus.NOT_FOUND, "Notification not found");
  }
  return notification;
};

const updateNotificationById = async (notificationId, updateBody) => {
  await Notification.update({ "_id": notificationId }, { $set: updateBody })
  return true;
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
  sendNotification,
  queryNotifications,
  getNotificationById,
  updateNotificationById,
  deleteNotificationById,
  clearNotifications,
  deleteNotifications
};
