const express = require("express");
const validate = require("@middlewares/validate");
const auth = require("@middlewares/auth");
const upload = require("@middlewares/upload");
const { categoryValidation } = require("@validations");
const { categoryController } = require("@controllers");

const router = express.Router();

router
  .route("/")
  .get(auth(false, true), categoryController.getAllCategories)
  .post(
    auth(false, true),
    upload.single("image"),
    validate(categoryValidation.createCategory),
    categoryController.createCategory
  );

router
  .route("/all")
  .get(auth(false, true), categoryController.getAllCategories)

router
  .route("/subcategories")
  .get(
    auth(false, true),
    categoryController.getSubCategories
  )
  .post(
    auth(false, true),
    upload.single("image"),
    validate(categoryValidation.createSubCategory),
    categoryController.createSubCategory
  );

router
  .route("/subcategories/:id")
  .get(auth(false, true), categoryController.getSubCategoryById)
  .patch(
    auth(false, true),
    upload.single("image"),
    validate(categoryValidation.updateSubCategory),
    categoryController.updateSubCategory
  )
  .delete(
    auth(false, true),
    validate(categoryValidation.deleteSubCategory),
    categoryController.deleteSubCategory
  );

router
  .route("/getsub/:id")
  .get(auth(false, true), categoryController.getSubCategoryByCategoryId)

router
  .route("/:categoryId")
  .get(auth(false, true), categoryController.getCategoryById)
  .patch(
    auth(false, true),
    upload.single("image"),
    validate(categoryValidation.updateCategory),
    categoryController.updateCategory
  )
  .delete(
    auth(false, true),
    validate(categoryValidation.deleteCategory),
    categoryController.deleteCategory
  );

module.exports = router;
