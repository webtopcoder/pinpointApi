const { toJSON } = require("./plugins");
const softDelete = require("mongoose-delete");

module.exports = ({ Schema, Types, model }, mongoosePaginate) => {
  const Order = new Schema(
    {
      product: {
        type: Types.ObjectId,
      },
      amount: {
        type: String,
        required: true,
      },
      currency: {
        type: String,
        required: true,
      },
      user: {
        type: Types.ObjectId,
        ref: "User",
      },
    },
    {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
    }
  );

  // Order.plugin(softDelete, {
  //   deletedBy: true,
  //   deletedAt: true,
  //   overrideMethods: "all",
  // });
  Order.plugin(toJSON);
  Order.plugin(mongoosePaginate);

  /**
   * @typedef Order
   */
  return model("Order", Order);
};
