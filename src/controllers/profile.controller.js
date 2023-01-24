const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const ApiError = require("@utils/ApiError");
const { userService } = require("@services");
const pick = require("../utils/pick");
const followService = require("../services/follow.service");
const { Post } = require("../models");
const { uploadMedia, createMedia } = require("../services/media.service");

const editProfile = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.user._id, {
    profile: { ...req.user.profile, ...req.body },
  });
  res.send(user);
});

const editPoll = catchAsync(async (req, res) => {
  const { poll } = req.body;
  const user = await userService.updateUserById(req.user._id, {
    profile: { ...req.user.profile, poll },
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

const getProfileHeaderInfo = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const user = await userService.getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  const followerCount = (await followService.getFollowers(userId)).length;

  return res.json({
    profile: {
      avatar: user.profile.avatar,
      favorites: 0,
      followers: followerCount,
      username: user.username,
      fullname: user.name,
      usertype: user.role,
      is_follow: followerCount > 0,
    },
  });
});

const getProfileActivity = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { search, page } = pick(req.query, ["search", "page"]);
  const user = await userService.getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  const { post, images } = await userService.getUserActivity(userId, {
    page,
    search,
  });

  return res.json({
    success: true,
    about: user.profile?.about,
    notification: user.profile?.notification,
    social: user.profile?.social,
    posts: post,
    image: images,
  });
});

const createPost = catchAsync(async (req, res) => {
  const { content, userId } = req.body;

  const to_user = await userService.getUserById(userId);
  const newPost = Post({
    from: req.user._id,
    to: to_user._id,
    content,
  });

  await newPost.save();
  return res.json({ success: true, msg: "Post successfully!" });
});

const addProfilePicture = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No file uploaded");
  }
  const media = await uploadMedia(req.file, req.user._id, true);
  await userService.updateUserById(req.user._id, {
    profile: { ...req.user.profile, avatar: media._id },
  });

  return res.json({ success: true, avatar: media });
});

module.exports = {
  createPost,
  editProfile,
  editPoll,
  getProfile,
  getProfileHeaderInfo,
  getProfileActivity,
  addProfilePicture,
};
