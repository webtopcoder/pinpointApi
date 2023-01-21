const httpStatus = require("http-status"),
  { Contact } = require("@models"),
  ApiError = require("@utils/ApiError"),
  customLabels = require("@utils/customLabels"),
  defaultSort = require("@utils/defaultSort");

/**
 * Create a Contact
 * @param { Object } contactBody
 * @returns {Promise<Contact>}
 * @throws {ApiError}
 */
const createContact = async ({ user, subject, content }) => {
  const contact = await Contact.create({
    user,
    subject,
    content,
  });
  return contact;
};
