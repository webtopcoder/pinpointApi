const mongoose = require("mongoose-fill");

const SocialSchema = new mongoose.Schema(
  {
    facebook: { type: String, default: "" },
    twitter: { type: String, default: "" },
    instagram: { type: String, default: "" },
    tiktok: { type: String, default: "" },
    snapchat: { type: String, default: "" },
    website: { type: String, default: "" },
  },
  { _id: false }
);

module.exports = SocialSchema;
