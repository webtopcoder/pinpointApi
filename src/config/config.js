const dotenv = require("dotenv"),
  path = require("path"),
  Joi = require("joi");

dotenv.config({
  path: path.join(
    __dirname,
    process.env.NODE_ENV === "production"
      ? "../../.env.production"
      : "../../.env.development"
  ),
});

const envVariableSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid("production", "development").required(),
    PORT: Joi.number().default(8080),
    MONGODB_URL: Joi.string().required().description("Mongo Database url"),
    JWT_SECRET: Joi.string().required().description("JWT secret key"),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number()
      .default(60)
      .description("minutes after which access tokens expire"),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number()
      .default(60)
      .description("days after which refresh tokens expire"),
    OTP_EXPIRATION_TIME_MINUTE: Joi.number()
      .default(5)
      .description("OTP Expiration Time"),
    SMTP_HOST: Joi.string().description("server that will send the emails"),
    SMTP_PORT: Joi.number().description("port to connect to the email server"),
    SMTP_USERNAME: Joi.string().description("username for email server"),
    SMTP_PASSWORD: Joi.string().description("password for email server"),
    EMAIL_FROM: Joi.string().description(
      "the from field in the emails sent by the app"
    ),
    SWAGGER_URL: Joi.string()
      .description("Swagger URL")
      .default("http://localhost:8080"),
  })
  .unknown();

const { value: envVars, error } = envVariableSchema
  .prefs({ errors: { label: "key" } })
  .validate(process.env);

if (error) {
  throw new Error(`Config Validation error: ${error.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  mongoose: {
    url: envVars.MONGODB_URL + (envVars.NODE_ENV === "test" ? "-test" : ""),
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
  },
  email: {
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      auth: {
        user: envVars.SMTP_USERNAME,
        pass: envVars.SMTP_PASSWORD,
      },
    },
    from: envVars.EMAIL_FROM,
  },
  otp: {
    expirationTime: envVars.OTP_EXPIRATION_TIME_MINUTE,
  },
  swagger: {
    url: envVars.SWAGGER_URL,
  },
};
