const httpStatus = require("http-status"),
  { User, FAQ, Media, Like, Order, Post, Category, Location, Transaction, SubCategory, Contact, Testimonial, Shoutout, Review } = require("../models"),
  { STATUS_ACTIVE, STATUS_INACTIVE, STATUS_PENDING, ROLE_USER, ROLE_PARTNER, ISFALSE, ISTRUE } = require("../config/constants"),
  ApiError = require("../utils/ApiError"),
  customLabels = require("../utils/customLabels"),
  defaultSort = require("../utils/defaultSort"),
  mediaService = require("./media.service");
const { ObjectId } = require("bson");


/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const stats = async () => {

  const totalUsers = await User.countDocuments({ role: ROLE_USER });
  const totalPartners = await User.countDocuments({ role: ROLE_PARTNER });
  const totalCategories = await Category.countDocuments();
  const totalSubcategories = await SubCategory.countDocuments();
  const totalTestimonials = await Testimonial.countDocuments();
  const totalContacts = await Contact.countDocuments();
  const totalFaqs = await FAQ.countDocuments();
  const totalPhotos = await Media.countDocuments();
  const totalLocations = await Location.countDocuments();
  const totalGrossRevenue = await Order.countDocuments();
  const totaltransactions = await Transaction.countDocuments({});
  const totalactivities = await Post.countDocuments({}) + await Shoutout.countDocuments({}) + await Review.countDocuments({});

  return {
    totalUsers,
    totalPartners,
    totalLocations,
    totalFaqs,
    totalContacts,
    totalTestimonials,
    totalCategories,
    totalSubcategories,
    totalPhotos,
    totalGrossRevenue,
    totalactivities,
    totaltransactions,
  };
};

module.exports = {
  stats,
};
