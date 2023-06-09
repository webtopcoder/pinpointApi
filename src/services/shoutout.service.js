const httpStatus = require("http-status"),
  { Shoutout } = require("../models"),
  customLabels = require("../utils/customLabels"),
  defaultSort = require("../utils/defaultSort"),
  ApiError = require("../utils/ApiError");
const userService = require("./user.service");
const settingService = require("./setting.service");
const { EventEmitter, events } = require("../events");

const createShoutout = async (shoutoutBody) => {
  const shoutout = await Shoutout.create(shoutoutBody);
  const shoutoutUser = await userService.getUserById(shoutoutBody.from);
  // const status = await settingService.getSettingStatus({
  //   key: "user:mention",
  //   user: shoutout.to,
  // });
  // if (status)
  EventEmitter.emit(events.SEND_NOTIFICATION, {
    recipient: shoutout.to.toString(),
    actor: shoutout.from.toString(),
    title: "Shoutout",
    description: `You have been shouted out by ${shoutoutUser.businessname}`,
    url: `/profile/${shoutout.to.toString()}/shout-outs/`,
    type: "shoutout",
  });

  return shoutout;
};

const getShoutList = async (id) => {
  const shoutoutList = await Shoutout.find({ post: id }).select('to');

  const userIDs = shoutoutList.reduce((acc, shout) => {
    acc.push(shout.to)
    return acc;
  }, []);

  return userIDs;
};

const queryShoutouts = async (filter, options) => {
  const shoutouts = await Shoutout.paginate(filter, {
    customLabels,
    sort: defaultSort,
    ...options,
  });
  return shoutouts;
};

const getShoutoutById = async (id, populate) => {
  const shoutout = await Shoutout.findById(id).populate(populate);
  if (!shoutout) {
    throw new ApiError(httpStatus.NOT_FOUND, "Shoutout not found");
  }
  return shoutout;
};

const updateShoutoutById = async (shoutoutId, updateBody) => {
  const shoutout = await getShoutoutById(shoutoutId);
  if (!shoutout) {
    throw new ApiError(httpStatus.NOT_FOUND, "Shoutout not found");
  }
  Object.assign(shoutout, updateBody);
  await shoutout.save();
  return shoutout;
};

const deleteShoutoutById = async (shoutoutId) => {
  const shoutout = await getShoutoutById(shoutoutId);
  if (!shoutout) {
    throw new ApiError(httpStatus.NOT_FOUND, "Shoutout not found");
  }
  await shoutout.delete();
  return shoutout;
};

module.exports = {
  getShoutList,
  createShoutout,
  queryShoutouts,
  getShoutoutById,
  updateShoutoutById,
  deleteShoutoutById,
};
