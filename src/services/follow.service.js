const httpStatus = require("http-status"),
  { Follow } = require("@models"),
  ApiError = require("@utils/ApiError"),
  customLabels = require("@utils/customLabels"),
  defaultSort = require("@utils/defaultSort");

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
  const follows = await Follow.find(followData);

  if (follows) {
    follows.delete();
    return follows;
  }

  const newFollow = await Follow.create(followData);
  return newFollow;
};
