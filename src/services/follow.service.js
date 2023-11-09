const httpStatus = require("http-status"),
  { Follow, Media } = require("@models"),
  ApiError = require("@utils/ApiError"),
  customLabels = require("@utils/customLabels"),
  defaultSort = require("@utils/defaultSort");
const userService = require("./user.service");
const { EventEmitter, events } = require("../events");
const { ObjectId } = require("bson");
const settingService = require("./setting.service");

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
              role: 1,
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
        status: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
    {
      $match: {
        following: new ObjectId(userId),
        follower: { $ne: null },
        status: { $ne: 'decline' }
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
  const followData = [
    {
      follower: userId,
      following: followingUser,
    }, {
      follower: followingUser,
      following: userId,
    }
  ]
  const followingUserValid = await userService.getUserById(followingUser);
  const followerUserValid = await userService.getUserById(userId);

  const notifyFlag = await Follow.findOne({
    follower: userId,
    following: followingUser,
  });

  if (notifyFlag) {
    // const status = await settingService.getSettingStatus({
    //   key: "user:followRequest",
    //   user: followingUser,
    // });
    // if (status)
    EventEmitter.emit(events.SEND_NOTIFICATION, {
      recipient: followingUser,
      actor: userId,
      title: "New Follower",
      description: `${followerUserValid.businessname} removed your following.`,
      url: `/profile/${followingUser}/followers`,
      type: "follow",
      flag: "removing"
    })
  }
  else {
    // const status = await settingService.getSettingStatus({
    //   key: "user:followRequest",
    //   user: followingUser,
    // });
    // if (status)
    EventEmitter.emit(events.SEND_NOTIFICATION, {
      recipient: followingUser,
      actor: userId,
      title: "New Follower",
      description: `${followerUserValid.businessname} has started following you`,
      url: `/profile/${followingUser}/followers`,
      type: "follow",
      flag: "creating"
    })
  }

  if (!followingUserValid || !followerUserValid) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  followData?.map(async (item, index) => {
    const follows = await Follow.findOne(item);
    if (follows) {
      if (follows.status === "decline")
        res = {
          type: "warning",
          message: "you are already declined",
        };
      else if (follows.status === "pending" || follows.status === "requesting")
        res = {
          type: "warning",
          message: "you are on pending.",
        };
      else {
        follows.remove();
        res = {
          type: "warning",
          message: "unfriend successfully.",
        };
      }
      return res;
    }

    const newItem = {
      ...item,
      status: index === 0 ? "pending" : "requesting",
    };
    await Follow.create(newItem);
  })

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
  type === "active" ? await follow.save() : await follow.remove();

  const followingUserValid = await userService.getUserById(follow.following);
  if (type === "active") {
    // const status = await settingService.getSettingStatus({
    //   key: "user:followRequest",
    //   user: follow.follower,
    // });
    // if (status)
    EventEmitter.emit(events.SEND_NOTIFICATION, {
      recipient: follow.follower,
      actor: follow.following,
      title: "New Follower",
      description: `${followingUserValid.businessname} accepted your following request`,
      url: `/profile/${follow.follower}/followers`,
      type: "follow",
      flag: "accepting"
    });

    await Follow.update({ follower: follow.following, following: follow.follower }, { status: "active" });
  }
  else {
    await Follow.remove({ follower: follow.following, following: follow.follower });
    // const status = await settingService.getSettingStatus({
    //   key: "user:followRequest",
    //   user: follow.follower,
    // });
    // if (status)
    EventEmitter.emit(events.SEND_NOTIFICATION, {
      recipient: follow.follower,
      actor: follow.following,
      title: "New Follower",
      description: `${followingUserValid.businessname} declined your following request`,
      url: `/profile/${follow.follower}/followers`,
      type: "follow",
      flag: "declining"
    });
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

// const queryFollows = async (req) => {

//   const { userId } = req.params;

//   let filter = pick(req.query, ["q", "limit", "page", "sort"]);

//   // const follows = await Follow.paginate(filters, {
//   //   sort: defaultSort,
//   //   customLabels,
//   //   ...options,
//   // });



//   let postAndFollows = await Follow.aggregate([
//     {
//       $match: {
//         following: new ObjectId(userId.toString()),
//       },
//     },
//     {
//       $lookup: {
//         from: Media.collection.name,
//         localField: "profile.avatar",
//         foreignField: "_id",
//         as: "profile.avatar",
//       },
//     },
//     {
//       $unwind: "$profile.avatar",
//     },
//     {
//       $lookup: {
//         from: "posts",
//         let: { userId: "$_id" },
//         pipeline: [
//           {
//             $match: {
//               $expr: {
//                 $or: [
//                   { $eq: ["$from", "$$userId"] },
//                   { $eq: ["$to", "$$userId"] },
//                 ],
//               },
//             },
//           },
//           {
//             $lookup: {
//               from: Like.collection.name,
//               localField: "like",
//               foreignField: "_id",
//               as: "like",
//             },
//           },
//           {
//             $unwind: "$like",
//           },
//           {
//             $lookup: {
//               from: Media.collection.name,
//               localField: "images",
//               foreignField: "_id",
//               as: "images",
//             },
//           },
//           {
//             $lookup: {
//               from: "users",
//               localField: "from",
//               foreignField: "_id",
//               pipeline: [
//                 {
//                   $lookup: {
//                     from: Media.collection.name,
//                     localField: "profile.avatar",
//                     foreignField: "_id",
//                     as: "profile.avatar",
//                   },
//                 },
//                 {
//                   $unwind: "$profile.avatar",
//                 },
//               ],
//               as: "from",
//             },
//           },
//           {
//             $unwind: "$from",
//           },
//           {
//             $lookup: {
//               from: "users",
//               localField: "to",
//               foreignField: "_id",
//               pipeline: [
//                 {
//                   $lookup: {
//                     from: Media.collection.name,
//                     localField: "profile.avatar",
//                     foreignField: "_id",
//                     as: "profile.avatar",
//                   },
//                 },
//                 {
//                   $unwind: "$profile.avatar",
//                 },
//               ],
//               as: "to",
//             },
//           },
//           {
//             $unwind: "$to",
//           },
//           {
//             $project: {
//               from_user: {
//                 username: "$from.username",
//                 avatar: "$from.profile.avatar",
//                 _id: "$from._id",
//               },
//               to_user: {
//                 username: "$to.username",
//                 avatar: "$to.profile.avatar",
//                 _id: "$to._id",
//               },
//               content: "$content",
//               image: "$images",
//               like: "$like",
//               createdAt: "$createdAt",
//               updatedAt: "$updatedAt",
//               type: "post",
//             },
//           },
//           {
//             $match: {
//               $or: [
//                 { "from.username": new RegExp(search, "i") },
//                 { "to.username": new RegExp(search, "i") },
//                 { content: new RegExp(search, "i") },
//               ],
//             },
//           },
//           {
//             $sort: { updatedAt: -1 },
//           },
//         ],
//         as: "posts",
//       },
//     },
//     {
//       $lookup: {
//         from: "follows",
//         let: { userId: "$_id" },
//         pipeline: [
//           {
//             $match: {
//               $expr: {
//                 $or: [
//                   { $eq: ["$follower", "$$userId"] },
//                   { $eq: ["$following", "$$userId"] },
//                 ],
//               },
//             },
//           },
//           {
//             $lookup: {
//               from: "users",
//               localField: "follower",
//               foreignField: "_id",
//               pipeline: [
//                 {
//                   $lookup: {
//                     from: Media.collection.name,
//                     localField: "profile.avatar",
//                     foreignField: "_id",
//                     as: "profile.avatar",
//                   },
//                 },
//                 {
//                   $unwind: "$profile.avatar",
//                 },
//               ],
//               as: "follower",
//             },
//           },
//           {
//             $unwind: "$follower",
//           },
//           {
//             $lookup: {
//               from: "users",
//               localField: "following",
//               foreignField: "_id",
//               pipeline: [
//                 {
//                   $lookup: {
//                     from: Media.collection.name,
//                     localField: "profile.avatar",
//                     foreignField: "_id",
//                     as: "profile.avatar",
//                   },
//                 },
//                 {
//                   $unwind: "$profile.avatar",
//                 },
//               ],
//               as: "following",
//             },
//           },
//           {
//             $unwind: "$following",
//           },
//           {
//             $project: {
//               follower: {
//                 username: "$follower.username",
//                 avatar: "$follower.profile.avatar",
//                 _id: "$follower._id",
//               },
//               following: {
//                 username: "$following.username",
//                 avatar: "$following.profile.avatar",
//                 _id: "$following._id",
//               },
//               createdAt: "$createdAt",
//               updatedAt: "$updatedAt",
//               type: "follow",
//             },
//           },
//           {
//             $sort: { updatedAt: -1 },
//           },
//         ],
//         as: "follows",
//       },
//     },
//     {
//       $project: {
//         posts: 1,
//         follows: 1,
//       },
//     },
//   ]);


//   return follows;
// };

const getFollowAndFollowings = async (userId) => {
  const followAndFollowing = await Follow.aggregate([
    {
      $match: {
        $or: [
          { follower: new ObjectId(userId) },
          { following: new ObjectId(userId) },
        ],
        status: 'active'
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
