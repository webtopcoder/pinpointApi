const passport = require("passport");
const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
var cls = require("cls-hooked");
var ns = cls.createNamespace("request");

/**
 * Verify user permission
 *  @module auth
 * @param {Object} req
 * @param {Function} resolve
 * @param {Function} reject
 * @param {Object} [requiredRights] - required rights
 * @param {Object} [requiredRights.resource] - required resource
 * @param {Object} [requiredRights.method] - required permission
 * @returns {Function}
 */
const verifyCallback = (req, resolve, reject) => async (err, user, info) => {
  if (err || info || !user) {
    return reject(new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate"));
  }
  req.user = user;
  resolve(user);
};

const auth =
  (allowAnonymous = false) =>
  async (req, res, next) => {
    const passportMiddleware = allowAnonymous ? ["jwt", "anonymous"] : ["jwt"];
    return new Promise((resolve, reject) => {
      passport.authenticate(
        passportMiddleware,
        { session: false },
        verifyCallback(req, resolve, reject)
      )(req, res, next);
    })
      .then((user) => {
        ns.run(() => {
          ns.set("user", user);
          next();
        });
      })
      .catch((err) => next(err));
  };

module.exports = auth;
