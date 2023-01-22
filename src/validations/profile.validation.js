const Joi = require("joi");

const editPartnerProfile = {
  body: Joi.object()
    .keys({
      social: Joi.object().keys({
        facebook: Joi.string(),
        twitter: Joi.string(),
        instagram: Joi.string(),
        tiktok: Joi.string(),
        snapchat: Joi.string(),
        website: Joi.string(),
      }),
      about: Joi.string(),
    })
    .min(1),
};

const editPoll = {
  body: Joi.object()
    .keys({
      poll: Joi.object()
        .keys({
          question: Joi.string().required(),
          options: Joi.array().items(Joi.string()).min(4).max(4).required(),
        })
        .required(),
    })
    .min(1),
};

module.exports = {
  editPartnerProfile,
  editPoll,
};
