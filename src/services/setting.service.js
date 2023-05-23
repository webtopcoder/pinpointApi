const httpStatus = require("http-status"),
  { Setting, Additionaluser, User } = require("../models"),
  customLabels = require("../utils/customLabels"),
  defaultSort = require("../utils/defaultSort"),
  ApiError = require("../utils/ApiError");
const { events, EventEmitter } = require("@events");

const createSetting = async (settingBody) => {

  if (settingBody.key == "user:additionalUser") {
    EventEmitter.emit(events.SEND_ADDITION_USER, {
      NewUser: settingBody.value[settingBody.value.length - 1],
      user_id: settingBody.user
    });
  }
  const setting = await Setting.create(settingBody);
  return setting;

};

const createAdditionalItem = async (owner, AdditionalBody) => {
  const setting = await Additionaluser.create(AdditionalBody);
  EventEmitter.emit(events.SEND_ADDITION_USER, {
    owner_id: owner,
    additional: AdditionalBody,
  });

  return setting;
};

const getSettingByKey = async ({ key }) => {
  const setting = await Setting.findOne({ key });
  return setting;
};
const getSettings = async (filter) => {
  const settings = await Setting.find(filter).populate('extra');
  return settings;
};

const querySettings = async (filter, options) => {
  const settings = await Setting.paginate(filter, {
    customLabels,
    sort: defaultSort,
    ...options,
  });
  return settings;
};

const getSettingById = async (id, populate) => {
  const setting = await Setting.findById(id).populate(populate);
  if (!setting) {
    throw new ApiError(httpStatus.NOT_FOUND, "Setting not found");
  }
  return setting;
};

const updateSettingById = async (settingId, updateBody) => {
  const setting = await getSettingById(settingId);
  if (!setting) {
    throw new ApiError(httpStatus.NOT_FOUND, "Setting not found");
  }
  Object.assign(setting, updateBody);
  await setting.save();
  return setting;
};

const updateSetting = async (setting, updateBody) => {
  if (updateBody.key == "user:additionalUser") {
    EventEmitter.emit(events.SEND_ADDITION_USER, {
      NewUser: updateBody.value[updateBody.value.length - 1],
      user_id: updateBody.user
    });
  }
  Object.assign(setting, updateBody);
  await setting.save();
  return setting;
};
const deleteSettingById = async (settingId) => {
  const setting = await getSettingById(settingId);
  if (!setting) {
    throw new ApiError(httpStatus.NOT_FOUND, "Setting not found");
  }
  await setting.delete();
  return setting;
};

const deleteAdditionUser = async (id) => {
  const setting = await Additionaluser.findById(id);
  if (!setting) {
    throw new ApiError(httpStatus.NOT_FOUND, "Setting not found");
  }
  await setting.delete();
  return setting;
};

const updateAdditionUser = async (id, updateBody) => {
  const setting = await Additionaluser.findById(id);
  if (!setting) {
    throw new ApiError(httpStatus.NOT_FOUND, "Setting not found");
  }
  Object.assign(setting, updateBody);
  await setting.save();
  return setting;
};

const getAdditionUser = async (id) => {
  const setting = await Additionaluser.findById(id);
  if (!setting) {
    throw new ApiError(httpStatus.NOT_FOUND, "Setting not found");
  }
  return setting;
};

module.exports = {
  createSetting,
  getSettings,
  querySettings,
  getSettingByKey,
  getSettingById,
  updateSettingById,
  deleteSettingById,
  updateSetting,
  createAdditionalItem,
  deleteAdditionUser,
  updateAdditionUser,
  getAdditionUser
};
