const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const ApiError = require("@utils/ApiError");
const { contactService } = require("@services");

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

module.exports = {
  createContact,
};
