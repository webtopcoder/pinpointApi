const Joi = require("joi");
const { objectId } = require("./custom.validation");

const createMail = {
  body: Joi.object()
    .keys({
      isNotice: Joi.boolean().valid(),
      to: Joi.string(),
      subject: Joi.string().required(),
      message: Joi.string().required(),
    })
    .xor("isNotice", "to"),
};

const createMailbyAdmin = {
  body: Joi.object()
    .keys({
      isNotice: Joi.string(),
      to: Joi.string(),
      subject: Joi.string().required(),
      message: Joi.string().required(),
    })
    .xor("isNotice", "to"),
};

const createEmailing = {
  body: Joi.object()
    .keys({
      to: Joi.array(),
      template: Joi.string().required(),
    })
};


const createReply = {
  body: Joi.object()
    .keys({
      from: Joi.string(),
      role: Joi.string(),
      reply: Joi.string().custom(objectId),
      to: Joi.string(),
      message: Joi.string().required(),
    })
};

const invite = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    message: Joi.string(),
  }),
};

const updateMail = {
  params: Joi.object().keys({
    mailId: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys({
    is_read: Joi.boolean(),
    is_star: Joi.boolean(),
  }),
};

const bulkActions = {
  body: Joi.object().keys({
    action: Joi.string().valid("read", "unread", "delete").required(),
    mailIds: Joi.array().items(Joi.string().custom(objectId)).required(),
  }),
};

const sendMessageByAdmin = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys({
    subject: Joi.string().required(),
    message: Joi.string().required(),
    to: Joi.string().required()
  }),
};

module.exports = {
  createMail,
  createReply,
  invite,
  updateMail,
  bulkActions,
  sendMessageByAdmin,
  createMailbyAdmin,
  createEmailing
};
