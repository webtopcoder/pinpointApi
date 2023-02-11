const express = require("express");
const auth = require("@middlewares/auth");
const { adminController } = require("@controllers");
const uploadAdmin = require("../middlewares/upload");

const router = express.Router();

router
  .route("/users/search")
  .get(auth(true), adminController.getSearchUsers);

router
  .route("/partners/search")
  .get(auth(true), adminController.getSearchPartners);

router
  .route("/users/:id/view")
  .get(auth(true), adminController.getUserByID);

router
  .route("/users/:id/avatar/upload")
  .post(auth(true), uploadAdmin.single("avatar"), adminController.ChangeAvatar);

module.exports = router;
