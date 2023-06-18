const express = require("express");
const auth = require("@middlewares/auth");
const { adminController } = require("@controllers");
const uploadAdmin = require("../middlewares/upload");
const validate = require("../middlewares/validate");
const { adminValidation } = require("../validations");

const router = express.Router();

router
  .route("/users")
  .get(auth(false, true), adminController.getAllUsers);

router
  .route("/users/search")
  .get(auth(false, true), adminController.getSearchUsers);

router
  .route("/partners/search")
  .get(auth(false, true), adminController.getSearchPartners);

router
  .route("/eventhosts/search")
  .get(auth(false, true), adminController.getSearchEventhosts);

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
  .route("/users/:id/view")
  .get(auth(false, true), adminController.getUserByID);

router
  .route("/users/:id")
  .put(auth(false, true), adminController.updateUserByID)
  .delete(auth(false, true), adminController.deleteUserByID);

router
  .route("/users/updateStaus/:id")
  .put(auth(false, true), adminController.updateUserStatus)

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
  .route("/transactions")
  .get(
    auth(false, true),
    validate(adminValidation.getLatestTransactions),
    adminController.getLatestTransactions
  );

router
  .route("/transactions/monthly-revenue")
  .get(auth(false, true), adminController.getMonthlyRevenue);

router
  .route("/transactions/yearly-revenue")
  .get(auth(false, true), adminController.getYearlyRevenue);

router.use("/activities", require("./admin/activity.route"));
router.use("/categories", require("./admin/category.route"));
router.use("/transactions", require("./admin/transactions.route"));
router.use("/faqs", require("./admin/faq.route"));
router.use("/testimonial", require("./admin/testimonial.route"));
router.use("/newpartners", require("./admin/newpartners.route"));
router.use("/contact", require("./admin/contact.route"));
router.use("/message", require("./admin/message.route"));
router.use("/partnership", require("./admin/partnership.route"));

module.exports = router;
