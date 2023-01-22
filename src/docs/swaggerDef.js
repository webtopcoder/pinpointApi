const swaggerDef = {
  openapi: "3.0.0",
  info: {
    title: "Pinpoint API documentation",
    version: "1.0.0",
    license: {
      name: "MIT",
      url: "",
    },
    description: "http://localhost:8080/api/v1/docs/swagger",
  },
  servers: [{ url: `http://localhost:8080/api/v1` }],
};

module.exports = swaggerDef;
