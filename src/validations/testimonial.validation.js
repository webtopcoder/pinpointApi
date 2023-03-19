const Joi = require("joi");
const { objectId } = require("./custom.validation");

const createTestimonial = {
  body: Joi.object().keys({
    username: Joi.string().required(),
    content: Joi.string().required(),
    occupation: Joi.string().required(),
    isArchived: Joi.boolean(),
  }),
};

const getTestimonial = {
  query: Joi.object().keys({
    q: Joi.string(),
    isArchived: Joi.boolean(),
    sort: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const updateTestimonial = {
  params: Joi.object().keys({
    testimonialId: Joi.string().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      username: Joi.string().required(),
      content: Joi.string().required(),
      occupation: Joi.string().required(),
      isArchived: Joi.boolean(),
    })
    .min(1),
};

module.exports = {
  createTestimonial,
  getTestimonial,
  updateTestimonial,
};
