const httpStatus = require("http-status");
const { Post } = require("../models"),
  ApiError = require("@utils/ApiError"),
  customLabels = require("../utils/customLabels"),
  defaultSort = require("../utils/defaultSort");

const createPost = async (postBody) => {
  const post = await Post.create(postBody);
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
  const post = await getPostById(userId, "");
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
  updatePostById
};
