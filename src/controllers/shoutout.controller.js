const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const ApiError = require("@utils/ApiError");
const { shoutoutService, userService } = require("@services");
const pick = require("../utils/pick");
const createShoutout = catchAsync(async (req, res) => {
  const to_user = await userService.getUserByUsername(req.params.to_username);
  if (!to_user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  } else {
    const to_userid = to_user._id;
    const data = {
      from: req.user._id,
      to: to_userid,
      content: req.body.content,
    };
    const shoutout = await shoutoutService.createShoutout(data);
    res.status(httpStatus.CREATED).send({ success: true, shoutout });
  }
});

const getShoutoutsByUserId = catchAsync(async (req, res) => {
  let filter = pick(req.query, ["q"]);
  let options = pick(req.query, ["sort", "limit", "page"]);
  if (options.sort) {
    options.sort = Object.fromEntries(
      options.sort.split(",").map((field) => field.split(":"))
    );
  } else {
    options.sort = "-createdAt";
  }
  filter.to = req.params.userid;
  options.populate = [
    "from",
    "to",
    {
      path: "from",
      populate: {
        path: "profile",
        populate: {
          path: "avatar",
        },
      },
    },
    {
      path: "to",
      populate: {
        path: "profile",
        populate: {
          path: "avatar",
        },
      },
    },
  ];

  const shoutout = await shoutoutService.queryShoutouts(filter, options);
  if (!shoutout) {
    throw new ApiError(httpStatus.NOT_FOUND, "Shoutout not found");
  }
  res.send(shoutout);
});

const deleteShoutout = catchAsync(async (req, res) => {
  const { shoutoutid } = req.params;
  const userId = req.user._id;
  const shoutout = await shoutoutService.getShoutoutById(shoutoutid);
  if (!shoutout || shoutout.from != userId) {
    throw new ApiError(httpStatus.NOT_FOUND, "Shoutout not found");
  }

  if (shoutout.from == userId) {
    await shoutoutService.deleteShoutoutById(shoutoutid);
  }

  res.send({ success: true, message: "Deleted successfully!" });
});

module.exports = {
  createShoutout,
  getShoutoutsByUserId,
  deleteShoutout,
};
