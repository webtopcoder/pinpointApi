const express = require("express");
const auth = require("@middlewares/auth");
const { adminController } = require("@controllers");
const uploadAdmin = require("../middlewares/upload");

const router = express.Router();

router.route("/users/search").get(auth(true), adminController.getSearchUsers);

router
  .route("/activities/search")
  .get(auth(true), adminController.getSearchActivities);

router
  .route("/locations/search")
  .get(auth(true), adminController.getSearchLocations);

router
  .route("/locations/:id/view")
  .get(auth(true), adminController.getLocationByID);

router
  .route("/partners/export/csv")
  .get(auth(true), adminController.getUsersForCSV);

router
  .route("/partners/search")
  .get(auth(true), adminController.getSearchPartners);

router.route("/users/:id/view").get(auth(true), adminController.getUserByID);

router.route("/users/:id").put(auth(true), adminController.updateUserByID);

router.route("/partners/:id/view").get(auth(true), adminController.getUserByID);

router
  .route("/users/:id/avatar/upload")
  .post(auth(true), uploadAdmin.single("avatar"), adminController.ChangeAvatar);

router
  .route("/activities/delete")
  .put(auth(true), adminController.deleteActivitesByID);

module.exports = router;
