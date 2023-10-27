const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const { events, EventEmitter } = require("@events");
const ApiError = require("@utils/ApiError");
const {
  authService,
  userService,
  tokenService,
  stripeService,
} = require("@services");

const register = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  EventEmitter.emit(events.VERIFY_EMAIL, user.id);
  const adminInfo = await userService.getadmin();
  if (user.role === "partner")
    EventEmitter.emit(events.SEND_NOTIFICATION, {
      recipient: adminInfo?._id,
      type: "signup",
      title: "New Pending Partner",
      description: `You have new pending partner`,
      url: `/partner`,
    });
  res.send({
    code: httpStatus.CREATED,
    success: true,
    message: "Verification email sent successfully",
  });
});

const login = catchAsync(async (req, res, next) => {
  const { email, password, role } = req.body;

  let user = await authService.loginUserWithEmailAndPassword(email, password);
  if (!user || !(Object.keys(user).length > 0) || user.role !== role) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ code: 400, message: "No User existing." });
  }
  user = user.toJSON();

  if (user.status !== "active") {
    return res.status(httpStatus.BAD_REQUEST).json({
      code: 400,
      message: "Your account is not active. Please contact admin.",
    });
  }

  const tokens = await tokenService.generateAuthTokens(user);
  res.send({
    user,
    tokens,
  });
});

const getDefaultAvatar = catchAsync(async (req, res) => {
  const DefaultAvatar = await userService.getDefaultAvatar();
  res.send({
    result: DefaultAvatar,
  });
});

const adminLogin = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  let admin = await authService.loginAdminWithEmailAndPassword(email, password);
  if (!admin || !(Object.keys(admin).length > 0)) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ code: 400, message: "Unable to login." });
  }
  admin = admin.toJSON();

  const tokens = await tokenService.generateAuthTokens(admin);

  res.send({
    data: { admin, tokens },
  });
});

const getAdmin = catchAsync(async (req, res) => {
  res.send({ data: req.user });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ success: true, ...tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
  let user = await userService.getUserByEmail(req.body.emailOrUsername);
  if (!user) {
    user = await userService.getUserByUsername(req.body.emailOrUsername);
  }

  console.log(user);

  if (!user) {
    console.log(234234234)
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ code: 400, message: "No email existing." });
  }

  EventEmitter.emit(events.RESET_PASSWORD, user.id);
  res.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = catchAsync(async (req, res) => {
  const { token, password } = req.body;
  await authService.resetPassword(token, password);
  res.status(httpStatus.NO_CONTENT).send();
});

const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, currentPassword, newPassword);
  res.status(httpStatus.NO_CONTENT).send();
});

const changePasswordUser = catchAsync(async (req, res) => {
  await authService.changePasswordUser(req.body.userId, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const user = req.user || (await userService.getUserByEmail(req.body.email));

  if (!user) {
    res.status(httpStatus.NO_CONTENT).send();
  }

  if (user && user.isEmailVerified) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email is already verified.");
  }

  EventEmitter.emit(events.VERIFY_EMAIL, user.id);
  res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.body.email, req.body.otp);
  res.status(httpStatus.NO_CONTENT).send();
});

const getActivePartners = catchAsync(async (req, res) => {
  const { status } = req.query;
  let activepartners = await userService.getActivePartners(status);
  res.send(activepartners);
});

const getUsernameById = catchAsync(async (req, res) => {
  const { ID } = req.query;
  let userinfo = await userService.getUserById(ID);
  res.send(userinfo);
});

const getUser = catchAsync(async (req, res) => {
  let userinfo = await userService.getUserById(req.user._id);
  res.send({ success: true, user: userinfo });
});

module.exports = {
  register,
  login,
  adminLogin,
  getAdmin,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  getUsernameById,
  changePasswordUser,
  changePassword,
  sendVerificationEmail,
  verifyEmail,
  getUser,
  getActivePartners,
  getDefaultAvatar,
};
