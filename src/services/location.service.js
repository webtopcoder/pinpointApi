const httpStatus = require("http-status"),
  { Location, Like, Review, Media, Arrival } = require("@models"),
  ApiError = require("@utils/ApiError"),
  customLabels = require("@utils/customLabels"),
  defaultSort = require("@utils/defaultSort");
const { EventEmitter, events } = require("../events");
const followService = require("./follow.service");
const userService = require("./user.service");
const { ObjectID } = require("bson");

const getLocationById = async (id) => {

  await Location.updateMany({ "departureAt": { $lt: new Date() }, isActive: true }, { $set: { isActive: false, isArrival: null } })

  const originallocation = await Location.findById(id)
    .populate({
      path: "partner",
      populate: { path: "profile.avatar" },
    })
    .populate("images")
    .populate("like")
    .populate("isArrival")
    .populate("poll")
    .populate({
      path: "isArrival",
      populate: [
        {
          path: "like",
        },
        {
          path: "images",
        },
      ],
    })
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


const getLocationByTitle = async (title) => {
  await Location.updateMany({ "departureAt": { $lt: new Date() }, isActive: true }, { $set: { isActive: false, isArrival: null } })
  const originallocation = await Location.findOne({ title: title })
    .populate({
      path: "partner",
      populate: { path: "profile.avatar" },
    })
    .populate("images")
    .populate("like")
    .populate("isArrival")
    .populate("poll")
    .populate({
      path: "isArrival",
      populate: [
        {
          path: "like",
        },
        {
          path: "images",
        },
      ],
    })
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

const getIsArrival = async (id) => {
  const ArrivalInfo = await Location.findById(id).select('isArrival')
    .populate({
      path: "isArrival",
    })
  return ArrivalInfo;
};

const getArrivalById = async (id) => {
  const arrival = await Arrival.findById(id)
    .populate("like")
    .populate("location");
  return arrival;
};

const getExpiredArrivals = async (locationID, expand, isArrival) => {

  let query;
  isArrival.isArrival !== null ? query = { location: locationID, _id: { $ne: isArrival.isArrival._id } } : query = { location: locationID }
  const [
    arrivalData,
    total
  ] = await Promise.all([
    Arrival.find(query)
      .populate("like")
      .populate("location")
      .populate("images")
      .sort({ "createdAt": -1 })
      .limit(expand ? 9999 : 3),
    Arrival.countDocuments(query),
  ]);

  return {
    arrivalData,
    total
  }
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

const getLocationsByPartnerId = async (followersArray, filter) => {

  await Location.updateMany({ "departureAt": { $lt: new Date() }, isActive: true }, { $set: { isActive: false, isArrival: null } })

  return Location.find({ ...filter, partner: { $in: followersArray } })
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
  const arrival = await Arrival.create({ ...arriveBody });
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

const updateArrivalById = async (ArrivalID, updateBody) => {
  const arrival = await getArrivalById(ArrivalID);
  if (!arrival) {
    throw new ApiError(httpStatus.NOT_FOUND, "arrival not found");
  }
  Object.assign(arrival, updateBody);
  await arrival.save();
  return arrival;
};

const queryLocations = async (filter, options) => {

  await Location.updateMany({ "departureAt": { $lt: new Date() }, isActive: true }, { $set: { isActive: false, isArrival: null } })

  let locations = await Location.paginate(filter, {
    customLabels,
    sort: defaultSort,
    ...options,
  });

  for (let key = 0; key < locations.results.length; key++) {
    let item = locations.results[key]._doc;
    const reviewlikeCount = await Location.aggregate([
      {
        $match: {
          _id: item._id,
        },
      },
      {
        $lookup: {
          from: "reviews",
          localField: "reviews",
          foreignField: "_id",
          pipeline: [
            {
              $lookup: {
                from: Like.collection.name,
                localField: "like",
                foreignField: "_id",
                as: "like",
              },
            },
            {
              $unwind: "$like",
            },
            {
              $group: {
                _id: null,
                total: { $sum: "$like.count" },
              }
            },
          ],
          as: "reviews",
        },
      },
      {
        $unwind: "$reviews",
      },
      {
        $project: {
          total: "$reviews.total",
        },
      },
    ])

    const arrivallikeCount = await Arrival.aggregate([
      {
        $match: {
          location: item._id,
        },
      },
      {
        $lookup: {
          from: "likes",
          localField: "like",
          foreignField: "_id",
          as: "likescount",
        },
      },
      {
        $unwind: "$likescount",
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$likescount.count" },
        },
      },
    ]);

    if (!reviewlikeCount.length > 0)
      reviewlikeCount.push({
        total: 0
      })

    if (!arrivallikeCount.length > 0)
      arrivallikeCount.push({
        total: 0
      });

    const totalLike = arrivallikeCount[0].total + reviewlikeCount[0].total;
    item = { ...item, totalLike };
    locations.results[key] = item;
  };
  return locations;

};

const getlikeLocationCount = async (userId) => {

  var locations = await Location.find({ partner: new ObjectID(userId) });
  let totalValue = 0;

  for (let key = 0; key < locations.length; key++) {
    let item = locations[key];
    const reviewlikeCount = await Location.aggregate([
      {
        $match: {
          _id: item._id,
        },
      },
      {
        $lookup: {
          from: "reviews",
          localField: "reviews",
          foreignField: "_id",
          pipeline: [
            {
              $lookup: {
                from: Like.collection.name,
                localField: "like",
                foreignField: "_id",
                as: "like",
              },
            },
            {
              $unwind: "$like",
            },
            {
              $group: {
                _id: null,
                total: { $sum: "$like.count" },
              }
            },
          ],
          as: "reviews",
        },
      },
      {
        $unwind: "$reviews",
      },
      {
        $project: {
          total: "$reviews.total",
        },
      },
    ])

    const arrivallikeCount = await Arrival.aggregate([
      {
        $match: {
          location: item._id,
        },
      },
      {
        $lookup: {
          from: "likes",
          localField: "like",
          foreignField: "_id",
          as: "likescount",
        },
      },
      {
        $unwind: "$likescount",
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$likescount.count" },
        },
      },
    ]);

    if (!reviewlikeCount.length > 0)
      reviewlikeCount.push({
        total: 0
      })

    if (!arrivallikeCount.length > 0)
      arrivallikeCount.push({
        total: 0
      });

    totalValue = totalValue + arrivallikeCount[0].total + reviewlikeCount[0].total;
  };

  return totalValue;

};


const getAllCheckInCount = async (userId) => {

  var locations = await Location.find({ partner: new ObjectID(userId) });
  let totalValue = 0;

  for (let key = 0; key < locations.length; key++) {
    let item = locations[key];

    const arrivallikeCount = await Arrival.aggregate([
      {
        $match: {
          location: item._id,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $size: "$checkIn" } },
        },
      },
    ]);

    if (!arrivallikeCount.length > 0)
      arrivallikeCount.push({
        total: 0
      });

    totalValue = totalValue + arrivallikeCount[0].total;
  };

  return totalValue;
};

