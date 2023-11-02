const httpStatus = require("http-status"),
  { Location, Like, Schedule, Media, Arrival } = require("@models"),
  ApiError = require("@utils/ApiError"),
  customLabels = require("@utils/customLabels"),
  defaultSort = require("@utils/defaultSort");
const { EventEmitter, events } = require("../events");
const followService = require("./follow.service");
const userService = require("./user.service");
const { ObjectID } = require("bson");

const getEventById = async (id) => {

  await Location.updateMany({ "departureAt": { $lt: new Date() }, isActive: true }, { $set: { isActive: false, isArrival: null } })

  const originalEvent = await Location.findById(id)
    .populate({
      path: "partner",
      populate: { path: "profile.avatar" },
    })
    .populate("images")
    .populate("like")
    .populate("isArrival")
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
    .populate({
      path: "arrivalImages",
    });

  return originalEvent;
};

const getScheduleById = async (id) => {
  const schedule = await Schedule.findById(id);
  return schedule;
};

const getIndividualSchedule = async (id) => {

  const schedule = await Schedule.findById(id)
    .populate({
      path: "eventhost",
      populate: { path: "profile.avatar" },
    })
    .populate("event")
    .populate("images")
    .populate("categories")

  return schedule;
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

const getExpiredArrivals = async (eventId, expand, isArrival) => {
  let query;
  isArrival.isArrival !== null ? query = { location: eventId, _id: { $ne: isArrival.isArrival._id } } : query = { location: eventId }
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

const deleteEventByID = async (id, updateBody) => {
  const event = await getEventById(id);
  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, "event not found");
  }
  Object.assign(event, updateBody);
  await event.save();
  return event;
};

const requestAccess = async (id, updateBody) => {
  const schedule = await getScheduleById(id);
  if (!schedule) {
    throw new ApiError(httpStatus.NOT_FOUND, "event not found");
  }
  Object.assign(schedule, updateBody);
  await schedule.save();
  return schedule;
};

const createEvent = async (eventBody) => {
  const like = await Like.create({ count: 0 });
  const event = await Location.create({ ...eventBody, like: like._id });
  const eventhost = await userService.getUserById(eventBody.partner);
  const userFollowers = await followService.getFollowers(eventhost._id);

  if (userFollowers.result) {
    userFollowers.forEach((follower) => {
      EventEmitter.emit(events.SEND_NOTIFICATION, {
        recipient: follower._id,
        actor: eventhost._id,
        title: "New Event",
        description: `${eventhost.username} has added a new event @${eventBody.title}`,
        url: `/profile/${eventhost._id}/locations/${event._id}`,
        type: "addEvent",
      });
    });
  }

  return event;
};

const createEventSchedule = async (eventBody) => {
  const event = await Schedule.create(eventBody);
  return event;
};

const updateScheduleById = async (scheduleId, updateBody) => {
  const schedule = await getScheduleById(scheduleId);
  if (!schedule) {
    throw new ApiError(httpStatus.NOT_FOUND, "schedule not found");
  }
  Object.assign(schedule, updateBody);
  await schedule.save();
  return schedule;
};

const createArrivalById = async (arriveBody) => {
  const arrival = await Arrival.create({ ...arriveBody });
  return arrival;
};

const updateEventById = async (eventId, updateBody) => {
  const event = await getEventById(eventId);
  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, "event not found");
  }
  Object.assign(event, updateBody);
  await event.save();
  return event;
};

// const updateArrivalById = async (ArrivalID, updateBody) => {
//   const arrival = await getArrivalById(ArrivalID);
//   if (!arrival) {
//     throw new ApiError(httpStatus.NOT_FOUND, "arrival not found");
//   }
//   Object.assign(arrival, updateBody);
//   await arrival.save();
//   return arrival;
// };

const queryEvents = async (filter, options) => {

  await Location.updateMany({ "departureAt": { $lt: new Date() }, isActive: true }, { $set: { isActive: false, isArrival: null } })

  var events = await Location.paginate(filter, {
    customLabels,
    sort: defaultSort,
    ...options,
  });


  for (let key = 0; key < events.results.length; key++) {
    let item = events.results[key]._doc;
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
          event: item._id,
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
    events.results[key] = item;
  };
  return events;
};


const queryEventSchedule = async (filter, options) => {
  var eventSchedule = await Schedule.paginate(filter, {
    customLabels,
    sort: defaultSort,
    ...options,
  });

  return eventSchedule;
};


// const getlikeLocationCount = async (userId) => {

//   var locations = await Location.find({ partner: new ObjectID(userId) });
//   let totalValue = 0;

