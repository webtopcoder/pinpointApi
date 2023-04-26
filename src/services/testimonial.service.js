const httpStatus = require("http-status"),
  { Testimonial } = require("@models"),
  ApiError = require("@utils/ApiError"),
  customLabels = require("@utils/customLabels"),
  defaultSort = require("@utils/defaultSort");

const gettestimonialForTestimonialSection = async () => {

  const testimonials = await Testimonial.find({ isArchived: true }).populate(["image"]);

  return testimonials;
};

const getTestimonials = async (filter, options) => {
  const testimonials = await Testimonial.paginate(filter, {
    ...options,
    customLabels,
  });
  return testimonials;
};

const getTestimonialById = async (testimonialId) => {
  const testimonial = await Testimonial.findById(testimonialId).populate(["image"]);
  if (!testimonial) {
    throw new ApiError(httpStatus.NOT_FOUND, "Testimonial not found");
  }

  return testimonial;
};

const createTestimonial = async (TestimonialBody) => {
  const testimonial = await Testimonial.create(TestimonialBody);
  return testimonial;
};

const updateTestimonialById = async (testimonialId, updateBody) => {
  const testimonial = await getTestimonialById(testimonialId);
  if (!testimonial) {
    throw new ApiError(httpStatus.NOT_FOUND, "Testimonial not found");
  }
  Object.assign(testimonial, updateBody);
  await testimonial.save();
  return testimonial;
};

const deleteTestimonialById = async (testimonialId) => {
  const testimonial = await getTestimonialById(testimonialId);
  if (!testimonial) {
    throw new ApiError(httpStatus.NOT_FOUND, "Testimonial not found");
  }
  await testimonial.delete();
  return testimonial;
};

module.exports = {
  gettestimonialForTestimonialSection,
  getTestimonials,
  getTestimonialById,
  createTestimonial,
  updateTestimonialById,
  deleteTestimonialById,
};
