const winston = require("winston"),
  config = require("./config");

const enumeratedErrorFormat = winston.format((info) => {
  if (info instanceof Error) {
    Object.assign(info, { message: info.stack });
  }
  return info;
});

const logger = winston.createLogger({
  level: config.env === "development" ? "debug" : "info",
  format: winston.format.combine(
    enumeratedErrorFormat(),
    config.env === "development"
      ? winston.format.colorize()
      : winston.format.uncolorize(),
    winston.format.timestamp(),
    winston.format.splat(),
    winston.format.printf(({ level, message }) => `${level} : ${message}`)
  ),
  transports: [
    new winston.transports.Console({
      stderrLevels: ["error"],
    }),
  ],
});

module.exports = logger;
