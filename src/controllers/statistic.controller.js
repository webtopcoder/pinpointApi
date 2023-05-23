const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const {statisticService} = require("@services");

const getStats = catchAsync(async (req, res) => {
  let stats = await statisticService.stats();
  res.send({ success: true, data: stats });
});

module.exports = {
  getStats,
};
