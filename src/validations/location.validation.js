const Joi = require("joi");
const { objectId } = require("./custom.validation");

const createLocation = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string().required(),
    mapLocation: Joi.object().keys({
      latitude: Joi.number().required(),
      longitude: Joi.number().required(),
      address: Joi.string().required(),
    }),
    images: Joi.array().items(Joi.string()),
    isActive: Joi.boolean(),
    arrivalAt: Joi.date(),
  }),
};

const getLocations = {
  query: Joi.object().keys({
    q: Joi.string(),
    isActive: Joi.boolean(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    sort: Joi.string(),
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
      arrivalAt: Joi.date(),
      departureAt: Joi.date(),
    })
    .min(1),
};

module.exports = {
  createLocation,
  getLocations,
  getLocation,
};
