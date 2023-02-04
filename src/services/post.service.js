const { Post } = require("../models"),
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

module.exports = {
  createPost,
  getPosts,
  getPostById,
};
