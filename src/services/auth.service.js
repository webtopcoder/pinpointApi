const httpStatus = require("http-status"),
  { tokenService, userService } = require("@services"),
  { Token } = require("@models"),
  ApiError = require("@utils/ApiError"),
  { tokenTypes } = require("@configs/tokens");
const logger = require("@configs/logger");

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
  await refreshTokenDoc.remove();
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
    await refreshTokenDoc.remove();
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
const resetPassword = async (email, otp, newPassword) => {
  try {
    const user = await userService.getUserByEmail(email);
    if (!user) {
      throw Error();
    }

    const verifyOTP = await tokenService.verifyOTP(
      user.id,
      otp,
      tokenTypes.RESET_PASSWORD
    );
    if (!verifyOTP) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid token");
    }

    await userService.updateUserById(user.id, { password: newPassword });
    await Token.deleteMany({ user: user.id, type: tokenTypes.RESET_PASSWORD });
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
 * Verify email
 * @param {string} email
 * @param {string} otp
 * @returns {Promise}
 */
const verifyEmail = async (email, otp) => {
  try {
    if (!email || !otp) {
      throw new Error();
    }

    const user = await userService.getUserByEmail(email);
    if (!user) {
      throw Error();
    }

    const verifyOTP = await tokenService.verifyOTP(
      user.id,
      otp,
      tokenTypes.VERIFY_EMAIL
    );
    if (!verifyOTP) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid token");
    }

    await Token.deleteMany({ user: user.id, type: tokenTypes.VERIFY_EMAIL });

    let updateUser = {};
    if (["pending", "active"].includes(user.status)) {
      updateUser = { status: "active" };
    }
    await userService.updateUserById(user.id, {
      ...updateUser,
      isEmailVerified: true,
    });
  } catch (error) {
    console.log(error);
    throw new ApiError(httpStatus.UNAUTHORIZED, "Email verification failed");
  }
};

module.exports = {
  loginUserWithEmailAndPassword,
  logout,
  refreshAuth,
  resetPassword,
  changePassword,
  verifyEmail,
};
