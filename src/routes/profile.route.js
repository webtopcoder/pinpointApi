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
  .route("/eventhost/dashboard")
  .get(auth(), profileController.getEventhostDashboard);

router
  .route("/partner/dashboard")
  .get(auth(), profileController.getPartnerDashboard);

router
  .route("/avatar")
  .post(auth(), upload.single("avatar"), profileController.addProfilePicture);

router
  .route("/changePassword")
  .patch(
    auth(),
    // validate(profileValidation.editPartnerProfile),
    profileController.changePassword
  );

  router
  .route("/edit")
  .patch(
    auth(),
    // validate(profileValidation.editPartnerProfile),
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
  .route("/:userId/poll")
  .get(profileController.getPollForProfile)
  .post(
    auth(),
    validate(profileValidation.votePoll),
    profileController.votePoll
  );

router
  .route("/:userId/header")
  .get(auth(true), profileController.getProfileHeaderInfo);

router
  .route("/:userId/getAllMemebers")
  .get(auth(true), profileController.getAllMemebers);

router
  .route("/getFavortied/:locationID")
  .get(auth(true), profileController.getFavorited);

router
  .route("/updateProfileView/:userId")
  .get(auth(true), profileController.updateProfileView);

router
  .route("/:userId/socials")
  .get(auth(true), profileController.getProfileSocials);

router
  .route("/:userId/activity")
  .get(auth(true), profileController.getProfileActivity);

router
  .route("/:userId/post")
  .post(
    auth(),
    upload.array("images", 5),
    validate(profileValidation.createPost),
    profileController.createPost
  );

router
  .route("/:userId/:flag/image/all")
  .get(auth(true), profileController.getAllImages);

module.exports = router;
