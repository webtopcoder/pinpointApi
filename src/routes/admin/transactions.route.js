const express = require("express");
const auth = require("@middlewares/auth");
const { transactionController } = require("@controllers");

const router = express.Router();

router
  .route("/:transactionID")
  .get(auth(false, true), transactionController.getTransactionById)

module.exports = router;
