const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const ApiError = require("@utils/ApiError");
const { settingService } = require("@services");
const pick = require("../utils/pick");
const createSetting = catchAsync(async (req, res) => {
  const setting = await settingService.createSetting(req.body);
  res.status(httpStatus.CREATED).send({ success: true, setting });
});

const getSettingById = catchAsync(async (req, res) => {
  const setting = await settingService.getSettingById(req.params.settingid);
  if (!setting) {
    throw new ApiError(httpStatus.NOT_FOUND, "Setting not found");
  }
  res.send(setting);
});

const getSettings = catchAsync(async (req, res) => {
  let filter = {};

  let options = pick(req.query, ["limit", "page", "sort"]);

  const result = await settingService.querySettings(filter, options);
  res.send(result);
});
const getUserSettings = catchAsync(async (req, res) => {
  let filter = {};
  let options = pick(req.query, ["limit", "page", "sort"]);
  const { userId } = req.params;

  const result = await notificationService.querySettings(
    { ...filter, user: userId },
    options
  );
  res.send(result);
});

const updateSetting = catchAsync(async (req, res) => {
  const { settingid } = req.params;
  const setting = await settingService.getSettingById(settingid);
  if (!setting) {
    throw new ApiError(httpStatus.NOT_FOUND, "Setting not found");
  }

  const data = req.body;

  await settingService.updateSettingById(settingid, data);
  res.send(setting);
});
const deleteSetting = catchAsync(async (req, res) => {
  const settingid = req.params;
  let setting = await settingService.getSettingById(settingid);

  if (!setting) {
    console.log({
      setting,
    });
    throw new ApiError(httpStatus.NOT_FOUND, "Setting not found");
  }
  await settingService.deleteSettingById(settingid);

  res.send({ success: true, message: "Deleted successfully!" });
});

module.exports = {
  createSetting,
  getSettingById,
  getSettings,
  getUserSettings,
  updateSetting,
  deleteSetting,
};
