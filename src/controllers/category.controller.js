const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const { Category, SubCategory } = require("@models");
const { categoryService } = require("@services");

const getCategories = catchAsync(async (req, res) => {
  const categories = await categoryService.getCategories(req.query);
  res.status(httpStatus.OK).send({
    success: true,
    categories,
    total: await Category.countDocuments(),
  });
});

const getSubCategories = catchAsync(async (req, res) => {
  const subCategories = await categoryService.getSubCategories(req.query);
  res.status(httpStatus.OK).send({
    success: true,
    subCategories,
    total: await SubCategory.countDocuments(),
  });
});

const getSubCategoryByCategoryId = catchAsync(async (req, res) => {
  const { categoryId } = req.params;
  const subCategories = await categoryService.getSubCategoryByCategoryId(
    categoryId
  );
  res.status(httpStatus.OK).send({ success: true, subCategories });
});

const getSubCategoryById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const subCategory = await categoryService.getSubCategoryById(id);
  res.status(httpStatus.OK).send({ success: true, subCategory });
});

const getCategoryById = catchAsync(async (req, res) => {
  const { categoryId } = req.params;
  const category = await categoryService.getCategoryById(categoryId);
  res.status(httpStatus.OK).send({ success: true, category });
});

const createCategory = catchAsync(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  res.status(httpStatus.CREATED).send({ success: true, category });
});

const createSubCategory = catchAsync(async (req, res) => {
  const subCategory = await categoryService.createSubCategory(req.body);
  res.status(httpStatus.CREATED).send({ success: true, subCategory });
});

const updateCategory = catchAsync(async (req, res) => {
  const { categoryId } = req.params;
  const category = await categoryService.updateCategory(categoryId, req.body);
  res.status(httpStatus.OK).send({ success: true, category });
});

const updateSubCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const subCategory = await categoryService.updateSubCategory(id, req.body);
  res.status(httpStatus.OK).send({ success: true, subCategory });
});

const deleteCategory = catchAsync(async (req, res) => {
  const { categoryId } = req.params;
  await categoryService.deleteCategory(categoryId);
  res.status(httpStatus.NO_CONTENT).send({ success: true });
});

const deleteSubCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  await categoryService.deleteSubCategory(id);
  res.status(httpStatus.NO_CONTENT).send({ success: true });
});

module.exports = {
  getCategories,
  getSubCategories,
  getSubCategoryByCategoryId,
  getSubCategoryById,
  getCategoryById,
  createCategory,
  createSubCategory,
  updateCategory,
  updateSubCategory,
  deleteCategory,
  deleteSubCategory,
};
