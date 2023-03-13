const httpStatus = require("http-status"),
  { Location, Like } = require("@models"),
  ApiError = require("@utils/ApiError"),
  customLabels = require("@utils/customLabels"),
  defaultSort = require("@utils/defaultSort");
const { EventEmitter, events } = require("../events");
const followService = require("./follow.service");
const userService = require("./user.service");

const getLocationById = async (id) => {
  const originallocation = await Location.findById(id)
    .populate({
      path: "partner",
      populate: { path: "profile.avatar" },
    })
    .populate("images")
    .populate("like")
    .populate({
      path: "reviews",
      populate: [
        {
          path: "user",
          populate: {
            path: "profile.avatar",
          },
        },
        {
          path: "like",
        },
        {
          path: "images",
        },
      ],
    })
    .populate("subCategories")
    .populate({
      path: "arrivalImages",
    });

  return originallocation;
};

const deleteLocationByID = async (id, updateBody) => {
  const location = await getLocationById(id);

  if (!location) {
    throw new ApiError(httpStatus.NOT_FOUND, "Location not found");
  }
  Object.assign(location, updateBody);
  await location.save();
  return location;
};

const getLocationsByPartnerId = async (partnerId, filter) => {
  return Location.find({ ...filter, partner: partnerId })
    .populate("images")
    .populate("subCategories");
};

const createLocation = async (locationBody) => {
  const like = await Like.create({ count: 0 });
  const location = await Location.create({ ...locationBody, like: like._id });
  const partner = await userService.getUserById(locationBody.partner);
  const userFollowers = await followService.getFollowers(partner._id);

  userFollowers.forEach((follower) => {
    EventEmitter.emit(events.SEND_NOTIFICATION, {
      recipient: follower._id,
      actor: partner._id,
      title: "New Location",
      description: `${partner.username} has added a new location @${locationBody.title}`,
      url: `/profile/${partner._id}/locations/${location._id}`,
      type: "addLocation",
    });
  });

  return location;
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
  deleteLocationByID,
};
