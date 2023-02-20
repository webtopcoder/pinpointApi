const express = require("express");
const auth = require("@middlewares/auth");
const { adminController } = require("@controllers");
const uploadAdmin = require("../middlewares/upload");
const validate = require("../middlewares/validate");
const { adminValidation } = require("../validations");

const router = express.Router();

router
  .route("/users/search")
  .get(auth(false, true), adminController.getSearchUsers);

router
  .route("/locations/search")
  .get(auth(false, true), adminController.getSearchLocations);

router
  .route("/locations/:id/view")
  .get(auth(false, true), adminController.getLocationByID);

router
  .route("/partners/export/csv")
  .get(auth(false, true), adminController.getUsersForCSV);

router
  .route("/partners/search")
  .get(auth(false, true), adminController.getSearchPartners);

router
  .route("/users/:id/view")
  .get(auth(false, true), adminController.getUserByID);

router
  .route("/users/:id")
  .put(auth(false, true), adminController.updateUserByID);

router
  .route("/partners/:id/view")
  .get(auth(false, true), adminController.getUserByID);

router
  .route("/users/:id/avatar/upload")
  .post(
    auth(false, true),
    uploadAdmin.single("avatar"),
    adminController.ChangeAvatar
  );

router
  .route("/revenue/monthly")
  .get(auth(false, true), adminController.getMonthlyRevenue);

router
  .route("/revenue/yearly")
  .get(auth(false, true), adminController.getYearlyRevenue);

router
  .route("/revenue/recent-transactions")
  .get(
    auth(false, true),
    validate(adminValidation.getLatestTransactions),
    adminController.getLatestTransactions
  );

router.use("/activities", require("./admin/activity.route"));
router.use("/categories", require("./admin/category.route"));

module.exports = router;
