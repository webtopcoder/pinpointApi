const httpStatus = require("http-status"),
  { User, Post, Media, Like } = require("../models"),
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
const createUser = async (userBody) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }
  const user = await User.create(userBody);
  return user;
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

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getUserById = (id) => {
  return User.findById(id).populate("profile.avatar");
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
const getUserByUsername = (username) => {
  return User.findOne({ username }).populate("profile.avatar");
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
        _id: new ObjectId(userId),
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
              $expr: { $or: { from: "$$userId", to: "$$userId" } },
            },
          },
        ],
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
                avatar: "$from.profile.avatar",
                _id: "$from._id",
              },
              to_user: {
                username: "$to.username",
                avatar: "$to.profile.avatar",
                _id: "$to._id",
              },
              content: "$content",
              images: "$images",
              like: "$like",
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
              $expr: { $or: { follower: "$$userId", following: "$$userId" } },
            },
          },
        ],
        pipeline: [
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
                avatar: "$follower.profile.avatar",
                _id: "$follower._id",
              },
              following: {
                username: "$following.username",
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
    postAndFollowsOfCurrentUser.follows
  );

  post.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  const limitedPost = post.splice((parseInt(page) - 1) * 5, 5);

  return {
    post: limitedPost,
    images,
  };
};

module.exports = {
  createUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
  checkUser,
  getUserActivity,
  getUserByUsername,
};
