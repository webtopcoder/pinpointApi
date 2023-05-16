const config = require("../config/config");
const stripe = require("stripe")(config.stripe.secretKey);

exports.stripeInstance = stripe;

exports.createCustomer = async ({ email, name, userId }) => {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      userId,
    },
  });
  return customer;
};

exports.retrieveCustomer = async (customerId) => {
  const customer = await stripe.customers.retrieve(customerId);
  return customer;
};

exports.createSubscription = async ({
  customerId,
  priceId,
  metadata,
  trialDays,
}) => {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: "default_incomplete",
    metadata,
    trial_period_days: trialDays,
    expand: ["latest_invoice.payment_intent"],
    trial_settings: {
      end_behavior: {
        missing_payment_method: "cancel",
      },
    },
  });
  return subscription;
};

exports.retrieveSubscription = async (subscriptionId) => {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return subscription;
};

exports.updateSubscription = async (subscriptionId, { priceId }) => {
  const price = await stripe.prices.retrieve(priceId);
  if (!price.active) {
    throw new Error("Price is not active");
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  if (price.currency !== subscription.currency) {
    throw new Error("Price currency does not match subscription currency");
  }

  const updatedSubscription = await stripe.subscriptions.update(
    subscriptionId,
    {
      items: [{ price: priceId }],
    },
  );
  return updatedSubscription;
};

exports.createProduct = async ({ name, description, defaultPrice }) => {
  return stripe.products.create({
    name,
    description,
    default_price_data: defaultPrice,
  });
};

exports.updateProduct = async (productId, updateBody) => {
  return stripe.products.update(productId, updateBody);
};

exports.retrieveProduct = async (productId) => {
  return stripe.products.retrieve(productId);
};

exports.deleteProduct = async (productId) => {
  return stripe.products.del(productId);
};

exports.createPrice = async ({ productId, unitAmount, currency, interval }) => {
  return stripe.prices.create({
    product: productId,
    unit_amount: unitAmount,
    currency,
    recurring: {
      interval,
    },
  });
};

exports.retrievePrice = async (priceId) => {
  const price = await stripe.prices.retrieve(priceId);
  return price;
};

exports.updatePrice = async (priceId, updateBody) => {
  const price = await stripe.prices.update(priceId, updateBody);
  return price;
};

exports.constructEvent = (req) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = config.stripe.webhookSecret;
  const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  return event;
};
