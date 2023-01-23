const express = require("express");
const validate = require("@middlewares/validate");
const auth = require("@middlewares/auth");
const { profileValidation } = require("@validations");
const { profileController } = require("@controllers");

// Route: /api/v1/profile/
const router = express.Router();

router.route("/").get(auth(), profileController.getProfile);

router
  .route("/edit")
  .patch(
    auth(),
    validate(profileValidation.editPartnerProfile),
    profileController.editProfile
  );

router
  .route("/poll")
  .patch(
    auth(),
    validate(profileValidation.editPoll),
    profileController.editPoll
  );

router
  .route("/:userId/header")
  .get(auth(true), profileController.getProfileHeaderInfo);

module.exports = router;
