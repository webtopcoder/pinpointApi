const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const ApiError = require("@utils/ApiError");
const { ObjectId } = require("bson");
const {
  eventService,
  likeService,
  reviewService,
  categoryService,
  userService,
  settingService
} = require("@services");
const XLSX = require('xlsx');
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

const markStatus = catchAsync(async (req, res) => {

  const { scheduleId } = req.params;
  const schedule = await eventService.getScheduleById(scheduleId);
  if (!schedule) {
    throw new ApiError(httpStatus.NOT_FOUND, "schedule not found");
  }

  const updatedSchedule = schedule.request.map(item => {
    if (item?.id) {
      const objectIdString = item.id.toString();
      if (objectIdString === req.body.id) {
        return {
          ...item,
          isActive: req.body.isActive
        };
      }
    }
    return item;
  });

  console.log(updatedSchedule)
  const result = await eventService.requestAccess(scheduleId, {
    request: updatedSchedule,
  });
  res.status(httpStatus.CREATED).send(result);
});


const getEvents = catchAsync(async (req, res) => {
  let filter = pick(req.query, [
    "isActive", "partner"
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

const uploadExcel = catchAsync(async (req, res) => {
  try {

    const { scheduleId } = req.params;
    let path = req.file.path;
    console.log(path);
    var workbook = XLSX.readFile(path);
    var sheet_name_list = workbook.SheetNames;
    let jsonData = XLSX.utils.sheet_to_json(
      workbook.Sheets[sheet_name_list[0]]
    );
    if (jsonData.length === 0) {
      return res.status(400).json({
        success: false,
        message: "xml sheet has no data",
      });
    }

    const schedule = await eventService.getScheduleById(scheduleId);
    if (!schedule) {
      throw new ApiError(httpStatus.NOT_FOUND, "schedule not found");
    }

    const updatedjsonData = jsonData.map(item => {
      return {
        ...item,
        isActive: 'approve'
      };
    });

    const updatedRequest = schedule.request.concat(updatedjsonData);
    const result = await eventService.requestAccess(scheduleId, {
      request: [...updatedRequest],
    });

    res.status(httpStatus.CREATED).send(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

const requestAccess = catchAsync(async (req, res) => {

  const { scheduleId } = req.params;
  const schedule = await eventService.getScheduleById(scheduleId);

  if (!schedule) {
    throw new ApiError(httpStatus.NOT_FOUND, "schedule not found");
  }

  const result = await eventService.requestAccess(scheduleId, {
    request: [...schedule.request, {
      id: req.user._id,
      firstname: req.user.firstName,
      lastname: req.user.lastName,
      businessname: req.user.businessname,
      category: req.user.category.name,
      email: req.user.email,
      isActive: 'pending'
    }],
  });
  res.status(httpStatus.CREATED).send(result);
});

const deleteManualRequest = catchAsync(async (req, res) => {

  const { scheduleId, requestId } = req.params;
  const schedule = await eventService.getScheduleById(scheduleId);

  if (!schedule) {
    throw new ApiError(httpStatus.NOT_FOUND, "schedule not found");
  }
  schedule.request = schedule.request.filter((item) => item?._id != requestId);

  const result = await eventService.requestAccess(scheduleId, {
    request: schedule.request,
  });
  res.status(httpStatus.CREATED).send(result);
});

const requestAccessManually = catchAsync(async (req, res) => {

  const { scheduleId } = req.params;
  const schedule = await eventService.getScheduleById(scheduleId);

  if (!schedule) {
    throw new ApiError(httpStatus.NOT_FOUND, "schedule not found");
  }

  const result = await eventService.requestAccess(scheduleId, {
    request: [...schedule.request, {
      ...req.body,
      isActive: 'approve'
    }],
  });
  res.status(httpStatus.CREATED).send(result);
});


const getScheduleById = catchAsync(async (req, res) => {

  const { scheduleId } = req.params;
  const schedule = await eventService.getIndividualSchedule(scheduleId);

  if (!schedule) {
    throw new ApiError(httpStatus.NOT_FOUND, "schedule not found");
  }
  res.send(schedule);
});

const getEventSchedule = catchAsync(async (req, res) => {

  let filter = pick(req.body, [
    "isActive",
    "flag",
    "time",
    "position",
    "range",
    "map"
  ]);


  if (filter.position.lat) {
    filter.coordinates = {
      $geoWithin: {
        $centerSphere: [[filter.position.lng, filter.position.lat], filter.range / 3980.2]
      }
    }
  }

  if (!filter.flag)
    filter.eventhost = req.user._id;
  let options = pick(req.query, ["limit", "page", "sort", "pagination"]);
  if (filter.q) {
    filter.title = { $regex: filter.q, $options: "i" };
    delete filter.q;
  }

  const currentDate = new Date();  // Assuming the current date is 2023-06-22T01:25:48.560+00:00

  if (filter.map) {
    filter.$expr = {
      $and: [
        { $gt: [new Date(), "$startDate"] },
        { $lt: [new Date(), "$endDate"] }
      ]
    }
  }
  switch (filter.time) {
    case "this":
      const startOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay() + 7);
      filter.startDate = {
        $gte: startOfWeek,
        $lt: endOfWeek
      }
      break;
    case "next":
      const startOfNextWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay() + 7);
      const endOfNextWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay() + 14);
      console.log(startOfNextWeek, endOfNextWeek);
      filter.startDate = {
        $gte: startOfNextWeek,
        $lt: endOfNextWeek
      }
      break;
    case "future":
      const startOfFutureWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay() + 14);
      filter.startDate = {
        $gte: startOfFutureWeek,
      }
      break;
    default:
      break
  }

  delete filter.time;
  delete filter.flag;
  delete filter.range;
  delete filter.position;
  delete filter.map;

  options.populate = [
    "eventhost",
    { path: "eventhost", populate: "profile.avatar" },
    "event",
    "images",
    "categories",
  ];

  const result = await eventService.queryEventSchedule(filter, options);

  res.send(result);
});

const deleteEventSchedule = catchAsync(async (req, res) => {
  const { scheduleId } = req.params;

  const schedule = await eventService.getScheduleById(scheduleId);
  if (!schedule) {
    throw new ApiError(httpStatus.NOT_FOUND, "schedule not found");
  }

  await schedule.delete();
  res.send(schedule);
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

const addEventSchedule = catchAsync(async (req, res) => {
  const images = await Promise.all(
    req.files.map(async (file) => {
      const media = await uploadMedia(file, req.user._id);
      return media._id;
    })
  );

  const event = await eventService.createEventSchedule({
    ...req.body,
    eventhost: req.user._id,
    images,
  });
  res.status(httpStatus.CREATED).send(event);
});

const updateEventSchedule = catchAsync(async (req, res) => {
  const images = await Promise.all(
    req.files.map(file => uploadMedia(file, req.user._id).then(media => media._id))
  );

  const { scheduleId } = req.params;
  const schedule = await eventService.getScheduleById(scheduleId);
  if (!schedule) {
    throw new ApiError(httpStatus.NOT_FOUND, "schedule not found");
  }
  const data = req.files.length > 0 ? { ...req.body, images } : { ...schedule, ...req.body };

  const result = await eventService.updateScheduleById(scheduleId, data);
  res.status(httpStatus.CREATED).send(result);
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

module.exports = {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  quickArrival,
  quickDeparture,
  reviewEvent,
  deleteEvent,
  addEventSchedule,
  getEventSchedule,
  requestAccessManually,
  uploadExcel,
  deleteEventSchedule,
  updateEventSchedule,
  deleteManualRequest,
  checkIn,
  requestAccess,
  getScheduleById,
  markStatus
};
