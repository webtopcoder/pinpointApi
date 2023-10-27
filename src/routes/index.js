const express = require("express"),
  config = require("../config/config");

const router = express.Router();
const defaultRoutes = [
  {
    path: "/auth",
    route: require("./auth.route"),
  },
  {
    path: "/faq",
    route: require("./faq.route"),
  },
  {
    path: "/share",
    route: require("./share.route"),
  },
  {
    path: "/categories",
    route: require("./category.route"),
  },
  {
    path: "/contact",
    route: require("./contact.route"),
  },
  {
    path: "/follow",
    route: require("./follow.route"),
  },
  {
    path: "/locations",
    route: require("./location.route"),
  },
  {
    path: "/event",
    route: require("./event.route"),
  },
  {
    path: "/profile",
    route: require("./profile.route"),
  },
  {
    path: "/comment",
    route: require("./comment.route"),
  },
  {
    path: "/mail",
    route: require("./mail.route"),
  },
  {
    path: "/media",
    route: require("./media.route"),
  },
  {
    path: "/notification",
    route: require("./notification.route"),
  },
  {
    path: "/setting",
    route: require("./setting.route"),
  },
  {
    path: "/profile/shoutout",
    route: require("./shoutout.route.js"),
  },
  {
    path: "/partnership",
    route: require("./partnership.route.js"),
  },
  {
    path: "/post",
    route: require("./post.route"),
  },
  {
    path: "/statistics",
    route: require("./statistics.route"),
  },
  {
    path: "/admin",
    route: require("./admin.route"),
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

const devRoutes = [
  {
    path: "/docs",
    route: require("./docs.route"),
  },
];

if (config.env === "development") {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

module.exports = router;
