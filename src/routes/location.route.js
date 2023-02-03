const express = require("express");
const validate = require("@middlewares/validate");
const auth = require("@middlewares/auth");
const { locationValidation } = require("@validations");
const { locationController } = require("@controllers");
const upload = require("../middlewares/upload");

const router = express.Router();

router
  .route("/")
  .post(
    auth(),
    upload.array("images", 5),
    validate(locationValidation.createLocation),
    locationController.createLocation
  )
  .get(
    auth(true),
    validate(locationValidation.getLocations),
    locationController.getLocations
  );

router
  .route("/:locationId/review")
  .post(
    auth(),
    upload.array("images", 5),
    validate(locationValidation.reviewLocation),
    locationController.reviewLocation
  );

router
  .route("/:locationId/quick-arrival")
  .post(
    auth(),
    validate(locationValidation.quickArrival),
    locationController.quickArrival
  );

router
  .route("/:locationId/quick-departure")
  .post(
    auth(),
    validate(locationValidation.quickDeparture),
    locationController.quickDeparture
  );

router
  .route("/:locationId")
  .get(
    auth(true),
    validate(locationValidation.getLocation),
    locationController.getLocation
  )
  .post(
    auth(),
    upload.array("images", 5),
    validate(locationValidation.updateLocation),
    locationController.updateLocation
  )
  .put(
    auth(),
    locationController.deleteLocation
  );

module.exports = router;
