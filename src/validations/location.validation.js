const Joi = require("joi");
const { objectId } = require("./custom.validation");

const createLocation = {
  body: Joi.object().keys({
    title: Joi.string().required(),
    description: Joi.string().allow(""),
    address: Joi.string().allow(""),
    city: Joi.string().allow(""),
    state: Joi.string().allow(""),
  }),
};

const getLocations = {
  query: Joi.object().keys({
    q: Joi.string(),
    isActive: Joi.boolean(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    sort: Joi.string(),
    pagination: Joi.boolean(),
    partner: Joi.string().custom(objectId),
  }),
};

const getLocation = {
  params: Joi.object().keys({
    locationId: Joi.string().custom(objectId),
  }),
};

const updateLocation = {
  params: Joi.object().keys({
    locationId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      title: Joi.string().required(),
      description: Joi.string().allow(""),
      address: Joi.string().allow(""),
      city: Joi.string().allow(""),
      state: Joi.string().allow(""),
    })
    .min(1),
};

const quickArrival = {
  params: Joi.object().keys({
    locationId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    departureAt: Joi.date(),
    arrivalText: Joi.string().allow("").optional().default(""),
  }),
};

const quickDeparture = {
  params: Joi.object().keys({
    locationId: Joi.required().custom(objectId),
  }),
};

const reviewLocation = {
  params: Joi.object().keys({
    locationId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    rating: Joi.number().required(),
    text: Joi.string().required(),
  }),
};

module.exports = {
  createLocation,
  getLocations,
  getLocation,
  updateLocation,
  quickArrival,
  quickDeparture,
  reviewLocation,
};
