const express = require("express");
const auth = require("@middlewares/auth");
const { partnershipController } = require("@controllers");

const router = express.Router();

router.route("/").get(auth(), partnershipController.getPartnerships);

router.route("/:id").get(auth(), partnershipController.getPartnershipById);

module.exports = router;
