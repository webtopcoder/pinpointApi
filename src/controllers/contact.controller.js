const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const ApiError = require("@utils/ApiError");
const { contactService } = require("@services");
const pick = require("@utils/pick");

const createContact = catchAsync(async (req, res) => {
  const body = {
    user: {
      firstname: req.body.firstName,
      lastname: req.body.lastName,
      email: req.body.email,
    },
    subject: req.body.subject,
    message: req.body.messageContent,
    usertype: req.body.usertype,
  };
  const contact = await contactService.createContact(body);
  res.status(httpStatus.CREATED).send({ success: true, contact });
});

const getContacts = catchAsync(async (req, res) => {
  const filter = pick(req.query, ["q", "isArchived"]);
  const options = pick(req.query, ["sort", "limit", "page"]);

  if (options.sort) {
    options.sort = options.sort.split(",").map((field) => field.split(":"));
  }

  if (filter.q) {
    filter["$or"] = [
      { subject: { $regex: filter.q, $options: "i" } },
      { message: { $regex: filter.q, $options: "i" } },
    ];
    delete filter.q;
  }

  const result = await contactService.getContacts(filter, options);
  res.send(result);
});

const getContactById = catchAsync(async (req, res) => {
  const contact = await contactService.getContactById(req.params.ContactId);
  if (!contact) {
    throw new ApiError(httpStatus.NOT_FOUND, "Testimonial not found");
  }
  res.send(contact);
});

const deleteContactById = catchAsync(async (req, res) => {
  await contactService.deleteContactById(req.params.ContactId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createContact,
  getContacts,
  getContactById,
  deleteContactById
};
