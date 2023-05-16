const httpStatus = require("http-status"),
  { Partnership } = require("../models"),
  customLabels = require("../utils/customLabels"),
  defaultSort = require("../utils/defaultSort"),
  ApiError = require("../utils/ApiError");
const { User } = require("@models");

const createPartnership = async (partnershipBody) => {
  const partnership = new Partnership(partnershipBody);
  await partnership.save();
  return partnership;
};

const queryPartnerships = async (filter, options) => {
  const partnerships = await Partnership.paginate(filter, {
    customLabels,
    sort: defaultSort,
    ...options,
  });
  return partnerships;
};

const getPartnerships = async (filter) => Partnership.find(filter);

const getPartnershipById = async (id, populate) => {
  const partnership = await Partnership.findById(id).populate(populate);

  if (!partnership) {
    throw new ApiError(httpStatus.NOT_FOUND, "Partnership not found");
  }

  return partnership;
};

const updatePartnershipById = async (partnershipId, updateBody) => {
  const partnership = await getPartnershipById(partnershipId);

  if (!partnership) {
    throw new ApiError(httpStatus.NOT_FOUND, "Partnership not found");
  }

  Object.assign(partnership, updateBody);

  await partnership.save();
  return partnership;
};

const deletePartnershipById = async (partnershipId) => {
  const partnership = await getPartnershipById(partnershipId);
  if (!partnership) {
    throw new ApiError(httpStatus.NOT_FOUND, "Partnership not found");
  }

  await partnership.delete();
  return partnership;
};

const endPartnership = async () => {
  const users = await User.updateMany(
    {
      role: "partner",
      activeSubscription: null,
      partnershipPriceRenewalDate: { $lte: new Date() },
    },
    { activePartnership: null, partnershipPriceRenewalDate: null },
  );

  console.log("Partnerships ended: ", users.length);
};

module.exports = {
  createPartnership,
  queryPartnerships,
  getPartnershipById,
  updatePartnershipById,
  deletePartnershipById,
  getPartnerships,
  endPartnership,
};
