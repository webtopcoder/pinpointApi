const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const { followService } = require("@services");
const pick = require("@utils/pick");

const getFollowers = catchAsync(async (req, res) => {
  const { userId } = req.params;
  let filter = {};
  let options = pick(req.query, ["limit", "page", "sort"]);
  options.populate = [
    "follower",
    { path: "follower", populate: "profile.avatar" },
  ];

  const followers = await followService.queryFollows(
    {
      ...filter,
      following: userId,
    },
    options
  );
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
  await followService.followOrUnfollow(req.user._id, userId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  getFollowers,
  getFollowings,
  followOrUnfollow,
};
