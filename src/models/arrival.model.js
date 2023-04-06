const { toJSON } = require("./plugins");
const softDelete = require("mongoose-delete");

module.exports = ({ Schema, Types, model }, mongoosePaginate) => {

  const Arrival = new Schema(
    {
      location: {
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
      lastSeen: {
        type: Date,
      },
      departureAt: {
        type: Date,
      },
      arrivalText: {
        type: String,
      },
      checkIn: [
        {
          type: Types.ObjectId,
          ref: "User",
        },
      ],
    },
    {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
    }
  );

  Arrival.plugin(softDelete, {
    deletedBy: true,
    deletedAt: true,
    overrideMethods: "all",
  });
  Arrival.plugin(toJSON);
  Arrival.plugin(mongoosePaginate);

  /**
   * @typedef Arrival
   */
  return model("Arrival", Arrival);
};
