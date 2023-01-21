const { toJSON, diffHistory } = require("./plugins");
const softDelete = require("mongoose-delete");

module.exports = ({ Schema, Types, model }, mongoosePaginate) => {
  const MapLocationSchema = new Schema(
    {
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
      address: {
        type: String,
        required: true,
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
        default: true,
      },
      arrivalAt: {
        type: Date,
        default: new Date().now,
      },
      departureAt: {
        type: Date,
      },
    },
    {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
    }
  );

  Location.virtual("rating").get(function () {
    if (this.reviews.length > 0) {
      const totalRating = this.reviews.reduce((acc, review) => {
        return acc + review.rating;
      }, 0);
      return totalRating / this.reviews.length;
    }
    return 0;
  });

  Location.virtual("reviewCount").get(function () {
    return this.reviews.length;
  });

  Location.virtual("likeCount").get(function () {
    return this.like ? this.like.count : 0;
  });

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
