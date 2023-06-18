const Joi = require("joi");
const { password, objectId } = require("@validations/custom.validation");

const register = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    firstName: Joi.string().required(),
    businessname: Joi.string().allow(""),
    lastName: Joi.string().required(),
    status: Joi.string().allow(""),
    role: Joi.string().required().valid("user", "partner", "admin", "eventhost"),
    username: Joi.string().required(),
    // .required()
    // .min(3)
    // .custom((value, helpers) => {
    //   if (!/^[a-zA-Z0-9_]*$/.test(value)) {
    //     return helpers.error("any.invalid", { message: "Username can't be contain backspace" });
    //   }
    //   return value;
    // }),
    address: Joi.object().keys({
      address: Joi.string(),
      state: Joi.string().required(),
      city: Joi.string().required(),
      latitude: Joi.number(),
      longitude: Joi.number(),
    }),
    profile: Joi.object().keys({
      avatar: Joi.string().custom(objectId),
    }),
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
    role: Joi.string().required().valid("user", "partner", "admin", "eventhost"),
  }),
};

const adminlogin = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required(),
    role: Joi.string().required().valid("user", "partner", "admin"),
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
    emailOrUsername: Joi.string().required(),
  }),
};

const resetPassword = {
  body: Joi.object().keys({
    password: Joi.string().required().custom(password),
    token: Joi.string().required(),
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
  adminlogin,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail,
  sendVerificationEmail,
};
