const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const { followService } = require("@services");
const pick = require("@utils/pick");
const ApiError = require("../utils/ApiError");
const { Follow } = require("../models");

const getFollowers = catchAsync(async (req, res) => {
  const { userId } = req.params;
  let filter = pick(req.query, ["q"]);
  let options = pick(req.query, ["limit", "page", "sort"]);

  const followers = await followService.getFollowers(userId, options.page == {} ? {} : filter, options.page == {} ? {} : options);
  res.status(httpStatus.OK).send({ success: true, data: followers });
});

const getFollowings = catchAsync(async (req, res) => {
  const { userId } = req.params;
  let filter = {};
  let options = pick(req.query, ["limit", "page", "sort"]);
  options.populate = [
    "follower",
    { path: "follower", populate: "profile.avatar" },
  ];

  const followings = await followService.queryFollows(
    {
      ...filter,
      follower: userId,
    },
    options
  );
  res.status(httpStatus.OK).send({ success: true, data: followings });
});

const followOrUnfollow = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const result = await followService.followOrUnfollow(req.user._id, userId);
  res.status(httpStatus.OK).send({ data: result });
});

const acceptFollowingRequest = catchAsync(async (req, res) => {
  const { id, type } = req.query;
  await followService.acceptFollowing(id, type, {
    status: type,
  });
  res.status(httpStatus.NO_CONTENT).send();
});

const getOwnFollowerAndFollowing = catchAsync(async (req, res) => {
  const { _id: userId } = req.user;
  const followAndFollowing = await followService.getFollowAndFollowings(userId);
  res.status(httpStatus.OK).send({
    success: true,
    data: followAndFollowing,
  });
});

const unfriend = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const follow = await Follow.findOne({
    follower: userId,
    following: req.user._id,
  });

  if (!follow) {
    throw new ApiError(httpStatus.NOT_FOUND, "Follow not found");
  }

  await followService.followOrUnfollow(req.user._id, userId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  getFollowers,
  getFollowings,
  followOrUnfollow,
  getOwnFollowerAndFollowing,
  unfriend,
  acceptFollowingRequest,
};
