const mongoosePaginate = require("mongoose-paginate-v2");
const mongoose = require("mongoose-fill");

module.exports.User = require("./user.model")(mongoose, mongoosePaginate);
module.exports.Token = require("./token.model")(mongoose, mongoosePaginate);
module.exports.Mail = require("./mail.model")(mongoose, mongoosePaginate);
module.exports.Like = require("./like.model")(mongoose, mongoosePaginate);
module.exports.Contact = require("./contact.model")(mongoose, mongoosePaginate);
module.exports.Category = require("./category.model")(
  mongoose,
  mongoosePaginate
);
module.exports.Post = require("./post.model")(mongoose, mongoosePaginate);
module.exports.SubCategory = require("./subCategory.model")(
  mongoose,
  mongoosePaginate
);
module.exports.Media = require("./media.model")(mongoose, mongoosePaginate);
module.exports.Follow = require("./follow.model")(mongoose, mongoosePaginate);
