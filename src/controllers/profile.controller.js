const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const ApiError = require("@utils/ApiError");
const { userService } = require("@services");
const pick = require("../utils/pick");

const editProfile = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.user._id, req.body);
  res.send(user);
});

const editPoll = catchAsync(async (req, res) => {
  const { poll } = req.body;
  const user = await userService.updateUserById(req.user._id, {
    profile: { poll },
  });
  res.send(user);
});

module.exports = {
  editProfile,
  editPoll,
};
