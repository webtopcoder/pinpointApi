const httpStatus = require("http-status"),
  { Follow } = require("@models"),
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
const getFollowers = async (userId) => {
  const follows = await Follow.find({
    following: userId,
    status: 'active'
  })
    .populate("follower")
    .select("-following");
  return follows;
};

const getFollowById = async (id) => {
  const follows = await Follow.findById(
    id,
  )
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
        type: 'warning',
        message: 'you are already declined'
      }
    else if (follows.status === "pending")
      res = {
        type: 'warning',
        message: 'you are on pending.'
      }
    else
      follows.delete();
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
    type: 'success',
    message: 'Requested Successfully.'
  }

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
      status: 'active'
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
    status: 'active'
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
  getFollowById
};
