const httpStatus = require("http-status"),
  { FAQ } = require("@models"),
  ApiError = require("@utils/ApiError"),
  customLabels = require("@utils/customLabels"),
  defaultSort = require("@utils/defaultSort");
const mongoose = require("mongoose-fill");

const getFaqForFAQSection = async () => {
  const faqs = await FAQ.find({ isArchived: true });
  return faqs;
};

const getFaqs = async (filter, options) => {
  const faqs = await FAQ.paginate(filter, {
    ...options,
    customLabels,
  });
  return faqs;
};

const getFaqById = async (faqId) => {
  const faq = await FAQ.findById(faqId);
  if (!faq) {
    throw new ApiError(httpStatus.NOT_FOUND, "FAQ not found");
  }

  return faq;
};

const createFaq = async (faqBody) => {
  const faq = await FAQ.create(faqBody);
  return faq;
};

const updateFaqById = async (faqId, updateBody) => {
  const faq = await getFaqById(faqId);
  if (!faq) {
    throw new ApiError(httpStatus.NOT_FOUND, "FAQ not found");
  }
  Object.assign(faq, updateBody);
  await faq.save();
  return faq;
};

const deleteFaqById = async (faqId) => {
  const faq = await getFaqById(faqId);
  if (!faq) {
    throw new ApiError(httpStatus.NOT_FOUND, "FAQ not found");
  }
  await faq.delete();
  return faq;
};

const bulkAction = async (selectedIds, status) => {
  const objectMailIds = selectedIds.map((id) => mongoose.Types.ObjectId(id));
  if (status === "deleted") {
    objectMailIds.map(async activitiID => {
      await deleteFaqById(activitiID)
    });
  }
  else {
    objectMailIds.map(async activitiID => {
      await updateFaqById(activitiID, { isArchived: status })
    });
  }
};

module.exports = {
  getFaqForFAQSection,
  getFaqs,
  getFaqById,
  createFaq,
  updateFaqById,
  deleteFaqById,
  bulkAction
};
