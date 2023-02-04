const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const { categoryService } = require("@services");

const getCategories = catchAsync(async (_, res) => {
  const categories = await categoryService.getCategories();
  res.status(httpStatus.OK).send({ success: true, categories });
});

const getAllSubCategories = catchAsync(async (_, res) => {
  const categories = await categoryService.getAllSubCategories();
  res.status(httpStatus.OK).send({ success: true, data: categories });
});

const getSubCategoryByCategoryId = catchAsync(async (req, res) => {
  const { categoryId } = req.params;
  const subCategories = await categoryService.getSubCategoryByCategoryId(
    categoryId
  );
  res.status(httpStatus.OK).send({ success: true, subCategories });
});

module.exports = {
  getCategories,
  getSubCategoryByCategoryId,
  getAllSubCategories,
};
