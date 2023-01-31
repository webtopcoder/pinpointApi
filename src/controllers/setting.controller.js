const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const ApiError = require("@utils/ApiError");
const { settingService } = require("@services");
const pick = require("../utils/pick");

const getUserSettings = catchAsync(async (req, res) => {
  let filter = {};
  let options = pick(req.query, ["limit", "page", "sort"]);
  const userId = req.user._id;
  const result = await settingService.querySettings(
    { ...filter, user: userId },
    options
  );
  res.send(result);
});
const createOrUpdateSetting = catchAsync(async (req, res) => {
  const result = await settingService.getSettings({
    key: req.body.key,
    user: req.user._id,
  });
  console.log(result);
  if (result.length == 0) {
    const createBody = { ...req.body, user: req.user._id };
    const setting = await settingService.createSetting(createBody);
    res.status(httpStatus.CREATED).send({ success: true, setting });
  } else {
    const updateBody = req.body;
    console.log(result);
    let updatedResult = await Promise.all(
      result.map(async (setting) => {
        let updatedSetting;
        updatedSetting = await settingService.updateSetting(setting, {
          ...updateBody,
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
};
