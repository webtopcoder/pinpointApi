const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const { events, EventEmitter } = require("@events");
const ApiError = require("@utils/ApiError");
const { userService, adminService } = require("@services");
const { uploadMedia } = require("../services/media.service");
import { Parser } from 'json2csv';

const getSearchUsers = catchAsync(async (req, res) => {

  const users = await adminService.searchUser(req.query);
  if (!users) {
    throw new ApiError(httpStatus.NOT_FOUND, "Users not found");
  }
  res.send({ data: users });

});

const getSearchLocations = catchAsync(async (req, res) => {

  const locations = await adminService.searchLocation(req.query);
  if (!locations) {
    throw new ApiError(httpStatus.NOT_FOUND, "locations not found");
  }

  console.log(locations)
  res.send({ data: locations });

});

const updateUserByID = catchAsync(async (req, res) => {
  const { id } = req.params;

  await adminService.userUpdate(id, req.body);

  const user = await adminService.getUserByID(id);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "Users not found");
  }
  res.send({ data: user });

});

const getSearchActivities = catchAsync(async (req, res) => {

  const activities = await adminService.searchActivities(req.query);
  if (!activities) {
    throw new ApiError(httpStatus.NOT_FOUND, "activities not found");
  }

  res.send({ data: activities });

});

const deleteActivitesByID = catchAsync(async (req, res) => {

  console.log(req.query);
  const data = {
    status: 'deleted',
  };

  const activities = await adminService.deleteActivitiesById(req.query, data);

  res.send(activities);

});



const getSearchPartners = catchAsync(async (req, res) => {

  const partners = await adminService.searchPartner(req.query);
  if (!partners) {
    throw new ApiError(httpStatus.NOT_FOUND, "partners not found");
  }
  res.send({ data: partners });

});

const getUsersForCSV = catchAsync(async (req, res) => {

  const fileName = 'partners_export.csv';
  const fields = [
    {
      label: 'firstName',
      value: 'firstName'
    },
    {
      label: 'lastName',
      value: 'lastName'
    },
    {
      label: 'username',
      value: 'username'
    },
    {
      label: 'Email',
      value: 'email'
    },
    {
      label: 'Role',
      value: 'role'
    },
    {
      label: 'Status',
      value: 'status'
    },
  ];


  const { data } = await adminService.searchPartner({ ...req, limit: 9999 });
  if (!data) {
    throw new ApiError(httpStatus.NOT_FOUND, "partners not found");
  }

  const json2csv = new Parser({ fields });
  const csv = json2csv.parse(data);

  res.header('Content-Type', 'text/csv');
  res.attachment(fileName);
  res.send(csv);
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

  const user = await adminService.getUserByIDForAvatar(id);

  const media = await uploadMedia(req.file, id, true);

  await userService.updateUserById(id, {
    profile: { ...user?.profile?.profile, avatar: media._id },
  });

  return res.json({ success: true, avatar: media });
});

module.exports = {
  getSearchUsers,
  getSearchActivities,
  getSearchLocations,
  updateUserByID,
  deleteActivitesByID,
  getUsersForCSV,
  getSearchPartners,
  getUserByID,
  ChangeAvatar
};
