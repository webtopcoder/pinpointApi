const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const ApiError = require("@utils/ApiError");
const {
  locationService,
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

const createLocation = catchAsync(async (req, res) => {
  const images = await Promise.all(
    req.files.map(async (file) => {
      const media = await uploadMedia(file, req.user._id);
      return media._id;
    })
  );

  const location = await locationService.createLocation({
    partner: req.user._id,
    images,
    title: req.body.title,
    description: req.body.description,
    lastSeen: new Date(),
    subCategories: req.body.subCategories,
    poll: req.body?.question || req.body.options ? { question: req.body.question, options: req.body.options.split(',').map(option => ({ optionText: option })) } : {}
  });

  res.status(httpStatus.CREATED).send(location);
});

const deleteLocation = catchAsync(async (req, res) => {
  const { locationId } = req.params;

  const location = await locationService.getLocationById(locationId);
  if (!location) {
    throw new ApiError(httpStatus.NOT_FOUND, "Location not found");
  }

  const data = {
    deleted: true,
  };

  await locationService.deleteLocationByID(locationId, data);

  res.send(location);
});

const getLocations = catchAsync(async (req, res) => {
  let filter = pick(req.query, [
    "isActive",
    "partner",
    "category",
    "subCategory",
  ]);

  let options = pick(req.query, ["limit", "page", "sort"]);

  let subcategoryFlag;
  filter.subCategory ? subcategoryFlag = true : subcategoryFlag = false;

  if (filter.q) {
    filter.title = { $regex: filter.q, $options: "i" };
    delete filter.q;
  }
  if (filter.category) {
    const subcategoriesID = await categoryService.getSubCategoryByCategoryId(
      filter.category
    );
    var subCategoriesString = [];
    subcategoriesID.map(async (item) => {
      subCategoriesString.push(item.id);
    });

    filter.subCategory = subCategoriesString.toString();
  }

  if (filter.subCategory) {
    const subCategories = await Promise.all(
      filter.subCategory.split(",").map(async (subCategoryID) => {
        return subCategoryID;
      })
    );

    subcategoryFlag === true ? filter.subCategories = { $all: subCategories } : filter.subCategories = { $in: subCategories }
    delete filter.subCategory;
  }

  options.populate = [
    {
      path: "partner",
      populate: [
        {
          path: "category",
          populate: {
            path: "image",
          },
        },
      ],
    },
    "like",
    "reviews",
    "images",
    "isArrival",
    "arrivalImages",
    "subCategories",
    "poll"
  ];

  delete filter.category;

  const result = await locationService.queryLocations(filter, options);
  res.send(result);
});

const getLocation = catchAsync(async (req, res) => {
  const location = await locationService.getLocationById(req.params.locationId);
  const IsArrival = await locationService.getIsArrival(req.params.locationId);
  const ExpiredArrivals = await locationService.getExpiredArrivals(req.params.locationId, req.params.expand, IsArrival);
  let favorited = false;

  if (!location) {
    throw new ApiError(httpStatus.NOT_FOUND, "Location not found");
  }

  if (req.user) {
    const userinfo = await userService.getUserById(req.user._id);
    favorited = userinfo.favoriteLocations.includes(req.params.locationId) ? true : false;
  }

  const data = {
    lastSeen: new Date(),
  };

  await locationService.updateLocationById(req.params.locationId, data);
  res.send({ location: location, expiredArrival: ExpiredArrivals, isFavorite: favorited });
});

const getLocationByTitle = catchAsync(async (req, res) => {
  const location = await locationService.getLocationByTitle(req.params.title);
  if (!location) {
    throw new ApiError(httpStatus.NOT_FOUND, "Location not found");
  }

  const IsArrival = await locationService.getIsArrival(location?.id);
  const ExpiredArrivals = await locationService.getExpiredArrivals(location?.id, req.params.expand, IsArrival);
  let favorited = false;
  if (req.user) {
    const userinfo = await userService.getUserById(req.user._id);
    favorited = userinfo.favoriteLocations.includes(location?.id) ? true : false;
  }

  const data = {
    lastSeen: new Date(),
  };

  await locationService.updateLocationById(location?.id, data);
  res.send({ location: location, expiredArrival: ExpiredArrivals, isFavorite: favorited });
});

const getExpiredArrivals = catchAsync(async (req, res) => {
  const IsArrival = await locationService.getIsArrival(req.params.locationId);
  const ExpiredArrivals = await locationService.getExpiredArrivals(req.params.locationId, IsArrival);
  res.send(ExpiredArrivals);
});

const votePoll = catchAsync(async (req, res) => {
  const { userId, locationId } = req.params;
  const { option } = req.body;
  const user = await userService.getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const location = await locationService.getLocationById(locationId);

  if (location?.poll?.usersVoted.includes(req.user._id)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "You already voted");
  }

  const opentextToFind = option; // The optionText to find
  const options = location.poll;
  // Function to find the index of the option with the given optionText
  const findOptionIndex = (options, opentext) => {
    return options.findIndex(option => option.optionText === opentext);
  };

  // Find the index of the option with the given optionText
  const optionIndex = findOptionIndex(options.options, opentextToFind);

  if (optionIndex !== -1) {
    // If the option with the given optionText is found, increment its votes
    options.options[optionIndex].votes++;
    // Log the updated options object
    options.usersVoted.push(req.user._id);

  } else {
    // If the option with the given optionText is not found
    console.log('Option not found.');
  }


  await locationService.updateLocationById(locationId, { ...location, poll: options });

  // poll.votes[option] += 1;

  // await userService.updateUserById(userId, {
  //   profile: { ...user.profile, poll },
  // });
  res.send(options);
});

