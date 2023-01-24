const express = require("express");
const validate = require("@middlewares/validate");
const auth = require("@middlewares/auth");
const { mailValidation } = require("@validations");
const { mailController } = require("@controllers");

const router = express.Router();

router
  .route("/")
  .post(auth(), validate(mailValidation.createMail), mailController.compose);

router
  .route("/invite")
  .post(auth(), validate(mailValidation.invite), mailController.invite);

router.route("/inbox").get(auth(), mailController.getInbox);

router.route("/sent").get(auth(), mailController.getSent);

router
  .route("/:mailId")
  .delete(auth(), mailController.deleteMail)
  .get(auth(), mailController.readMail);

router
  .route("/:mailId/resend-invite")
  .post(auth(), mailController.resendInvite);

module.exports = router;
