const httpStatus = require("http-status"),
  { User, Post, Media, Like, Order, Category, Location } = require("../models"),
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
  const totalActiveUsers = await User.countDocuments({ role: ROLE_USER, status: STATUS_ACTIVE });
  const totalInactiveUsers = await User.countDocuments({ role: ROLE_USER, status: STATUS_INACTIVE });
  const totalPendingUsers = await User.countDocuments({ role: ROLE_USER, status: STATUS_PENDING });
  const totalActivePartners = await User.countDocuments({ role: ROLE_PARTNER, status: STATUS_ACTIVE });
  const totalInactivePartners = await User.countDocuments({ role: ROLE_PARTNER, status: STATUS_INACTIVE });
  const totalPendingPartners = await User.countDocuments({ role: ROLE_PARTNER, status: STATUS_PENDING });
  const totalCategories = await Category.countDocuments();
  const totalActiveLocations = await Location.countDocuments({ isActive: ISTRUE });
  const totalINActiveLocations = await Location.countDocuments({ isActive: ISFALSE });
  const totalOrders = await Order.countDocuments();
  const totalGalleries = await Media.countDocuments({});
  const totalLike = await Like.countDocuments({});
  
  return {
    totalActiveUsers,
    totalInactiveUsers,
    totalPendingUsers,
    totalActivePartners,
    totalInactivePartners,
    totalPendingPartners,
    totalCategories,
    totalActiveLocations,
    totalINActiveLocations,
    totalOrders,
    totalGalleries,
    totalLike,
  };
};

module.exports = {
  stats,
};
