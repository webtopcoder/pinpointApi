const express = require("express");
const auth = require("@middlewares/auth");
const { adminController } = require("@controllers");
const validate = require("@middlewares/validate");
const { adminValidation } = require("@validations");
const upload = require("../../middlewares/upload");

const router = express.Router();

router
  .route("/recent-activities")
  .get(
    auth(false, true),
    adminController.getLatestActivities
  );

router
  .route("/")
  .put(auth(false, true), adminController.deleteActivitesByID);

router
  .route("/:id/:type/upload")
  .post(
    auth(true),
    upload.single("avatar"),
    adminController.uploadActivityImage
  );

router
  .route("/search")
  .get(auth(false, true), adminController.getSearchActivities);

router
  .route("/view")
  .get(auth(false, true), adminController.getActivityByID);

router
  .route("/imageUpload")
  .get(auth(false, true), adminController.getActivityImageRemoveByID);

router
  .route("/:id/:type")
  .put(auth(false, true), adminController.updateActivityByID)

router
  .route("/image/:id")
  .delete(auth(false, true), adminController.deleteImageByID);

router
  .route("/bulk-actions")
  .post(
    auth(),
    adminController.bulkActions
  );

module.exports = router;
