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

// router.route("/interactive-map").get(locationController.getInteractiveMap);

router
  .route("/review/:reviewId/like")
  .post(auth(), locationController.likeReview);

router.route("/favorite/:userId").get(locationController.getFavoriteLocations);

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
    upload.array("images", 5),
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

router.route("/:arrivalID/like").post(auth(), locationController.likeArrival);

router.route("/:arrivalID/check-in").post(auth(), locationController.checkIn);

router
  .route("/:locationId/favorite")
  .post(auth(), locationController.favoriteLocation)
  .delete(auth(), locationController.unfavoriteLocation);

router
  .route("/Bytitle/:title/:expand")
  .get(auth(),
    validate(locationValidation.getLocationByTitle),
    locationController.getLocationByTitle
  )

router
  .route("/:locationId/:expand")
  .get(auth(),
    validate(locationValidation.getLocationById),
    locationController.getLocation
  )

router
  .route("/:locationId")
  .patch(
    auth(),
    upload.array("images", 5),
    validate(locationValidation.updateLocation),
    locationController.updateLocation
  )
  .delete(auth(), locationController.deleteLocation);

router
  .route("/arrival/:locationId")
  .get(
    auth(true),
    validate(locationValidation.getLocation),
    locationController.getExpiredArrivals
  )

router
  .route("/:userId/:locationId/poll")
  .post(
    auth(),
    locationController.votePoll
  );

module.exports = router;