const getReviewImages = async (followersArray, flag, options) => {
  const locations = await getLocationsByPartnerId(followersArray, {});
  const locationIDs = locations.map(location => location._id);

  const matchQuery = flag === "true" ? { user: { $in: followersArray } } : { location: { $in: locationIDs } };

  const imagesInReview = await Review.aggregate([
    { $match: matchQuery },
    {
      $lookup: {
        from: Media.collection.name,
        localField: "images",
        foreignField: "_id",
        as: "images",
        pipeline: [
          {
            $match: {
              status: 'active',
              mimetype: { $in: ['image/jpeg', 'image/jpg', 'image/png'] }
            },
          },
        ],
      },
    },
    {
      $project: {
        createdAt: 1,
        status: 1,
        filepath: "$images.filepath",
      },
    },
    {
      $addFields: {
        content: "$text",
      },
    },
    {
      $project: {
        text: 0,
      },
    },
    {
      $unwind: "$filepath",
    },
    {
      $sort: { createdAt: -1 },
    },
  ]);

  const newArray = imagesInReview.map(item => ({
    ...item,
    type: "Review"
  }));

  return newArray;
};

const getRating = async (userId) => {
  const locations = await Location.find({
    partner: new ObjectID(userId),
  }).populate("reviews");

  let count = 0;
  for (const obj of locations) {
    if ('rating' in obj && obj.rating !== 0) {
      count++;
    }
  }

  const businessRating = (
    locations?.reduce((acc, location) => {
      return acc + (location.rating ?? 0);
    }, 0) / count
  ).toFixed(1);

  return businessRating;
};

module.exports = {
  getLocationById,
  getLocationByTitle,
  getLocationsByPartnerId,
  createLocation,
  updateLocationById,
  queryLocations,
  deleteLocationByID,
  getReviewImages,
  createArrivalById,
  getArrivalById,
  updateArrivalById,
  getIsArrival,
  getExpiredArrivals,
  getlikeLocationCount,
  getRating,
  getAllCheckInCount
};
