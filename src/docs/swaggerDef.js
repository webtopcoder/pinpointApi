const config = require("@configs/config");
const swaggerDef = {
  openapi: "3.0.0",
  info: {
    title: "Pinpoint API documentation",
    version: "1.0.0",
    license: {
      name: "MIT",
      url: "",
    },
    description: `${config.swagger.url}/api/v1/docs/swagger`,
  },
  servers: [{ url: `${config.swagger.url}/api/v1` }],
};

module.exports = swaggerDef;
