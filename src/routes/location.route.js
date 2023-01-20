const express = require("express");
const validate = require("@middlewares/validate");
const auth = require("@middlewares/auth");
const { locationValidation } = require("@validations");
const { locationController } = require("@controllers");

const router = express.Router();

router
  .route("/")
  .post(
    auth({
      allowAnonymous: false,
    }),
    validate(locationValidation.createLocation),
    locationController.createLocation
  )
  .get(
    auth({
      allowAnonymous: true,
    }),
    validate(locationValidation.getLocations),
    locationController.getLocations
  );

router.route("/quickArrival").get(
  auth({
    allowAnonymous: true,
  }),
  locationController.getQuickArrival
);

router.route("/quickDeparture").get(
  auth({
    allowAnonymous: true,
  }),
  locationController.getQuickDeparture
);

router
  .route("/:locationId")
  .get(
    auth({
      allowAnonymous: true,
    }),
    validate(locationValidation.getLocation),
    locationController.getLocation
  )
  .patch(
    auth({
      allowAnonymous: false,
    }),
    validate(locationValidation.updateLocation),
    locationController.updateLocation
  );

module.exports = router;
