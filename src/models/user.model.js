const bcrypt = require("bcryptjs");
const validator = require("validator");
const { toJSON } = require("./plugins");

const soft_delete = require("mongoose-delete");

module.exports = ({ Schema, model }, mongoosePaginate) => {
  const UserSchema = new Schema(
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
      isEmailVerified: {
        type: Boolean,
        default: false,
      },
      status: {
        type: String,
        enum: ["pending", "suspended", "banned", "active"],
        default: "active",
      },
      role: {
        type: String,
        enum: ["user", "partner"],
        required: true,
      },
      dob: {
        type: Date,
      },
      address: {
        city: { type: String },
        state: { type: String },
      },
      category: { type: String, required: false },
      profile: {
        about: { type: String },
        social: { type: Object },
        notification: { type: Object },
        avatar: { type: String },
      },
      profilePicture: {
        type: Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },
    },
    {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
    }
  );

  UserSchema.index({ email: 1, deletedAt: 1 }, { unique: true });
  UserSchema.plugin(soft_delete, {
    deletedBy: true,
    deletedAt: true,
    overrideMethods: "all",
  });
  UserSchema.plugin(toJSON);
  UserSchema.plugin(mongoosePaginate);

  /**
   * Check if email is taken
   * @param {string} email - The user's email
   * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
   * @returns {Promise<boolean>}
   */
  UserSchema.statics.isEmailTaken = async function (email, excludeUserId) {
    const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
    return !!user;
  };

  /**
   * Check if password matches the user's password
   * @param {string} password
   * @returns {Promise<boolean>}
   */
  UserSchema.methods.isPasswordMatch = async function (password) {
    const user = this;
    return bcrypt.compare(password, user.password);
  };

  UserSchema.pre("save", async function (next) {
    const user = this;
    if (user.isModified("password")) {
      user.password = await bcrypt.hash(user.password, 8);
    }
    next();
  });

  /**
   * @typedef User
   */
  return model("User", UserSchema);
};
