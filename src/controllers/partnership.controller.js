const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const ApiError = require("@utils/ApiError");
const {
  partnershipService,
  transactionService,
  userService,
} = require("@services");
const pick = require("../utils/pick");
const env = require("../config/config");

const Stripe = require("stripe");

const getPartnerships = catchAsync(async (req, res) => {
  let filter = pick(req.query, ["q"]);
  let options = pick(req.query, ["sort", "limit", "page"]);
  if (options.sort) {
    options.sort = Object.fromEntries(
      options.sort.split(",").map((field) => field.split(":"))
    );
  } else {
    options.sort = "-createdAt";
  }

  const partnership = await partnershipService.queryPartnerships(
    filter,
    options
  );

  if (!partnership) {
    throw new ApiError(httpStatus.NOT_FOUND, "Partnership not found");
  }
  res.send(partnership);
});

const getPartnershipById = catchAsync(async (req, res) => {
  const partnership = await partnershipService.getPartnershipById(
    req.params.id
  );
  if (!partnership) {
    throw new ApiError(httpStatus.NOT_FOUND, "Partnership not found");
  }
  res.send(partnership);
});

const createCustomer = async (req, res) => {
  try {
    const stripe = new Stripe(env.stripe.secretKey, {
      apiVersion: "2020-08-27",
    });

    const data = {
      email: req.user.email,
      name: req.user.username,
    };

    const customer = await stripe.customers.create(data);

    // Optional but recommended
    // Save the customer object or ID to your database

    res.status(200).json({
      code: "customer_created",
      customer,
    });
  } catch (e) {
    console.error(e);
    res.status(400).json({
      code: "customer_creation_failed",
      error: e,
    });
  }
};

const subscribePartnership = catchAsync(async (req, res) => {
  try {
    const stripe = new Stripe(env.stripe.secretKey, {
      apiVersion: "2020-08-27",
    });
    const { customerId, priceId } = req.body;

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      metadata: {
        // You can save details about your user here
        // Or any other metadata that you would want as reference.
      },
      expand: ["latest_invoice.payment_intent"],
    });
    console.log(subscription);

    const updateBody = {
      ...req.user,
      activeSubscription: subscription,
    };
    await userService.updateUserById(req.user._id, updateBody);
    res.status(200).json({
      code: "subscription_created",
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
    });
  } catch (e) {
    console.error(e);
    res.status(400).json({
      code: "subscription_creation_failed",
      error: e,
    });
  }
});

const createTransaction = catchAsync(async (req, res) => {
  const stripe = new Stripe(env.stripe.secretKey, {
    apiVersion: "2020-08-27",
  });
  const data = {
    order: req.body.order,
    amount: req.body.amount,
    currency: req.body.currency,
    user: req.user,
  };

  const plans = await stripe.prices.list({
    lookup_keys: [req.body.lookup_key],
    expand: ["data.product"],
  });
  console.log(plans);
  const userUpdatedPlan = plans.data.find(
    (plan) => plan.id == req.body.priceId
  );
  const partnerships = await partnershipService.getPartnerships();
  const updatedPartnership = partnerships.find(
    (partnership) => partnership.plan.id == userUpdatedPlan.id
  );
  const updateUser = {
    ...req.user,
    activePartnership: updatedPartnership,
  };
  await userService.updateUserById(req.user._id, updateUser);
  res.send(await transactionService.createTransaction(data));
});

const getUserTransactions = catchAsync(async (req, res) => {
  let filter = {};
  let options = pick(req.query, ["limit", "page", "sort"]);
  const userId = req.user._id;
  const result = await transactionService.queryTransactions(
    { ...filter, user: userId },
    options
  );
  res.send(result);
});

const cancelSubscription = async (req, res) => {
  try {
    const stripe = new Stripe(env.stripe.secretKey, {
      apiVersion: "2020-08-27",
    });
    const { subscriptionId } = req.body;

    const deletedSubscription = await stripe.subscriptions.del(subscriptionId);

    const updateUser = {
      ...req.user,
      activePartnership: null,
      activeSubscription: null,
    };
    await userService.updateUserById(req.user._id, updateUser);
    res.status(200).json({
      code: "subscription_deleted",
      deletedSubscription,
    });
  } catch (e) {
    console.error(e);
    res.status(400).json({
      code: "subscription_deletion_failed",
      error: e,
    });
  }
};

module.exports = {
  createCustomer,
  getPartnerships,
  getPartnershipById,
  subscribePartnership,
  cancelSubscription,
  createTransaction,
  getUserTransactions,
};
