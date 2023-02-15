const httpStatus = require("http-status"),
  { User, Review, Post, Shoutout, Location } = require("../models"),
  {
    STATUS_ACTIVE,
    STATUS_INACTIVE,
    STATUS_PENDING,
    STATUS_DELETED,
    ROLE_USER,
    ROLE_PARTNER,
    ISFALSE,
    ISTRUE,
  } = require("../config/constants"),
  moment = require("moment"),
  ApiError = require("../utils/ApiError");

const getTopCities = async ({ role = ROLE_USER, limit = 3 }) => {
  const usersWithCities = await User.find({
    role,
    "address.city": { $exists: true },
  });

  const address = new Map();

  usersWithCities.forEach((item) => {
    address.set(
      item.address.city,
      address.has(item.address.city) ? address.get(item.address.city) + 1 : 1
    );
  });

  const sortedAddress = [...address.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  return Object.fromEntries(sortedAddress);
};

const getUserStats = async (
  role = ROLE_USER,
  { yearBack = 1, monthBack = 1, weekBack = 1 }
) => {
  const yearBackFromNow = moment().subtract(yearBack, "year").toDate();
  const monthBackFromNow = moment().subtract(monthBack, "month").toDate();
  const weekBackFromNow = moment().subtract(weekBack, "week").toDate();

  const [usersByYear, usersByMonth, usersByWeek] = await Promise.all([
    User.aggregate([
      {
        $match: {
          role,
          createdAt: { $gte: yearBackFromNow },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y",
              date: "$createdAt",
            },
          },
          count: { $sum: 1 },
        },
      },
    ]),
    User.aggregate([
      {
        $match: {
          role,
          createdAt: { $gte: monthBackFromNow },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%m",
              date: "$createdAt",
            },
          },
          count: { $sum: 1 },
        },
      },
    ]),
    User.aggregate([
      {
        $match: {
          role,
          createdAt: { $gte: weekBackFromNow },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%U",
              date: "$createdAt",
            },
          },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  return {
    usersByYear,
    usersByMonth: usersByMonth.map((item) => {
      return {
        ...item,
        _id: moment(item._id, "MM").format("MMM"),
      };
    }),
    usersByWeek: usersByWeek.map((item) => {
      return {
        ...item,
        _id: moment(item._id, "YYYY-WW").format("YYYY-MM-DD"),
      };
    }),
  };
};

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const searchUser = async (reqQuery) => {
  reqQuery?.status ? reqQuery.status : (reqQuery.status = "all");

  let query = {};

  if (reqQuery.q) {
    query.$or = [
      {
        username: { $regex: reqQuery.q, $options: "ig" },
      },
      {
        email: { $regex: reqQuery.q, $options: "ig" },
      },
    ];
  }
  query.role = ROLE_USER;
  query.status =
    reqQuery.status === "all" || undefined || null || ""
      ? { $in: [STATUS_ACTIVE, STATUS_INACTIVE] }
      : reqQuery.status;

  let sort = {};
  if (reqQuery.sort && reqQuery.sortBy) {
    sort = {
      [reqQuery.sortBy]: reqQuery.sort,
    };
  }

  const [data, total] = await Promise.all([
    User.find(query)
      .sort(sort)
      .limit(parseInt(reqQuery.limit, 10))
      .skip(parseInt(reqQuery.offset, 10)),
    User.countDocuments(query),
  ]);

  const topCities = await getTopCities({
    role: ROLE_USER,
  });
  const userStats = await getUserStats(ROLE_USER, {
    yearBack: reqQuery.yearBack ?? 5,
    monthBack: reqQuery.monthBack ?? 5,
    weekBack: reqQuery.weekBack ?? 5,
  });

  return { data, total, topCities, userStats };
};

/**
 * get Locations
 * @param {Object} userBody
 * @returns {Promise<location>}
 */
const searchLocation = async (req) => {
  req?.status ? req.status : (req.status = "all");

  let query = {};

  if (req.q) {
    const regexp = new RegExp(
      req.q.toLowerCase().replace(/[^a-zA-Z0-9]/g, ""),
      "i"
    );
    query.$or = [
      {
        title: { $regex: regexp },
      },
      {
        description: { $regex: regexp },
      },
    ];
  }
  query.isActive =
    req.status === "all" || undefined || null || ""
      ? { $in: [ISTRUE, ISFALSE] }
      : req.status;

  let sort = {};
  if (req.sort && req.sortBy) {
    sort = {
      [req.sortBy]: req.sort,
    };
  }

  const [data, total] = await Promise.all([
    Location.find(query)
      .sort(sort)
      .populate("partner subCategories images like reviews")
      .limit(parseInt(req.limit, 10))
      .skip(parseInt(req.offset, 10)),
    Location.countDocuments(query),
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
      req.q.toLowerCase().replace(/[^a-zA-Z0-9]/g, ""),
      "i"
    );
    query.$or = [
      {
        content: { $regex: regexp },
      },
      {
        status: { $regex: regexp },
      },
    ];
  }

  query.status =
    req.status === "all" || undefined || null || ""
      ? { $in: [STATUS_ACTIVE, STATUS_PENDING, STATUS_DELETED] }
      : req.status;
  let sort = {};
  if (req.sort && req.sortBy) {
    sort = {
      [req.sortBy]: req.sort,
    };
  }

  const [
    Postdata,
    Posttotal,
    Reivewdata,
    ReviewTotal,
    shoutoutdata,
    shoutouttotal,
  ] = await Promise.all([
    Post.find(query)
      .sort(sort)
      .populate("from to images like")
      .limit(parseInt(req.limit, 10))
      .skip(parseInt(req.offset, 10)),
    Post.countDocuments(query),
    Review.find(query)
      .sort(sort)
      .populate("like images")
      .limit(parseInt(req.limit, 10))
      .skip(parseInt(req.offset, 10)),
    Review.countDocuments(query),
    Shoutout.find(query)
      .sort(sort)
      .limit(parseInt(req.limit, 10))
      .skip(parseInt(req.offset, 10)),
    Shoutout.countDocuments(query),
  ]);

  return {
    Postdata,
    Posttotal,
    Reivewdata,
    ReviewTotal,
    shoutoutdata,
    shoutouttotal,
  };
};

const getActivitiesById = (query) => {
  switch (query.type) {
    case "Post":
      return Post.findById(query.id);
    case "Review":
      return Review.findById(query.id);
    case "Shoutout":
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
    user.name = [user.firstName || "", user.lastName || ""].join(" ").trim();
  }

  if (data.email && data.email.toLowerCase() !== user.email.toLowerCase()) {
    const emailCheck = await User.countDocuments({
      email: data.email.toLowerCase(),
      _id: {
        $ne: user._id,
      },
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
      _id: { $ne: user._id },
    });
    if (usernameCheck) {
      throw new ApiError(httpStatus.NOT_FOUND, "UserName is already taken");
    }
  }

  await User.updateOne({ _id: id }, data, { new: true });
};

const searchPartner = async (reqQuery) => {
  reqQuery?.status ? reqQuery.status : (reqQuery.status = "all");

  const pipeline = [];
  let query = {};

  if (reqQuery.q) {
    const regexp = new RegExp(
      reqQuery.q.toLowerCase().replace(/[^a-zA-Z0-9]/g, ""),
      "i"
    );

    query.$or = [
      {
        username: { $regex: regexp },
      },
      {
        email: { $regex: regexp },
      },
    ];
  }

  query.role = ROLE_PARTNER;
  query.status =
    reqQuery.status === "all" || undefined || null || ""
      ? { $in: [STATUS_ACTIVE, STATUS_INACTIVE] }
      : reqQuery.status;

  pipeline.push({
    $match: query,
  });

  if (reqQuery.sort && reqQuery.sortBy) {
    pipeline.push({
      $sort: {
        [reqQuery.sortBy]: reqQuery.sort === "desc" ? -1 : 1,
      },
    });
  }

  const [data, total] = await Promise.all([
    User.aggregate([
      ...pipeline,
      {
        $lookup: {
          from: "locations",
          localField: "_id",
          foreignField: "partner",
          as: "locations",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: "$category",
      },
      {
        $lookup: {
          from: "settings",
          localField: "_id",
          foreignField: "user",
          as: "externalUsers",
          pipeline: [
            {
              $match: {
                key: "user:additionalUser",
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$externalUsers",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          locationCount: {
            $size: "$locations",
          },
        },
      },
      {
        $project: {
          locations: 0,
          userSettings: 0,
        },
      },
      {
        $skip: parseInt(reqQuery.offset, 10),
      },
      {
        $limit: parseInt(reqQuery.limit, 10),
      },
    ]),
    User.countDocuments(query),
  ]);

  return {
    data,
    total,
  };
};

const getUserByID = (id) => {
  return User.findById(id).populate("profile.avatar");
};

const getLocationByID = (id) => {
  return Location.findById(id).populate();
};

const getUserByIDForAvatar = (id) => {
  return User.findById(id);
};

module.exports = {
  searchUser,
  userUpdate,
  searchLocation,
  getLocationByID,
  getUserByIDForAvatar,
  searchActivities,
  getActivitiesById,
  deleteActivitiesById,
  searchPartner,
  getUserByID,
};