const updateLocation = catchAsync(async (req, res) => {
  const { title, description, subCategories } = req.body;
  const { locationId } = req.params;
  const { _id: userId } = req.user;

  const location = await locationService.getLocationById(locationId);
  if (!location) {
    throw new ApiError(httpStatus.NOT_FOUND, "Location not found");
  }

  if (String(location.partner._id) !== String(userId)) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You don't have permission to update this location"
    );
  }

  let data = {
    title,
    description,
    subCategories,
    poll: {}
  };

  if (req.files && req.files.length > 0) {
    const images = await Promise.all(
      req.files.map(async (file) => {
        const media = await uploadMedia(file, userId);
        return media._id;
      })
    );
    data.images = images;
  }

  if (req.body.question || req.body.options) {
    data.poll = {
      question: req.body.question || "",
      options: (req.body.options || "").split(',').map(option => ({ optionText: option.trim() }))
    };
  }

  await locationService.updateLocationById(locationId, data);
  res.send(location);
});

const quickArrival = catchAsync(async (req, res) => {
  const { locationId } = req.params;
  const location = await locationService.getLocationById(locationId);
  if (!location) {
    throw new ApiError(httpStatus.NOT_FOUND, "Location not found");
  }

  if (!location.partner == req.user._id) {
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

  const createdArrival = await locationService.createArrivalById({
    location: locationId,
    address: req.body.history,
    images: arrivalImages,
    isActive: true,
    arrivalText: req.body.arrivalText,
    departureAt: req.body.departureAt,
  });

  const updatedLocation = await locationService.updateLocationById(locationId, {
    ...req.body,
    mapLocation: req.body.history,
    history: req.body.addressType === "new" ? [...location.history, req.body.history] : location.history,
    arrivalImages,
    isActive: true,
    isArrival: createdArrival._id,
    departureAt: req.body.departureAt
  });

  // EventEmitter.emit(events.SEND_NOTIFICATION, {
  //   recipient: location.partner._id,
  //   actor: location.partner._id,
  //   type: "LocationActive",
  //   title: "Location Active",
  //   description: `Your location ${location.title} is now active.`,
  //   url: `/profile/${req.user._id}/locations/`,
  // });

  location.favoriteUsers.map(async item => {
    // const status = await settingService.getSettingStatus({
    //   key: "user:location",
    //   user: item,
    // });
    // if (status) {
    EventEmitter.emit(events.SEND_NOTIFICATION, {
      recipient: item,
      actor: location.partner._id,
      type: "addLocation",
      title: "Location Favorite",
      description: `Your favorite location ${location.title} is now inactive.`,
      url: `/profile/${item}/favorites/`,
    });
    // }
  });

  res.send(updatedLocation);
});

const quickDeparture = catchAsync(async (req, res) => {
  const { locationId } = req.params;
  const location = await locationService.getLocationById(locationId);
  if (!location) {
    throw new ApiError(httpStatus.NOT_FOUND, "Location not found");
  }

  if (!location.partner == req.user._id) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You don't have permission to update this location"
    );
  }

  location.favoriteUsers.map(async item => {
    // const status = await settingService.getSettingStatus({
    //   key: "user:location",
    //   user: item,
    // });
    // if (status) {
    EventEmitter.emit(events.SEND_NOTIFICATION, {
      recipient: item,
      actor: location.partner._id,
      type: "addLocation",
      title: "Location Favorite",
      description: `Your favorite location ${location.title} is now inactive.`,
      url: `/profile/${item}/favorites/`,
    });
    // }
  });

  // EventEmitter.emit(events.SEND_NOTIFICATION, {
  //   recipient: location.partner._id,
  //   actor: location.partner._id,
  //   type: "LocationActive",
  //   title: "Location Active",
  //   description: `Your location ${location.title} is now inactive.`,
  //   url: `/profile/${req.user._id}/locations/`,
  // });

  // if (!req?.user?.partnershipPriceRenewalDate || new Date() > new Date(req?.user?.partnershipPriceRenewalDate)) {
  //   throw new ApiError(
  //     httpStatus.FORBIDDEN,
  //     "You're not subscribed to this service"
  //   );
  // }

  const updatedLocation = await locationService.updateLocationById(locationId, {
    isActive: false,
    isArrival: null
  });
  res.send(updatedLocation);
});

