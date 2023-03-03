const config = require("../config/config");
const stripe = require("stripe")(config.stripe.secretKey);

const createProduct = async ({ name, description, defaultPrice }) => {
  return await stripe.products.create({
    name,
    description,
    default_price_data: defaultPrice,
  });
};

const updateProduct = async (productId, updateBody) => {
  return await stripe.products.update(productId, updateBody);
};

const retrieveProduct = async (productId) => {
  return await stripe.products.retrieve(productId);
};

const deleteProduct = async (productId) => {
  return await stripe.products.del(productId);
};

const createPrice = async ({ productId, unitAmount, currency, interval }) => {
  return await stripe.prices.create({
    product: productId,
    unit_amount: unitAmount,
    currency,
    recurring: {
      interval,
    },
  });
};

const retrievePrice = async (priceId) => {
  const price = await stripe.prices.retrieve(priceId);
  return price;
};

const updatePrice = async (priceId, updateBody) => {
  const price = await stripe.prices.update(priceId, updateBody);
  return price;
};

module.exports = {
  createProduct,
  updateProduct,
  retrieveProduct,
  deleteProduct,
  createPrice,
  retrievePrice,
  updatePrice,
};
