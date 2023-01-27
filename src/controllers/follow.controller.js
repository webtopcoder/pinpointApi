const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const ApiError = require("@utils/ApiError");
const { followService } = require("@services");

const getFollowers = catchAsync(async (req, res) => {
  const { userId } = req.params;
  console.log(userId);
  const followers = await followService.getFollowers(userId);
  console.log(followers)
  res.status(httpStatus.OK).send({ success: true, followers });
});

const getFollowings = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const followings = await followService.getFollowings(userId);
  res.status(httpStatus.OK).send({ success: true, followings });
});

const followOrUnfollow = catchAsync(async (req, res) => {
  const { userId } = req.params;
  await followService.followOrUnfollow(req.user._id, userId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  getFollowers,
  getFollowings,
  followOrUnfollow,
};
