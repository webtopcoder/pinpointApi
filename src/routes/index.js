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
