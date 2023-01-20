const express = require("express");
const validate = require("@middlewares/validate");
const auth = require("@middlewares/auth");
const { profileValidation } = require("@validations");
const { profileController } = require("@controllers");

const router = express.Router();

router.route("/partner/edit").patch(
  auth({
    allowAnonymous: false,
  }),
  validate(profileValidation.editPartnerProfile),
  profileController.editProfile
);

router.route("/partner/poll").patch(
  auth({
    allowAnonymous: false,
  }),
  validate(profileValidation.editPoll),
  profileController.editPoll
);

module.exports = router;
