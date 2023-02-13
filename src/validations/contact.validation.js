const Joi = require("joi");

const createContact = {
  body: Joi.object().keys({
    usertype: Joi.string().required().valid("user", "partner"),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().required().email(),
    subject: Joi.string().required(),
    messageContent: Joi.string().required(),
  }),
};

module.exports = {
  createContact,
};
