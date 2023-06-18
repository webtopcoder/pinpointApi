const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const ApiError = require("@utils/ApiError");
const {
  eventService,
  likeService,
  reviewService,
  categoryService,
  userService,
  settingService
} = require("@services");
const { uploadMedia } = require("../services/media.service");
const pick = require("../utils/pick");
const { Review, Like } = require("../models");
const { EventEmitter, events } = require("../events");

const createEvent = catchAsync(async (req, res) => {
  const images = await Promise.all(
    req.files.map(async (file) => {
      const media = await uploadMedia(file, req.user._id);
      return media._id;
    })
  );

  const event = await eventService.createEvent({
    partner: req.user._id,
    images,
    title: req.body.title,
    description: req.body.description,
    lastSeen: new Date(),
  });
  res.status(httpStatus.CREATED).send(event);
});

const deleteEvent = catchAsync(async (req, res) => {
  const { eventId } = req.params;

  const event = await eventService.getEventById(eventId);
  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, "event not found");
  }

  const data = {
    deleted: true,
  };

  await eventService.deleteEventByID(eventId, data);

  res.send(event);
});

const getEvents = catchAsync(async (req, res) => {
  let filter = pick(req.query, [
    "isActive",
    "partner",
  ]);

  let options = pick(req.query, ["limit", "page", "sort", "pagination"]);
  if (filter.q) {
    filter.title = { $regex: filter.q, $options: "i" };
    delete filter.q;
  }

  options.populate = [
    "partner",
    "like",
    "reviews",
    "images",
    "isArrival",
    "arrivalImages",
  ];

  const result = await eventService.queryEvents(filter, options);

  res.send(result);
});

const getEvent = catchAsync(async (req, res) => {
  const event = await eventService.getEventById(req.params.eventId);
  const IsArrival = await eventService.getIsArrival(req.params.eventId);
  const ExpiredArrivals = await eventService.getExpiredArrivals(req.params.eventId, req.params.expand, IsArrival);
  const userinfo = await userService.getUserById(req.user._id);

  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, "event not found");
  }
  const favorited = userinfo.favoriteLocations.includes(req.params.eventId) ? true : false;

  const data = {
    lastSeen: new Date(),
  };

  await eventService.updateEventById(req.params.eventId, data);
  res.send({ event: event, expiredArrival: ExpiredArrivals, isFavorite: favorited });
});

// const getExpiredArrivals = catchAsync(async (req, res) => {
//   const IsArrival = await locationService.getIsArrival(req.params.locationId);
//   const ExpiredArrivals = await locationService.getExpiredArrivals(req.params.locationId, IsArrival);
//   res.send(ExpiredArrivals);
// });

const updateEvent = catchAsync(async (req, res) => {
  const images = await Promise.all(
    req.files.map(async (file) => {
      const media = await uploadMedia(file, req.user._id);
      return media._id;
    })
  );
  const { eventId } = req.params;
  const event = await eventService.getEventById(eventId);
  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, "event not found");
  }

  if (!event.partner == req.user._id) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You don't have permission to update this location"
    );
  }

  const data = {
    title: req.body.title,
    description: req.body.description,
    images,
  };

  await eventService.updateEventById(eventId, data);
  res.send(event);
});

const quickArrival = catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const event = await eventService.getEventById(eventId);
  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, "Location not found");
  }

  if (!event.partner == req.user._id) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You don't have permission to update this location"
    );
  }

  // if (!req?.user?.partnershipPriceRenewalDate || new Date() > new Date(req?.user?.partnershipPriceRenewalDate)) {
  //   throw new ApiError(
  //     httpStatus.FORBIDDEN,
  //     "You're not subscribed to this service"
  //   );
  // }

  const arrivalImages = await Promise.all(
    req.files.map(async (file) => {
      const media = await uploadMedia(file, req.user._id);
      return media._id;
    })
  );

  const createdArrival = await eventService.createArrivalById({
    location: eventId,
    images: arrivalImages,
    isActive: true,
    arrivalText: req.body.arrivalText,
    departureAt: req.body.departureAt,
  });

  const updatedEvent = await eventService.updateEventById(eventId, {
    ...req.body,
    arrivalImages,
    isActive: true,
    isArrival: createdArrival._id,
    departureAt: req.body.departureAt
  });

  event.favoriteUsers.map(async item => {
    // const status = await settingService.getSettingStatus({
    //   key: "user:location",
    //   user: item,
    // });
    // if (status) {
    EventEmitter.emit(events.SEND_NOTIFICATION, {
      recipient: item,
      actor: event.partner._id,
      type: "addEvent",
      title: "Event Favorite",
      description: `Your favorite Event ${event.title} is now inactive.`,
      url: `/profile/${item}/favorites/`,
    });
    // }
  });

  EventEmitter.emit(events.SEND_NOTIFICATION, {
    recipient: event.partner._id,
    actor: event.partner._id,
    type: "LocationActive",
    title: "Location Active",
    description: `Your event ${event.title} is now active.`,
    url: `/profile/${req.user._id}/events/`,
  });

  res.send(updatedEvent);
});

