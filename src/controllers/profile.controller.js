const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const ApiError = require("@utils/ApiError");
const {
  userService,
  shoutoutService,
  likeService,
  locationService,
  notificationService
} = require("@services");
const pick = require("../utils/pick");
const followService = require("../services/follow.service");
const { Post, Location, Follow } = require("../models");
const { uploadMedia } = require("../services/media.service");

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

  poll.votes = Array(4).fill(0);
  poll.usersVoted = [];

  const user = await userService.updateUserById(req.user._id, {
    profile: { ...req.user.profile, poll },
  });
  res.send(user.profile.poll);
});

const votePoll = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { option } = req.body;
  const user = await userService.getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  if (!user?.profile?.poll) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User has no poll");
  }

  const poll = user.profile.poll;

  if (poll.usersVoted.includes(req.user._id)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "You already voted");
  }

  poll.votes[option] += 1;
  poll.usersVoted.push(req.user._id);

  await userService.updateUserById(userId, {
    profile: { ...user.profile, poll },
  });

  res.send(poll);
});

const getPollForProfile = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const user = await userService.getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  if (!user?.profile?.poll) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User has no poll");
  }

  res.send(user?.profile?.poll);
});

const getProfile = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.user._id);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  res.json({ success: true, data: user.profile });
});

const getFavorited = catchAsync(async (req, res) => {
  const userinfo = await userService.getUserById(req.user._id);

  const favorited = userinfo.favoriteLocations.includes(req.params.locationID) ? true : false;

  res.send({ success: favorited });
});


const getProfileHeaderInfo = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const user = await userService.getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const followerCount = (await followService.getFollowers(userId)).totalResults;
  const locationCount = (
    await locationService.getLocationsByPartnerId(userId, {})
  ).length;
  let is_followed = false;
  if (req.user) {
    is_followed = await followService.getFollowStatus(req.user._id, userId);
  }

  return res.json({
    profile: {
      avatar: user?.profile?.avatar,
      favorites: 0,
      followers: followerCount,
      location: locationCount,
      username: user?.username,
      fullname: user?.name,
      usertype: user?.role,
      is_follow: is_followed,
    },
  });
});

const getProfileActivity = catchAsync(async (req, res) => {
  const { userId } = req.params;
  let { search, page } = pick(req.query, ["search", "page"]);

  page = page ? parseInt(page) : 1;

  console.log(userId)
  const user = await userService.getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const { post, images } = await userService.getUserActivity(user._id, {
    page: page ?? 1,
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

const updateProfileView = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const user = await userService.getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  if (req.user.id !== userId) {
    try {
      await userService.updateUserById(user._id, {
        profileViews: (user.profileViews ?? 0) + 1,
      });
    } catch (error) {
      console.log(error);
    }
  }

  return res.json({
    success: true,
  });
});

const createPost = catchAsync(async (req, res) => {
  const { content } = req.body;
  const { userId } = req.params;

  const images = await Promise.all(
    req.files.map(async (file) => {
      const media = await uploadMedia(file, req.user._id);
      return media._id;
    })
  );

  const to_user = await userService.getUserById(userId);

  const like = await likeService.createLike();

  const newPost = Post({
    from: req.user._id,
    to: to_user._id,
    content,
    images,
    like,
  });

  await newPost.save();

  const pattern = /@\w+/g;
  const mentions = content.match(pattern);

  if (mentions && mentions.length) {
    await Promise.all(
      mentions.map(async (mention) => {
        mention = mention.slice(1);
        const followerOrFollowing = await followService.getFollowAndFollowings(
          req.user._id
        );
        const followAndFollowingList = Array.from(
          new Set(
            followerOrFollowing?.map((item) => {
              let user;
              if (item.following) {
                user = item.following;
              }

              if (item.follower) {
                user = item?.follower;
              }
              return user?.username;
            })
          )
        );

        if (!followAndFollowingList.includes(mention)) {
          return;
        }
        const to_user = await userService.getUserByUsername(mention);
        if (to_user) {
          const shoutout_data = {
            from: req.user._id,
            to: to_user._id,
            post: newPost._id,
          };

          await shoutoutService.createShoutout(shoutout_data);
        }
      })
    );
  }

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

const editProfileData = catchAsync(async (req, res) => {
  const { address, ...rest } = req.body;
  const user = await userService.updateUserById(req.user._id, {
    ...rest,
    address: { ...req.user.address, ...address },
  });
  return res.json({ success: true, data: user });
});

const getAllImages = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { page, limit } = req.query;
  const user = await userService.getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const postImgs = await userService.getProfileImages(user._id, {
    page: page ?? 1,
    limit: limit ?? 10,
  });

  const locationReviewImgs = await locationService.getReviewImages(user._id, {
    page: page ?? 1,
    limit: limit ?? 10,
  });

  const images = postImgs.concat(locationReviewImgs);
  let sortedDates = images.sort((p1, p2) => (p1.createdAt < p2.createdAt) ? 1 : (p1.createdAt > p2.createdAt) ? -1 : 0);

  return res.json({ success: true, image: sortedDates });
});

const getPartnerDashboard = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const partnerLocations = await Location.find({
    partner: userId,
  }).countDocuments();

  const activeLocations = await Location.find({
    partner: userId,
    isActive: true,
  }).countDocuments();

  const followers = await Follow.find({
    following: userId,
  }).countDocuments();

  const locations = await Location.find({
    partner: userId,
  }).populate("reviews");

  const businessRating = (
    locations?.reduce((acc, location) => {
      return acc + (location.rating ?? 0);
    }, 0) / locations.length
  ).toFixed(2);

  const profileViews =
    (await userService.getUserById(userId)).profileViews ?? 0;

  const checkIns = locations.reduce((acc, location) => {
    return acc + (location.checkIn?.length ?? 0);
  }, 0);

  return res.send({
    partnerLocations,
    activeLocations,
    followers,
    profileViews,
    businessRating,
    checkIns,
  });
});

const markAsRead = catchAsync(async (req, res) => {
 
  await notificationService.updateNotificationById(req.params.id, {
    is_read: true,
  });

  res.send({ "success": true });
});

module.exports = {
  createPost,
  editProfile,
  editPoll,
  getProfile,
  getProfileHeaderInfo,
  getProfileActivity,
  addProfilePicture,
  editProfileData,
  votePoll,
  getPollForProfile,
  getAllImages,
  getPartnerDashboard,
  updateProfileView,
  getFavorited,
  markAsRead
};
