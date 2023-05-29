const Joi = require("joi");
const { objectId } = require("./custom.validation");

const createNewpartners = {
  body: Joi.object().keys({
    username: Joi.string().required(),
    content: Joi.string().required(),
    category: Joi.string().required(),
    state: Joi.string().required(),
    city: Joi.string().allow(""),
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

const updateNewpartners = {
  params: Joi.object().keys({
    testimonialId: Joi.string().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      username: Joi.string().required(),
      content: Joi.string().required(),
      category: Joi.string().required(),
      state: Joi.string().required(),
      city: Joi.string().allow(""),
      isArchived: Joi.boolean(),
    })
    .min(1),
};

module.exports = {
  createNewpartners,
  getTestimonial,
  updateNewpartners,
};
