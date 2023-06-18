const httpStatus = require("http-status"),
  {
    User,
    Review,
    Post,
    Shoutout,
    Location,
    Transaction,
    Media,
  } = require("../models"),
  {
    STATUS_ACTIVE,
    STATUS_INACTIVE,
    STATUS_PENDING,
    STATUS_DELETED,
    STATUS_DECLINED,
    ROLE_USER,
    ROLE_PARTNER,
    ROLE_EVENTHOST,
    ISTRUE,
  } = require("../config/constants"),
  moment = require("moment"),
  customLabels = require("../utils/customLabels"),
  defaultSort = require("../utils/defaultSort"),
  ApiError = require("../utils/ApiError");
const userService = require("./user.service");
const mediaService = require("./media.service");
const { query } = require("express");
const mongoose = require("mongoose-fill");

const getAllUsers = async () => {

  const [data, total] = await Promise.all([
    User.find({
      status: 'active', role: {
        $ne: 'admin',
      },
    }).select('_id username name role'),
    User.countDocuments(),
  ]);

  return {
    data,
    total,
  };
};

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
  { yearBack = 1, monthBack = 1, weekBack = 1, address = "" }
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
          $or: [
            {
              "address.city": { $regex: address, $options: "i" },
            },
            {
              "address.state": { $regex: address, $options: "i" },
            },
          ],
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
          $or: [
            {
              "address.city": { $regex: address, $options: "i" },
            },
            {
              "address.state": { $regex: address, $options: "i" },
            },
          ],
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
          $or: [
            {
              "address.city": { $regex: address, $options: "i" },
            },
            {
              "address.state": { $regex: address, $options: "i" },
            },
          ],
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
        username: { $regex: reqQuery.q },
      },
      {
        firstName: { $regex: reqQuery.q },
      },
      {
        lastName: { $regex: reqQuery.q },
      },
      {
        email: { $regex: reqQuery.q },
      },
      {
        "address.city": { $regex: reqQuery.q, $options: "i" },
      },
      {
        "address.state": { $regex: reqQuery.q, $options: "i" },

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
    address: reqQuery.address,
  });

  return { data, total, topCities, userStats };
};

const searchRevenue = async (reqQuery) => {
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

  req.subCategory ? query.subCategories = req.subCategory : '';
  req.isActive ? query.isActive = req.isActive : '';

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
      return Post.findById(query.id).populate("from to images");
    case "Review":
      return Review.findById(query.id).populate("user location images");
    case "Shoutout":
      return Shoutout.findOne({
        $or: [{ _id: query.id }, { post: query.id }],
      }).populate([
        "from",
        "to",
        {
          path: "post",
          populate: "images",
        },
      ]);
    case "Media":
      return Media.findById({ id: query.id, status: "active" }).populate(
        "user"
      );
  }
};

