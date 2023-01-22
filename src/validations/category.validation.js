const Joi = require("joi");
const { objectId } = require("./custom.validation");

const getSubCategories = {
  params: Joi.object().keys({
    categoryId: Joi.string().required().custom(objectId),
  }),
};
