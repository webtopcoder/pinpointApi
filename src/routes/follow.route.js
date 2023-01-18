const express = require("express");
const validate = require("@middlewares/validate");
const auth = require("@middlewares/auth");
const { followValidation } = require("@validations");
const { followController } = require("@controllers");

const router = express.Router();

router
  .route("/:userId", validate(followValidation.followUnfollow))
  .post(auth({ anonymous: false }), followController.followOrUnfollow)
  .delete(auth({ anonymous: false }), followController.followOrUnfollow);

router
  .route("/:userId/following")
  .get(auth({ anonymous: true }), followController.getFollowings);
router
  .route("/:userId/follower")
  .get(auth({ anonymous: true }), followController.getFollowers);

module.exports = router;
