const express = require("express");
const auth = require("@middlewares/auth");
const { settingController } = require("@controllers");

const router = express.Router();

router.route("/").post(auth(), settingController.createOrUpdateSetting);
router.route("/").get(auth(), settingController.getUserSettings);
// router.route("/getPartnerByID").get(auth(), settingController.getPartnerByID);
router.route("/deleteUser/:id").post(auth(), settingController.deleteAdditionUser);
router.route("/updateUser/:id").post(auth(), settingController.updateAdditionUser);
router.route("/updateUserWithPassword").post(settingController.updateAdditionUserWithPassword);
router.route("/getUser/:id").post(auth(), settingController.getAdditionUser);
router.route("/loginUser").post(settingController.loginUser);
router.route("/getPartners/:email").post(settingController.getPartners);
module.exports = router;
