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
  let filter = pick(req.query, []);
  let options = pick(req.query, ["limit", "page", "sort"]);
  if (filter.q) {
    filter.title = { $regex: filter.q, $options: "i" };
    delete filter.q;
  }
  filter = {
    ...filter,
    recipient: req.user._id,
  };
  options.populate = ["key", "value"];
  const result = await settingService.querySettings(filter, options);
  res.send(result);
});

const updateSetting = catchAsync(async (req, res) => {
  const { settingid } = req.params;
  const setting = await settingService.getSettingById(settingid);
  if (!setting) {
    throw new ApiError(httpStatus.NOT_FOUND, "Setting not found");
  }

  const data = {
    key: req.body.key,
    value: req.body.value,
  };

  await settingService.updateSettingById(settingid, data);
  res.send(setting);
});
const deleteSetting = catchAsync(async (req, res) => {
  const settingid = req.params;
  let setting = await settingService.getSettingById(settingid);
  setting = setting.toJSON();

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
  updateSetting,
  deleteSetting,
};
