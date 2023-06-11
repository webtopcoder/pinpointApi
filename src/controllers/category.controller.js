const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const { Category, SubCategory } = require("@models");
const { categoryService } = require("@services");
const { mediaService } = require("../services");

const getCategories = catchAsync(async (req, res) => {

  const allcategories = await categoryService.getAllCategories();
  res.status(httpStatus.OK).send({
    success: true,
    allcategories,
    total: await Category.countDocuments(),
  });
});

const getAllCategories = catchAsync(async (req, res) => {

  if (req.query.sort) {
    req.query.sort = Object.fromEntries(
      req.query.sort.split(",").map((field) => field.split(":"))
    );
  }
  const categories = await categoryService.getCategories(req.query);
  res.status(httpStatus.OK).send({
    success: true,
    categories,
    total: await Category.countDocuments(),
  });
});

const getSubCategoriesGroupedByCategories = catchAsync(async (req, res) => {
  const subCategories = await Category.aggregate([
    {
      $lookup: {
        from: "subcategories",
        localField: "_id",
        foreignField: "category",
        as: "subCategories",
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        subCategories: {
          _id: 1,
          name: 1,
        },
      },
    },
  ]);

  res.status(httpStatus.OK).send({
    success: true,
    subCategories,
  });
});

const getSubCategories = catchAsync(async (req, res) => {
  if (req.query.sort) {
    req.query.sort = Object.fromEntries(
      req.query.sort.split(",").map((field) => field.split(":"))
    );
  }

  const subCategories = await categoryService.getSubCategories(req.query);
  const total = (await categoryService.getSubCategoryByCategoryId(req.query.categoryId === undefined ? "all" : req.query.categoryId)).length

  res.status(httpStatus.OK).send({
    success: true,
    subCategories,
    total: total,
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
  if (req.file) {
    const media = await mediaService.uploadMedia(req.file, req.user._id, true);
    req.body.image = media._id;
  }
  const category = await categoryService.createCategory(req.body);
  res.status(httpStatus.CREATED).send({ success: true, category });
});

const createSubCategory = catchAsync(async (req, res) => {
  if (req.file) {
    const media = await mediaService.uploadMedia(req.file, req.user._id, true);
    req.body.image = media._id;
  }
  const subCategory = await categoryService.createSubCategory(req.body);
  res.status(httpStatus.CREATED).send({ success: true, subCategory });
});

const updateCategory = catchAsync(async (req, res) => {
  const { categoryId } = req.params;
  if (req.file) {
    const media = await mediaService.uploadMedia(req.file, req.user._id, true);
    req.body.image = media._id;
  }
  const category = await categoryService.updateCategory(categoryId, req.body);
  res.status(httpStatus.OK).send({ success: true, category });
});

const updateSubCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (req.file) {
    const media = await mediaService.uploadMedia(req.file, req.user._id, true);
    req.body.image = media._id;
  }
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
  getSubCategoriesGroupedByCategories,
  getAllCategories
};