const quickDeparture = catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const event = await eventService.getEventById(eventId);
  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, "event not found");
  }

  if (!event.partner == req.user._id) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You don't have permission to update this location"
    );
  }

  event.favoriteUsers.map(async item => {
    // const status = await settingService.getSettingStatus({
    //   key: "user:location",
    //   user: item,
    // });
    // if (status) {
    EventEmitter.emit(events.SEND_NOTIFICATION, {
      recipient: item,
      actor: event.partner._id,
      type: "addLocation",
      title: "Event Favorite",
      description: `Your favorite event ${event.title} is now inactive.`,
      url: `/profile/${item}/favorites/`,
    });
    // }
  });

  EventEmitter.emit(events.SEND_NOTIFICATION, {
    recipient: event.partner._id,
    actor: event.partner._id,
    type: "LocationActive",
    title: "Event Active",
    description: `Your event ${event.title} is now inactive.`,
    url: `/profile/${req.user._id}/events/`,
  });

  // if (!req?.user?.partnershipPriceRenewalDate || new Date() > new Date(req?.user?.partnershipPriceRenewalDate)) {
  //   throw new ApiError(
  //     httpStatus.FORBIDDEN,
  //     "You're not subscribed to this service"
  //   );
  // }

  const updatedEvent = await eventService.updateEventById(eventId, {
    isActive: false,
    isArrival: null
  });
  res.send(updatedEvent);
});

const reviewEvent = catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const event = await eventService.getEventById(eventId);
  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, "event not found");
  }

  const images = await Promise.all(
    req.files.map(async (file) => {
      const media = await uploadMedia(file, req.user._id);
      return media._id;
    })
  );

  const like = await Like.create({
    count: 0,
  });

  const review = await reviewService.createReview({
    location: eventId,
    user: req.user._id,
    images,
    like,
    ...req.body,
  });

  await eventService.updateEventById(eventId, {
    reviews: [...event.reviews, review._id],
  });

  res.send(review);
});

const checkIn = catchAsync(async (req, res) => {
  const { arrivalID } = req.params;
  const arrival = await eventService.getArrivalById(arrivalID);
  if (!arrival) {
    throw new ApiError(httpStatus.NOT_FOUND, "arrival not found");
  }

  const ischeckedin = arrival.checkIn.includes(req.user.id);
  if (ischeckedin) {
    res.send({
      count: arrival.checkIn.length,
      type: "warning",
      message: "You are already checked in.",
    });
  } else {
    const result = await locationService.updateArrivalById(arrivalID, {
      checkIn: [...arrival.checkIn, req.user._id],
    });

    // const status = await settingService.getSettingStatus({
    //   key: "user:location",
    //   user: arrival.location.partner,
    // });
    // if (status) {
    EventEmitter.emit(events.SEND_NOTIFICATION, {
      recipient: arrival.location.partner,
      actor: req.user._id,
      type: "checkIn",
      title: "Checked In",
      description: `${req.user.businessname} has checked into your location ${arrival.location.title}`,
      url: `/profile/${arrival.location.partner}/locations/${arrival.location.id}`,
    });
    // }
    res.send({
      count: result.checkIn.length,
      type: "success",
      message: "You are checked in successfully.",
    });
  }
});

// const likeArrival = catchAsync(async (req, res) => {
//   const { arrivalID } = req.params;
//   const arrival = await locationService.getArrivalById(arrivalID);
//   if (!arrival) {
//     throw new ApiError(httpStatus.NOT_FOUND, "arrival not found");
//   }

//   if (!arrival.like) {
//     arrival.like = await likeService.createLike({
//       users: [],
//       count: 0,
//     });

//     await arrival.save();
//   }

//   const liked = arrival.like.users.includes(req.user.id);

//   if (liked) {
//     arrival.like.users = arrival.like.users.filter(
//       (user) => user != req.user._id
//     );
//     arrival.like.count -= 1;
//   } else {
//     arrival.like.users.push(req.user._id);
//     arrival.like.count += 1;
//   }

