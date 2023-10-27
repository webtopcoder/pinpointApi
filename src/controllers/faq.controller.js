const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const { faqService } = require("@services");
const pick = require("@utils/pick");
const ApiError = require("../utils/ApiError");

const getFaqForFAQSection = catchAsync(async (req, res) => {
  const faqs = await faqService.getFaqForFAQSection();
  res.send({
    data: faqs,
  });
});

const getFaqs = catchAsync(async (req, res) => {
  const filter = pick(req.query, ["q", "isArchived"]);
  const options = pick(req.query, ["sort", "limit", "page"]);

  if (options.sort) {
    options.sort = options.sort.split(",").map((field) => field.split(":"));
  }

  if (filter.q) {
    filter["$or"] = [
      { question: { $regex: filter.q, $options: "i" } },
      { answer: { $regex: filter.q, $options: "i" } },
    ];
  }

  delete filter.q;
  const result = await faqService.getFaqs(filter, options);
  console.log(result)
  res.send(result);
});

const getFaqById = catchAsync(async (req, res) => {
  const faq = await faqService.getFaqById(req.params.faqId);
  if (!faq) {
    throw new ApiError(httpStatus.NOT_FOUND, "FAQ not found");
  }
  res.send(faq);
});

const createFaq = catchAsync(async (req, res) => {
  const faq = await faqService.createFaq(req.body);
  res.status(httpStatus.CREATED).send(faq);
});

const updateFaqById = catchAsync(async (req, res) => {
  const faq = await faqService.updateFaqById(req.params.faqId, req.body);
  res.send(faq);
});

const deleteFaqById = catchAsync(async (req, res) => {
  await faqService.deleteFaqById(req.params.faqId);
  res.status(httpStatus.NO_CONTENT).send();
});

const bulkActions = catchAsync(async (req, res) => {
  const { action, selectedIds } = req.body;
  await faqService.bulkAction(selectedIds, action);

  return res.json({ success: true, message: "Action performed successfully!" });
});

module.exports = {
  getFaqForFAQSection,
  getFaqs,
  getFaqById,
  createFaq,
  updateFaqById,
  deleteFaqById,
  bulkActions
};
