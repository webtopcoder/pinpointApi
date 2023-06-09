const httpStatus = require("http-status"),
  { Review } = require("@models"),
  ApiError = require("@utils/ApiError"),
  { EventEmitter, events } = require("../events");
const settingService = require("./setting.service");

const getReviewById = async (id, populate) => {
  return Review.findById(id)
    .populate("location")
    .populate("images")
    .populate("like")
    .populate(populate);
};

const getReviewByLocationId = async (locationId, filter, populate) => {
  return Review.find({ ...filter, location: locationId })
    .populate("location")
    .populate("images")
    .populate("like")
    .populate(populate);
};

const createReview = async (reviewBody) => {
  const createdReview = await Review.create(reviewBody);
  const review = await getReviewById(createdReview._id, "user");

  if (reviewBody.user.toString() !== review.location.partner.toString()) {
    // const status = await settingService.getSettingStatus({
    //   key: "user:likeCommentRating",
    //   user: review.location.partner,
    // });
    // if (status)
    EventEmitter.emit(events.SEND_NOTIFICATION, {
      recipient: review.location.partner.toString(),
      actor: review.user._id.toString(),
      title: "New Review",
      description: `Your location has a new review from ${review.user.businessname}`,
      url: `/profile/${review.location.partner.toString()}/locations/${review.location._id
        }`,
      type: "review",
    });
  }

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
