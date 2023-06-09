const httpStatus = require("http-status");
const { Post, Shoutout, Like } = require("../models"),
  ApiError = require("@utils/ApiError"),
  customLabels = require("../utils/customLabels"),
  defaultSort = require("../utils/defaultSort");
const { EventEmitter, events } = require("../events");
const { ObjectID } = require("bson");
const settingService = require("./setting.service");

const createPost = async (postBody) => {
  const createdPost = await Post.create(postBody);
  const post = await getPostById(createdPost._id, "from to");
  // const status = await settingService.getSettingStatus({
  //   key: "user:likeCommentRating",
  //   user: post.to._id,
  // });
  // if (status)
  EventEmitter.emit(events.SEND_NOTIFICATION, {
    recipient: post.to._id.toString(),
    actor: post.from._id.toString(),
    title: "New post",
    description: `You have new activity from ${post.from.businessname}`,
    url: `/profile/${post.to._id.toString()}/activity`,
    type: "post",
  });
  return post;
};

const getPosts = async (filter, options) => {
  const posts = await Post.paginate(filter, {
    ...options,
    customLabels,
    sort: defaultSort,
  });
  return posts;
};

const getPostById = async (postId, populate) => {
  return Post.findById(postId).populate(populate);
};

const updatePostById = async (userId, updateBody) => {
  const post = await getPostById(userId);
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, "post not found");
  }

  Object.assign(post, updateBody);
  await post.save();
  return post;
};

const getlikePostCount = async (userId) => {
  const likePostCount = await Post.aggregate([
    {
      $match: {
        to: new ObjectID(userId),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "like",
        foreignField: "_id",
        as: "likescount",
      },
    },
    {
      $unwind: "$likescount",
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$likescount.count" },
      },
    },
  ]);

  const likeShoutoutCount = await Shoutout.aggregate([
    {
      $match: {
        to: new ObjectID(userId)
      },
    },
    {
      $lookup: {
        from: "posts",
        localField: "post",
        foreignField: "_id",
        pipeline: [
          {
            $lookup: {
              from: Like.collection.name,
              localField: "like",
              foreignField: "_id",
              as: "like",
            },
          },
          {
            $unwind: "$like",
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$like.count" },
            }
          },
        ],
        as: "shoutout",
      },
    },
    {
      $unwind: "$shoutout",
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$shoutout.total" },
      }
    },
  ])

  if (!likePostCount.length > 0)
    likePostCount.push({
      total: 0
    });

  if (!likeShoutoutCount.length > 0)
    likeShoutoutCount.push({
      total: 0
    });

  return likePostCount[0].total + likeShoutoutCount[0].total
};

module.exports = {
  createPost,
  getPosts,
  getPostById,
  updatePostById,
  getlikePostCount,
};
