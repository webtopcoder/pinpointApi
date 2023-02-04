const express = require("express");
const auth = require("@middlewares/auth");
const { shoutoutController } = require("@controllers");

const router = express.Router();

router.route("/:userid").get(auth(), shoutoutController.getShoutoutsByUserId);

module.exports = router;
