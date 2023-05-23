const express = require("express");
const auth = require("@middlewares/auth");
const { settingController } = require("@controllers");

const router = express.Router();

router.route("/").post(auth(), settingController.createOrUpdateSetting);
router.route("/").get(auth(), settingController.getUserSettings);
router.route("/deleteUser/:id").post(auth(), settingController.deleteAdditionUser);
router.route("/updateUser/:id").post(auth(), settingController.updateAdditionUser);
router.route("/updateUserWithPassword").post(auth(), settingController.updateAdditionUserWithPassword);
router.route("/getUser/:id").post(auth(), settingController.getAdditionUser);
updateUserWithPassword
module.exports = router;
