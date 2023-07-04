const { toJSON } = require("./plugins");
const softDelete = require("mongoose-delete");
const validator = require("validator");

module.exports = ({ Schema, Types, model }, mongoosePaginate) => {
  const Schedule = new Schema(
    {
      type: {
        type: String,
        enum: ["private", "public"],
        required: true,
      },
      isActive: {
        type: Boolean,
        default: true
      },
      centerAddress: {
        latitude: {
          type: Number,
        },
        longitude: {
          type: Number,
        },
        address: { type: String, default: "" },
        city: { type: String },
        state: { type: String },
      },
      coordinates: {
        type: [Number],
      },
      title: {
        type: String,
        required: true,
      },
      eventhost: {
        type: Types.ObjectId,
        ref: "User",
        required: true,
      },
      event: {
        type: Types.ObjectId,
        ref: "Location",
        required: true,
      },
      images: {
        type: [
          {
            type: Types.ObjectId,
            ref: "Media",
          },
        ],
      },
      like: {
        type: Types.ObjectId,
        ref: "Like",
      },
      reviews: [
        {
          type: Types.ObjectId,
          ref: "Review",
        },
      ],
      isActive: {
        type: Boolean,
        default: false,
      },
      categories: [
        {
          type: Types.ObjectId,
          ref: "Category",
        },
      ],
      favoriteUsers: [
        {
          type: Types.ObjectId,
          ref: "User",
        },
      ],
      startDate: {
        type: Date,
      },
      endDate: {
        type: Date,
      },
      area: [
        {
          lat: {
            type: Number,
          },
          lng: {
            type: Number,
          },
        },
      ],
      request: [
        {
          firstname: {
            type: String,
          },
          lastname: {
            type: String,
          },
          businessname: {
            type: String,
          },
          id: {
            type: Types.ObjectId,
            ref: "User",
          },
          category: {
            type: String,
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
          isActive: {
            type: String,
            enum: ["pending", "decline", "approve"],
          },
        },
      ]
    },
    {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
    }
  );

  /* Schedule.pre("save", function (next) {
    if (this.departureAt < new Date()) {
      this.isActive = false;
    }
    next();
  }); */

  // Schedule.plugin(softDelete, {
  //   deletedBy: true,
  //   deletedAt: true,
  //   overrideMethods: "all",
  // });
  Schedule.plugin(toJSON);
  Schedule.plugin(mongoosePaginate);

  /**
   * @typedef Location
   */
  return model("Schedule", Schedule);
};
