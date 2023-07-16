const express = require("express");
const validate = require("@middlewares/validate");
const auth = require("@middlewares/auth");
const { followValidation } = require("@validations");
const { followController } = require("@controllers");

// Route: /api/v1/follow/
const router = express.Router();
router.route("/").get(auth(), followController.getOwnFollowerAndFollowing);

router
  .route("/:userId")
  .post(
    auth(),
    followController.followOrUnfollow
  )
  .delete(
    auth(),
    followController.followOrUnfollow
  );

router
  .route("/accept")
  .get(
    auth(),
    followController.acceptFollowingRequest
  )

router.route("/:userId/unfriend").delete(auth(), followController.unfriend);

router
  .route("/:userId/following")
  .get(auth(), followController.getFollowings);

router
  .route("/:userId/follower")
  .get(auth(), followController.getFollowers);

module.exports = router;
