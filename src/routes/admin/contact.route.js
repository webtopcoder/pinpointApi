const express = require("express");
const auth = require("@middlewares/auth");
const { contactController } = require("@controllers");
const router = express.Router();

router
  .route("/")
  .get(auth(false, true), contactController.getContacts)

router
  .route("/:ContactId")
  .get(auth(false, true), contactController.getContactById)
  .delete(auth(false, true), contactController.deleteContactById);

module.exports = router;
