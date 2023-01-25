const httpStatus = require("http-status"),
  { Follow } = require("@models"),
  ApiError = require("@utils/ApiError"),
  customLabels = require("@utils/customLabels"),
  defaultSort = require("@utils/defaultSort");
const notificationService = require("./notification.service");
const userService = require("./user.service");
const { EventEmitter, events } = require("../events");

/**
 * Get Followers
 * @param {ObjectId} userId
 * @returns {Promise<Follow[]>}
 */
const getFollowers = async (userId) => {
  const follows = await Follow.find({
    following: userId,
  })
    .populate("follower")
    .select("-following");
  return follows;
};

/**
 * Get Followings
 * @param {ObjectId} userId
 * @returns {Promise<Follow[]>}
 * @throws {ApiError}
 */
const getFollowings = async (userId) => {
  const follows = await Follow.find({
    follower: userId,
  })
    .populate("following")
    .select("-follower");
  return follows;
};

/**
 * Toggle Follow
 * @param {ObjectId} userId
 * @returns {Promise<Follow>}
 * @throws {ApiError}
 */
const followOrUnfollow = async (userId, followingUser) => {
  const followData = {
    follower: userId,
    following: followingUser,
  };
  const follows = await Follow.findOne(followData);
  const followingUserValid = await userService.getUserById(followingUser);
  const followerUserValid = await userService.getUserById(userId);

  if (!followingUserValid || !followerUserValid) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  if (follows) {
    follows.delete();
    return follows;
  }

  let follow = await Follow.findOneDeleted(followData);

  if (follow) {
    follow.restore();
  } else {
    follow = await Follow.create(followData);
  }

  // TODO: make template for notification
  EventEmitter.emit(events.SEND_NOTIFICATION, {
    recipient: followingUser,
    actor: userId,
    title: "New Follower",
    description: `You have a new follower @${followerUserValid.username}`,
    url: `/profile/${userId}/activity`,
    type: "follow",
  });

  return follow;
};

const getFollowStatus = async (userId, followingUser) => {
  const followData = {
    follower: userId,
    following: followingUser,
  };

  const follows = await Follow.findOne(followData);

  return !!follows;
};

module.exports = {
  getFollowers,
  getFollowings,
  followOrUnfollow,
  getFollowStatus,
};