//   for (let key = 0; key < locations.length; key++) {
//     let item = locations[key];
//     const reviewlikeCount = await Location.aggregate([
//       {
//         $match: {
//           _id: item._id,
//         },
//       },
//       {
//         $lookup: {
//           from: "reviews",
//           localField: "reviews",
//           foreignField: "_id",
//           pipeline: [
//             {
//               $lookup: {
//                 from: Like.collection.name,
//                 localField: "like",
//                 foreignField: "_id",
//                 as: "like",
//               },
//             },
//             {
//               $unwind: "$like",
//             },
//             {
//               $group: {
//                 _id: null,
//                 total: { $sum: "$like.count" },
//               }
//             },
//           ],
//           as: "reviews",
//         },
//       },
//       {
//         $unwind: "$reviews",
//       },
//       {
//         $project: {
//           total: "$reviews.total",
//         },
//       },
//     ])

//     const arrivallikeCount = await Arrival.aggregate([
//       {
//         $match: {
//           location: item._id,
//         },
//       },
//       {
//         $lookup: {
//           from: "likes",
//           localField: "like",
//           foreignField: "_id",
//           as: "likescount",
//         },
//       },
//       {
//         $unwind: "$likescount",
//       },
//       {
//         $group: {
//           _id: null,
//           total: { $sum: "$likescount.count" },
//         },
//       },
//     ]);

//     if (!reviewlikeCount.length > 0)
//       reviewlikeCount.push({
//         total: 0
//       })

//     if (!arrivallikeCount.length > 0)
//       arrivallikeCount.push({
//         total: 0
//       });

//     totalValue = totalValue + arrivallikeCount[0].total + reviewlikeCount[0].total;
//   };

//   return totalValue;

// };


// const getAllCheckInCount = async (userId) => {

//   var locations = await Location.find({ partner: new ObjectID(userId) });
//   let totalValue = 0;

//   for (let key = 0; key < locations.length; key++) {
//     let item = locations[key];

//     const arrivallikeCount = await Arrival.aggregate([
//       {
//         $match: {
//           location: item._id,
//         },
//       },
//       {
//         $group: {
//           _id: null,
//           total: { $sum: { $size: "$checkIn" } },
//         },
//       },
//     ]);

//     if (!arrivallikeCount.length > 0)
//       arrivallikeCount.push({
//         total: 0
//       });

//     totalValue = totalValue + arrivallikeCount[0].total;
//   };

//   return totalValue;
// };

// const getReviewImages = async (userId, options) => {

//   const locations = await getLocationsByPartnerId(userId, {});
//   const locationIDs = locations.reduce((acc, location) => {
//     acc.push(location._id)
//     return acc;
//   }, []);


//   const imagesInReview = await Review.aggregate([
//     {
//       $match: { location: { $in: locationIDs } }
//     },
//     {
//       $lookup: {
//         from: Media.collection.name,
//         localField: "images",
//         foreignField: "_id",
//         as: "images",
//         pipeline: [
//           {
//             $match: {
//               status: 'active',
//               mimetype: 'image/jpeg' || 'image/jpg' || 'image/png'
//             },
//           },
//         ],
//       },
//     },
//     {
//       $project: {
//         text: 1,
//         createdAt: 1,
//         status: 1,
//         filepath: "$images.filepath",
//       },
//     },
//     {
//       $addFields: {
//         content: "$text",
//       },
//     },
//     {
//       $project: {
//         text: 0,
//       },
//     },
//     {
//       $unwind: "$filepath",
//     },
//     {
//       $sort: { createdAt: -1 },
//     },
//   ]);

//   const newArray = imagesInReview.map(item => {
//     return { ...item, type: "Review" };
//   });
//   return newArray;
// };

// const getRating = async (userId) => {
//   const locations = await Location.find({
//     partner: new ObjectID(userId),
//   }).populate("reviews");

//   let count = 0;
//   for (const obj of locations) {
//     if ('rating' in obj && obj.rating !== 0) {
//       count++;
//     }
//   }

//   const businessRating = (
//     locations?.reduce((acc, location) => {
//       return acc + (location.rating ?? 0);
//     }, 0) / count
//   ).toFixed(1);

//   return businessRating;
// };

module.exports = {
  getEventById,
  updateScheduleById,
  createEvent,
  updateEventById,
  queryEvents,
  deleteEventByID,
  // getReviewImages,
  createArrivalById,
  getArrivalById,
  // updateArrivalById,
  getIsArrival,
  getExpiredArrivals,
  createEventSchedule,
  queryEventSchedule,
  getScheduleById,
  requestAccess,
  getIndividualSchedule,
  // getlikeLocationCount,
  // getRating,
  // getAllCheckInCount
};
