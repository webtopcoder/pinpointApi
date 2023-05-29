const httpStatus = require("http-status"),
  { Newpartners } = require("@models"),
  ApiError = require("@utils/ApiError"),
  customLabels = require("@utils/customLabels"),
  defaultSort = require("@utils/defaultSort");

const getnewpartnersForNewpartnerSection = async () => {

  const testimonials = await Newpartners.find({ isArchived: true }).populate(["image", "category"]);
  return testimonials;
};

const getNewpartners = async (filter, options) => {
  const result = await Newpartners.paginate(filter, {
    ...options,
    customLabels,
  });
  return result;
};

const getNewpartnerById = async (testimonialId) => {
  const testimonial = await Newpartners.findById(testimonialId).populate(["image"]);
  if (!testimonial) {
    throw new ApiError(httpStatus.NOT_FOUND, "Testimonial not found");
  }

  return testimonial;
};

const createNewpartner = async (reqBody) => {
  const result = await Newpartners.create(reqBody);
  return result;
};

const updateNewpartnerById = async (testimonialId, updateBody) => {
  const testimonial = await getNewpartnerById(testimonialId);
  if (!testimonial) {
    throw new ApiError(httpStatus.NOT_FOUND, "Testimonial not found");
  }
  Object.assign(testimonial, updateBody);
  await testimonial.save();
  return testimonial;
};

const deleteNewpartnerById = async (testimonialId) => {
  const result = await getNewpartnerById(testimonialId);
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Testimonial not found");
  }
  await result.delete();
  return result;
};

module.exports = {
  getnewpartnersForNewpartnerSection,
  getNewpartners,
  getNewpartnerById,
  createNewpartner,
  updateNewpartnerById,
  deleteNewpartnerById,
};