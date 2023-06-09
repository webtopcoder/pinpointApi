const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const ApiError = require("@utils/ApiError");
const {
  likeService,
  commentService,
  settingService
} = require("@services");
const { EventEmitter, events } = require("../events");

const createComment = catchAsync(async (req, res) => {

  const { oriuserId } = req.params;

  const comment = await commentService.createComment({ userId: req.user._id, ...req.body });
  if (oriuserId.toString() !== req.user.id.toString()) {
    // const status = await settingService.getSettingStatus({
    //   key: "user:likeCommentRating",
    //   user: oriuserId,
    // });
    // if (status)
    EventEmitter.emit(events.SEND_NOTIFICATION, {
      recipient: oriuserId.toString(),
      actor: req.user._id.toString(),
      title: "comment",
      description: `You have a new comment from ${req.user.businessname}`,
      url: req.body.path,
      type: "comment",
    });
  }

  res.send(comment);
});

const deleteComment = catchAsync(async (req, res) => {
  await commentService.deleteComment(req.body.id);
  return res.json({ success: true, msg: "Post successfully!" });
});


const updateComment = catchAsync(async (req, res) => {
  const comment = await commentService.getCommentById(req.body.id);
  const result = await commentService.updateCommentById(req.body.id, {
    ...comment,
    body: req.body.body,
  });
  res.send(result);
});

const recommendComment = catchAsync(async (req, res) => {

  const { commentId } = req.params;
  const comment = await commentService.getCommentById(commentId, "like");
  if (!comment) {
    throw new ApiError(httpStatus.NOT_FOUND, "Comment not found");
  }

  if (!comment.like) {
    comment.like = await likeService.createLike({
      users: [],
      count: 0,
    });
  }

  const liked = comment.like.users.includes(req.user.id);

  if (liked) {
    comment.like.users = comment.like.users.filter((user) => user != req.user._id);
    comment.like.count -= 1;
  } else {
    comment.like.users.push(req.user._id);
    comment.like.count += 1;
  }

  await likeService.updateLikeById(comment.like._id, comment.like);
  await comment.save();

  res.send({ liked: !liked });
});

const getAllComments = catchAsync(async (req, res) => {
  const result = await commentService.getAllComments(req.params.typeId);
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "result not found");
  }
  res.send(result);
});

const getCommentCountBytypeId = catchAsync(async (req, res) => {
  const result = await commentService.getAllComments(req.params.typeId);
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "result not found");
  }
  res.send(result);
});

module.exports = {
  getAllComments,
  createComment,
  deleteComment,
  updateComment,
  recommendComment,
  getCommentCountBytypeId
};
