const httpStatus = require("http-status"),
  { User, Post, Media, Like, Order, Category, Location, Transaction } = require("../models"),
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
  const totalActiveUsers = await User.countDocuments({ role: ROLE_USER, status: STATUS_ACTIVE });
  const totalInactiveUsers = await User.countDocuments({ role: ROLE_USER, status: STATUS_INACTIVE });
  const totalPendingUsers = await User.countDocuments({ role: ROLE_USER, status: STATUS_PENDING });
  const totalPartners = await User.countDocuments({ role: ROLE_PARTNER });
  const totalActivePartners = await User.countDocuments({ role: ROLE_PARTNER, status: STATUS_ACTIVE });
  const totalInactivePartners = await User.countDocuments({ role: ROLE_PARTNER, status: STATUS_INACTIVE });
  const totalPendingPartners = await User.countDocuments({ role: ROLE_PARTNER, status: STATUS_PENDING });
  const totalCategories = await Category.countDocuments();
  const totalLocations = await Location.countDocuments();
  const totalGrossRevenue = await Order.countDocuments();
  const totaltransactions = await Transaction.countDocuments({});
  const totalactivities = await Like.countDocuments({});

  return {
    totalUsers,
    totalPartners,
    totalLocations,
    totalGrossRevenue,
    totalactivities,
    totaltransactions,
  };
};

module.exports = {
  stats,
};
