const express = require("express");
const { faqController } = require("@controllers");

/** @namespace  api/v1/faq */
const router = express.Router();

router.get("/getFaqs", faqController.getFaqForFAQSection);
router.get("/searchFaqs", faqController.getFaqs);

module.exports = router;
