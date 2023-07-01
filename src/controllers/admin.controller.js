const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const { events, EventEmitter } = require("@events");
const ApiError = require("@utils/ApiError");
const { userService, adminService, postService, reviewService, locationService, mediaService } = require("@services");
const { uploadMedia } = require("../services/media.service");
import { Parser } from "json2csv";
import pick from "../utils/pick";

const getAllUsers = catchAsync(async (req, res) => {
  const users = await adminService.getAllUsers();
  if (!users) {
    throw new ApiError(httpStatus.NOT_FOUND, "Users not found");
  }
  res.send({ data: users });
});

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
    throw new ApiError(httpStatus.NOT_FOUND, "Locations not found");
  }
  res.send({ data: locations });
});

const updateUserByID = catchAsync(async (req, res) => {
  const { id } = req.params;
  await adminService.userUpdate(id, req.body);
  const user = await userService.getUserById(id);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "Users not found");
  }
  res.send({ data: user });
});

const updateUserStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  await adminService.userUpdate(id, req.body);
  const user = await userService.getUserById(id);
  EventEmitter.emit(user.role === "partner" ? events.PARTNER_STATUS : events.EVENTHOST_STATUS, { id: id });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "Users not found");
  }
  res.send({ data: user });
});

const updateActivityByID = catchAsync(async (req, res) => {
  const { id, type } = req.params;

  await adminService.ActivityUpdate(id, type, req.body);

  const acitvity = await adminService.getActivitiesById({ id: id, type: type });

  if (!acitvity) {
    throw new ApiError(httpStatus.NOT_FOUND, "Users not found");
  }
  res.send({ data: acitvity });
});

const getSearchActivities = catchAsync(async (req, res) => {
  const activities = await adminService.searchActivities(req.query);
  if (!activities) {
    throw new ApiError(httpStatus.NOT_FOUND, "activities not found");
  }

  res.send({ data: activities });
});

const deleteActivitesByID = catchAsync(async (req, res) => {
  let data, activities;
  if (req.body.deleteType !== "permant") {
    if (req.body.status === 'deleted')
      data = {
        status: "active",
      };
    else data = {
      status: "deleted",
    };
    activities = await adminService.deleteActivitiesById(req.body, data);
  }
  else {
    activities = await adminService.removeActivitiesById(req.body);
  }

  res.send(activities);
});


const getSearchPartners = catchAsync(async (req, res) => {
  const partners = await adminService.searchPartner(req.query);
  if (!partners) {
    throw new ApiError(httpStatus.NOT_FOUND, "partners not found");
  }
  res.send({ data: partners });
});

const getSearchEventhosts = catchAsync(async (req, res) => {
  const eventhosts = await adminService.searchEventhost(req.query);
  if (!eventhosts) {
    throw new ApiError(httpStatus.NOT_FOUND, "eventhosts not found");
  }
  res.send({ data: eventhosts });
});



const getUsersForCSV = catchAsync(async (req, res) => {
  const fileName = "partners_export.csv";
  const fields = [
    {
      label: "firstName",
      value: "firstName",
    },
    {
      label: "lastName",
      value: "lastName",
    },
    {
      label: "username",
      value: "username",
    },
    {
      label: "Email",
      value: "email",
    },
    {
      label: "Role",
      value: "role",
    },
    {
      label: "Status",
      value: "status",
    },
  ];

  if (req.query.role == "user")
    var { data } = await adminService.searchUser({ ...req.query, limit: 9999 });
  else
    var { data } = await adminService.searchPartner({ ...req.query, limit: 9999 });

  if (!data) {
    throw new ApiError(httpStatus.NOT_FOUND, "partners not found");
  }

  const json2csv = new Parser({ fields });
  const csv = json2csv.parse(data);

  res.header("Content-Type", "text/csv");
  res.attachment(fileName);
  res.send(csv);
});

const getUserByID = catchAsync(async (req, res) => {
  const { id } = req.params;
  const user = await userService.getUserById(id);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "user not found");
  }
  res.send({ data: user });
});

const getLocationByID = catchAsync(async (req, res) => {
  const { id } = req.params;
  const location = await locationService.getLocationById(id);
  if (!location) {
    throw new ApiError(httpStatus.NOT_FOUND, "location not found");
  }
  res.send({ data: location });
});

const getActivityByID = catchAsync(async (req, res) => {
  const acitvity = await adminService.getActivitiesById(req.query);
  if (!acitvity) {
    throw new ApiError(httpStatus.NOT_FOUND, "acitvity not found");
  }
  res.send({ data: acitvity });
});

