const Joi = require("joi");

const editPartnerProfile = {
  body: Joi.object()
    .keys({
      social: Joi.object()
        .keys({
          facebook: Joi.string().allow(""),
          twitter: Joi.string().allow(""),
          instagram: Joi.string().allow(""),
          tiktok: Joi.string().allow(""),
          snapchat: Joi.string().allow(""),
          website: Joi.string().allow(""),
        })
        .min(1),
      about: Joi.string().allow(""),
      notification: Joi.any(),
    })
    .min(1),
};

const editPoll = {
  body: Joi.object()
    .keys({
      poll: Joi.object()
        .keys({
          question: Joi.string().required(),
          options: Joi.array().items(Joi.string()).min(2).max(4).required(),
        })
        .required(),
    })
    .min(1),
};

module.exports = {
  editPartnerProfile,
  editPoll,
};
