const express = require("express");
const validate = require("@middlewares/validate");
const auth = require("@middlewares/auth");
const { postController } = require("@controllers");

// Route: /api/v1/post/
const router = express.Router();

router.post("/:postId/like", auth(), postController.likePost);

module.exports = router;
