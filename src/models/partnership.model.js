const { toJSON } = require("./plugins");
const softDelete = require("mongoose-delete");

const stripeService = require("../services/stripe.service");

module.exports = ({ Schema, model }, mongoosePaginate) => {
  const Partnership = new Schema(
    {
      price: {
        type: String,
        required: true,
      },
      currency: {
        type: String,
        required: true,
      },
      applyIn: {
        type: String,
        required: true,
      },
      title: {
        type: String,
        required: true,
      },
      features: {
        type: [
          {
            type: String,
            required: true,
          },
        ],
      },
      kind: {
        type: String,
        enum: ["partner", "event"],
        required: true,
      },
      stripePriceId: {
        type: String,
      },
      stripeProductId: {
        type: String,
      },
      trialPeriodDays: {
        type: Number,
        default: 0,
      },
    },
    {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
    }
  );

  // Partnership.plugin(softDelete, {
  //   deletedBy: true,
  //   deletedAt: true,
  //   overrideMethods: "all",
  // });
  Partnership.plugin(toJSON);
  Partnership.plugin(mongoosePaginate);

  Partnership.pre("save", async function () {
    let productId;
    const partnership = this;

    if (partnership.stripeProductId) {
      productId = partnership.stripeProductId;
    } else {
      const product = await stripeService.createProduct({
        name: partnership.title,
      });
      productId = product.id;
      partnership.stripeProductId = productId;
    }

    if (
      partnership.isModified("price") ||
      partnership.isModified("currency") ||
      partnership.isModified("applyIn")
    ) {
      const price = await stripeService.createPrice({
        productId,
        unitAmount: Number(partnership.price) * 100,
        currency: partnership.currency,
        interval: partnership.applyIn,
      });

      await stripeService.updateProduct(productId, {
        default_price: price.id,
      });

      const oldPrice = partnership.stripePriceId;
      partnership.stripePriceId = price.id;

      if (oldPrice) {
        await stripeService.updatePrice(oldPrice, {
          active: false,
        });
      }
    }
  });

  Partnership.pre("delete", async function () {
    const partnership = this;

    if (partnership.stripeProductId) {
      await stripeService.deleteProduct(partnership.stripeProductId);
    }
  });

  Partnership.methods.getStripeData = async function () {
    const partnership = this;

    const product = await stripeService.retrieveProduct(
      partnership.stripeProductId
    );

    const price = await stripeService.retrievePrice(partnership.stripePriceId);

    return {
      product,
      price,
    };
  };

  /**
   * @typedef Partnership
   */
  return model("Partnership", Partnership);
};
