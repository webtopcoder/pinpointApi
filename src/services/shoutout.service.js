const httpStatus = require("http-status"),
  { Shoutout } = require("../models"),
  customLabels = require("../utils/customLabels"),
  defaultSort = require("../utils/defaultSort"),
  ApiError = require("../utils/ApiError");

const createShoutout = async (shoutoutBody) => {
  const shoutout = await Shoutout.create(shoutoutBody);
  return shoutout;
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
  createShoutout,
  queryShoutouts,
  getShoutoutById,
  updateShoutoutById,
  deleteShoutoutById,
};
