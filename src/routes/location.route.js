const express = require("express");
const validate = require("@middlewares/validate");
const auth = require("@middlewares/auth");
const { locationValidation } = require("@validations");
const { locationController } = require("@controllers");

const router = express.Router();

router
  .route("/")
  .post(
    auth(),
    validate(locationValidation.createLocation),
    locationController.createLocation
  )
  .get(
    auth(true),
    validate(locationValidation.getLocations),
    locationController.getLocations
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
  .patch(
    auth(),
    validate(locationValidation.updateLocation),
    locationController.updateLocation
  );

module.exports = router;
