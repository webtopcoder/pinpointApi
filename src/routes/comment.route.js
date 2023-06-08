const express = require("express");
const auth = require("@middlewares/auth");
const { commentController } = require("@controllers");

// Route: /api/v1/profile/
const router = express.Router();

router
  .route("/")
  .patch(auth(), commentController.updateComment)
  .delete(auth(), commentController.deleteComment)

router
  .route("/:oriuserId")
  .post(auth(), commentController.createComment)

router
  .route("/:typeId")
  .get(auth(true), commentController.getAllComments)

router
  .route("/:commentId/like")
  .post(auth(), commentController.recommendComment)

router
  .route("/getCount/:typeId")
  .post(auth(), commentController.getCommentCountBytypeId)

module.exports = router;
