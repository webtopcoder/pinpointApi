const express = require("express");
const auth = require("@middlewares/auth");
const { settingController } = require("@controllers");

const router = express.Router();

router
  .route("/")
  .get(settingController.getSettings)
  .post(settingController.createSetting);
router.route("/:userId").get(settingController.getUserSettings);
router.route("/:settingid").get(settingController.getSettingById);
router.route("/edit/:settingid").patch(settingController.updateSetting);

module.exports = router;
