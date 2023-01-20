const express = require("express");
const validate = require("@middlewares/validate");
const auth = require("@middlewares/auth");
const { mailValidation } = require("@validations");
const { mailController } = require("@controllers");

const router = express.Router();

router.route("/").post(
  auth({
    allowAnonymous: false,
  }),
  validate(mailValidation.createMail),
  mailController.compose
);

router.route("/invite").post(
  auth({
    allowAnonymous: false,
  }),
  validate(mailValidation.invite),
  mailController.invite
);

router.route("/inbox").get(
  auth({
    allowAnonymous: false,
  }),
  mailController.getInbox
);

router.route("/sent").get(
  auth({
    allowAnonymous: false,
  }),
  mailController.getSent
);

router
  .route("/:mailId")
  .delete(
    auth({
      allowAnonymous: false,
    }),
    mailController.deleteMail
  )
  .get(
    auth({
      allowAnonymous: false,
    }),
    mailController.readMail
  );

router.route("/:mailId/resend-invite").post(
  auth({
    allowAnonymous: false,
  }),
  mailController.resendInvite
);

module.exports = router;
