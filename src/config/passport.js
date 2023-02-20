const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const config = require("./config");
const { tokenTypes } = require("./tokens");
const { userService } = require("@services");
const adminService = require("../services/admin.service");

const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  passReqToCallback: false,
};

const jwtVerify = async (payload, done) => {
  try {
    if (payload.type !== tokenTypes.ACCESS) {
      throw new Error("Invalid token type");
    }

    if (payload.role == "admin") {
      let admin = await adminService.getAdminById(payload.sub);
      admin = JSON.parse(JSON.stringify(admin));
      if (!admin) {
        return done(null, false);
      }

      done(null, admin);
    }

    let user = await userService.getUserById(payload.sub);
    user = JSON.parse(JSON.stringify(user));
    if (!user) {
      return done(null, false);
    }

    done(null, user);
  } catch (error) {
    done(error, false);
  }
};

const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);

module.exports = {
  jwtStrategy,
};
