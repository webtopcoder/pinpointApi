const express = require("express"),
  config = require("../config/config");

const router = express.Router();
const defaultRoutes = [
  {
    path: "/auth",
    route: require("./auth.route"),
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
    path: "/profile",
    route: require("./profile.route"),
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
