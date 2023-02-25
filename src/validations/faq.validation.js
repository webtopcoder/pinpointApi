const Joi = require("joi");
const { objectId } = require("./custom.validation");

const createFAQ = {
  body: Joi.object().keys({
    question: Joi.string().required(),
    answer: Joi.string().required(),
    isArchived: Joi.boolean(),
  }),
};

const getFAQs = {
  query: Joi.object().keys({
    q: Joi.string(),
    isArchived: Joi.boolean(),
    sort: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const updateFAQ = {
  params: Joi.object().keys({
    faqId: Joi.string().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      question: Joi.string(),
      answer: Joi.string(),
      isArchived: Joi.boolean(),
    })
    .min(1),
};

module.exports = {
  createFAQ,
  getFAQs,
  updateFAQ,
};
