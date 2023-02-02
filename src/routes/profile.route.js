const express = require("express");
const validate = require("@middlewares/validate");
const auth = require("@middlewares/auth");
const { profileValidation } = require("@validations");
const { profileController } = require("@controllers");
const upload = require("../middlewares/upload");

// Route: /api/v1/profile/
const router = express.Router();

router
  .route("/")
  .get(auth(), profileController.getProfile)
  .patch(
    auth(),
    validate(profileValidation.editProfileData),
    profileController.editProfileData
  );

router
  .route("/avatar")
  .post(auth(), upload.single("avatar"), profileController.addProfilePicture);

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

router
  .route("/:userId/activity")
  .get(auth(true), profileController.getProfileActivity);

router.route("/:userId/post").post(auth(), profileController.createPost);

module.exports = router;
