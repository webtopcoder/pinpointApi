const express = require("express");
const auth = require("@middlewares/auth");
const { partnershipController } = require("@controllers");
const validate = require("@middlewares/validate");

const router = express.Router();

router
  .route("/")
  .get(auth(), partnershipController.getPartnerships)
  .post(auth(), partnershipController.createPartnership);

router
  .route("/:partnershipId")
  .get(auth(false, true), partnershipController.getPartnershipById)
  .patch(auth(false, true), partnershipController.updatePartnership)
  .delete(auth(false, true), partnershipController.deletePartnership);

module.exports = router;
