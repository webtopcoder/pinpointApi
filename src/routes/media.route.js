const express = require("express");
const auth = require("@middlewares/auth");
const upload = require("@middlewares/upload");
const { mediaController } = require("@controllers");

const router = express.Router();

router
  .route("/upload")
  .post(auth(), upload.single("file"), mediaController.uploadMedia);

router.route("/:mediaId").get(auth(true), mediaController.getMedia);

module.exports = router;
