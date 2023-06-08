const httpStatus = require("http-status"),
  { Setting, Additionaluser, User } = require("../models"),
  customLabels = require("../utils/customLabels"),
  defaultSort = require("../utils/defaultSort"),
  { tokenService, userService } = require("@services"),
  { Token } = require("@models"),
  ApiError = require("../utils/ApiError"),
  { tokenTypes } = require("@configs/tokens");
const { events, EventEmitter } = require("@events");
const jwt = require("jsonwebtoken");
const config = require("../config/config");

const createSetting = async (settingBody) => {
  const setting = await Setting.create(settingBody);
  return setting;

};

const createAdditionalItem = async (owner, AdditionalBody) => {
  const setting = await Additionaluser.create(AdditionalBody);
  if (setting) {
    EventEmitter.emit(events.SEND_ADDITION_USER, {
      owner_id: owner,
      additional: AdditionalBody,
    });
  }
  return setting;
};

const getSettingByKey = async ({ key }) => {
  const setting = await Setting.findOne({ key });
  return setting;
};

const getSettingStatus = async (filter) => {
  const status = await Setting.findOne(filter);
  if (status && status.value !== "false")
    return true;
  else return false
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
  // if (updateBody.key == "user:additionalUser") {
  //   EventEmitter.emit(events.SEND_ADDITION_USER, {
  //     NewUser: updateBody.value[updateBody.value.length - 1],
  //     user_id: updateBody.user
  //   });
  // }
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

const updateAdditionUserWithPassword = async (token, query, updateBody) => {
  // try {
  const payload = jwt.verify(token, config.jwt.secret);

  const blacklisted = await Token.findOne({
    token: token,
    type: tokenTypes.CREATE_ADDITION,
    blacklisted: true,
  });

  if (
    !payload.sub ||
    blacklisted ||
    payload.type !== tokenTypes.CREATE_ADDITION
  ) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid token");
  }

  const user = await userService.getUserById(payload.sub);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const setting = await Additionaluser.findOne(query);
  if (!setting) {
    throw new ApiError(httpStatus.NOT_FOUND, "Setting not found");
  }
  Object.assign(setting, updateBody);
  await setting.save();

  await tokenService.saveToken(
    token,
    user.id,
    undefined,
    tokenTypes.CREATE_ADDITION,
    true
  );
  // } catch (error) {
  //   logger.error(error.stack);
  //   throw new ApiError(httpStatus.UNAUTHORIZED, "Update Additon User failed");
  // }
};

const getAdditionUser = async (id) => {
  const setting = await Additionaluser.findById(id);
  if (!setting) {
    throw new ApiError(httpStatus.NOT_FOUND, "Setting not found");
  }
  return setting;
};

const getAdditionUserWithEmailAndOwner = async (data) => {
  const setting = await Additionaluser.findOne(data).populate({
    path: "owner",
    populate: {
      path: "profile",
      populate: {
        path: "avatar"
      }
    }
  });

  if (!setting) {
    throw new ApiError(httpStatus.NOT_FOUND, "Setting not found");
  }
  return setting;
};

const getPartners = async (email) => {
  const partners = await Additionaluser.find({ email: email }).populate({
    path: "owner",
    populate: {
      path: "profile",
      populate: {
        path: "avatar"
      }
    }
  });
  if (!partners) {
    throw new ApiError(httpStatus.NOT_FOUND, "Setting not found");
  }
  return partners;
};

const loginUserWithEmailAndPassword = async (email, password, owner) => {
  const user = await getAdditionUserWithEmailAndOwner({ email: email, owner: owner });

  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect password");
  }

  if (user && ["pending", "suspended", "banned"].includes(user.status)) {
    if (user.status === "inactive")
      throw new ApiError(httpStatus.FORBIDDEN, "Account is inactive.");
    if (user.status === "banned")
      throw new ApiError(httpStatus.FORBIDDEN, "Account is banned.");
    if (user.status === "pending") {
      throw new ApiError(httpStatus.FORBIDDEN, "Account is not activated.");
    }
  }
  return user;
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
  updateAdditionUserWithPassword,
  getAdditionUser,
  loginUserWithEmailAndPassword,
  getPartners,
  getAdditionUserWithEmailAndOwner,
  getSettingStatus
};
