const express = require("express");
const auth = require("@middlewares/auth");
const { shoutoutController } = require("@controllers");

const router = express.Router();

router.route("/:to_userid").post(auth(), shoutoutController.createShoutout);
router.route("/own").get(auth(), shoutoutController.getOwnShoutouts);
router.route("/sent").get(auth(), shoutoutController.getSentShoutouts);
router.route("/:userid").get(shoutoutController.getShoutoutsByUserId);
router.route("/edit/:shoutoutid").patch(shoutoutController.updateShoutout);
router.route("/:shoutoutid").delete(shoutoutController.deleteShoutout);

module.exports = router;
