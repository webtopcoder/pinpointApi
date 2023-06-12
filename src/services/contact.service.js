const httpStatus = require("http-status"),
  { Contact, User } = require("@models"),
  ApiError = require("@utils/ApiError"),
  customLabels = require("@utils/customLabels"),
  defaultSort = require("@utils/defaultSort");
  const { events, EventEmitter } = require("@events");

/**
 * Create a Contact
 * @param { Object } contactBody
 * @returns {Promise<Contact>}
 * @throws {ApiError}
 */
const createContact = async (body) => {
  const contact = await Contact.create(body);
  const adminInfo = await User.findOne({ role: "admin" })
  EventEmitter.emit(events.SEND_NOTIFICATION, {
    recipient: adminInfo._id,
    type: "contact",
    title: "New Contact Submission",
    description: `You have received new contact submission`,
    url: `/contacts`,
  });
  return contact;
};

const getContacts = async (filter, options) => {
  const contact = await Contact.paginate(filter, {
    ...options,
    customLabels,
  });
  return contact;
};

const getContactById = async (contactID) => {
  const contact = await Contact.findById(contactID);
  if (!contact) {
    throw new ApiError(httpStatus.NOT_FOUND, "Contact not found");
  }

  return contact;
};

const deleteContactById = async (contactID) => {
  const contact = await getContactById(contactID);
  if (!contact) {
    throw new ApiError(httpStatus.NOT_FOUND, "Contact not found");
  }
  await contact.delete();
  return contact;
};
module.exports = {
  createContact,
  getContacts,
  getContactById,
  deleteContactById
};
