const jwt = require("jsonwebtoken");
const moment = require("moment");
const httpStatus = require("http-status");
const otpGenerator = require("otp-generator");
const config = require("@configs/config");
const { Token } = require("@models");
const ApiError = require("@utils/ApiError");
const { tokenTypes } = require("@configs/tokens");

/**
 * Generate token
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} [secret]
 * @returns {string}
 */
const generateToken = (userId, expires, type, secret = config.jwt.secret) => {
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
  };
  return jwt.sign(payload, secret);
};

/**
 * Generate OTP
 * @returns {Promise<string>}
 */
const generateOTP = () => {
  const token = otpGenerator.generate(6, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
  return token;
};

/**
 * Save a token
 * @param {string} token
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {boolean} [blacklisted]
 * @returns {Promise<Token>}
 */
const saveToken = async (token, userId, expires, type, blacklisted = false) => {
  const tokenDoc = await Token.create({
    token,
    user: userId,
    expires: expires.toDate(),
    type,
    blacklisted,
  });
  return tokenDoc;
};

/**
 * Verify token and return token doc (or throw an error if it is not valid)
 * @param {string} token
 * @param {string} type
 * @returns {Promise<Token>}
 */
const verifyToken = async (token, type) => {
  const payload = jwt.verify(token, config.jwt.secret);
  const tokenDoc = await Token.findOne({
    token,
    type,
    user: payload.sub,
    blacklisted: false,
  });
  if (!tokenDoc) {
    throw new Error("Token not found");
  }
  return tokenDoc;
};

/**
 * Verify OTP
 * @param {ObjectId} userId
 * @param {string} otp
 * @param {string} type
 * @returns {Promise<Boolean>}
 */
const verifyOTP = async (userId, otp, type) => {
  const token = await Token.findOne({ user: userId, type, blacklisted: false });
  if (!token) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "OTP not found");
  }
  if (token.expires < new Date()) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "OTP already expired");
  }
  if (await token.isOtpMatch(otp, type)) {
    await Token.deleteOne({ _id: token.id });
    return true;
  }
};
/**
 * Generate auth tokens
 * @param {User} user
 * @returns {Promise<Object>}
 */
const generateAuthTokens = async (user) => {
  const accessTokenExpires = moment().add(
    config.jwt.accessExpirationMinutes,
    "minutes"
  );
  const accessToken = generateToken(
    user.id,
    accessTokenExpires,
    tokenTypes.ACCESS
  );

  const refreshTokenExpires = moment().add(
    config.jwt.refreshExpirationDays,
    "days"
  );
  const refreshToken = generateToken(
    user.id,
    refreshTokenExpires,
    tokenTypes.REFRESH
  );
  await saveToken(
    refreshToken,
    user.id,
    refreshTokenExpires,
    tokenTypes.REFRESH
  );

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
};

/**
 * Generate reset password token
 * @param {string} email
 * @returns {Promise<string>}
 */
const generateResetPasswordToken = async (user) => {
  const expires = moment().add(config.otp.expirationTime, "minutes");
  const tokenType = tokenTypes.RESET_PASSWORD;
  const token = generateOTP();

  await Token.deleteMany({ user: user.id, type: tokenTypes.RESET_PASSWORD });
  await saveToken(token, user.id, expires, tokenType);
  return token;
};

/**
 * Generate verify email token
 * @param {User} user
 * @returns {Promise<string>}
 */
const generateVerifyEmailToken = async (user) => {
  const expires = moment().add(config.otp.expirationTime, "minutes");
  const tokenType = tokenTypes.VERIFY_EMAIL;
  const token = generateOTP();

  await Token.deleteMany({ user: user.id, type: tokenTypes.VERIFY_EMAIL });
  await saveToken(token, user.id, expires, tokenType);
  return token;
};

module.exports = {
  generateToken,
  saveToken,
  verifyToken,
  verifyOTP,
  generateAuthTokens,
  generateResetPasswordToken,
  generateVerifyEmailToken,
};
