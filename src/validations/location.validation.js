const Joi = require("joi");
const {
  objectId,
  validateObjectIdArrayInFormData,
  validateObjectArray
} = require("./custom.validation");

const createLocation = {
  body: Joi.object().keys({
    title: Joi.string().required(),
    description: Joi.string().allow(""),
    question: Joi.any(),
    options: Joi.any(),
    subCategories: Joi.string().custom(validateObjectIdArrayInFormData),
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
    subCategory: Joi.string().allow(""),
    category: Joi.string().allow(""),
  }),
};

const getLocationByTitle = {
  params: Joi.object().keys({
    title: Joi.string().allow(""),
    expand: Joi.boolean()
  }),
};

const getLocationById = {
  params: Joi.object().keys({
    locationId: Joi.required().custom(objectId),
    expand: Joi.boolean()
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
      subCategories: Joi.string().custom(validateObjectIdArrayInFormData), // transform to array of objectIds
      question: Joi.any(),
      options: Joi.any(),
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
    addressType: Joi.string().allow(""),
    history: Joi.string().custom(validateObjectArray),
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
  getLocationByTitle,
  getLocationById,
  updateLocation,
  quickArrival,
  quickDeparture,
  reviewLocation,
};
