const express = require("express");
const validate = require("@middlewares/validate");
const auth = require("@middlewares/auth");
const { authValidation } = require("@validations");
const { authController } = require("@controllers");

const router = express.Router();

router.post(
  "/register",
  validate(authValidation.register),
  authController.register
);
router.post("/login", validate(authValidation.login), authController.login);
router.post(
  "/admin-login",
  validate(authValidation.adminlogin),
  authController.adminLogin
);
router.post("/logout", validate(authValidation.logout), authController.logout);
router.post(
  "/refresh-tokens",
  validate(authValidation.refreshTokens),
  authController.refreshTokens
);
router.post(
  "/forgot-password",
  validate(authValidation.forgotPassword),
  authController.forgotPassword
);
router.post(
  "/reset-password",
  validate(authValidation.resetPassword),
  authController.resetPassword
);
router.put("/change-password", auth(true), authController.changePasswordUser);
router.post(
  "/send-verification-email",
  auth(true),
  validate(authValidation.sendVerificationEmail),
  authController.sendVerificationEmail
);
router.post(
  "/verify-email",
  validate(authValidation.verifyEmail),
  authController.verifyEmail
);

router.get("/getDefaultAvatar", authController.getDefaultAvatar);
router.get("/partners", authController.getActivePartners);
router.get("/me", auth(), authController.getUser);
router.get("/username", auth(), authController.getUsernameById);
router.get("/admin/me", auth(false, true), authController.getAdmin);

module.exports = router;
