const express = require("express");
const auth = require("@middlewares/auth");
const { adminController } = require("@controllers");
const validate = require("@middlewares/validate");
const { adminValidation } = require("@validations");

const router = express.Router();

router
  .route("/recent-activities")
  .get(
    auth(false, true),
    validate(adminValidation.getLatestActivities),
    adminController.getLatestActivities
  );

router
  .route("/")
  .delete(auth(false, true), adminController.deleteActivitesByID);

router
  .route("/search")
  .get(auth(false, true), adminController.getSearchActivities);

module.exports = router;
