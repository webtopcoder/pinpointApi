const express = require("express");
const auth = require("@middlewares/auth");
const { shareController } = require("@controllers");

const router = express.Router();

router
  .route("/")
  .get(auth({ anonymous: true }), shareController.shareLink)


module.exports = router;
