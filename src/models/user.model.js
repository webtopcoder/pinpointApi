const bcrypt = require("bcryptjs");
const validator = require("validator");
const { toJSON } = require("./plugins");
const soft_delete = require("mongoose-delete");
const SocialSchema = require("./schemas/social.schema");
const PollSchema = require("./schemas/poll.schema");
const stripeService = require("../services/stripe.service");

module.exports = ({ Schema, model, Types }, mongoosePaginate) => {
  const ProfileSchema = new Schema(
    {
      avatar: {
        type: Schema.Types.ObjectId,
        ref: "Media",
        default: null,
      },
      about: { type: String, default: "" },
      social: SocialSchema,
      poll: PollSchema,
      notification: { type: Object },
    },
    { _id: false },
  );

  const UserSchema = new Schema(
    {
      firstName: { type: String, required: true, trim: true },
      lastName: { type: String, required: true, trim: true },
      username: { type: String, required: true },
      businessname: { type: String },
      profile: ProfileSchema,
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
      isEmailVerified: {
        type: Boolean,
        default: false,
      },
      status: {
        type: String,
        enum: ["pending", "declined", "banned", "active", "inactive"],
        default: "inactive",
      },
      role: {
        type: String,
        enum: ["user", "partner", "admin", "eventhost"],
        required: true,
      },
      dob: {
        type: Date,
      },
      address: {
        latitude: {
          type: Number,
        },
        longitude: {
          type: Number,
        },
        address: { type: String, default: "" },
        city: { type: String },
        state: { type: String },
        // state: { 
        //   label: { type: String }, 
        //   value: { type: String } 
        // },
      },
      category: { type: Types.ObjectId, ref: "Category", required: false },

      profileViews: {
        type: Number,
        default: 0,
      },

      locations: [
        {
          type: Types.ObjectId,
          ref: "Location",
        },
      ],

      favoriteLocations: [
        {
          type: Types.ObjectId,
          ref: "Location",
        },
      ],

      activePartnership: {
        type: Types.ObjectId,
        ref: "Partnership",
        default: null,
      },
      stripeCustomerId: {
        type: String,
        private: true,
      },
      // FIX: this should be a virtual field
      activeSubscription: {
        type: Schema.Types.Mixed,
        default: null,
      },
      partnershipPriceRenewalDate: {
        type: Date,
      },
    },
    {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
    },
  );

  UserSchema.index({ email: 1, deletedAt: 1 }, { unique: true });
  UserSchema.plugin(soft_delete, {
    deletedBy: true,
    deletedAt: true,
    overrideMethods: "all",
  });
  UserSchema.plugin(toJSON);
  UserSchema.plugin(mongoosePaginate);

  UserSchema.virtual("name").get(function () {
    return `${this.firstName} ${this.lastName}`;
  });

  UserSchema.methods.getStripeCustomerId = async function () {
    const user = this;
    if (!user.stripeCustomerId) {
      const data = {
        email: user.email,
        name: user.username,
        userId: user._id,
      };

      const customer = await stripeService.createCustomer(data);
      user.stripeCustomerId = customer.id;
      await user.save();
    }

    return user.stripeCustomerId;
  };

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

  UserSchema.statics.usernameTaken = async function (username, excludeUserId) {
    const user = await this.findOne({ username, _id: { $ne: excludeUserId } });
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
