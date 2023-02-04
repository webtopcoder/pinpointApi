const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const ApiError = require("@utils/ApiError");
const { likeService, postService } = require("@services");

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
  }

  await likeService.updateLikeById(post.like._id, post.like);
  await post.save();

  res.send({ liked: !liked });
});

module.exports = {
  likePost,
};
