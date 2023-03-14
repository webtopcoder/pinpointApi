const httpStatus = require("http-status");
const { Post } = require("../models"),
  ApiError = require("@utils/ApiError"),
  customLabels = require("../utils/customLabels"),
  defaultSort = require("../utils/defaultSort");
const { EventEmitter, events } = require("../events");

const createPost = async (postBody) => {
  const createdPost = await Post.create(postBody);
  const post = await getPostById(createdPost._id, "from to");

  EventEmitter.emit(events.SEND_NOTIFICATION, {
    recipient: post.to._id.toString(),
    actor: post.from._id.toString(),
    title: "New post",
    description: `You have a new post from @${post.from.username}`,
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

module.exports = {
  createPost,
  getPosts,
  getPostById,
  updatePostById,
};
