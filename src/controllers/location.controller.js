const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const ApiError = require("@utils/ApiError");
const { locationService } = require("@services");
const pick = require("../utils/pick");

const createLocation = catchAsync(async (req, res) => {
  const location = await locationService.createLocation(req.body);
  res.status(httpStatus.CREATED).send(location);
});

const getLocations = catchAsync(async (req, res) => {
  let filter = pick(req.query, ["isActive"]);
  let options = pick(req.query, ["limit", "page", "sort"]);
  if (filter.q) {
    filter.title = { $regex: filter.q, $options: "i" };
    delete filter.q;
  }
  const result = await locationService.queryEpisodes(filter, options);
  res.send(result);
});

const getLocation = catchAsync(async (req, res) => {
  const location = await locationService.getLocationById(req.params.locationId);
  if (!location) {
    throw new ApiError(httpStatus.NOT_FOUND, "Location not found");
  }
  res.send(location);
});

const getQuickArrival = catchAsync(async (req, res) => {
  const filter = {
    arrivalAt: { $gte: new Date().now - 1000 * 60 * 60 * 24 },
  };

  const options = {
    sort: "arrivalAt",
  };
  const location = await locationService.queryLocations(filter, options);
  res.send(location);
});

const getQuickDeparture = catchAsync(async (req, res) => {
  const filter = {
    departureAt: { $gte: new Date().now - 1000 * 60 * 60 * 24 },
  };

  const options = {
    sort: "departureAt",
  };

  const location = await locationService.queryLocations(filter, options);
  res.send(location);
});

const updateLocation = catchAsync(async (req, res) => {
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
  const updatedLocation = await locationService.updateLocationById(
    locationId,
    req.body
  );
  res.send(location);
});

module.exports = {
  createLocation,
  getLocations,
  getLocation,
  getQuickArrival,
  getQuickDeparture,
  updateLocation,
};
