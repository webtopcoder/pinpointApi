const httpStatus = require("http-status"),
  { User, Review, Post, Shoutout, Location } = require("../models"),
  { STATUS_ACTIVE, STATUS_INACTIVE, STATUS_PENDING, STATUS_DELETED, ROLE_USER, ROLE_PARTNER ,ISFALSE, ISTRUE} = require("../config/constants"),
  ApiError = require("../utils/ApiError"),
  customLabels = require("../utils/customLabels"),
  defaultSort = require("../utils/defaultSort");
const { ObjectId } = require("bson");
const { query } = require("express");
const { add } = require("lodash");


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

  const [cities] = await Promise.all([
    User
      .find({}, { address: 1, _id: 0 })
  ]);

  const topCities = {};
  let address = [];
  cities.map(async (item) => {
    address.push(item.address.city);
  })

  // topCities.forEach(function (x) {
  //   counts[x] = (counts[x] || 0) + 1;
  // });

  // console.log(counts);

  return {
    data,
    total,
    // topCities
  };
};

/**
 * get Locations
 * @param {Object} userBody
 * @returns {Promise<location>}
 */
const searchLocation = async (req) => {
  req?.status ? req.status : req.status = 'all';

  let query = {};

  if (req.q) {
    const regexp = new RegExp(
      req.q.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''),
      'i'
    );
    query.$or = [
      {
        title: { $regex: regexp }
      },
      {
        description: { $regex: regexp }
      }
    ];
  }
  query.isActive = req.status === 'all' || undefined || null || '' ? { $in: [ISTRUE, ISFALSE] } : req.status;

  let sort = {};
  if (req.sort && req.sortBy) {
    sort = {
      [req.sortBy]: req.sort
    };
  }

  const [data, total] = await Promise.all([
    Location
      .find(query)
      .sort(sort).populate('partner subCategories images like')
      .limit(parseInt(req.limit, 10))
      .skip(parseInt(req.offset, 10)),
    Location.countDocuments(query)
  ]);

  return {
    data,
    total,
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

const userUpdate = async (id, payload) => {
  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const data = { ...payload };

  if (!user.name) {
    user.name = [user.firstName || '', user.lastName || ''].join(' ').trim();
  }

  if (data.email && data.email.toLowerCase() !== user.email.toLowerCase()) {
    const emailCheck = await User.countDocuments({
      email: data.email.toLowerCase(),
      _id: {
        $ne: user._id
      }
    });
    if (emailCheck) {
      throw new ApiError(httpStatus.NOT_FOUND, "Email is already taken");
    }
  }

  if (
    data.username &&
    data.username.toLowerCase() !== user.username.toLowerCase()
  ) {
    const usernameCheck = await User.countDocuments({
      username: user.username.toLowerCase(),
      _id: { $ne: user._id }
    });
    if (usernameCheck) {
      throw new ApiError(httpStatus.NOT_FOUND, "UserName is already taken");
    }
  }

  await User.updateOne({ _id: id }, data, { new: true });

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

const getUserByIDForAvatar = (id) => {
  return User.findById(id);
};

module.exports = {
  searchUser,
  userUpdate,
  searchLocation,
  getUserByIDForAvatar,
  searchActivities,
  getActivitiesById,
  deleteActivitiesById,
  searchPartner,
  getUserByID
};
