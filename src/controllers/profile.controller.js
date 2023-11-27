const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const ApiError = require("@utils/ApiError");
const {
  userService,
  shoutoutService,
  likeService,
  locationService,
  notificationService,
  postService,
  settingService
} = require("@services");
const pick = require("../utils/pick");
const followService = require("../services/follow.service");
const { Post, Location, Follow, Schedule } = require("../models");
const { uploadMedia } = require("../services/media.service");
const { EventEmitter, events } = require("../events");
const { use } = require("passport");
const { schedule } = require("node-cron");
const { ObjectId } = require("bson");

const editProfile = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.user._id, {
    ...req.user, ...req.body, profile: {
      ...req.user.profile, ...req.body.profile
    }
  });
  res.send(user);
});

const changePassword = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.user._id, {
    ...req.user, ...req.body
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
  res.json({ success: true, data: user });
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

  const followerCount = (await followService.getFollowers(userId, {}, {})).totalResults;
  const locationCount = (
    await locationService.getLocationsByPartnerId(userId, {})
  ).length;
  let is_followed = false;
  if (req.user) {
    is_followed = await followService.getFollowStatus(req.user._id, userId);
  }

  const likesPostCount = await postService.getlikePostCount(userId);
  const likesLocationCount = await locationService.getlikeLocationCount(userId);
  const Rating = await locationService.getRating(userId);

  return res.json({
    profile: {
      avatar: user?.profile?.avatar,
      favorites: likesPostCount + likesLocationCount,
      followers: followerCount,
      location: locationCount,
      fullname: user?.name,
      aboutme: user.profile.about,
      username: user?.username,
      socials: user?.profile.social,
      businessname: user?.businessname,
      usertype: user?.role,
      rating: Rating,
      is_follow: is_followed,
    },
  });
});

const getProfileActivity = catchAsync(async (req, res) => {
  const { userId } = req.params;
  let { search, page } = pick(req.query, ["search", "page"]);

  page = page ? parseInt(page) : 1;

  const user = await userService.getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  let followersArray = []
  followersArray.push(new ObjectId(userId.toString()));
  const { post, images, activityTotal } = await userService.getUserActivity(user._id, followersArray, {
    page: page ?? 1,
    search,
  });

  return res.json({
    success: true,
    about: user.profile?.about,
    notification: user.profile?.notification,
    social: user.profile?.social,
    posts: post,
    activityTotal,
    image: images,
  });
});

