const mongoosePaginate = require("mongoose-paginate-v2");
const mongoose = require("mongoose-fill");

module.exports.User = require("./user.model")(mongoose, mongoosePaginate);
module.exports.Token = require("./token.model")(mongoose, mongoosePaginate);
module.exports.Mail = require("./mail.model")(mongoose, mongoosePaginate);
module.exports.MailReply = require("./mailreply.model")(mongoose, mongoosePaginate);
module.exports.Like = require("./like.model")(mongoose, mongoosePaginate);
module.exports.Additionaluser = require("./additionaluser.model")(mongoose, mongoosePaginate);
module.exports.Contact = require("./contact.model")(mongoose, mongoosePaginate);
module.exports.Category = require("./category.model")(
  mongoose,
  mongoosePaginate
);
module.exports.Schedule = require("./schedule.model")(
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
module.exports.Location = require("./location.model")(
  mongoose,
  mongoosePaginate
);

module.exports.Arrival = require("./arrival.model")(
  mongoose,
  mongoosePaginate
);

module.exports.Review = require("./review.model")(mongoose, mongoosePaginate);
module.exports.Comment = require("./comment.model")(mongoose, mongoosePaginate);
module.exports.Notification = require("./notification.model")(
  mongoose,
  mongoosePaginate
);

module.exports.Setting = require("./setting.model")(mongoose, mongoosePaginate);

module.exports.Shoutout = require("./shoutout.model")(
  mongoose,
  mongoosePaginate
);
module.exports.Partnership = require("./partnership.model")(
  mongoose,
  mongoosePaginate
);

module.exports.Transaction = require("./transaction.model")(
  mongoose,
  mongoosePaginate
);

module.exports.Order = require("./order.model")(mongoose, mongoosePaginate);
module.exports.Admin = require("./adminUser.model")(mongoose, mongoosePaginate);
module.exports.FAQ = require("./faq.model")(mongoose, mongoosePaginate);
module.exports.Testimonial = require("./testimonial.model")(mongoose, mongoosePaginate);
module.exports.Newpartners = require("./newpartners.model")(mongoose, mongoosePaginate);
module.exports.Emailing = require("./emailing.model")(mongoose, mongoosePaginate);

