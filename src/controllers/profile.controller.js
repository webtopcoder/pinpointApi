const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const ApiError = require("@utils/ApiError");
const { userService } = require("@services");
const pick = require("../utils/pick");

const editProfile = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.user._id, {
    profile: req.body,
  });
  res.send(user);
});

const editPoll = catchAsync(async (req, res) => {
  const { poll } = req.body;
  const user = await userService.updateUserById(req.user._id, {
    profile: { poll },
  });
  res.send(user.profile.poll);
});

const getProfile = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.user._id);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  res.json({ success: true, data: user.profile });
});

module.exports = {
  editProfile,
  editPoll,
  getProfile,
};
