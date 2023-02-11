const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const { events, EventEmitter } = require("@events");
const ApiError = require("@utils/ApiError");
const { userService, adminService } = require("@services");
const { uploadMedia } = require("../services/media.service");

const getSearchUsers = catchAsync(async (req, res) => {

  const partners = await adminService.searchPartner(req.query);
  if (!partners) {
    throw new ApiError(httpStatus.NOT_FOUND, "Users not found");
  }
  res.send({ data: partners });

});

const getSearchPartners = catchAsync(async (req, res) => {

  const users = await adminService.searchUser(req.query);
  if (!users) {
    throw new ApiError(httpStatus.NOT_FOUND, "Users not found");
  }
  res.send({ data: users });

});

const getUserByID = catchAsync(async (req, res) => {

  const { id } = req.params;
  const user = await adminService.getUserByID(id);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "user not found");
  }
  res.send({ data: user });
});

const ChangeAvatar = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No file uploaded");
  }

  const user = await adminService.getUserByID(id);

  const media = await uploadMedia(req.file, id, true);
  // await userService.updateUserById(id, {
  //   profile: { ...user?.profile.profile, avatar: media._id },
  // });

  return res.json({ success: true, avatar: media });
});

module.exports = {
  getSearchUsers,
  getSearchPartners,
  getUserByID,
  ChangeAvatar
};
