const mongoose = require("mongoose");
const { app } = require("./app");
const config = require("./config/config");
const logger = require("./config/logger");
const { Socket } = require("./socket/socket");
const crons = require("./crons");

let server;

mongoose.set("strictQuery", false);
mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  logger.info("Connected to Database");
  server = app.listen(config.port, () => {
    logger.info(`Listening to port ${config.port}`);
  });
  Socket(server);
  crons.start().then(() => {
    logger.info("Crons started");
  });
});

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info("Server closed");
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);

process.on("SIGTERM", () => {
  logger.info("SIGTERM received");
  if (server) {
    server.close();
  }
});