const getUpdateActivityById = (query) => {
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

const removeActivitiesById = async (query) => {
  const activities = await getActivitiesById(query);
  if (!activities) {
    throw new ApiError(httpStatus.NOT_FOUND, "activities not found");
  }
  await activities.delete();
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

const ActivityUpdate = async (id, type, updateBody) => {
  const Activity = await getUpdateActivityById({ id: id, type: type });

  if (!Activity) {
    throw new ApiError(httpStatus.NOT_FOUND, "Activity not found");
  }
  Object.assign(Activity, updateBody);
  await Activity.save();

  if (type === "Shoutout") {
    const sub_Activity = await getUpdateActivityById({
      id: Activity.post.toString(),
      type: "Post",
    });
    Object.assign(sub_Activity, updateBody);
    await sub_Activity.save();
  }
  return Activity;
};

const searchPartner = async (reqQuery) => {
  reqQuery?.status ? reqQuery.status : (reqQuery.status = "all");

  const pipeline = [];
  let query = {};

  if (reqQuery.q) {
    // const regexp = new RegExp(
    //   reqQuery.q.toLowerCase().replace(/[^a-zA-Z0-9]/g, ""),
    //   "i"
    // );

    query.$or = [
      {
        username: { $regex: reqQuery.q },
      },
      {
        firstName: { $regex: reqQuery.q },
      },
      {
        lastName: { $regex: reqQuery.q },
      },
      {
        email: { $regex: reqQuery.q },
      },
      {
        "address.city": { $regex: reqQuery.q, $options: "i" },
      },
      {
        "address.state": { $regex: reqQuery.q, $options: "i" },
      },
    ];
  }

  query.role = ROLE_PARTNER;
  query.status =
    reqQuery.status === "all" || undefined || null || ""
      ? {
        $in: [
          STATUS_ACTIVE,
          STATUS_INACTIVE,
          STATUS_DECLINED,
          STATUS_PENDING,
          STATUS_DELETED,
        ],
      }
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
        $unwind: {
          path: "$category",
          preserveNullAndEmptyArrays: true,
        },
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

  const topCities = await getTopCities({
    role: ROLE_PARTNER,
  });
  const userStats = await getUserStats(ROLE_PARTNER, {
    yearBack: reqQuery.yearBack ?? 5,
    monthBack: reqQuery.monthBack ?? 5,
    weekBack: reqQuery.weekBack ?? 5,
    address: reqQuery.address ?? "",
  });

  return {
    data,
    total,
    topCities,
    userStats,
  };
};


const searchEventhost = async (reqQuery) => {
  reqQuery?.status ? reqQuery.status : (reqQuery.status = "all");

  const pipeline = [];
  let query = {};

  if (reqQuery.q) {
    // const regexp = new RegExp(
    //   reqQuery.q.toLowerCase().replace(/[^a-zA-Z0-9]/g, ""),
    //   "i"
    // );

    query.$or = [
      {
        username: { $regex: reqQuery.q },
      },
      {
        firstName: { $regex: reqQuery.q },
      },
      {
        lastName: { $regex: reqQuery.q },
      },
      {
        email: { $regex: reqQuery.q },
      },
      {
        "address.city": { $regex: reqQuery.q, $options: "i" },
      },
      {
        "address.state": { $regex: reqQuery.q, $options: "i" },
      },
    ];
  }

  query.role = ROLE_EVENTHOST;
  query.status =
    reqQuery.status === "all" || undefined || null || ""
      ? {
        $in: [
          STATUS_ACTIVE,
          STATUS_INACTIVE,
          STATUS_DECLINED,
          STATUS_PENDING,
          STATUS_DELETED,
        ],
      }
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

  const topCities = await getTopCities({
    role: ROLE_PARTNER,
  });
  const userStats = await getUserStats(ROLE_PARTNER, {
    yearBack: reqQuery.yearBack ?? 5,
    monthBack: reqQuery.monthBack ?? 5,
    weekBack: reqQuery.weekBack ?? 5,
    address: reqQuery.address ?? "",
  });

  return {
    data,
    total,
    topCities,
    userStats,
  };
};

const getMonthlyRevenue = ({
  start = new Date(new Date().getFullYear(), 0, 1),
  end = new Date(new Date().getFullYear(), 11, 31),
}) => {
  return Transaction.aggregate([
    {
      $match: {
        createdAt: {
          $gte: start,
          $lte: end,
        },
        status: "completed",
      },
    },
    {
      $group: {
        _id: "$status",
        total: { $sum: "$amount" },
      },
    },
  ]);
};

const getYearlyRevenue = ({
  start = new Date(new Date().getFullYear(), 0, 1),
  end = new Date(new Date().getFullYear(), 11, 31),
}) => {
  return Transaction.aggregate([
    {
      $match: {
        createdAt: {
          $gte: start,
          $lte: end,
        },
        status: "completed",
      },
    },
    {
      $group: {
        _id: "$status",
        total: { $sum: "$amount" },
      },
    },
  ]);
};

const getLatestTransactions = (filter, options) => {
  return Transaction.paginate(filter, {
    customLabels,
    sort: defaultSort,
    ...options,
  });
};

const getLatestActivities = async (req) => {
  req?.status ? req.status : (req.status = "all");

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
    ];
  }

  let sort = {};
  if (req.sort && req.sortBy) {
    sort = {
      [req.sortBy]: req.sort,
    };
  }

  query.status =
    req.status === "all" || undefined || null || ""
      ? { $in: [STATUS_DELETED, STATUS_ACTIVE] }
      : req.status;

  switch (req.type) {
    case "Post":
      return {
        data: await Post.find(query)
          .sort(sort)
          .skip(req.limit * (req.page - 1))
          .limit(req.limit)
          .populate("from to like images"),
        total: await Post.countDocuments(query),
      };
    case "Review":
      return {
        data: await Review.find({})
          .sort(sort)
          .skip(req.limit * (req.page - 1))
          .limit(req.limit)
          .populate("like images user location"),
        total: await Review.countDocuments({}),
      };
    case "Shoutout":
      return {
        data: await Shoutout.find({})
          .sort(sort)
          .skip(req.limit * (req.page - 1))
          .limit(req.limit)
          .populate("from to post post.like post.images"),
        total: await Shoutout.countDocuments({}),
      };
    case "Media":
      return {
        data: await Media.find({ status: "active" })
          .sort(sort)
          .skip(req.limit * (req.page - 1))
          .limit(req.limit)
          .populate("user"),
        total: await Media.countDocuments({}),
      };
    default:
      return {
        data: [],
        total: 0,
      };
  }
};

