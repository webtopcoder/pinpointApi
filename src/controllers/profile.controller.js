const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const ApiError = require("@utils/ApiError");
const { userService, shoutoutService } = require("@services");
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
  if (poll.options.filter((option) => option !== "").length < 2) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Poll must have at least 2 options"
    );
  }
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
  const is_followed = await followService.getFollowStatus(req.user._id, userId);

  return res.json({
    profile: {
      avatar: user.profile.avatar,
      favorites: 0,
      followers: followerCount,
      username: user.username,
      fullname: user.name,
      usertype: user.role,
      is_follow: is_followed,
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
  const { content } = req.body;
  const { userId } = req.params;
  const to_user = await userService.getUserById(userId);
  console.log(to_user);
  const newPost = Post({
    from: req.user._id,
    to: to_user._id,
    content,
  });

  const pattern = /\B@[a-z0-9_-]+/gi;
  const mentions = content.match(pattern);
  if (mentions && mentions.length) {
    console.log(mentions);
    mentions.map(async (mention) => {
      mention = mention.slice(1);
      console.log(mention);
      const to_user = await userService.getUserByUsername(mention);

      if (!to_user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found");
      } else {
        const shoutout_data = {
          from: req.user._id,
          to: to_user._id,
          content: req.body.content,
        };

        const shoutout = await shoutoutService.createShoutout(shoutout_data);
        console.log(shoutout);
      }
    });
  }
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
