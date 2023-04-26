const Joi = require("joi");

const getLatestActivities = {
  query: Joi.object().keys({
    status: Joi.string()
      .valid("deleted", "active")
      .default(""),
    q: Joi.string().allow(""),
    limit: Joi.number().integer().min(1).max(100).default(10),
    page: Joi.number().integer().min(1).default(1),
    type: Joi.string()
      .valid("Post", "Shoutout", "Media", "Review")
      .default("Post"),
    sort: Joi.string().default("createdAt:desc"),

  }),
};

const getLatestTransactions = {
  query: Joi.object().keys({
    status: Joi.string()
      .valid("pending", "completed", "failed")
      .default("completed"),
    limit: Joi.number().integer().min(1).max(100).default(10),
    page: Joi.number().integer().min(1).default(1),
    sort: Joi.string().default("createdAt:desc"),
  }),
};

module.exports = {
  getLatestActivities,
  getLatestTransactions,
};
