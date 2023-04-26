const express = require("express");
const auth = require("@middlewares/auth");
const { testimonialController, adminController } = require("@controllers");
const validate = require("@middlewares/validate");
const { testimonialValidation } = require("@validations");
const upload = require("@baseDir/src/middlewares/upload");
const uploadAdmin = require("@baseDir/src/middlewares/upload");

const router = express.Router();

router
  .route("/")
  .get(auth(false, true), testimonialController.getTestimonials)
  .post(
    auth(false, true),
    upload.single("image"),
    validate(testimonialValidation.createTestimonial),
    testimonialController.createTestimonial
  );

router.get(
  "/all",
  testimonialController.gettestimonialForTestimonialSection
)

router
  .route("/:id/avatar/upload")
  .post(
    auth(false, true),
    uploadAdmin.single("avatar"),
    testimonialController.ChangeAvatar
  );

router
  .route("/:testimonialId")
  .get(auth(false, true), testimonialController.getTestimonialById)
  .patch(
    auth(false, true),
    validate(testimonialValidation.updateTestimonial),
    testimonialController.updateTestimonialById
  )
  .delete(auth(false, true), testimonialController.deleteTestimonialById);

module.exports = router;
