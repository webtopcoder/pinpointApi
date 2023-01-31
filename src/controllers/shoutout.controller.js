const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const ApiError = require("@utils/ApiError");
const { shoutoutService } = require("@services");
const pick = require("../utils/pick");
const createShoutout = catchAsync(async (req, res) => {
  const data = {
    from: req.user._id,
    to: req.params.to_userid,
    content: req.body,
  };
  const shoutout = await shoutoutService.createShoutout(data);
  res.status(httpStatus.CREATED).send({ success: true, shoutout });
});

const getOwnShoutouts = catchAsync(async (req, res) => {
  let filter = pick(req.query, ["q"]);
  let options = pick(req.query, ["sort", "limit", "page"]);
  if (options.sort) {
    options.sort = Object.fromEntries(
      options.sort.split(",").map((field) => field.split(":"))
    );
  } else {
    options.sort = "-createdAt";
  }
  filter.to = req.user._id;
  filter.to_is_deleted = false;

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
      path: "from",
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
const getSentShoutouts = catchAsync(async (req, res) => {
  let filter = pick(req.query, ["q"]);
  let options = pick(req.query, ["sort", "limit", "page"]);
  if (options.sort) {
    options.sort = Object.fromEntries(
      options.sort.split(",").map((field) => field.split(":"))
    );
  } else {
    options.sort = "-createdAt";
  }
  filter.from = req.user._id;
  filter.from_is_deleted = false;

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
      path: "from",
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
      path: "from",
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

const updateShoutout = catchAsync(async (req, res) => {
  const { shoutoutid } = req.params;
  const shoutout = await shoutoutService.getShoutoutById(shoutoutid);
  if (!shoutout) {
    throw new ApiError(httpStatus.NOT_FOUND, "Shoutout not found");
  }

  const data = req.body.content;

  await shoutoutService.updateShoutoutById(shoutoutid, data);
  res.send(shoutout);
});
const deleteShoutout = catchAsync(async (req, res) => {
  const { shoutoutId } = req.params;
  const userId = req.user._id;
  let shoutout = await shoutoutService.getShoutoutById(shoutoutId);

  if (!shoutout || (shoutout.to !== userId && shoutout.from !== userId)) {
    console.log({
      shoutout,
      userId,
    });
    throw new ApiError(httpStatus.NOT_FOUND, "Shoutout not found");
  }

  if (shoutout.to === userId) {
    await shoutoutService.updateShoutoutById(shoutoutId, {
      to_is_deleted: true,
    });
  }

  if (shoutout.from === userId) {
    await shoutoutService.updateShoutoutById(shoutoutId, {
      from_is_deleted: true,
    });
  }

  res.send({ success: true, message: "Deleted successfully!" });
});

module.exports = {
  createShoutout,
  getOwnShoutouts,
  getShoutoutsByUserId,
  getSentShoutouts,
  updateShoutout,
  deleteShoutout,
};
