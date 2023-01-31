const { toJSON } = require("./plugins");
const softDelete = require("mongoose-delete");

module.exports = ({ Schema, Types, model }, mongoosePaginate) => {
  const Transaction = new Schema(
    {
      order: {
        type: Types.ObjectId,
        ref: "Order",
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

  Transaction.plugin(softDelete, {
    deletedBy: true,
    deletedAt: true,
    overrideMethods: "all",
  });
  Transaction.plugin(toJSON);
  Transaction.plugin(mongoosePaginate);

  /**
   * @typedef Transaction
   */
  return model("Transaction", Transaction);
};