const getProfileSocials = catchAsync(async (req, res) => {
  const { userId } = req.params;
  let { search, page } = pick(req.query, ["search", "page"]);

  page = page ? parseInt(page) : 1;

  const user = await userService.getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const followers = await followService.getFollowers(userId, {}, {});
  let followersArray = [];
  followers?.results?.filter(obj => obj.status === "active")?.map(async (item) => {
    followersArray.push(item.follower._id);
  });

  const { post, images, activityTotal } = await userService.getUserActivity(user._id, followersArray, {
    page: page ?? 1,
    search,
  });

  return res.json({
    success: true,
    about: user.profile?.about,
    notification: user.profile?.notification,
    social: user.profile?.social,
    posts: post,
    activityTotal,
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
  const from_user = await userService.getUserById(req.user._id);

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

    const shoutUsers = await shoutoutService.getShoutList(newPost._id);
    await postService.updatePostById(newPost._id, {
      shoutlist: shoutUsers,
    });
  }

  else if (to_user._id.toString() !== req.user.id.toString()) {
    // const status = await settingService.getSettingStatus({
    //   key: "user:likeCommentRating",
    //   user: to_user._id,
    // });
    // if (status)
    EventEmitter.emit(events.SEND_NOTIFICATION, {
      recipient: to_user._id.toString(),
      actor: req.user._id.toString(),
      title: "post",
      description: `You have new activity from ${from_user.businessname}`,
      url: `/profile/${to_user._id.toString()}/activity/`,
      type: "post",
    });
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

const getAllMemebers = catchAsync(async (req, res) => {
  const { userId } = req.params;
  let filter = pick(req.query, ["q"]);
  let options = pick(req.query, ["limit", "page", "sort"]);

  const follwers = await followService.getFollowers(userId, {}, {});
  let followerIDs = new Array();
  follwers.results.map((item) => {
    followerIDs.push(item.follower._id)
  })

  if (filter.q !== undefined && filter.q !== null) {
    if (filter.q === "") {
      // Get all data
      delete filter.q;
    } else {
      filter["$or"] = [
        { firstName: { $regex: filter.q, $options: "i" } },
        { username: { $regex: filter.q, $options: "i" } },
        { lastName: { $regex: filter.q, $options: "i" } }
      ];
      delete filter.q;
    }
  }

  options.populate = [
    {
      path: "category",
      populate: {
        path: "image",
      },
    },
    { path: "profile.avatar" }
  ];

  filter.status = "active";
  filter._id = {
    $nin: followerIDs
  };

  const result = await userService.getAllMemebers(filter, options);
  return res.json({ success: true, data: result });
});

const getAllImages = catchAsync(async (req, res) => {
  const { userId, flag } = req.params;
  const { page, limit } = req.query;
  const user = await userService.getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const followers = await followService.getFollowers(userId, {}, {});
  let followersArray = [];

  if (flag === 'true')
    followers?.results?.filter(obj => obj.status === "active")?.map(async (item) => {
      followersArray.push(new ObjectId(item.follower._id.toString()));
    });
  else
    followersArray.push(new ObjectId(userId.toString()));

  const postImgs = await userService.getPostImages(followersArray, {
    page: page,
    limit: limit
  });

  const shoutImgs = await userService.getShoutImages(followersArray, {
    page: page,
    limit: limit
  });

  const locationReviewImgs = await locationService.getReviewImages(followersArray, flag, {
    page: page,
    limit: limit,
  });

  const images = await (postImgs.concat(locationReviewImgs)).concat(shoutImgs);
  let sortedDates = await images.sort((p1, p2) => (p1.createdAt < p2.createdAt) ? 1 : (p1.createdAt > p2.createdAt) ? -1 : 0);

  const startIndex = (parseInt(page) - 1) * parseInt(limit);
  const endIndex = parseInt(startIndex) + parseInt(limit);
  const paginatedData = await sortedDates.slice(startIndex, endIndex);

  return res.json({ success: true, sidebarImage: sortedDates.slice(0, 8), image: page === "undefined" && limit === "undefined" ? sortedDates : paginatedData, total: sortedDates.length });
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

  const likesPostCount = await postService.getlikePostCount(userId);
  const likesLocationCount = await locationService.getlikeLocationCount(userId);

  const businessRating = await locationService.getRating(userId);
  const profileViews =
    (await userService.getUserById(userId)).profileViews ?? 0;

  const checkIns = await locationService.getAllCheckInCount(userId)

  return res.send({
    partnerLocations,
    activeLocations,
    likes: likesLocationCount + likesPostCount,
    followers,
    profileViews,
    businessRating,
    checkIns,
  });
});


const getEventhostDashboard = catchAsync(async (req, res) => {

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

  const events = await Location.find({
    partner: userId,
  }).populate("reviews");

  const schedules = await Schedule.find({
    eventhost: userId,
  });

  let requestsCount = 0;
  schedules.map((item) => {
    item.request.map((item) => {
      if (item.isActive === "pending") requestsCount = requestsCount + 1;
    })
  })

  const scheduleEvnets = schedules.length;
  const businessRating = (
    events?.reduce((acc, event) => {
      return acc + (event.rating ?? 0);
    }, 0) / events.length
  ).toFixed(1);

  const profileViews =
    (await userService.getUserById(userId)).profileViews ?? 0;

  const checkIns = await locationService.getAllCheckInCount(userId)

  return res.send({
    partnerLocations,
    activeLocations,
    followers,
    profileViews,
    businessRating,
    checkIns,
    scheduleEvnets,
    requestsCount
  });
});

const markAsRead = catchAsync(async (req, res) => {

  await notificationService.updateNotificationById(req.params.id, {
    is_read: true,
  });

  res.send({ "success": true });
});

module.exports = {
  getAllMemebers,
  createPost,
  editProfile,
  editPoll,
  getProfile,
  getProfileHeaderInfo,
  getProfileActivity,
  getProfileSocials,
  addProfilePicture,
  editProfileData,
  votePoll,
  getPollForProfile,
  getAllImages,
  getPartnerDashboard,
  updateProfileView,
  getFavorited,
  markAsRead,
  getEventhostDashboard,
  changePassword
};
