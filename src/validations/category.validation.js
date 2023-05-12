const Joi = require("joi");
const { objectId } = require("./custom.validation");

const getSubCategories = {
  params: Joi.object().keys({
    categoryId: Joi.string().required(),
  }),
};

const getAdminSubCategories = {
  query: Joi.object().keys({
    categoryId: Joi.string().custom(objectId),
    page: Joi.number().default(1),
    limit: Joi.number().default(10),
    sort: Joi.string(),
  }),
};

module.exports = {
  getSubCategories,
  getAdminSubCategories,
};
