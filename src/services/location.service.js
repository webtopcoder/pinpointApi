const httpStatus = require("http-status"),
  { Location, Like, Review, Media, Arrival } = require("@models"),
  ApiError = require("@utils/ApiError"),
  customLabels = require("@utils/customLabels"),
  defaultSort = require("@utils/defaultSort");
const { EventEmitter, events } = require("../events");
const followService = require("./follow.service");
const userService = require("./user.service");

const getLocationById = async (id) => {

  await Location.updateMany({ "departureAt": { $lt: new Date() }, isActive: true }, { $set: { isActive: false } })

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

  await Location.updateMany({ "departureAt": { $lt: new Date() }, isActive: true }, { $set: { isActive: false } })

  return Location.find({ ...filter, partner: partnerId })
    .populate("images")
    .populate("subCategories");
};

const createLocation = async (locationBody) => {
  const like = await Like.create({ count: 0 });
  const location = await Location.create({ ...locationBody, like: like._id });
  const partner = await userService.getUserById(locationBody.partner);
  const userFollowers = await followService.getFollowers(partner._id);

  if (userFollowers.result) {
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

  }

  return location;
};

const createArrivalById = async (arriveBody) => {
  const arrival = await Arrival.create({ ...arriveBody});
  return arrival;
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

  await Location.updateMany({ "departureAt": { $lt: new Date() }, isActive: true }, { $set: { isActive: false } })

  const locations = await Location.paginate(filter, {
    customLabels,
    sort: defaultSort,
    ...options,
  });
  return locations;
};

const getReviewImages = async (userId, options) => {

  const locations = await getLocationsByPartnerId(userId, {});

  const locationIDs = locations.reduce((acc, location) => {
    acc.push(location._id)
    return acc;
  }, []);

  console.log(locationIDs)

  const imagesInReview = await Review.aggregate([
    {
      $match: { location: { $in: locationIDs } }
    },
    {
      $lookup: {
        from: Media.collection.name,
        localField: "images",
        foreignField: "_id",
        as: "images",
      },
    },
    {
      $project: {
        image: "$images",
      },
    },
    {
      $group: {
        _id: "",
        image: {
          $push: "$image",
        },
      },
    },
    {
      $unwind: "$image",
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $skip: (parseInt(options.page) - 1) * options.limit,
    },
    {
      $limit: parseInt(options.limit),
    },
  ]);

  const images = imagesInReview.reduce((acc, image) => {
    image.image.forEach((img) => {
      acc.push(img);
    });
    return acc;
  }, []);

  return images;
};

module.exports = {
  getLocationById,
  getLocationsByPartnerId,
  createLocation,
  updateLocationById,
  queryLocations,
  deleteLocationByID,
  getReviewImages,
  createArrivalById
};
