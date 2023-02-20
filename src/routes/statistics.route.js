const express = require("express");
const auth = require("@middlewares/auth");
const { statisticController } = require("@controllers");

const router = express.Router();

router.route("/admin").get(auth(false, true), statisticController.getStats);

module.exports = router;
