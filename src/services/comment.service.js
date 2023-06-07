const httpStatus = require("http-status"),
  {
    Comment
  } = require("../models"),
  ApiError = require("../utils/ApiError");

const createComment = async (commentBody) => {

  const comment = await Comment.create(commentBody);

  const result = await Comment.findById(comment.id).populate({
    path: "userId",
    populate: { path: "profile.avatar" },
  })

  return result;
};

const deleteComment = async (id) => {

  const result = await Comment.findById(id);
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  await result.delete();
  return result;
};

const getAllComments = async (typeId) => {
  const result = await Comment.find({ typeId: typeId }).sort({ ['createdAt']: 'desc' })
    .populate({
      path: "userId",
      populate: { path: "profile.avatar" },
    })
    .populate("like")

  return result;
};

const getCommentById = async (commentId, populate) => {
  return Comment.findById(commentId).populate(populate);
};

const updateCommentById = async (commentId, updateBody) => {
  const comment = await getCommentById(commentId, "");
  if (!comment) {
    throw new ApiError(httpStatus.NOT_FOUND, "comment not found");
  }

  Object.assign(comment, updateBody);
  await comment.save();
  return comment;
};

module.exports = {
  getAllComments,
  createComment,
  deleteComment,
  getCommentById,
  updateCommentById
};
