const httpStatus = require("http-status"),
  { User, Review, Post, Shoutout } = require("../models"),
  { STATUS_ACTIVE, STATUS_INACTIVE, STATUS_PENDING, STATUS_DELETED, ROLE_USER, ROLE_PARTNER } = require("../config/constants"),
  ApiError = require("../utils/ApiError"),
  customLabels = require("../utils/customLabels"),
  defaultSort = require("../utils/defaultSort");
const { ObjectId } = require("bson");
const { query } = require("express");


/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const searchUser = async (req) => {
  req?.status ? req.status : req.status = 'all';

  let query = {};

  if (req.q) {
    const regexp = new RegExp(
      req.q.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''),
      'i'
    );
    query.$or = [
      {
        username: { $regex: regexp }
      },
      {
        email: { $regex: regexp }
      }
    ];
  }
  query.role = ROLE_USER;
  query.status = req.status === 'all' || undefined || null || '' ? { $in: [STATUS_ACTIVE, STATUS_INACTIVE] } : req.status;

  let sort = {};
  if (req.sort && req.sortBy) {
    sort = {
      [req.sortBy]: req.sort
    };
  }

  const [data, total] = await Promise.all([
    User
      .find(query)
      .sort(sort)
      .limit(parseInt(req.limit, 10))
      .skip(parseInt(req.offset, 10)),
    User.countDocuments(query)
  ]);

  return {
    data,
    total
  };
};

const searchActivities = async (req) => {

  let query = {};

  if (req.q) {
    const regexp = new RegExp(
      req.q.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''),
      'i'
    );
    query.$or = [
      {
        content: { $regex: regexp }
      },
      {
        status: { $regex: regexp }
      },
    ];
  }

  query.status = req.status === 'all' || undefined || null || '' ? { $in: [STATUS_ACTIVE, STATUS_PENDING, STATUS_DELETED] } : req.status;
  let sort = {};
  if (req.sort && req.sortBy) {
    sort = {
      [req.sortBy]: req.sort
    };
  }

  const [Postdata, Posttotal, Reivewdata, ReviewTotal, shoutoutdata, shoutouttotal] = await Promise.all([
    Post
      .find(query)
      .sort(sort).populate('from to images like')
      .limit(parseInt(req.limit, 10))
      .skip(parseInt(req.offset, 10)),
    Post.countDocuments(query),
    Review
      .find(query)
      .sort(sort)
      .populate('like images')
      .limit(parseInt(req.limit, 10))
      .skip(parseInt(req.offset, 10)),
    Review.countDocuments(query),
    Shoutout
      .find(query)
      .sort(sort)
      .limit(parseInt(req.limit, 10))
      .skip(parseInt(req.offset, 10)),
    Shoutout.countDocuments(query)
  ]);

  return {
    Postdata, Posttotal, Reivewdata, ReviewTotal, shoutoutdata, shoutouttotal
  };
};

const getActivitiesById = (query) => {

  switch (query.type) {
    case 'Post':
      return Post.findById(query.id);
    case 'Review':
      return Review.findById(query.id);
    case 'Shoutout':
      return Shoutout.findById(query.id);
  }
};

const deleteActivitiesById = async (query, updateBody) => {
  const activities = await getActivitiesById(query);

  if (!activities) {
    throw new ApiError(httpStatus.NOT_FOUND, "activities not found");
  }
  
  Object.assign(activities, updateBody);
  await activities.save();
  return activities;
};


const searchPartner = async (req) => {

  req?.status ? req.status : req.status = 'all';

  let query = {};

  if (req.q) {
    const regexp = new RegExp(
      req.q.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''),
      'i'
    );
    query.$or = [
      {
        username: { $regex: regexp }
      },
      {
        email: { $regex: regexp }
      }
    ];
  }
  query.role = ROLE_PARTNER;
  query.status = req.status === 'all' || undefined || null || '' ? { $in: [STATUS_ACTIVE, STATUS_INACTIVE] } : req.status;

  let sort = {};
  if (req.sort && req.sortBy) {
    sort = {
      [req.sortBy]: req.sort
    };
  }

  const [data, total] = await Promise.all([
    User
      .find(query)
      .sort(sort)
      .limit(parseInt(req.limit, 10))
      .skip(parseInt(req.offset, 10)),
    User.countDocuments(query)
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
  searchActivities,
  getActivitiesById,
  deleteActivitiesById,
  searchPartner,
  getUserByID
};
