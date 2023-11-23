const { toJSON } = require("./plugins");
const softDelete = require("mongoose-delete");
const PollSchema = require("./schemas/poll.schema");

module.exports = ({ Schema, Types, model }, mongoosePaginate) => {
  const MapLocationSchema = new Schema(
    {
      latitude: {
        type: Number,
      },
      longitude: {
        type: Number,
      },
      address: {
        type: String,
      },
      city: {
        type: String,
      },
      state: {
        type: String,
      },
      interactiveMapContent: {
        type: String,
      },
    },
    {
      _id: false,
    }
  );
  const Location = new Schema(
    {
      partner: {
        type: Types.ObjectId,
        ref: "User",
        required: true,
      },
      title: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      poll: PollSchema,
      mapLocation: MapLocationSchema,
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
      isArrival: {
        type: Types.ObjectId,
        ref: "Arrival",
        default: null
      },
      lastSeen: {
        type: Date,
      },
      departureAt: {
        type: Date,
      },
      arrivalText: {
        type: String,
      },
      arrivalImages: {
        type: [
          {
            type: Types.ObjectId,
            ref: "Media",
          },
        ],
      },
      subCategories: [
        {
          type: Types.ObjectId,
          ref: "SubCategory",
        },
      ],
      favoriteUsers: [
        {
          type: Types.ObjectId,
          ref: "User",
        },
      ],
      history: [
        {
          latitude: {
            type: Number,
          },
          longitude: {
            type: Number,
          },
          address: {
            type: String,
          },
          city: {
            type: String,
          },
          state: {
            type: String,
          },
          interactiveMapContent: {
            type: String,
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

  Location.virtual("rating").get(function () {
    if (this.reviews?.length > 0) {
      let length = 0;
      const totalRating = this.reviews.reduce((acc, review) => {
        if (review.rating !== 0) length++
        return acc + review.rating;
      }, 0);
      return totalRating / length;
    }
    return 0;
  });

  Location.virtual("reviewCount").get(function () {
    return this.reviews?.length;
  });

  /* Location.pre("save", function (next) {
    if (this.departureAt < new Date()) {
      this.isActive = false;
    }
    next();
  }); */

  Location.plugin(softDelete, {
    deletedBy: true,
    deletedAt: true,
    overrideMethods: "all",
  });
  Location.plugin(toJSON);
  Location.plugin(mongoosePaginate);

  /**
   * @typedef Location
   */
  return model("Location", Location);
};
