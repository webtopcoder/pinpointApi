const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const ApiError = require("@utils/ApiError");
const { settingService } = require("@services");
const pick = require("../utils/pick");

const getUserSettings = catchAsync(async (req, res) => {
  let filter = {};
  let options = pick(req.query, ["limit", "page", "sort"]);
  options.populate = [
    "extra",
  ];
  const userId = req.user._id;
  const result = await settingService.querySettings(
    { ...filter, user: userId },
    options
  );
  res.send(result);
});

const deleteAdditionUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await settingService.deleteAdditionUser(id);
  res.send(result);
});

const updateAdditionUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await settingService.updateAdditionUser(id, req.body);
  res.send(result);
});


const updateAdditionUserWithPassword = catchAsync(async (req, res) => {

  const { token, password, email, owner } = req.body;

  const result = await settingService.updateAdditionUserWithPassword(token, { email: email, owner: owner }, { password: password, status: 'active' });
  res.send(result);
});

const getAdditionUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await settingService.getAdditionUser(id);
  res.send(result);
});

const createOrUpdateSetting = catchAsync(async (req, res) => {
  const result = await settingService.getSettings({
    key: req.body.key,
    user: req.user._id,
  });

  const additionalItem = await settingService.createAdditionalItem(req.user._id, { ...req.body.value, owner: req.user._id });
  
  if (result.length == 0) {
    const createBody = { ...req.body, extra: [additionalItem._id], user: req.user._id };
    const setting = await settingService.createSetting(createBody);
    res.status(httpStatus.CREATED).send({ success: true, setting });
  } else {
    const updateBody = req.body;
    let updatedResult = await Promise.all(
      result.map(async (setting) => {
        let updatedSetting;
        updatedSetting = await settingService.updateSetting(setting, {
          ...updateBody,
          extra: [...setting.extra, additionalItem._id],
          user: req.user._id,
        });
        return updatedSetting;
      })
    );
    res.send({ success: true, updatedResult });
  }
});

module.exports = {
  getUserSettings,
  createOrUpdateSetting,
  deleteAdditionUser,
  updateAdditionUser,
  getAdditionUser,
  updateAdditionUserWithPassword
};
