const Joi = require("joi");

const getLatestActivities = {
  query: Joi.object().keys({
    limit: Joi.number().integer().min(1).max(50).default(5),
    page: Joi.number().integer().min(1).default(1),
  }),
};

const getLatestTransactions = {
  query: Joi.object().keys({
    status: Joi.string()
      .valid("pending", "completed", "failed")
      .default("completed"),
    limit: Joi.number().integer().min(1).max(100).default(10),
    page: Joi.number().integer().min(1).default(1),
  }),
};

module.exports = {
  getLatestActivities,
  getLatestTransactions,
};
