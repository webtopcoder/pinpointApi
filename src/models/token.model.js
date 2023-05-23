const { toJSON } = require("@models/plugins");
const { tokenTypes } = require("@configs/tokens");
const bcrypt = require("bcryptjs");

module.exports = ({ Schema, model }, mongoosePaginate) => {
  const tokenSchema = Schema(
    {
      token: {
        type: String,
        required: true,
        index: true,
      },
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      type: {
        type: String,
        enum: [
          tokenTypes.REFRESH,
          tokenTypes.RESET_PASSWORD,
          tokenTypes.VERIFY_EMAIL,
          tokenTypes.CREATE_ADDITION,
        ],
        required: true,
      },
      expires: {
        type: Date,
        required: true,
      },
      blacklisted: {
        type: Boolean,
        default: false,
      },
    },
    {
      timestamps: true,
    }
  );

  tokenSchema.plugin(toJSON);

  tokenSchema.pre("save", async function (next) {
    const token = this;
    if (token.isModified("token") && token.type !== tokenTypes.REFRESH) {
      token.token = await bcrypt.hash(token.token, 6);
    }
    next();
  });

  /**
   * Check if otp and otp type matches the token's otp and otp type
   * @param {string} otp
   * @param {string} otpType
   * @returns {Promise<boolean>}
   */
  tokenSchema.methods.isOtpMatch = async function (otp, otpType) {
    const token = this;
    return token.type === otpType && (await bcrypt.compare(otp, token.token));
  };

  tokenSchema.methods.isBlacklisted = async function () {
    const token = this;
    return token.blacklisted;
  };

  /**
   * @typedef Token
   */
  return model("Token", tokenSchema);
};