const getAdminById = async (id) => {
  return User.findById(id);
};

const deleteUserByID = async (user_id) => {
  const user = await userService.getUserById(user_id);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  await user.delete();
  return user;
};

const deletePermantlyActivitiesById = async (id) => {
  const acitvity = await Post.findById(id);
  if (!acitvity) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  await acitvity.delete();
  return acitvity;
};

const bulkDelete = async (selectedIds, flag, status) => {
  const objectMailIds = selectedIds.map((id) => mongoose.Types.ObjectId(id));
  const data = {
    status: status,
  };
  switch (flag) {
    case "Post":
      objectMailIds.map(async activitiID => {
        await deleteActivitiesById({ id: activitiID, type: flag }, data)
      });
      break;
    case "Review":
      objectMailIds.map(async activitiID => {
        await deleteActivitiesById({ id: activitiID, type: flag }, data)
      });
      break;
    case "Shoutout":
      objectMailIds.map(async activitiID => {
        await deleteActivitiesById({ id: activitiID, type: flag }, data)
      });
      break;
    case "Media":
      objectMailIds.map(async activitiID => {
        await mediaService.deleteMediaById(activitiID)
      });
      break;
  }
};

const bulkRemove = async (selectedIds, flag, status) => {
  const objectMailIds = selectedIds.map((id) => mongoose.Types.ObjectId(id));
  const data = {
    status: status,
  };
  switch (flag) {
    case "Post":
      objectMailIds.map(async activitiID => {
        await removeActivitiesById({ id: activitiID, type: flag })
      });
      break;
    case "Review":
      objectMailIds.map(async activitiID => {
        await removeActivitiesById({ id: activitiID, type: flag })
      });
      break;
    case "Shoutout":
      objectMailIds.map(async activitiID => {
        await removeActivitiesById({ id: activitiID, type: flag })
      });
      break;
    case "Media":
      objectMailIds.map(async activitiID => {
        await mediaService.deleteMediaById(activitiID)
      });
      break;
  }
};

module.exports = {
  getAllUsers,
  getAdminById,
  searchUser,
  userUpdate,
  searchLocation,
  searchActivities,
  getActivitiesById,
  deleteActivitiesById,
  removeActivitiesById,
  searchPartner,
  searchRevenue,
  getMonthlyRevenue,
  getYearlyRevenue,
  getLatestTransactions,
  getLatestActivities,
  deleteUserByID,
  getUpdateActivityById,
  ActivityUpdate,
  bulkDelete,
  bulkRemove,
  deletePermantlyActivitiesById,
  searchEventhost
};
