const express = require("express");
const auth = require("@middlewares/auth");
const { settingController } = require("@controllers");

const router = express.Router();

router.route("/").post(settingController.createOrUpdateSetting);
router.route("/").get(auth(), settingController.getUserSettings);
router.route("/:settingid").get(settingController.getSettingById);
router.route("/edit/:settingid").patch(settingController.updateSetting);

module.exports = router;
