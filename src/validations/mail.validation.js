const Joi = require("joi");

const createMail = {
  body: Joi.object()
    .keys({
      isNotice: Joi.boolean().valid(true),
      to: Joi.string(),
      subject: Joi.string().required(),
      message: Joi.string().required(),
    })
    .xor("isNotice", "to"),
};

const invite = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    message: Joi.string(),
  }),
};

module.exports = {
  createMail,
  invite,
};
