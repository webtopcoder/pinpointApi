const Joi = require("joi");
const { objectId } = require("./custom.validation");

const createLocation = {
  body: Joi.object().keys({
    title: Joi.string().required(),
    description: Joi.string(),
    mapLocation: Joi.object()
      .keys({
        latitude: Joi.number(),
        longitude: Joi.number(),
        address: Joi.string(),
      })
      .optional(),
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
      name: Joi.string().required(),
      description: Joi.string().required(),
      mapLocation: Joi.object().keys({
        latitude: Joi.number().required(),
        longitude: Joi.number().required(),
        address: Joi.string().required(),
      }),
      images: Joi.array().items(Joi.string()),
      isActive: Joi.boolean(),
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

module.exports = {
  createLocation,
  getLocations,
  getLocation,
  updateLocation,
  quickArrival,
  quickDeparture,
};
