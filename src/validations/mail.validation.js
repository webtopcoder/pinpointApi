const Joi = require("joi");

const createMail = {
  body: Joi.object().keys({
    to: Joi.string().required(),
    subject: Joi.string().required(),
    message: Joi.string().required(),
  }),
};

const invite = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    message: Joi.string().required(),
  }),
};

module.exports = {
  createMail,
  invite,
};
