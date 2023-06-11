const httpStatus = require("http-status"),
  { Category, SubCategory, User } = require("@models"),
  ApiError = require("@utils/ApiError"),
  defaultSort = require("@utils/defaultSort");

/**
 * Get Categories
 * @returns {Promise<Category[]>}
 */
const getCategories = async (query) => {
  const categories = await Category.find()
    .sort(query.sort ?? defaultSort)
    .skip(((query.page ?? 1) - 1) * (query.limit ?? 10))
    .limit(query.limit ?? 10);
  if (!categories) {
    throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
  }
  return categories;
};

const getAllCategories = async (query) => {
  const categories = await Category.find();

  if (!categories) {
    throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
  }
  return categories;
};

const getSubCategories = async (query) => {
  const subCategories = await SubCategory.find({ category: query.categoryId && query.categoryId !== "all" ? query.categoryId : { $exists: true } })
    .sort(query.sort ?? defaultSort)
    .skip(((query.page ?? 1) - 1) * (query.limit ?? 10))
    .limit(query.limit ?? 10)
    .populate("category");
  if (!subCategories) {
    throw new ApiError(httpStatus.NOT_FOUND, "SubCategory not found");
  }
  return subCategories;
};

/**
 * Get Category by id
 * @param {ObjectId} ObjectId
 * @returns {Promise<Category>}
 * @throws {ApiError}
 */

const getCategoryById = async (id) => {
  const category = await Category.findById(id);
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
  }
  return category;
};

/**
 * Get subCategory of a category
 * @param {ObjectId} ObjectId
 * @returns {Promise<SubCategory[]>}
 * @throws {ApiError}
 */
const getSubCategoryByCategoryId = async (id) => {

  const subCategory = await SubCategory.find(id === "all" || "" ? {} : {
    category: id,
  });
  if (!subCategory) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "SubCategory of requested category not found"
    );
  }
  return subCategory;
};

const getCategoryByName = async (name) => {
  const category = await Category.findOne({
    name,
  });
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
  }
  return category;
};

const getSubCategoryByName = async (name, categoryId) => {
  const subCategory = await SubCategory.findOne({
    name,
    category: categoryId ? categoryId : { $exists: true },
  });
  if (!subCategory) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "SubCategory of requested category not found"
    );
  }
  return subCategory;
};

const getPartnersByCategory = async (id) => {
  const partners = await User.find({
    category: id,
  }).select("_id");

  return partners;
};

const getSubcategoriesByCategoryID = async (id) => {
  const subcategories = await SubCategory.find({
    category: id,
  }).select("_id");

  return subcategories;
};

const getSubCategoryById = async (id) => {
  const subCategory = await SubCategory.findById(id);
  if (!subCategory) {
    throw new ApiError(httpStatus.NOT_FOUND, "SubCategory not found");
  }
  return subCategory;
};

const createCategory = async (categoryBody) => {
  const category = await Category.create(categoryBody);
  return category;
};

const createSubCategory = async (subCategoryBody) => {
  const subCategory = await SubCategory.create(subCategoryBody);
  return subCategory;
};

const updateCategory = async (id, updateBody) => {
  const category = await getCategoryById(id);
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
  }
  Object.assign(category, updateBody);
  await category.save();
  return category;
};

const updateSubCategory = async (id, updateBody) => {
  const subCategory = await getSubCategoryById(id);
  if (!subCategory) {
    throw new ApiError(httpStatus.NOT_FOUND, "SubCategory not found");
  }
  Object.assign(subCategory, updateBody);
  await subCategory.save();
  return subCategory;
};

const deleteCategory = async (id) => {
  const category = await getCategoryById(id);
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
  }
  await category.delete();
  return category;
};

const deleteSubCategory = async (id) => {
  const subCategory = await getSubCategoryById(id);
  if (!subCategory) {
    throw new ApiError(httpStatus.NOT_FOUND, "SubCategory not found");
  }
  await subCategory.delete();
  return subCategory;
};

module.exports = {
  getCategories,
  getSubCategories,
  getCategoryById,
  getSubCategoryById,
  getSubcategoriesByCategoryID,
  getSubCategoryByCategoryId,
  getCategoryByName,
  getSubCategoryByName,
  getPartnersByCategory,
  createCategory,
  createSubCategory,
  updateCategory,
  updateSubCategory,
  deleteCategory,
  deleteSubCategory,
  getAllCategories
};
