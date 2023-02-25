const express = require("express");
const { faqController } = require("@controllers");

/** @namespace  api/v1/faq */
const router = express.Router();

router.get("/faq", faqController.getFaqForFAQSection);

module.exports = router;
