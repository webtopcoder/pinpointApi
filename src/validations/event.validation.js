const Joi = require("joi");
const {
  objectId,
  validateObjectIdArrayInFormData,
} = require("./custom.validation");

const createEvent = {
  body: Joi.object().keys({
    title: Joi.string().required(),
    description: Joi.string().allow(""),
  }),
};

const getEvents = {
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

const getEvent = {
  params: Joi.object().keys({
    eventId: Joi.string().custom(objectId),
    expand: Joi.boolean()
  }),
};

const updateEvent = {
  params: Joi.object().keys({
    eventId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      title: Joi.string().required(),
      description: Joi.string().allow(""),
    })
    .min(1),
};

const quickArrival = {
  params: Joi.object().keys({
    eventId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    departureAt: Joi.date(),
    arrivalText: Joi.string().allow("").optional().default(""),
  }),
};

const quickDeparture = {
  params: Joi.object().keys({
    eventId: Joi.required().custom(objectId),
  }),
};

const reviewEvent = {
  params: Joi.object().keys({
    eventId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    rating: Joi.number().required(),
    text: Joi.string().required(),
  }),
};

module.exports = {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  quickArrival,
  quickDeparture,
  reviewEvent,
};
