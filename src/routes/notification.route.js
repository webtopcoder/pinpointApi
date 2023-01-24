const express = require("express");
const auth = require("@middlewares/auth");
const { notificationController } = require("@controllers");

const router = express.Router();

router.route("/").get(auth(), notificationController.getNotifications);

router.route("/:id").get(auth(), notificationController.getNotificationById);

router
  .route("/:id/mark-as-read")
  .post(auth(), notificationController.markAsRead);

module.exports = router;
