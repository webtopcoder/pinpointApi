const httpStatus = require("http-status"),
  { tokenService, userService } = require("@services"),
  { Token } = require("@models"),
  ApiError = require("@utils/ApiError"),
  { tokenTypes } = require("@configs/tokens");
const logger = require("@configs/logger");
const jwt = require("jsonwebtoken");
const config = require("../config/config");

/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await userService.getUserByEmail(email);

  if (user && !user.isEmailVerified) {
    throw new ApiError(httpStatus.FORBIDDEN, "Email is not verified.");
  }
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect email or password");
  }

  if (user && ["pending", "suspended", "banned"].includes(user.status)) {
    if (user.status === "suspended")
      throw new ApiError(httpStatus.FORBIDDEN, "Account is suspended.");
    if (user.status === "banned")
      throw new ApiError(httpStatus.FORBIDDEN, "Account is banned.");
    if (user.status === "pending") {
      throw new ApiError(httpStatus.FORBIDDEN, "Account is not activated.");
    }
  }
  return user;
};

/**
 * AdminLogin with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
const loginAdminWithEmailAndPassword = async (email, password) => {
  const admin = await userService.getAdminByEmail(email);
  if (!admin || !(await admin.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect email or password");
  }
  return admin;
};

/**
* @param {string} token
* @returns {Promise<User>}
*/
const getSourceFromJWT = async (token) => {

  const decodded = jwt.verify(token, process.env.JWT_SECRET);

  const admin = await userService.getAdminByID(decodded['sub']);

  return admin;

};

/**
 * Logout
 * @param {string} refreshToken
 * @returns {Promise}
 */
const logout = async (refreshToken) => {
  const refreshTokenDoc = await Token.findOne({
    token: refreshToken,
    type: tokenTypes.REFRESH,
    blacklisted: false,
  });
  if (!refreshTokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, "Not found");
  }
  await refreshTokenDoc.delete();
};

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<Object>}
 */
const refreshAuth = async (refreshToken) => {
  try {
    const refreshTokenDoc = await tokenService.verifyToken(
      refreshToken,
      tokenTypes.REFRESH
    );
    const user = await userService.getUserById(refreshTokenDoc.user);
    if (!user) {
      throw new Error();
    }
    await refreshTokenDoc.delete();
    return tokenService.generateAuthTokens(user);
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate");
  }
};

/**
 * Reset password
 * @param {string} otp
 * @param {string} newPassword
 * @returns {Promise}
 */
const resetPassword = async (token, newPassword) => {
  try {
    const payload = jwt.verify(token, config.jwt.secret);

    const blacklisted = await Token.findOne({
      token: token,
      type: tokenTypes.RESET_PASSWORD,
      blacklisted: true,
    });

    if (
      !payload.sub ||
      blacklisted ||
      payload.type !== tokenTypes.RESET_PASSWORD
    ) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid token");
    }

    const user = await userService.getUserById(payload.sub);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    await userService.updateUserById(user.id, { password: newPassword });
    await tokenService.saveToken(
      token,
      user.id,
      undefined,
      tokenTypes.RESET_PASSWORD,
      true
    );
  } catch (error) {
    logger.error(error.stack);
    throw new ApiError(httpStatus.UNAUTHORIZED, "Password reset failed");
  }
};

/**
 * Change password
 * @param {string} currentPassword
 * @param {string} newPassword
 * @returns {Promise}
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await userService.getUserById(userId);
  if (!user || !(await user.isPasswordMatch(currentPassword))) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Current password is incorrect"
    );
  }
  Object.assign(user, { password: newPassword });
  await user.save();
  return user;
};

/**
 * Change User password
 * @param {string} currentPassword
 * @param {string} newPassword
 * @returns {Promise}
 */
const changePasswordUser = async (userId, newPassword) => {
  const user = await userService.getUserById(userId);
  Object.assign(user, { password: newPassword });
  await user.save();
  return user;
};

/**
 * Verify email
 * @param {string} email
 * @param {string} otp
 * @returns {Promise}
 */
const verifyEmail = async (email, otp) => {
  const user = await userService.getUserByEmail(email);
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid Email");
  }

  const verifyOTP = await tokenService.verifyOTP(
    user.id,
    otp,
    tokenTypes.VERIFY_EMAIL
  );
  if (!verifyOTP) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid token");
  }

  await Token.deleteMany({ user: user._id, type: tokenTypes.VERIFY_EMAIL });

  await userService.updateUserById(user.id, {
    isEmailVerified: true,
  });
};


module.exports = {
  loginUserWithEmailAndPassword,
  loginAdminWithEmailAndPassword,
  getSourceFromJWT,
  logout,
  refreshAuth,
  resetPassword,
  changePassword,
  changePasswordUser,
  verifyEmail,
};
