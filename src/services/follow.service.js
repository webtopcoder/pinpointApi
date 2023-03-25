const httpStatus = require("http-status"),
  { Follow, Media } = require("@models"),
  ApiError = require("@utils/ApiError"),
  customLabels = require("@utils/customLabels"),
  defaultSort = require("@utils/defaultSort");
const userService = require("./user.service");
const { EventEmitter, events } = require("../events");
const { ObjectId } = require("bson");

/**
 * Get Followers
 * @param {ObjectId} userId
 * @returns {Promise<Follow[]>}
 */
const getFollowers = async (userId, filter, options) => {
  const followAggregate = Follow.aggregate([
    {
      $lookup: {
        from: "users",
        let: { follower: "$follower" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$$follower", "$_id"] },
                  {
                    $or: [
                      {
                        $regexMatch: {
                          input: "$firstName",
                          regex: filter?.q ?? "",
                          options: "i",
                        },
                      },
                      {
                        $regexMatch: {
                          input: "$lastName",
                          regex: filter?.q ?? "",
                          options: "i",
                        },
                      },
                      {
                        $regexMatch: {
                          input: "$username",
                          regex: filter?.q ?? "",
                          options: "i",
                        },
                      },
                    ],
                  },
                ],
              },
            },
          },
          {
            $addFields: {
              name: {
                $concat: ["$firstName", " ", "$lastName"],
              },
            },
          },
          {
            $project: {
              name: 1,
              username: 1,
              profile: {
                avatar: 1,
              },
            },
          },
          {
            $lookup: {
              from: Media.collection.name,
              let: { avatar: "$profile.avatar" },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ["$_id", "$$avatar"] },
                  },
                },
              ],
              as: "profile.avatar",
            },
          },
          {
            $unwind: {
              path: "$profile.avatar",
            },
          },
        ],
        as: "follower",
      },
    },
    {
      $project: {
        follower: {
          $arrayElemAt: ["$follower", 0],
        },
        following: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
    {
      $match: {
        following: new ObjectId(userId),
        follower: { $ne: null },
      },
    },
  ]);

  const follows = await Follow.aggregatePaginate(followAggregate, {
    sort: defaultSort,
    customLabels,
    ...options,
  });

  return follows;
};

const getFollowById = async (id) => {
  const follows = await Follow.findById(id);
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
  let res;
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
    if (follows.status === "decline")
      res = {
        type: "warning",
        message: "you are already declined",
      };
    else if (follows.status === "pending")
      res = {
        type: "warning",
        message: "you are on pending.",
      };
    else follows.delete();
    return res;
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

  res = {
    type: "success",
    message: "Requested Successfully.",
  };

  return res;
};

const acceptFollowing = async (id, type, updateBody) => {
  const follow = await getFollowById(id);
  if (!follow) {
    throw new ApiError(httpStatus.NOT_FOUND, "follow not found");
  }

  Object.assign(follow, updateBody);
  await follow.save();

  if (type === "active") {
    const followData = {
      follower: follow.following,
      following: follow.follower,
      status: "active",
    };

    // EventEmitter.emit(events.SEND_NOTIFICATION, {
    //   recipient: follow.following,
    //   actor: follow.follower,
    //   title: "New Follower",
    //   url: `/profile/${userId}/activity`,
    //   type: "followAccept",
    // });

    await Follow.create(followData);
  }

  return follow;
};

const getFollowStatus = async (userId, followingUser) => {
  const followData = {
    follower: userId,
    following: followingUser,
    status: "active",
  };

  const follows = await Follow.findOne(followData);

  return !!follows;
};

const queryFollows = async (filters, options) => {
  const follows = await Follow.paginate(filters, {
    sort: defaultSort,
    customLabels,
    ...options,
  });
  return follows;
};

const getFollowAndFollowings = async (userId) => {
  const followAndFollowing = await Follow.aggregate([
    {
      $match: {
        $or: [
          { follower: new ObjectId(userId) },
          { following: new ObjectId(userId) },
        ],
      },
    },
    {
      $lookup: {
        from: "users",
        let: { follower: "$follower" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$$follower", "$_id"] },
              _id: { $ne: new ObjectId(userId) },
            },
          },
        ],
        as: "follower",
      },
    },
    {
      $lookup: {
        from: "users",
        let: { following: "$following" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$$following", "$_id"] },
              _id: { $ne: new ObjectId(userId) },
            },
          },
        ],
        as: "following",
      },
    },
    {
      $project: {
        follower: { $arrayElemAt: ["$follower", 0] },
        following: { $arrayElemAt: ["$following", 0] },
      },
    },
  ]);

  return followAndFollowing;
};

module.exports = {
  getFollowers,
  getFollowings,
  followOrUnfollow,
  getFollowStatus,
  queryFollows,
  getFollowAndFollowings,
  acceptFollowing,
  getFollowById,
};
