const express = require("express");
const validate = require("@middlewares/validate");
const auth = require("@middlewares/auth");
const { categoryValidation } = require("@validations");
const { categoryController } = require("@controllers");

const router = express.Router();

router.get("/", categoryController.getCategories);

router.get("/:categoryId", categoryController.getCategoryById);

router.get(
  "/sub-categories",
  categoryController.getSubCategoriesGroupedByCategories
);

router.get(
  "/:categoryId/subcategories",
  validate(categoryValidation.getSubCategories),
  categoryController.getSubCategoryByCategoryId
);

module.exports = router;
