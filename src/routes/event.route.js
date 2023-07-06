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

router
  .route("/event-schedule")
  .post(
    auth(true),
    eventController.getEventSchedule
  );

router
  .route("/:eventId/review")
  .post(
    auth(),
    upload.array("images", 5),
    validate(eventValidation.reviewEvent),
    eventController.reviewEvent
  );

router
  .route("/:scheduleId/request-access")
  .post(
    auth(),
    eventController.requestAccess
  );

router
  .route("/:scheduleId/request-access-manually")
  .post(
    auth(),
    eventController.requestAccessManually
  );

router
  .route("/:scheduleId/event-scheduleById")
  .post(
    auth(),
    eventController.getScheduleById
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

router
  .route("/addeventschedule")
  .post(
    auth(),
    upload.array("images", 5),
    validate(eventValidation.addEventSchedule),
    eventController.addEventSchedule
  );

router.route("/:arrivalID/check-in").post(auth(), eventController.checkIn);

router
  .route("/:scheduleId/markStatus")
  .post(auth(), eventController.markStatus)

router
  .route("/:eventId/:expand")
  .get(
    auth(true),
    validate(eventValidation.getEvent),
    eventController.getEvent
  )

  router
  .route("/delete-manual-request/:scheduleId/:requestId")
  .get(
    auth(true),
    eventController.deleteManualRequest
  )

router
  .route("/:scheduleId/uploadExcel")
  .post(auth(), upload.single("xisx"), eventController.uploadExcel);

router
  .route("/:scheduleId/eventschedule")
  .delete(auth(), eventController.deleteEventSchedule)
  .patch(
    auth(),
    upload.array("images", 5),
    validate(eventValidation.updateEventSchedule),
    eventController.updateEventSchedule
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


module.exports = router;
