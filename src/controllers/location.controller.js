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
    mapLocation: {
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      latitude: req.body.lat,
      longitude: req.body.lng,
    },
    lastSeen: new Date(),
    subCategories: req.body.subCategories,
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

  let subcategoryFlag;
  filter.subCategory ? subcategoryFlag = true : subcategoryFlag = false;

  let options = pick(req.query, ["limit", "page", "sort", "pagination"]);
  if (filter.q) {
    filter.title = { $regex: filter.q, $options: "i" };
    delete filter.q;
  }
  let locationCategory;
  if (filter.category) {
    locationCategory = await categoryService.getCategoryById(filter.category);
    if (!locationCategory) {
      throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
    }

    const subcategoriesID = await categoryService.getSubCategoryByCategoryId(
      locationCategory._id
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
  ];

  delete filter.category;

  const result = await locationService.queryLocations(filter, options);

  res.send(result);
});

const getLocation = catchAsync(async (req, res) => {
  const location = await locationService.getLocationById(req.params.locationId);
  const IsArrival = await locationService.getIsArrival(req.params.locationId);
  const ExpiredArrivals = await locationService.getExpiredArrivals(req.params.locationId, req.params.expand, IsArrival);
  const userinfo = await userService.getUserById(req.user._id);

  if (!location) {
    throw new ApiError(httpStatus.NOT_FOUND, "Location not found");
  }

  const favorited = userinfo.favoriteLocations.includes(req.params.locationId) ? true : false;

  const data = {
    lastSeen: new Date(),
  };

  await locationService.updateLocationById(req.params.locationId, data);
  res.send({ location: location, expiredArrival: ExpiredArrivals, isFavorite: favorited });
});

const getExpiredArrivals = catchAsync(async (req, res) => {
  const IsArrival = await locationService.getIsArrival(req.params.locationId);
  const ExpiredArrivals = await locationService.getExpiredArrivals(req.params.locationId, IsArrival);
  res.send(ExpiredArrivals);
});

const updateLocation = catchAsync(async (req, res) => {
  const images = await Promise.all(
    req.files.map(async (file) => {
      const media = await uploadMedia(file, req.user._id);
      return media._id;
    })
  );
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

  const data = {
    title: req.body.title,
    description: req.body.description,
    images,
    mapLocation: {
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      latitude: req.body.lat,
      longitude: req.body.lng,
    },
    subCategories: req.body.subCategories,
  };

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

  if (!req?.user?.partnershipPriceRenewalDate && new Date() > new Date(req?.user?.partnershipPriceRenewalDate)) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You're not subscribed to this service"
    );
  }

  const arrivalImages = await Promise.all(
    req.files.map(async (file) => {
      const media = await uploadMedia(file, req.user._id);
      return media._id;
    })
  );

  const createdArrival = await locationService.createArrivalById({
    location: locationId,
    images: arrivalImages,
    isActive: true,
    arrivalText: req.body.arrivalText,
    departureAt: req.body.departureAt,
  });

  const updatedLocation = await locationService.updateLocationById(locationId, {
    ...req.body,
    arrivalImages,
    isActive: true,
    isArrival: createdArrival._id,
    departureAt: req.body.departureAt
  });

  location.favoriteUsers.map(async item => {
    // const result = await settingService.getSettings({
    //   key: "user:location",
    //   user: item,
    // });
    // if (result.length !== 0 && result[0].value !== "false") {
    EventEmitter.emit(events.SEND_NOTIFICATION, {
      recipient: item,
      actor: location.partner._id,
      type: "addLocation",
      title: "New message",
      description: `@${location.partner.username} Your favorite location is active.`,
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

  if (!req?.user?.partnershipPriceRenewalDate && new Date() > new Date(req?.user?.partnershipPriceRenewalDate)) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You're not subscribed to this service"
    );
  }

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

  res.status(httpStatus.NO_CONTENT).send(); ``
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
  getExpiredArrivals
};
