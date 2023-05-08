const express = require("express");
const auth = require("@middlewares/auth");
const { faqController } = require("@controllers");
const validate = require("@middlewares/validate");
const { faqValidation } = require("@validations");

const router = express.Router();

router
  .route("/")
  .get(auth(false, true), faqController.getFaqs)
  .post(
    auth(false, true),
    validate(faqValidation.createFAQ),
    faqController.createFaq
  );

router
  .route("/:faqId")
  .get(auth(false, true), faqController.getFaqById)
  .patch(
    auth(false, true),
    validate(faqValidation.updateFAQ),
    faqController.updateFaqById
  )
  .delete(auth(false, true), faqController.deleteFaqById);

router
  .route("/bulk-actions")
  .post(
    auth(),
    faqController.bulkActions
  );

module.exports = router;
