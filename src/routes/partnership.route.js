const express = require("express");
const auth = require("@middlewares/auth");
const { partnershipController } = require("@controllers");

const router = express.Router();

router.route("/").get(auth(), partnershipController.getPartnerships);
router
  .route("/create-customer")
  .post(auth(), partnershipController.createCustomer);

router
  .route("/subscribe")
  .post(auth(), partnershipController.subscribePartnership);
router
  .route("/cancel-subscribe")
  .delete(auth(), partnershipController.cancelSubscription);
router
  .route("/create-transaction")
  .post(auth(), partnershipController.createTransaction);
router.route("/:id").get(auth(), partnershipController.getPartnershipById);

module.exports = router;
