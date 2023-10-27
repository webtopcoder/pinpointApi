const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const ApiError = require("@utils/ApiError");
const { settingService, tokenService } = require("@services");
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

const getPartners = catchAsync(async (req, res) => {
  const { email } = req.params;
  const result = await settingService.getPartners(email);

  if (result.length === 0) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ code: 400, message: "You don't have any partner." });
  }
  res.send(result);
});

const createOrUpdateSetting = catchAsync(async (req, res) => {
  let additionalItem;
  const result = await settingService.getSettings({
    key: req.body.key,
    user: req.user._id,
  });

  req.body.key === "user:additionalUser" ? additionalItem = await settingService.createAdditionalItem(req.user._id, { ...req.body.value, owner: req.user._id }) : '';

  if (result.length == 0) {
    const createBody = "user:additionalUser" ?
      { ...req.body, extra: [additionalItem?._id], user: req.user._id } : { ...req.body, user: req.user._id };
    const setting = await settingService.createSetting(createBody);
    res.status(httpStatus.CREATED).send({ success: true, setting });
  } else {
    const updateBody = req.body;
    let updatedResult = await Promise.all(
      result.map(async (setting) => {
        let updatedSetting;
        updatedSetting = await settingService.updateSetting(setting, req.body.key === "user:additionalUser" ? {
          ...updateBody,
          extra: [...setting.extra, additionalItem._id],
          user: req.user._id,
        } : {
          ...updateBody,
          user: req.user._id,
        });
        return updatedSetting;
      })
    );
    res.send({ success: true, updatedResult });
  }
});

const loginUser = catchAsync(async (req, res, next) => {
  const { email, password, owner } = req.body;

  let user = await settingService.loginUserWithEmailAndPassword(email, password, owner);

  user = user.toJSON();

  const tokens = await tokenService.generateAuthTokens(user.owner);
  res.send({
    user,
    tokens,
  });
});

module.exports = {
  getUserSettings,
  createOrUpdateSetting,
  deleteAdditionUser,
  updateAdditionUser,
  getAdditionUser,
  updateAdditionUserWithPassword,
  loginUser,
  getPartners
};
