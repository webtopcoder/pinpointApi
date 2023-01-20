const httpStatus = require("http-status"),
  { Like } = require("@models"),
  ApiError = require("@utils/ApiError"),
  customLabels = require("@utils/customLabels"),
  defaultSort = require("@utils/defaultSort");

const getLikeById = async (id) => {
  return Like.findById(id);
};

const createLike = async (likeBody) => {
  return Like.create(likeBody);
};

const updateLikeById = async (likeId, updateBody) => {
  const like = await getLikeById(likeId);
  if (!like) {
    throw new ApiError(httpStatus.NOT_FOUND, "Like not found");
  }
  Object.assign(like, updateBody);
  await like.save();
  return like;
};

const queryLikes = async (filter, options) => {
  const likes = await Like.paginate(filter, options);
  return likes;
};

module.exports = {
  getLikeById,
  createLike,
  updateLikeById,
  queryLikes,
};
