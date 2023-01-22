const httpStatus = require("http-status"),
  { Category, SubCategory } = require("@models"),
  ApiError = require("@utils/ApiError"),
  customLabels = require("@utils/customLabels"),
  defaultSort = require("@utils/defaultSort");

/**
 * Get Categories
 * @returns {Promise<Category[]>}
 */
const getCategories = async () => {
  const categories = await Category.find();
  return categories;
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
  const subCategory = await SubCategory.find({
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
