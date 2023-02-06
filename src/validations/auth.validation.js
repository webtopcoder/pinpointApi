const Joi = require("joi");
const { password, objectId } = require("@validations/custom.validation");

const register = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    role: Joi.string().required().valid("user", "partner"),
    username: Joi.string().required(),
    address: Joi.object()
      .keys({
        address: Joi.string(),
        state: Joi.string().required(),
        city: Joi.string().required(),
      })
      .required(),
    category: Joi.string().custom(objectId),
    dob: Joi.when("role", {
      is: "user",
      then: Joi.date().required(),
      otherwise: Joi.date().optional(),
    }),
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required(),
    role: Joi.string().required().valid("user", "partner"),
  }),
};

const logout = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};

const resetPassword = {
  body: Joi.object().keys({
    password: Joi.string().required().custom(password),
    otp: Joi.string().required(),
    email: Joi.string().email().required(),
  }),
};

const changePassword = {
  body: Joi.object().keys({
    currentPassword: Joi.string().required().custom(password),
    newPassword: Joi.string().required().custom(password),
  }),
};

const sendVerificationEmail = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};

const verifyEmail = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    otp: Joi.string().required(),
  }),
};

module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail,
  sendVerificationEmail,
};
