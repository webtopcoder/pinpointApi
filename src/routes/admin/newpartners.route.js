const express = require("express");
const auth = require("@middlewares/auth");
const { newpartnersController } = require("@controllers");
const validate = require("@middlewares/validate");
const { newpartnersValidation } = require("@validations");
const upload = require("@baseDir/src/middlewares/upload");
const uploadAdmin = require("@baseDir/src/middlewares/upload");

const router = express.Router();

router
  .route("/")
  .get(auth(false, true), newpartnersController.getNewpartners)
  .post(
    auth(false, true),
    upload.single("image"),
    validate(newpartnersValidation.createNewpartners),
    newpartnersController.createNewpartners
  );

router.get(
  "/all",
  newpartnersController.getnewpartnersForNewpartnerSection
)

router
  .route("/:id/avatar/upload")
  .post(
    auth(false, true),
    uploadAdmin.single("avatar"),
    newpartnersController.ChangeAvatar
  );

router
  .route("/:testimonialId")
  .get(auth(false, true), newpartnersController.getNewpartnerById)
  .patch(
    auth(false, true),
    validate(newpartnersValidation.updateNewpartners),
    newpartnersController.updateNewpartnerById
  )
  .delete(auth(false, true), newpartnersController.deleteNewpartnerById);

module.exports = router;
