const express = require("express");
const validate = require("@middlewares/validate");
const auth = require("@middlewares/auth");
const { mailValidation } = require("@validations");
const { mailController } = require("@controllers");
const upload = require("../middlewares/upload");

const router = express.Router();

router
  .route("/compose")
  .post(
    auth(),
    upload.array("files", 5),
    validate(mailValidation.createMail),
    mailController.compose
  );

router
  .route("/invite")
  .post(auth(), validate(mailValidation.invite), mailController.invite);

router.route("/inbox").get(auth(), mailController.getInbox);

router.route("/sent").get(auth(), mailController.getSent);

router.route("/notices").get(auth(), mailController.getNotices);

router.route("/pending").get(auth(), mailController.getPendingInvites);

router.route("/isread").get(auth(), mailController.getIsReadEmails);

router
  .route("/bulk-actions")
  .post(
    auth(),
    validate(mailValidation.bulkActions),
    mailController.bulkActions
  );

router
  .route("/:mailId")
  .delete(auth(), mailController.deleteMail)
  .get(auth(), mailController.readMail)
  .patch(
    auth(),
    validate(mailValidation.updateMail),
    mailController.updateMail
  );

router
  .route("/:mailId/resend-invite")
  .post(auth(), mailController.resendInvite);

module.exports = router;
