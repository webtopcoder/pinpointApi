const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const { events, EventEmitter } = require("@events");
const ApiError = require("@utils/ApiError");
const { authService, userService, tokenService } = require("@services");

const register = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  EventEmitter.emit(events.VERIFY_EMAIL, user.id);
  res.send({
    code: httpStatus.CREATED,
    message: "Verification email sent successfully",
  });
});

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  let user = await authService.loginUserWithEmailAndPassword(email, password);
  if (!user || !(Object.keys(user).length > 0)) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ code: 400, message: "Unable to login." });
  }
  user = user.toJSON();
  const tokens = await tokenService.generateAuthTokens(user);
  res.send({ user, tokens });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
  const user = await userService.getUserByEmail(req.body.email);

  if (!user) {
    return res.status(httpStatus.NO_CONTENT).send();
  }
  EventEmitter.emit(events.RESET_PASSWORD, user.id);
  res.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = catchAsync(async (req, res) => {
  const { email, otp, password } = req.body;
  await authService.resetPassword(email, otp, password);
  res.status(httpStatus.NO_CONTENT).send();
});

const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, currentPassword, newPassword);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const user = req.user || (await userService.getUserByEmail(req.body.email));

  if (!user) {
    res.status(httpStatus.NO_CONTENT).send();
  }

  if (user && user.isEmailVerified) {
    throw new ApiError(httpStatus.OK, "Email is already verified.");
  }

  EventEmitter.emit(events.VERIFY_EMAIL, user.id);
  res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.body.email, req.body.otp);
  res.status(httpStatus.NO_CONTENT).send();
});

const getUser = catchAsync(async (req, res) => {
  res.send({ user: req.user });
});

module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  changePassword,
  sendVerificationEmail,
  verifyEmail,
  getUser,
};
