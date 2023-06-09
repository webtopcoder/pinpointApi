const bcrypt = require("bcryptjs");
const validator = require("validator");
const { toJSON } = require("./plugins");

const soft_delete = require("mongoose-delete");

module.exports = ({ Schema, model, Types }, mongoosePaginate) => {
  const AdminSchema = new Schema(
    {
      firstName: { type: String, required: true, trim: true },
      lastName: { type: String, required: true, trim: true },
      username: { type: String, required: true },
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
              "Password must contain at least one letter and one number"
            );
          }
        },
        private: true, // used by the toJSON plugin
      },
      role: {
        type: String,
        default: "admin",
      },
    },
    {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
    }
  );

  AdminSchema.index({ email: 1, deletedAt: 1 }, { unique: true });
  // AdminSchema.plugin(soft_delete, {
  //   deletedBy: true,
  //   deletedAt: true,
  //   overrideMethods: "all",
  // });
  AdminSchema.plugin(toJSON);
  AdminSchema.plugin(mongoosePaginate);

  AdminSchema.virtual("name").get(function () {
    return `${this.firstName} ${this.lastName}`;
  });

  /**
   * Check if email is taken
   * @param {string} email - The user's email
   * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
   * @returns {Promise<boolean>}
   */
  AdminSchema.statics.isEmailTaken = async function (email, excludeUserId) {
    const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
    return !!user;
  };

  /**
   * Check if password matches the user's password
   * @param {string} password
   * @returns {Promise<boolean>}
   */
  AdminSchema.methods.isPasswordMatch = async function (password) {
    const user = this;
    return bcrypt.compare(password, user.password);
  };

  AdminSchema.pre("save", async function (next) {
    const user = this;
    if (user.isModified("password")) {
      user.password = await bcrypt.hash(user.password, 8);
    }
    next();
  });

  /**
   * @typedef Admin
   */
  return model("Admin", AdminSchema);
};
