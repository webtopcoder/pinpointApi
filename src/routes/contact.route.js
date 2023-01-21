const express = require("express");
const validate = require("@middlewares/validate");
const { contactValidation } = require("@validations");
const { contactController } = require("@controllers");

const router = express.Router();

router.post(
  "/",
  validate(contactValidation.createContact),
  contactController.createContact
);

module.exports = router;
