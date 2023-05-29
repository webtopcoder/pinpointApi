const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const { newpartnersService } = require("@services");
const { uploadMedia } = require("../services/media.service");
const pick = require("@utils/pick");
const ApiError = require("../utils/ApiError");

const getnewpartnersForNewpartnerSection = catchAsync(async (req, res) => {
  const testimoials = await newpartnersService.getnewpartnersForNewpartnerSection();

  res.send({
    data: testimoials,
  });
});

const getNewpartners = catchAsync(async (req, res) => {
  const filter = pick(req.query, ["q", "isArchived"]);
  const options = pick(req.query, ["sort", "limit", "page"]);

  if (options.sort) {
    options.sort = options.sort.split(",").map((field) => field.split(":"));
  }

  if (filter.q) {
    filter["$or"] = [
      { username: { $regex: filter.q, $options: "i" } },
      { category: { $regex: filter.q, $options: "i" } },
      { content: { $regex: filter.q, $options: "i" } },
    ];
    delete filter.q;
  }

  options.populate = ["category"];

  const result = await newpartnersService.getNewpartners(filter, options);
  res.send(result);
});

const getNewpartnerById = catchAsync(async (req, res) => {
  const result = await newpartnersService.getNewpartnerById(req.params.testimonialId);
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "NewPartner not found");
  }
  res.send(result);
});

const createNewpartners = catchAsync(async (req, res) => {
  if (req.file) {
    const media = await uploadMedia(req.file, req.user._id, true);
    req.body.image = media._id;
  }
  const result = await newpartnersService.createNewpartner(req.body);
  res.status(httpStatus.CREATED).send(result);
});

const updateNewpartnerById = catchAsync(async (req, res) => {
  const testimoial = await newpartnersService.updateNewpartnerById(req.params.testimonialId, req.body);
  res.send(testimoial);
});

const deleteNewpartnerById = catchAsync(async (req, res) => {
  await newpartnersService.deleteNewpartnerById(req.params.testimonialId);
  res.status(httpStatus.NO_CONTENT).send();
});

const ChangeAvatar = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No file uploaded");
  }

  const media = await uploadMedia(req.file, id, true);
  await newpartnersService.updateTestimonialById(id, {
    image: media._id
  });

  return res.json({ success: true, avatar: media });
});

module.exports = {
  getnewpartnersForNewpartnerSection,
  getNewpartners,
  getNewpartnerById,
  createNewpartners,
  updateNewpartnerById,
  deleteNewpartnerById,
  ChangeAvatar
};
