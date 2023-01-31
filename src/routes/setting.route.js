const express = require("express");
const auth = require("@middlewares/auth");
const { settingController } = require("@controllers");

const router = express.Router();

router.route("/").post(auth(), settingController.createOrUpdateSetting);
router.route("/").get(auth(), settingController.getUserSettings);

module.exports = router;
