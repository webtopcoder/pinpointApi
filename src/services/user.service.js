const httpStatus = require("http-status"),
  {
    User,
    Admin,
    Post,
    Media,
    Like,
    Shoutout,
    Location,
    Arrival,
    Emailing,
    Comment
  } = require("../models"),
  ApiError = require("../utils/ApiError"),
  customLabels = require("../utils/customLabels"),
  defaultSort = require("../utils/defaultSort"),
  mediaService = require("./media.service");
const { ObjectId } = require("bson");
// const { events, EventEmitter } = require("@events");
/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }

  if (await User.usernameTaken(userBody.username)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User Name already taken");
  }
  const user = await User.create(userBody);

  await Emailing.updateOne({ email: user.email },
    {
      $set: {
        status: true
      }
    })
  return user;
};

const createComment = async (commentBody) => {

  const comment = await Comment.create(commentBody);

  const result = await Comment.findById(comment.id).populate({
    path: "userId",
    populate: { path: "profile.avatar" },
  })

  return result;
};

const deleteComment = async (id) => {

  const result = await Comment.findById(id);
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  await result.delete();
  return result;
};



const getDefaultAvatar = async () => {
  const defaultAvatar = await Media.findOne({ mimetype: "default" });
  if (defaultAvatar) {
    return defaultAvatar.id;
  } else {
    const file = {
      path: "default.png",
      mimetype: "default",
      size: 0,
    };
    const newAvatar = await mediaService.uploadMedia(
      file,
      "63d1b714d4ae07b0bf2b0c63",
    );
    return newAvatar.id;
  }
};

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format:
 *     sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default
 *     = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryUsers = async (filter, options) => {
  const users = await User.paginate(filter, {
    customLabels,
    sort: defaultSort,
    ...options,
  });
  return users;
};

const getUserById = async (userId) => {
  const user = await User.findById(userId).populate("profile.avatar").populate("category");
  return user;
};

/**
 * Check user
 * @param {string} fieldName
 * @param {string} fieldValue
 * @returns {Promise<User>}
 */
const checkUser = (fieldName, fieldValue) => {
  return User.findOne({
    [fieldName]: fieldValue,
  }).select("email name phone");
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
const getUserByEmail = (email) => {
  return User.findOne({ email }).populate("profile.avatar");
};

const getAdminByEmail = (email) => {
  return User.findOne({ email }).select(
    "_id firstName lastName username email password",
  );
};

const getAdminByID = (id) => {
  return Admin.findOne({ _id: id });
};

const getUserByUsername = (username) => {
  return User.findOne({ username }).populate("profile.avatar");
};

const getadmin = () => {
  return User.findOne({ role: "admin" });
};

const getActivePartners = async (status) => {
  const result = await User.find({
    role: "partner",
    status: status,
  })
    .populate([
      {
        path: "category",
        populate: {
          path: "image",
        },
      },
    ])
    .select("address category");

  return result;
};

const getAllComments = async (typeId) => {
  const result = await Comment.find({ typeId: typeId }).sort({ ['createdAt']: 'desc' })
    .populate({
      path: "userId",
      populate: { path: "profile.avatar" },
    })
    .populate("like")

  return result;
};

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }

  Object.assign(user, updateBody);
  await user.save();
  return user;
};

