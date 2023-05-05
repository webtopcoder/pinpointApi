const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const ApiError = require("@utils/ApiError");
const {
  transactionService,
} = require("@services");

const getTransactionById = catchAsync(async (req, res) => {

  const { transactionID } = req.params;
  const result = await transactionService.getTransactionById(transactionID, "user");
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Transaction not found");
  }

  res.status(httpStatus.OK).send(result);
});

module.exports = {
  getTransactionById
};