const getActivityImageRemoveByID = catchAsync(async (req, res) => {
  const { id } = req.query;
  const activity = await adminService.getUpdateActivityById(req.query);
  if (!activity) {
    throw new ApiError(httpStatus.NOT_FOUND, "acitvity not found");
  }
  const newArray = activity.images.filter(item => item.toString() !== req.query.imageid);

  switch (req.query.type) {
    case 'Post':
      await postService.updatePostById(id, { images: newArray });
      break;
    case 'Review':
      await reviewService.updateReviewById(id, { images: newArray });
      break;
    default:
      await postService.updatePostById(id, { images: newArray });
      break;
  }
  const result = await adminService.getActivitiesById(req.query);
  res.send({ data: result });
});


const ChangeAvatar = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No file uploaded");
  }

  const user = await userService.getUserById(id);

  const media = await uploadMedia(req.file, id, true);

  await userService.updateUserById(id, {
    profile: { ...user?.profile?.profile, avatar: media._id },
  });

  return res.json({ success: true, avatar: media });
});

const uploadActivityImage = catchAsync(async (req, res) => {
  const { id, type } = req.params;
  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No file uploaded");
  }

  const activity = await adminService.getUpdateActivityById({ id: id, type: type });

  const media = await uploadMedia(req.file, id, true);
  activity.images.push(media._id);

  switch (type) {
    case 'Post':
      await postService.updatePostById(id, { images: activity.images });
      break;
    case 'Review':
      await reviewService.updateReviewById(id, { images: activity.images });
      break;
    default:
      await postService.updatePostById(id, { images: activity.images });
      break;
  }
  return res.json({ success: true, avatar: media });
});


const getMonthlyRevenue = catchAsync(async (req, res) => {
  const revenue = await adminService.getMonthlyRevenue(req.query);
  if (!revenue) {
    throw new ApiError(httpStatus.NOT_FOUND, "revenue not found");
  }
  res.send({ data: revenue });
});

const getYearlyRevenue = catchAsync(async (req, res) => {
  const revenue = await adminService.getYearlyRevenue(req.query);
  if (!revenue) {
    throw new ApiError(httpStatus.NOT_FOUND, "revenue not found");
  }
  res.send({ data: revenue });
});

const getLatestTransactions = catchAsync(async (req, res) => {
  const filter = pick(req.query, ["status"]);
  const options = pick(req.query, ["limit", "page", "sort"]);

  if (options.sort) {
    options.sort = Object.fromEntries(
      options.sort.split(",").map((field) => field.split(":"))
    );
  }

  options.populate = ["user"];

  const transactions = await adminService.getLatestTransactions(
    filter,
    options
  );

  if (!transactions) {
    throw new ApiError(httpStatus.NOT_FOUND, "transactions not found");
  }

  res.send(transactions);
});


const getLatestActivities = catchAsync(async (req, res) => {

  const activities = await adminService.getLatestActivities(req.query);

  if (!activities) {
    throw new ApiError(httpStatus.NOT_FOUND, "activities not found");
  }

  res.send(activities);
});

const deleteUserByID = catchAsync(async (req, res) => {
  const { id } = req.params;
  await adminService.deleteUserByID(id);

  res.status(httpStatus.NO_CONTENT).send();
});

const deleteImageByID = catchAsync(async (req, res) => {
  const { id } = req.params;
  await mediaService.deleteMediaById(id);

  res.status(httpStatus.NO_CONTENT).send();
});

const bulkActions = catchAsync(async (req, res) => {
  const { action, flag, selectedIds } = req.body;

  if (action !== "removed")
    await adminService.bulkDelete(selectedIds, flag, action);
  else {
    await adminService.bulkRemove(selectedIds, flag, action);
  }
  return res.json({ success: true, message: "Action performed successfully!" });
});

module.exports = {
  getAllUsers,
  getSearchUsers,
  getSearchLocations,
  getSearchActivities,
  getLocationByID,
  updateUserByID,
  deleteActivitesByID,
  getUsersForCSV,
  getSearchPartners,
  getUserByID,
  ChangeAvatar,
  getMonthlyRevenue,
  getYearlyRevenue,
  getLatestTransactions,
  getLatestActivities,
  deleteUserByID,
  getActivityByID,
  uploadActivityImage,
  getActivityImageRemoveByID,
  updateActivityByID,
  deleteImageByID,
  bulkActions,
  updateUserStatus,
  getSearchEventhosts
};

