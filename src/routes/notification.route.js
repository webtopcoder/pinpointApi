const express = require("express");
const auth = require("@middlewares/auth");
const { notificationController, profileController } = require("@controllers");

const router = express.Router();

router
  .route("/")
  .get(
    auth(),
    notificationController.getNotifications
  );

router
  .route("/clear")
  .get(
    auth(),
    notificationController.clearNotifications
  );

router
  .route("/:id")
  .get(
    auth(), notificationController.getNotificationById
  )

router
  .route("/:id/mark-as-read")
  .post(auth(), notificationController.markAsRead);

router
  .route("/:id/:flag/update")
  .post(auth(), notificationController.update);

router
  .route("/:flag/updateAll")
  .post(auth(), notificationController.updateAll);

module.exports = router;
