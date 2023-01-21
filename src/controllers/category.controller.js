const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const { events, EventEmitter } = require("@events");
const ApiError = require("@utils/ApiError");
const { categoryService } = require("@services");

const getCategories = catchAsync(async (req, res) => {
  const categories = await categoryService.getCategories();
  res.status(httpStatus.OK).send(categories);
});

const getSubCategoryByCategoryId = catchAsync(async (req, res) => {
  const { categoryId } = req.params;
  const subCategory = await categoryService.getSubCategoryByCategoryId(
    categoryId
  );
  res.status(httpStatus.OK).send(subCategory);
});

module.exports = {
  getCategories,
  getSubCategoryByCategoryId,
};
