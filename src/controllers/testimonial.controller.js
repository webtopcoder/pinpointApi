const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const { testimonialService } = require("@services");
const { uploadMedia } = require("../services/media.service");
const pick = require("@utils/pick");
const ApiError = require("../utils/ApiError");

const gettestimonialForTestimonialSection = catchAsync(async (req, res) => {
  const testimoials = await testimonialService.gettestimonialForTestimonialSection();
  res.send({
    data: testimoials,
  });
});

const getTestimonials = catchAsync(async (req, res) => {
  const filter = pick(req.query, ["q", "isArchived"]);
  const options = pick(req.query, ["sort", "limit", "page"]);

  if (options.sort) {
    options.sort = options.sort.split(",").map((field) => field.split(":"));
  }

  if (filter.q) {
    filter["$or"] = [
      { username: { $regex: filter.q, $options: "i" } },
      { occupation: { $regex: filter.q, $options: "i" } },
      { content: { $regex: filter.q, $options: "i" } },
    ];
    delete filter.q;
  }

  const result = await testimonialService.getTestimonials(filter, options);
  res.send(result);
});

const getTestimonialById = catchAsync(async (req, res) => {
  const testimoial = await testimonialService.getTestimonialById(req.params.testimonialId);
  if (!testimoial) {
    throw new ApiError(httpStatus.NOT_FOUND, "Testimonial not found");
  }
  res.send(testimoial);
});

const createTestimonial = catchAsync(async (req, res) => {

  const { username, content, occupation } = req.body;

  const files = await Promise.all(
    req.files.map(async (file) => {
      const media = await uploadMedia(file, req.user._id);
      return media._id;
    })
  );

  let testimonialCreate = {
    username,
    content,
    occupation,
    files
  };

  const testimoial = await testimonialService.createTestimonial(testimonialCreate);
  res.status(httpStatus.CREATED).send(testimoial);
});

const updateTestimonialById = catchAsync(async (req, res) => {
  const testimoial = await testimonialService.updateTestimonialById(req.params.testimonialId, req.body);
  res.send(testimoial);
});

const deleteTestimonialById = catchAsync(async (req, res) => {
  await testimonialService.deleteTestimonialById(req.params.testimonialId);
  res.status(httpStatus.NO_CONTENT).send();
});

const ChangeAvatar = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No file uploaded");
  }

  const media = await uploadMedia(req.file, id, true);
  await testimonialService.updateTestimonialById(id, {
    files: media._id
  });

  return res.json({ success: true, avatar: media });
});

module.exports = {
  gettestimonialForTestimonialSection,
  getTestimonials,
  getTestimonialById,
  createTestimonial,
  updateTestimonialById,
  deleteTestimonialById,
  ChangeAvatar
};
