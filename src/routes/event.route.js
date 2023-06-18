const express = require("express");
const validate = require("@middlewares/validate");
const auth = require("@middlewares/auth");
const { eventValidation } = require("@validations");
const { eventController } = require("@controllers");
const upload = require("../middlewares/upload");

const router = express.Router();

router
  .route("/")
  .post(
    auth(),
    upload.array("images", 5),
    validate(eventValidation.createEvent),
    eventController.createEvent
  )
  .get(
    auth(true),
    validate(eventValidation.getEvents),
    eventController.getEvents
  );

// router.route("/interactive-map").get(eventController.getInteractiveMap);

// router
//   .route("/review/:reviewId/like")
//   .post(auth(), eventController.likeReview);

// router.route("/favorite/:userId").get(eventController.getFavoriteLocations);

router
  .route("/:eventId/review")
  .post(
    auth(),
    upload.array("images", 5),
    validate(eventValidation.reviewEvent),
    eventController.reviewEvent
  );

router
  .route("/:eventId/quick-arrival")
  .post(
    auth(),
    upload.array("images", 5),
    validate(eventValidation.quickArrival),
    eventController.quickArrival
  );

router
  .route("/:eventId/quick-departure")
  .post(
    auth(),
    validate(eventValidation.quickDeparture),
    eventController.quickDeparture
  );

// router.route("/:arrivalID/like").post(auth(), eventController.likeArrival);

router.route("/:arrivalID/check-in").post(auth(), eventController.checkIn);

// router
//   .route("/:locationId/favorite")
//   .post(auth(), eventController.favoriteLocation)
//   .delete(auth(), eventController.unfavoriteLocation);

router
  .route("/:eventId/:expand")
  .get(
    auth(true),
    validate(eventValidation.getEvent),
    eventController.getEvent
  )

router
  .route("/:eventId")
  .patch(
    auth(),
    upload.array("images", 5),
    validate(eventValidation.updateEvent),
    eventController.updateEvent
  )
  .delete(auth(), eventController.deleteEvent);

// router
//   .route("/arrival/:locationId")
//   .get(
//     auth(true),
//     validate(eventValidation.getLocation),
//     eventController.getExpiredArrivals
//   )

module.exports = router;
