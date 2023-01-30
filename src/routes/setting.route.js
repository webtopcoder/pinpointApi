const express = require("express");
const auth = require("@middlewares/auth");
const { settingController } = require("@controllers");

const router = express.Router();

router.route("/").get(settingController.getSettings);
router.route("/").post(settingController.createSetting);
router.route("/:settingid").get(settingController.getSettingById);
router.route("/edit/:settingid").patch(settingController.updateSetting);

module.exports = router;
