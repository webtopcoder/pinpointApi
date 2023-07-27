const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const ApiError = require("@utils/ApiError");
const { shoutoutService, userService } = require("@services");
const pick = require("../utils/pick");

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
  filter.status = 'active';
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
    {
      path: "post",
      populate: [
        {
          path: "images",
        },
        {
          path: "like",
        },
      ],
    },
  ];

  const shoutout = await shoutoutService.queryShoutouts(filter, options);
  if (!shoutout) {
    throw new ApiError(httpStatus.NOT_FOUND, "Shoutout not found");
  }
  res.send(shoutout);
});

module.exports = {
  getShoutoutsByUserId,
};
