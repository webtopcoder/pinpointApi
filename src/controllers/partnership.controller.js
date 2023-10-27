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
    req.body,
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
      options.sort.split(",").map((field) => field.split(":")),
    );
  } else {
    options.sort = "-createdAt";
  }

  const partnership = await partnershipService.queryPartnerships(
    filter,
    options,
  );

  if (!partnership) {
    throw new ApiError(httpStatus.NOT_FOUND, "Partnership not found");
  }

  res.send(partnership);
});

const getPartnershipById = catchAsync(async (req, res) => {
  const partnership = await partnershipService.getPartnershipById(
    req.params.partnershipId,
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
      "Invalid price id, no partnership found.",
    );
  }

  let subscription;

  if (!req.user.activePartnership) {
    const user = await userService.getUserById(req.user._id);
    const stripeCustomerId = await user.getStripeCustomerId();
    console.log(stripeCustomerId);
    if (!stripeCustomerId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "No customer id found, please create a customer first.",
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
        "You already have this partnership",
      );
    }

    subscription = await stripeService.updateSubscription(
      req.user.activeSubscription.id,
      {
        priceId,
      },
    );
  }

  let clientSecret, cardPaymentStatus;

  if (!subscription.latest_invoice.payment_intent) {
    const setupIntent = await stripeInstance.setupIntents.retrieve(
      subscription.pending_setup_intent,
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

const getUserTransactions = catchAsync(async (req, res) => {
  let filter = {};
  let options = pick(req.query, ["limit", "page", "sort"]);
  const userId = req.user._id;
  const result = await transactionService.queryTransactions(
    { ...filter, user: userId },
    options,
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

const stripeWebhook = async (req, res) => {
  let event;
  try {
    event = stripeService.constructEvent(req);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  let activePartnership, partnershipPriceRenewalDate;
  switch (event.type) {
    case "customer.subscription.created":
      const subscription = event.data.object;
      const user = await userService.getUserByStripeCustomerId(
        subscription.customer,
      );
      // if (!user) {
      //   throw new ApiError(
      //     httpStatus.BAD_REQUEST,
      //     "No user found, please create a user first.",
      //   );
      // }

      if (!user) {
        console.log("No user found, please create a user first.");
        break;
      }
      activePartnership = await Partnership.findOne({
        stripePriceId: subscription.items.data[0].price.id,
      });

      // if (!activePartnership) {
      //   throw new ApiError(
      //     httpStatus.BAD_REQUEST,
      //     "No activePartnership found, please create a activePartnership first.",
      //   );
      // }

      if (!activePartnership) {
        console.log("No activePartnership found, please create a activePartnership first.");
        break;
      }

      partnershipPriceRenewalDate = new Date(
        subscription.current_period_end * 1000,
      );

      await userService.updateUserById(user._id, {
        activeSubscription: subscription,
        partnershipPriceRenewalDate,
        activePartnership,
      });
      break;
    case "customer.subscription.updated":
      const updatedSubscription = event.data.object;
      const updatedUser = await userService.getUserByStripeCustomerId(
        updatedSubscription.customer,
      );

      // if (!updatedUser) {
      //   throw new ApiError(
      //     httpStatus.BAD_REQUEST,
      //     "No updatedUser found, please create a updatedUser first.",
      //   );
      // }

      if (!updatedUser) {
        console.log("No updatedUser found, please create a updatedUser first.");
        break;
      }

      activePartnership = await Partnership.findOne({
        stripePriceId: updatedSubscription.items.data[0].price.id,
      });

      // if (!activePartnership) {
      //   throw new ApiError(
      //     httpStatus.BAD_REQUEST,
      //     "No activePartnership found, please create a activePartnership first.",
      //   );
      // }

      if (!activePartnership) {
        console.log("No activePartnership found, please create a activePartnership first.");
        break;
      }

      partnershipPriceRenewalDate = new Date(
        updatedSubscription.current_period_end * 1000,
      );
      await userService.updateUserById(updatedUser._id, {
        activeSubscription: updatedSubscription,
        activePartnership,
        partnershipPriceRenewalDate,
      });
      break;
    case "customer.subscription.deleted":
      const deletedSubscription = event.data.object;

      const deletedUser = await userService.getUserByStripeCustomerId(
        deletedSubscription.customer,
      );

      if (!deletedUser) {
        console.log("No deletedUser found, please create a deletedUser first.");
        break;
        // throw new ApiError(
        //   httpStatus.BAD_REQUEST,
        //   "No deletedUser found, please create a deletedUser first.",
        // );
      }

      partnershipPriceRenewalDate = new Date(
        deletedSubscription.current_period_end * 1000,
      );

      await userService.updateUserById(deletedUser._id, {
        activeSubscription: null,
        activePartnership: null,
        partnershipPriceRenewalDate,
      });
      break;
    case "invoice.paid":
      const invoice = event.data.object;
      const invoiceUser = await userService.getUserByStripeCustomerId(
        invoice.customer,
      );

      // if (!invoiceUser) {
      //   throw new ApiError(
      //     httpStatus.BAD_REQUEST,
      //     "No invoiceUser found, please create a invoiceUser first.",
      //   );
      // }

      if (!invoiceUser) {
        console.log("No invoiceUser found, please create a invoiceUser first.");
        break;
      }

      const partnership = await Partnership.findOne({
        stripePriceId: invoice.lines.data[0].price.id,
      });

      // if (!partnership) {
      //   throw new ApiError(
      //     httpStatus.BAD_REQUEST,
      //     "No partnership found, please create a partnership first.",
      //   );
      // }

      
      if (!partnership) {
        console.log("No partnership found, please create a partnership first.");
        break;
      }


      const data = {
        order: invoice.id,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
        trial: false,
        user: invoiceUser._id,
        status: "completed",
      };

      partnershipPriceRenewalDate = new Date(
        invoice.lines.data[0].period.end * 1000,
      );

      await transactionService.createTransaction(data);
      await userService.updateUserById(invoiceUser._id, {
        activeSubscription: invoice.subscription,
        partnershipPriceRenewalDate,
        activePartnership: partnership,
      });
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  console.log({ event: event.type });
  console.log({ partnershipPriceRenewalDate });

  return res.json({ received: true });
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
  getUserTransactions,
  stripeWebhook,
};
