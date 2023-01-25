const Joi = require("joi");
const { objectId } = require("./custom.validation");

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
          options: Joi.array()
            .items(Joi.string().allow(""))
            .min(2)
            .max(4)
            .required(),
        })
        .required(),
    })
    .min(1),
};

const createPost = {
  body: Joi.object()
    .keys({
      content: Joi.string().required(),
      userId: Joi.string().required().custom(objectId),
    })
    .min(1),
};

module.exports = {
  editPartnerProfile,
  editPoll,
  createPost,
};
