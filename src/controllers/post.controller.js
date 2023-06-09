const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const ApiError = require("@utils/ApiError");
const { likeService, postService, settingService } = require("@services");
const { EventEmitter, events } = require("../events");

const likePost = catchAsync(async (req, res) => {
  const { postId } = req.params;
  const post = await postService.getPostById(postId, "like");
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, "Post not found");
  }

  if (!post.like) {
    post.like = await likeService.createLike({
      users: [],
      count: 0,
    });
  }

  const liked = post.like.users.includes(req.user.id);

  if (liked) {
    post.like.users = post.like.users.filter((user) => user != req.user._id);
    post.like.count -= 1;
  } else {
    post.like.users.push(req.user._id);
    post.like.count += 1;

    if (post.to.toString() !== req.user.id.toString()) {
      // const status = await settingService.getSettingStatus({
      //   key: "user:likeCommentRating",
      //   user: post.to,
      // });
      // if (status)
      EventEmitter.emit(events.SEND_NOTIFICATION, {
        recipient: post.to.toString(),
        actor: req.user.id.toString(),
        title: "New post like",
        description: `You have a new like from ${req.user.businessname}`,
        url: `/profile/${post.to.toString()}/activity/`,
        type: "like",
      });
    }

    if (post.from.toString() != req.user.id.toString()) {
      if (post.to.toString() != post.from.toString()) {
        // const status = await settingService.getSettingStatus({
        //   key: "user:likeCommentRating",
        //   user: post.from,
        // });
        // if (status)
        EventEmitter.emit(events.SEND_NOTIFICATION, {
          recipient: post.from.toString(),
          actor: req.user.id.toString(),
          title: "likes",
          description: `You have a new like from ${req.user.businessname}`,
          url: `/profile/${post.to.toString()}/activity/`,
          type: "like",
        });
      }
    }
  }

  await likeService.updateLikeById(post.like._id, post.like);
  await post.save();

  res.send({ liked: !liked });
});

module.exports = {
  likePost,
};
