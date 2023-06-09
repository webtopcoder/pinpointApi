const { toJSON, diffHistory } = require("./plugins");
const softDelete = require("mongoose-delete");
const validator = require("validator");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const bcrypt = require("bcryptjs");

module.exports = ({ Schema, Types, model }, mongoosePaginate) => {
  const Additionaluser = new Schema(
    {
      owner: {
        type: Types.ObjectId,
        ref: "User",
      },
      email: {
        type: String,
        lowercase: true,
        trim: true,
        sparse: true,
        default: "",
        validate(value) {
          if (value && !validator.isEmail(value)) {
            throw new Error("Invalid email");
          }
        },
      },
      password: {
        type: String,
        trim: true,
        minlength: 8,
        validate(value) {
          if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
            throw new Error(
              "Password must contain at least one letter and one number",
            );
          }
        },
        private: true, // used by the toJSON plugin
      },
      role: {
        type: String,
        enum: ["Location Manager", "Owner"],
      },
      locations: [
        {
          type: Types.ObjectId,
          ref: "Location",
        },
      ],
      status: {
        type: String,
        enum: ["pending", "inactive", "active"],
        default: "pending",
      },
    },
    {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
    }
  );

  // Additionaluser.plugin(softDelete, {
  //   deletedBy: true,
  //   deletedAt: true,
  //   overrideMethods: "all",
  // });
  Additionaluser.plugin(toJSON);
  Additionaluser.plugin(mongoosePaginate);
  Additionaluser.plugin(aggregatePaginate);

  Additionaluser.methods.isPasswordMatch = async function (password) {
    const user = this;
    return bcrypt.compare(password, user.password);
  };

  Additionaluser.pre("save", async function (next) {
    const user = this;
    if (user.isModified("password")) {
      user.password = await bcrypt.hash(user.password, 8);
    }
    next();
  });

  /**
   * @typedef Additionaluser
   */
  return model("Additionaluser", Additionaluser);
};