const reviewLocation = catchAsync(async (req, res) => {
  const { locationId } = req.params;
  const location = await locationService.getLocationById(locationId);
  if (!location) {
    throw new ApiError(httpStatus.NOT_FOUND, "Location not found");
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
    location: locationId,
    user: req.user._id,
    images,
    like,
    ...req.body,
  });

  await locationService.updateLocationById(locationId, {
    reviews: [...location.reviews, review._id],
  });

  res.send(review);
});

const checkIn = catchAsync(async (req, res) => {
  const { arrivalID } = req.params;
  const arrival = await locationService.getArrivalById(arrivalID);
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

const likeArrival = catchAsync(async (req, res) => {
  const { arrivalID } = req.params;
  const arrival = await locationService.getArrivalById(arrivalID);
  if (!arrival) {
    throw new ApiError(httpStatus.NOT_FOUND, "arrival not found");
  }

  if (!arrival.like) {
    arrival.like = await likeService.createLike({
      users: [],
      count: 0,
    });

    await arrival.save();
  }

  const liked = arrival.like.users.includes(req.user.id);

  if (liked) {
    arrival.like.users = arrival.like.users.filter(
      (user) => user != req.user._id
    );
    arrival.like.count -= 1;
  } else {
    arrival.like.users.push(req.user._id);
    arrival.like.count += 1;
  }

  await likeService.updateLikeById(arrival.like._id, arrival.like);

  res.send({ liked: !liked });
});

const favoriteLocation = catchAsync(async (req, res) => {
  const { locationId } = req.params;
  const location = await locationService.getLocationById(locationId);

  if (!location) {
    throw new ApiError(httpStatus.NOT_FOUND, "Location not found");
  }

  await locationService.updateLocationById(locationId, {
    favoriteUsers: location.favoriteUsers?.includes(req.user._id)
      ? location.favoriteUsers
      : [...location.favoriteUsers, req.user._id],
  });

  await userService.updateUserById(req.user._id, {
    favoriteLocations: req.user.favoriteLocations?.includes(location._id)
      ? req.user.favoriteLocations
      : [...req.user.favoriteLocations, locationId],
  });

  // const status = await settingService.getSettingStatus({
  //   key: "user:location",
  //   user: location.partner._id,
  // });
  // if (status) {
  EventEmitter.emit(events.SEND_NOTIFICATION, {
    recipient: location.partner._id,
    actor: req.user._id,
    type: "location",
    title: "Location Favorite",
    description: `${req.user.businessname} has favorited into your location ${location.title}`,
    url: `/profile/${location.partner._id}/locations/${location.id}`,
  });
  // }

  res.status(httpStatus.NO_CONTENT).send();
});

const unfavoriteLocation = catchAsync(async (req, res) => {
  const { locationId } = req.params;
  const location = await locationService.getLocationById(locationId);

  if (!location) {
    throw new ApiError(httpStatus.NOT_FOUND, "Location not found");
  }

  await locationService.updateLocationById(locationId, {
    favoriteUsers: location.favoriteUsers.filter(
      (user) => user != req.user._id
    ),
  });

  await userService.updateUserById(req.user._id, {
    favoriteLocations: req.user.favoriteLocations.filter(
      (location) => location != locationId
    ),
  });

  // const status = await settingService.getSettingStatus({
  //   key: "user:location",
  //   user: location.partner._id,
  // });
  // if (status) {
  EventEmitter.emit(events.SEND_NOTIFICATION, {
    recipient: location.partner._id,
    actor: req.user._id,
    type: "location",
    title: "Location Favorite",
    description: `${req.user.businessname} has unfavorited into your location ${location.title}`,
    url: `/profile/${location.partner._id}/locations/${location.id}`,
  });
  // }

  res.status(httpStatus.NO_CONTENT).send();
});

const getFavoriteLocations = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const locations = await userService.getFavoriteLocations(userId);
  res.send(locations);
});

