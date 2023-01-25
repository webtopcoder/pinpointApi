const httpStatus = require("http-status"),
  { Review } = require("@models"),
  ApiError = require("@utils/ApiError"),
  customLabels = require("@utils/customLabels"),
  defaultSort = require("@utils/defaultSort");
const { EventEmitter, events } = require("../events");

const getReviewById = async (id) => {
  return Review.findById(id)
    .populate("location")
    .populate("images")
    .populate("like");
};

const getReviewByLocationId = async (locationId, filter) => {
  return Review.find({ ...filter, location: locationId })
    .populate("location")
    .populate("images")
    .populate("like");
};

const createReview = async (reviewBody) => {
  const review = await Review.create(reviewBody);

  /* EventEmitter.emit(events.SEND_NOTIFICATION, {
    recipient: mail.to,
    actor: mail.from,
    title: "New message",
    description: `You have a new message from @${from_user.username}`,
    url: `/message/${mail._id}`,
    type: "mail",
  }); */

  return review;
};

const updateReviewById = async (reviewId, updateBody) => {
  const review = await getReviewById(reviewId);
  if (!review) {
    throw new ApiError(httpStatus.NOT_FOUND, "Review not found");
  }
  Object.assign(review, updateBody);
  await review.save();
  return review;
};

const queryReviews = async (filter, options) => {
  const reviews = await Review.paginate(filter, options);
  return reviews;
};

module.exports = {
  getReviewById,
  getReviewByLocationId,
  createReview,
  updateReviewById,
  queryReviews,
};
