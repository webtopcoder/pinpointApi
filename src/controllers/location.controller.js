const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const ApiError = require("@utils/ApiError");
const {
  locationService,
  likeService,
  reviewService,
  userService,
} = require("@services");
const { uploadMedia } = require("../services/media.service");
const pick = require("../utils/pick");
const { Review, Like } = require("../models");

const createLocation = catchAsync(async (req, res) => {
  const images = await Promise.all(
    req.files.map(async (file) => {
      const media = await uploadMedia(file, req.user._id);
      return media._id;
    })
  );
  console.log(req.body);

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
    subCategories: req.body.subCategories,
  });
  res.status(httpStatus.CREATED).send(location);
});

const deleteLocation = catchAsync(async (req, res) => {
  const { locationId } = req.params;

  console.log(locationId);
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
  let filter = pick(req.query, ["isActive", "partner"]);
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
    "arrivalImages",
    "subCategories",
  ];
  const result = await locationService.queryLocations(filter, options);
  res.send(result);
});

const getLocation = catchAsync(async (req, res) => {
  let location = await locationService.getLocationById(req.params.locationId);
  if (!location) {
    throw new ApiError(httpStatus.NOT_FOUND, "Location not found");
  }

  location = location.toJSON();

  res.send({
    ...location,
    isFavorite: req.user?.favoriteLocations?.includes(location.id) ?? false,
  });
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

  if (location.partner._id != req.user._id) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You don't have permission to update this location"
    );
  }

  const data = {
    title: req.body.title,
    description: req.body.description,
    images: images.length > 0 ? images : location.images,
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

  const arrivalImages = await Promise.all(
    req.files.map(async (file) => {
      const media = await uploadMedia(file, req.user._id);
      return media._id;
    })
  );

  const updatedLocation = await locationService.updateLocationById(locationId, {
    ...req.body,
    arrivalImages,
    isActive: true,
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

  const updatedLocation = await locationService.updateLocationById(locationId, {
    isActive: false,
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

  const review = await Review.create({
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

const likeLocation = catchAsync(async (req, res) => {
  const { locationId } = req.params;
  const location = await locationService.getLocationById(locationId);
  if (!location) {
    throw new ApiError(httpStatus.NOT_FOUND, "Location not found");
  }

  if (!location.like) {
    location.like = await likeService.createLike({
      users: [],
      count: 0,
    });

    await location.save();
  }

  const liked = location.like.users.includes(req.user.id);

  if (liked) {
    location.like.users = location.like.users.filter(
      (user) => user != req.user._id
    );
    location.like.count -= 1;
  } else {
    location.like.users.push(req.user._id);
    location.like.count += 1;
  }

  await likeService.updateLikeById(location.like._id, location.like);

  res.send({ liked: !liked });
});

const likeReview = catchAsync(async (req, res) => {
  const { reviewId } = req.params;
  const review = await reviewService.getReviewById(reviewId);
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
  }

  await likeService.updateLikeById(review.like._id, review.like);

  res.send({ liked: !liked });
});

const checkIn = catchAsync(async (req, res) => {
  const { locationId } = req.params;
  const location = await locationService.getLocationById(locationId);
  if (!location) {
    throw new ApiError(httpStatus.NOT_FOUND, "Location not found");
  }

  if (!location.checkIn?.includes(req.user._id)) {
    const updatedLocation = await locationService.updateLocationById(
      locationId,
      {
        checkIn: [...location.checkIn, req.user._id],
      }
    );

    res.status(httpStatus.CREATED).send(updatedLocation);
  }

  res.status(httpStatus.CREATED).send(location);
});

const favoriteLocation = catchAsync(async (req, res) => {
  const { locationId } = req.params;
  const location = await locationService.getLocationById(locationId);

  if (!location) {
    throw new ApiError(httpStatus.NOT_FOUND, "Location not found");
  }

  await userService.updateUserById(req.user._id, {
    favoriteLocations: req.user.favoriteLocations?.includes(location._id)
      ? req.user.favoriteLocations
      : [...req.user.favoriteLocations, locationId],
  });

  res.status(httpStatus.NO_CONTENT).send();
});

const unfavoriteLocation = catchAsync(async (req, res) => {
  const { locationId } = req.params;
  const location = await locationService.getLocationById(locationId);

  if (!location) {
    throw new ApiError(httpStatus.NOT_FOUND, "Location not found");
  }

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

const getInteractiveMap = catchAsync(async (_, res) => {
  const filter = {
    isActive: true,
    "mapLocation.interactiveMapContent": { $exists: true },
  };

  const options = {
    sort: { createdAt: -1 },
    pagination: false,
  };

  options.projection = [
    "mapLocation._id",
    "mapLocation.longitude",
    "mapLocation.latitude",
    "mapLocation.interactiveMapContent",
  ];

  const map = await locationService.queryLocations(filter, options);
  res.send(map);
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
  likeLocation,
  checkIn,
  favoriteLocation,
  unfavoriteLocation,
  getFavoriteLocations,
  getInteractiveMap,
};