//   await likeService.updateLikeById(arrival.like._id, arrival.like);

//   res.send({ liked: !liked });
// });

// const favoriteLocation = catchAsync(async (req, res) => {
//   const { locationId } = req.params;
//   const location = await locationService.getLocationById(locationId);

//   if (!location) {
//     throw new ApiError(httpStatus.NOT_FOUND, "Location not found");
//   }

//   await locationService.updateLocationById(locationId, {
//     favoriteUsers: location.favoriteUsers?.includes(req.user._id)
//       ? location.favoriteUsers
//       : [...location.favoriteUsers, req.user._id],
//   });

//   await userService.updateUserById(req.user._id, {
//     favoriteLocations: req.user.favoriteLocations?.includes(location._id)
//       ? req.user.favoriteLocations
//       : [...req.user.favoriteLocations, locationId],
//   });

//   // const status = await settingService.getSettingStatus({
//   //   key: "user:location",
//   //   user: location.partner._id,
//   // });
//   // if (status) {
//   EventEmitter.emit(events.SEND_NOTIFICATION, {
//     recipient: location.partner._id,
//     actor: req.user._id,
//     type: "location",
//     title: "Location Favorite",
//     description: `${req.user.businessname} has favorited into your location ${location.title}`,
//     url: `/profile/${location.partner._id}/locations/${location.id}`,
//   });
//   // }

//   res.status(httpStatus.NO_CONTENT).send();
// });

// const unfavoriteLocation = catchAsync(async (req, res) => {
//   const { locationId } = req.params;
//   const location = await locationService.getLocationById(locationId);

//   if (!location) {
//     throw new ApiError(httpStatus.NOT_FOUND, "Location not found");
//   }

//   await locationService.updateLocationById(locationId, {
//     favoriteUsers: location.favoriteUsers.filter(
//       (user) => user != req.user._id
//     ),
//   });

//   await userService.updateUserById(req.user._id, {
//     favoriteLocations: req.user.favoriteLocations.filter(
//       (location) => location != locationId
//     ),
//   });

//   // const status = await settingService.getSettingStatus({
//   //   key: "user:location",
//   //   user: location.partner._id,
//   // });
//   // if (status) {
//   EventEmitter.emit(events.SEND_NOTIFICATION, {
//     recipient: location.partner._id,
//     actor: req.user._id,
//     type: "location",
//     title: "Location Favorite",
//     description: `${req.user.businessname} has unfavorited into your location ${location.title}`,
//     url: `/profile/${location.partner._id}/locations/${location.id}`,
//   });
//   // }

//   res.status(httpStatus.NO_CONTENT).send();
// });

// const getFavoriteLocations = catchAsync(async (req, res) => {
//   const { userId } = req.params;

//   const locations = await userService.getFavoriteLocations(userId);
//   res.send(locations);
// });

// const likeReview = catchAsync(async (req, res) => {
//   const { reviewId } = req.params;
//   const review = await reviewService.getReviewById(reviewId, "user");
//   if (!review) {
//     throw new ApiError(httpStatus.NOT_FOUND, "Review not found");
//   }

//   if (!review.like) {
//     review.like = await likeService.createLike({
//       users: [],
//       count: 0,
//     });

//     await review.save();
//   }

//   const liked = review.like.users.includes(req.user.id);

//   if (liked) {
//     review.like.users = review.like.users.filter(
//       (user) => user != req.user._id
//     );
//     review.like.count -= 1;
//   } else {
//     review.like.users.push(req.user._id);
//     review.like.count += 1;

//     if (review.user._id.toString() !== req.user.id.toString()) {
//       EventEmitter.emit(events.SEND_NOTIFICATION, {
//         recipient: review.user._id.toString(),
//         actor: req.user.id.toString(),
//         title: "New review like",
//         description: `${req.user.username} has liked review ${review.text
//           ? review.text.slice(0, 20) + (review.text.length > 20 ? "..." : "")
//           : review._id
//           } `,
//         url: `/profile/${review.location.partner.toString()}/locations/${review.location._id.toString()}/`,
//         type: "like",
//       });
//     }
//   }

//   await likeService.updateLikeById(review.like._id, review.like);

//   res.send({ liked: !liked });
// });

module.exports = {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  quickArrival,
  quickDeparture,
  reviewEvent,
  deleteEvent,
  // likeReview,
  // likeArrival,
  // favoriteLocation,
  // unfavoriteLocation,
  // getFavoriteLocations,
  checkIn,
  // getExpiredArrivals
};
