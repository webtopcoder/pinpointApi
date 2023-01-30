const Joi = require("joi");
const { objectId } = require("./custom.validation");

const createSetting = {
  body: Joi.object().keys({
    key: Joi.string().required(),
    value: Joi.string().allow(""),
  }),
};

const getSettings = {
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

const getSetting = {
  params: Joi.object().keys({
    settingId: Joi.string().custom(objectId),
  }),
};

const updateSetting = {
  params: Joi.object().keys({
    settingId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      key: Joi.string().required(),
      value: Joi.string().allow(""),
    })
    .min(1),
};

module.exports = {
  createSetting,
  getSettings,
  getSetting,
  updateSetting,
};
