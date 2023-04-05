const httpStatus = require("http-status");
const catchAsync = require("@utils/catchAsync");
const ApiError = require("@utils/ApiError");
const {
  partnershipService,
  transactionService,
  userService,
  stripeService,
} = require("@services");
const pick = require("../utils/pick");
const env = require("../config/config");

const Stripe = require("stripe");
const { Partnership } = require("../models");
const { stripeInstance } = require("../services/stripe.service");

const createPartnership = catchAsync(async (req, res) => {
  const partnership = await partnershipService.createPartnership(req.body);
  res.status(httpStatus.CREATED).send(partnership);
});

const updatePartnership = catchAsync(async (req, res) => {
  const partnership = await partnershipService.updatePartnershipById(
    req.params.partnershipId,
    req.body
  );
  res.send(partnership);
});

const deletePartnership = catchAsync(async (req, res) => {
  await partnershipService.deletePartnershipById(req.params.partnershipId);

  res.status(httpStatus.NO_CONTENT).send();
});

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
    req.params.partnershipId
  );
  if (!partnership) {
    throw new ApiError(httpStatus.NOT_FOUND, "Partnership not found");
  }
  res.send(partnership);
});

const createCustomer = async (req, res) => {
  try {
    const user = await userService.getUserById(req.user._id);
    const stripeCustomerId = await user.getStripeCustomerId();

    const customer = await stripeService
      .retrieveCustomer(stripeCustomerId)
      .catch(async () => {
        const updatedUser = await userService.updateUserById(req.user._id, {
          stripeCustomerId: null,
        });

        return await updatedUser.getStripeCustomerId();
      });

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
  const { priceId } = req.body;

  const partnership = await Partnership.findOne({
    stripePriceId: priceId,
  });

  if (!partnership) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Invalid price id, no partnership found."
    );
  }

  let subscription;

  if (!req.user.activePartnership) {
    const user = await userService.getUserById(req.user._id);
    const stripeCustomerId = await user.getStripeCustomerId();

    if (!stripeCustomerId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "No customer id found, please create a customer first."
      );
    }

    subscription = await stripeService.createSubscription({
      customerId: stripeCustomerId,
      priceId,
      metadata: {
        userId: req.user._id,
      },
      trialDays: partnership.trialPeriodDays ?? 0,
    });
  } else {
    if (partnership._id.toString() === req.user.activePartnership.toString()) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "You already have this partnership"
      );
    }

    subscription = await stripeService.updateSubscription(
      req.user.activeSubscription.id,
      {
        priceId,
      }
    );
  }


  await userService.updateUserById(req.user._id, {
    activeSubscription: subscription,
  });

  let clientSecret, cardPaymentStatus;

  if (!subscription.latest_invoice.payment_intent) {
    const setupIntent = await stripeInstance.setupIntents.retrieve(
      subscription.pending_setup_intent
    );
    clientSecret = setupIntent.client_secret;
    cardPaymentStatus = "setupCard";
  } else {
    clientSecret = subscription.latest_invoice.payment_intent.client_secret;
    cardPaymentStatus = "confirmCard";
  }

  res.status(200).json({
    code: "subscription_created",
    status: cardPaymentStatus,
    subscriptionId: subscription.id,
    clientSecret,
  });
});

const createTransaction = catchAsync(async (req, res) => {
  const data = {
    order: req.body.order,
    amount: req.body.amount,
    currency: req.body.currency,
    trial: req.body.trial,
    user: req.user,
    status: "completed",
  };

  const updatedPartnership = await Partnership.findOne({
    stripePriceId: req.body.priceId,
  });

  const updateUser = {
    ...req.user,
    activePartnership: updatedPartnership,
  };

  await userService.updateUserById(req.user._id, updateUser);

  let userinfo = await userService.getUserById(req.user._id);

  const transaction = await transactionService.createTransaction(data);
  res.status(httpStatus.CREATED).send(userinfo);
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
    let userinfo = await userService.getUserById(req.user._id);

    res.status(200).json({
      code: "subscription_deleted",
      deletedSubscription,
      user: userinfo
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
  createPartnership,
  updatePartnership,
  deletePartnership,
  createCustomer,
  getPartnerships,
  getPartnershipById,
  subscribePartnership,
  cancelSubscription,
  createTransaction,
  getUserTransactions,
};
