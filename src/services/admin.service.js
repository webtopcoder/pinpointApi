const httpStatus = require("http-status"),
  { User } = require("../models"),
  { STATUS_ACTIVE, STATUS_INACTIVE, STATUS_PENDING, ROLE_USER, ROLE_PARTNER, ISFALSE, ISTRUE } = require("../config/constants"),
  ApiError = require("../utils/ApiError"),
  customLabels = require("../utils/customLabels"),
  defaultSort = require("../utils/defaultSort");
const { ObjectId } = require("bson");


/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const searchUser = async (query) => {
  const [data, total] = await Promise.all([
    User
      .find({ role: ROLE_USER, status: query.status })
      .sort(query.sort)
      .limit(parseInt(query.limit, 10))
      .skip(parseInt(query.offset, 10)),
    User.countDocuments({ status: query.status })
  ]);

  return {
    data,
    total
  };
};

const searchPartner = async (query) => {
  const [data, total] = await Promise.all([
    User
      .find({ role: ROLE_PARTNER, status: query.status })
      .sort(query.sort)
      .limit(parseInt(query.limit, 10))
      .skip(parseInt(query.offset, 10)),
    User.countDocuments({ status: query.status })
  ]);

  return {
    data,
    total
  };
};

const getUserByID = (id) => {
  return User.findById(id).populate("profile.avatar");
};

module.exports = {
  searchUser,
  searchPartner,
  getUserByID
};
