const express = require("express"),
  helmet = require("helmet"),
  xss = require("xss-clean"),
  cookieParser = require("cookie-parser"),
  mongoSanitize = require("express-mongo-sanitize"),
  compression = require("compression"),
  cors = require("cors"),
  passport = require("passport"),
  httpStatus = require("http-status"),
  config = require("./config/config"),
  morgan = require("./config/morgan"),
  { jwtStrategy } = require("./config/passport"),
  AnonymousStrategy = require("passport-anonymous"),
  { errorConverter, errorHandler } = require("./middlewares/error"),
  ApiError = require("./utils/ApiError"),
  path = require("path"),
  serveStatic = require("serve-static"),
  swaggerUi = require("swagger-ui-express"),
  expressOasGenerator = require("express-oas-generator"),
  httpContext = require("express-http-context");

const app = express();
expressOasGenerator.handleResponses(app, {});
if (config.env !== "test") {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}
app.use(httpContext.middleware);

app.use(helmet());
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(mongoSanitize());
app.use(compression());

app.options("*", cors());

app.use(passport.initialize());
passport.use(new AnonymousStrategy());
passport.use("jwt", jwtStrategy);

app.get("/health", (req, res) => {
  res.status(200).send("ok");
});
app.use(cookieParser());

const routes = require("./routes");
app.use("/api/v1", routes);
app.use(serveStatic(path.join(__dirname, "public")));

// const swaggerDocument = require("./config/swagger.json");
// const options = {
//   swaggerOptions: {
//     validatorUrl: null,
//   },
// };
//
// app.use(
//   "/api-docs",
//   swaggerUi.serve,
//   swaggerUi.setup(swaggerDocument, options)
// );

app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, "Not found"));
});

app.use(errorConverter);

app.use(errorHandler);
expressOasGenerator.handleRequests();

module.exports = {
  app,
};
