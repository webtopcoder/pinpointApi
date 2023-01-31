const express = require("express");
const auth = require("@middlewares/auth");
const { shoutoutController } = require("@controllers");

const router = express.Router();

router.route("/:to_username").post(auth(), shoutoutController.createShoutout);
router.route("/:userid").get(auth(), shoutoutController.getShoutoutsByUserId);
router.route("/:shoutoutid").delete(auth(), shoutoutController.deleteShoutout);

module.exports = router;