/**
 * Delete user by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  await user.delete();
  return user;
};

const getUserActivity = async (userId, { page, search }) => {
  let postAndFollows = await User.aggregate([
    {
      $match: {
        _id: new ObjectId(userId.toString()),
      },
    },
    {
      $lookup: {
        from: Media.collection.name,
        localField: "profile.avatar",
        foreignField: "_id",
        as: "profile.avatar",
      },
    },
    {
      $unwind: "$profile.avatar",
    },
    {
      $lookup: {
        from: "posts",
        let: { userId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  { $eq: ["$from", "$$userId"] },
                  { $eq: ["$to", "$$userId"] },
                ],
              },
              status: "active",
            },
          },
          {
            $lookup: {
              from: Like.collection.name,
              localField: "like",
              foreignField: "_id",
              as: "like",
            },
          },
          {
            $unwind: "$like",
          },
          {
            $lookup: {
              from: Comment.collection.name,
              let: { postId: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ["$typeId", "$$postId"] },
                  },
                },
                {
                  $count: "commentCount",
                },
              ],
              as: "commentCount",
            },
          },
          {
            $addFields: {
              commentCount: { $arrayElemAt: ["$commentCount.commentCount", 0] },
            },
          },
          {
            $lookup: {
              from: Media.collection.name,
              localField: "images",
              foreignField: "_id",
              as: "images",
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "from",
              foreignField: "_id",
              pipeline: [
                {
                  $lookup: {
                    from: Media.collection.name,
                    localField: "profile.avatar",
                    foreignField: "_id",
                    as: "profile.avatar",
                  },
                },
                {
                  $unwind: "$profile.avatar",
                },
              ],
              as: "from",
            },
          },
          {
            $unwind: "$from",
          },
          {
            $lookup: {
              from: "users",
              localField: "to",
              foreignField: "_id",
              pipeline: [
                {
                  $lookup: {
                    from: Media.collection.name,
                    localField: "profile.avatar",
                    foreignField: "_id",
                    as: "profile.avatar",
                  },
                },
                {
                  $unwind: "$profile.avatar",
                },
              ],
              as: "to",
            },
          },
          {
            $unwind: "$to",
          },
          {
            $project: {
              from_user: {
                username: "$from.username",
                businessname: "$from.businessname",
                avatar: "$from.profile.avatar",
                firstname: "$from.firstName",
                lastname: "$from.lastName",
                _id: "$from._id",
              },
              comment: "$commentCount",
              to_user: {
                username: "$to.username",
                businessname: "$from.businessname",
                firstname: "$from.firstName",
                lastname: "$from.lastName",
                avatar: "$to.profile.avatar",
                _id: "$to._id",
              },
              content: "$content",
              image: "$images",
              like: "$like",
              shortlist: "$shoutlist",
              createdAt: "$createdAt",
              updatedAt: "$updatedAt",
              type: "post",
            },
          },
          {
            $match: {
              $or: [
                { "from.username": new RegExp(search, "i") },
                { "to.username": new RegExp(search, "i") },
                { content: new RegExp(search, "i") },
              ],
            },
          },
          {
            $sort: { updatedAt: -1 },
          },
        ],
        as: "posts",
      },
    },
    {
      $lookup: {
        from: "follows",
        let: { userId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  { $eq: ["$follower", "$$userId"] },
                  { $eq: ["$following", "$$userId"] },
                ],
              },
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "follower",
              foreignField: "_id",
              pipeline: [
                {
                  $lookup: {
                    from: Media.collection.name,
                    localField: "profile.avatar",
                    foreignField: "_id",
                    as: "profile.avatar",
                  },
                },
                {
                  $unwind: "$profile.avatar",
                },
              ],
              as: "follower",
            },
          },
          {
            $unwind: "$follower",
          },
          {
            $lookup: {
              from: "users",
              localField: "following",
              foreignField: "_id",
              pipeline: [
                {
                  $lookup: {
                    from: Media.collection.name,
                    localField: "profile.avatar",
                    foreignField: "_id",
                    as: "profile.avatar",
                  },
                },
                {
                  $unwind: "$profile.avatar",
                },
              ],
              as: "following",
            },
          },
          {
            $unwind: "$following",
          },
          {
            $project: {
              follower: {
                username: "$follower.username",
                businessname: "$follower.businessname",
                firstname: "$follower.firstName",
                lastname: "$follower.lastName",
                avatar: "$follower.profile.avatar",
                _id: "$follower._id",
              },
              following: {
                username: "$following.username",
                businessname: "$following.businessname",
                firstname: "$following.firstName",
                lastname: "$following.lastName",
                avatar: "$following.profile.avatar",
                _id: "$following._id",
              },
              createdAt: "$createdAt",
              updatedAt: "$updatedAt",
              type: "follow",
            },
          },
          {
            $sort: { updatedAt: -1 },
          },
        ],
        as: "follows",
      },
    },
    {
      $project: {
        posts: 1,
        follows: 1,
      },
    },
  ]);

  let image = await Post.aggregate([
    {
      $match: {
        $or: [
          {
            to: new ObjectId(userId),
          },
          {
            from: new ObjectId(userId),
          },
        ],
      },
    },
    {
      $lookup: {
        from: Media.collection.name,
        localField: "images",
        foreignField: "_id",
        as: "images",
      },
    },
    {
      $project: {
        image: "$images",
      },
    },
    {
      $unwind: "$image",
    },
    {
      $group: {
        _id: "",
        image: {
          $push: "$image",
        },
      },
    },
    {
      $unwind: "$image",
    },
    {
      $limit: 8,
    },
    {
      $group: {
        _id: "",
        image: {
          $push: "$image",
        },
      },
    },
  ]);

  const images = image.length > 0 ? image[0].image : [];
  const postAndFollowsOfCurrentUser =
    postAndFollows.length > 0 ? postAndFollows[0] : null;

  if (!postAndFollowsOfCurrentUser)
    return {
      post: [],
      images,
    };

  const post = postAndFollowsOfCurrentUser.posts.concat(
    postAndFollowsOfCurrentUser.follows,
  );

  post.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  const limitedPost = post.splice((parseInt(page) - 1) * 5, 5);

  return {
    post: limitedPost,
    images,
  };
};

const getPostImages = async (userId, options) => {
  const imagesInPost = await Post.aggregate([
    {
      $match: {
        $or: [
          {
            to: new ObjectId(userId),
          },
          {
            from: new ObjectId(userId),
          },
        ],
      },
    },
    {
      $lookup: {
        from: Media.collection.name,
        localField: "images",
        foreignField: "_id",
        as: "images",
        pipeline: [
          {
            $match: {
              status: 'active',
              mimetype: 'image/jpeg' || 'image/jpg' || 'image/png'
            },
          },
        ],
      },
    },
    {
      $project: {
        content: 1,
        createdAt: 1,
        status: 1,
        filepath: "$images.filepath",
      },
    },
    {
      $unwind: "$filepath",
    },
    {
      $sort: { createdAt: -1 },
    },
  ]);
  const newArray = imagesInPost.map(item => {
    return { ...item, type: "Post" };
  });
  return newArray;
};

const getShoutImages = async (userId, options) => {
  const imagesInShout = await Shoutout.aggregate([
    {
      $match: { to: new ObjectId(userId) },
    },
    {
      $lookup: {
        from: "posts",
        localField: "post",
        foreignField: "_id",
        as: "shout",
        pipeline: [
          {
            $lookup: {
              from: Media.collection.name,
              localField: "images",
              foreignField: "_id",
              as: "images",
              pipeline: [
                {
                  $match: {
                    status: 'active',
                    mimetype: 'image/jpeg' || 'image/jpg' || 'image/png'
                  },
                },
              ],
            },
          },
          {
            $project: {
              content: 1,
              createdAt: 1,
              status: 1,
              filepath: "$images.filepath",
            },
          },
          {
            $unwind: "$filepath",
          },
          {
            $sort: { updatedAt: -1 },
          },
        ],
      },
    },
    {
      $project: {
        content: "$shout.content",
        createdAt: "$shout.createdAt",
        filepath: "$shout.filepath",
        status: "$shout.status",
      },
    },
    {
      $unwind: "$content",
    },
    {
      $unwind: "$createdAt",
    },
    {
      $unwind: "$filepath",
    },
    {
      $unwind: "$status",
    },
    {
      $sort: { createdAt: -1 },
    },
  ]);
  const newArray = imagesInShout.map(item => {
    return { ...item, type: "Shout out" };
  });
  return newArray;
};

const getFavoriteLocations = async (userId) => {
  let arr = [];
  var locations = await User.findById(userId).populate({
    path: "favoriteLocations",
    populate: [
      {
        path: "images",
      },
      {
        path: "reviews",
      },
    ],
  });

  for (let key = 0; key < locations.favoriteLocations.length; key++) {
    let item = locations.favoriteLocations[key]._doc;
    const reviewlikeCount = await Location.aggregate([
      {
        $match: {
          _id: item._id,
        },
      },
      {
        $lookup: {
          from: "reviews",
          localField: "reviews",
          foreignField: "_id",
          pipeline: [
            {
              $lookup: {
                from: Like.collection.name,
                localField: "like",
                foreignField: "_id",
                as: "like",
              },
            },
            {
              $unwind: "$like",
            },
            {
              $group: {
                _id: null,
                total: { $sum: "$like.count" },
              },
            },
          ],
          as: "reviews",
        },
      },
      {
        $unwind: "$reviews",
      },
      {
        $project: {
          total: "$reviews.total",
        },
      },
    ]);

    const arrivallikeCount = await Arrival.aggregate([
      {
        $match: {
          location: item._id,
        },
      },
      {
        $lookup: {
          from: "likes",
          localField: "like",
          foreignField: "_id",
          as: "likescount",
        },
      },
      {
        $unwind: "$likescount",
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$likescount.count" },
        },
      },
    ]);

    if (!reviewlikeCount.length > 0)
      reviewlikeCount.push({
        total: 0,
      });

    if (!arrivallikeCount.length > 0)
      arrivallikeCount.push({
        total: 0,
      });

    const totalLike = arrivallikeCount[0].total + reviewlikeCount[0].total;
    item = { ...item, totalLike };
    arr.push(item);
  }

  return arr;
};

const getUserByStripeCustomerId = async (stripeCustomerId) => {
  return User.findOne({ stripeCustomerId });
};

module.exports = {
  createUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  getAdminByID,
  getadmin,
  getAdminByEmail,
  updateUserById,
  deleteUserById,
  checkUser,
  getUserActivity,
  getUserByUsername,
  getPostImages,
  getShoutImages,
  getFavoriteLocations,
  getActivePartners,
  getDefaultAvatar,
  getUserByStripeCustomerId,
  getAllComments,
  createComment,
  deleteComment
};
