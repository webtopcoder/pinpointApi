const express = require("express");
const auth = require("@middlewares/auth");
const { mailController } = require("@controllers");
const validate = require("@middlewares/validate");
const { mailValidation } = require("@validations");
const upload = require("@baseDir/src/middlewares/upload");

const router = express.Router();

router
  .route("/:userId")
  .post(
    auth(false, true),
    upload.array("attachments"),
    // validate(mailValidation.sendMessageByAdmin),
    mailController.sendMessageByAdmin
  );

router
  .route("/compose")
  .post(
    auth(),
    upload.array("files", 5),
    validate(mailValidation.createMail),
    mailController.composebyAdmin
  );

module.exports = router;
