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
  .route("/composebyAdmin")
  .post(
    auth(),
    upload.array("files", 5),
    validate(mailValidation.createMailbyAdmin),
    mailController.composebyAdmin
  );

router
  .route("/composeEmail")
  .post(
    auth(),
    validate(mailValidation.createEmailing),
    mailController.composeEmail
  );

router
  .route("/reply")
  .post(
    auth(),
    upload.array("files", 5),
    validate(mailValidation.createReply),
    mailController.reply
  );
router
  .route("/invite")
  .post(auth(), validate(mailValidation.invite), mailController.invite);
router.route("/inbox").get(auth(), mailController.getInbox);
router.route("/emailing").get(auth(), mailController.getEmailing);
router.route("/sent").get(auth(), mailController.getSent);
router.route("/notices").get(auth(), mailController.getNotices);
router.route("/pending").get(auth(), mailController.getPendingInvites);
router.route("/isread").get(auth(), mailController.getIsReadEmails);
router.route("/unreadMessages").get(auth(), mailController.getUnReadMessages);
router
  .route("/MarkAll")
  .get(
    auth(),
    mailController.MarkAll
  );
router
  .route("/bulk-actions")
  .post(
    auth(),
    validate(mailValidation.bulkActions),
    mailController.bulkActions
  );
router
  .route("/bulkInvite")
  .post(
    auth(),
    mailController.bulkInvite
  );
router
  .route("/getEmailsByID")
  .get(
    auth(),
    mailController.getEmailsForCount
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
  .route("/sent/:mailId")
  .delete(auth(), mailController.deleteSentMail)
router
  .route("/emailing/:emailId")
  .delete(auth(), mailController.deleteEmailing)
  .post(auth(), mailController.resentEmailing);
router
  .route("/emailing/bulk-actions")
  .post(
    auth(),
    mailController.bulkActionsEmailing
  );
router
  .route("/:mailId/resend-invite")
  .post(auth(), mailController.resendInvite);
router
  .route("/:replyId/reply")
  .post(auth(), mailController.getReplyById);
router
  .route("/getInboxById/:id")
  .get(auth(), mailController.getInboxById);
router
  .route("/getSentById/:id")
  .get(auth(), mailController.getSentById);

module.exports = router;
