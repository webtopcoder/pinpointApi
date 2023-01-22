const httpStatus = require("http-status"),
  { Location, Like } = require("@models"),
  ApiError = require("@utils/ApiError"),
  customLabels = require("@utils/customLabels"),
  defaultSort = require("@utils/defaultSort");

const getLocationById = async (id) => {
  return Location.findById(id)
    .populate("partner")
    .populate("images")
    .populate("like")
    .populate("reviews");
};

const getLocationsByPartnerId = async (partnerId, filter) => {
  return Location.find({ ...filter, partner: partnerId }).populate("images");
};

const createLocation = async (locationBody) => {
  const like = await Like.create({ count: 0 });
  return Location.create({ ...locationBody, like: like._id });
};

const updateLocationById = async (locationId, updateBody) => {
  const location = await getLocationById(locationId);
  if (!location) {
    throw new ApiError(httpStatus.NOT_FOUND, "Location not found");
  }
  Object.assign(location, updateBody);
  await location.save();
  return location;
};

const queryLocations = async (filter, options) => {
  const locations = await Location.paginate(filter, {
    customLabels,
    sort: defaultSort,
    ...options,
  });
  return locations;
};

module.exports = {
  getLocationById,
  getLocationsByPartnerId,
  createLocation,
  updateLocationById,
  queryLocations,
};
