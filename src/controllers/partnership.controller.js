const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const ApiError = require("@utils/ApiError");
const { partnershipService } = require("@services");
const pick = require("../utils/pick");

const getPartnerships = catchAsync(async (req, res) => {
  let filter = pick(req.query, ["q"]);
  let options = pick(req.query, ["sort", "limit", "page"]);
  if (options.sort) {
    options.sort = Object.fromEntries(
      options.sort.split(",").map((field) => field.split(":"))
    );
  } else {
    options.sort = "-createdAt";
  }

  const partnership = await partnershipService.queryPartnerships(
    filter,
    options
  );
  if (!partnership) {
    throw new ApiError(httpStatus.NOT_FOUND, "Partnership not found");
  }
  res.send(partnership);
});

const getPartnershipById = catchAsync(async (req, res) => {
  const partnership = await partnershipService.getPartnershipById(
    req.params.id
  );
  if (!partnership) {
    throw new ApiError(httpStatus.NOT_FOUND, "Partnership not found");
  }
  res.send(partnership);
});
module.exports = {
  getPartnerships,
  getPartnershipById,
};