const likeReview = catchAsync(async (req, res) => {
  const { reviewId } = req.params;
  const review = await reviewService.getReviewById(reviewId, "user");
  if (!review) {
    throw new ApiError(httpStatus.NOT_FOUND, "Review not found");
  }

  if (!review.like) {
    review.like = await likeService.createLike({
      users: [],
      count: 0,
    });

    await review.save();
  }

  const liked = review.like.users.includes(req.user.id);

  if (liked) {
    review.like.users = review.like.users.filter(
      (user) => user != req.user._id
    );
    review.like.count -= 1;
  } else {
    review.like.users.push(req.user._id);
    review.like.count += 1;

    if (review.user._id.toString() !== req.user.id.toString()) {
      EventEmitter.emit(events.SEND_NOTIFICATION, {
        recipient: review.user._id.toString(),
        actor: req.user.id.toString(),
        title: "New review like",
        description: `${req.user.username} has liked review ${review.text
          ? review.text.slice(0, 20) + (review.text.length > 20 ? "..." : "")
          : review._id
          } `,
        url: `/profile/${review.location.partner.toString()}/locations/${review.location._id.toString()}/`,
        type: "like",
      });
    }
  }

  await likeService.updateLikeById(review.like._id, review.like);

  res.send({ liked: !liked });
});

module.exports = {
  createLocation,
  getLocations,
  getLocation,
  getLocationByTitle,
  updateLocation,
  quickArrival,
  quickDeparture,
  reviewLocation,
  deleteLocation,
  likeReview,
  likeArrival,
  favoriteLocation,
  unfavoriteLocation,
  getFavoriteLocations,
  checkIn,
  getExpiredArrivals,
  votePoll
};
