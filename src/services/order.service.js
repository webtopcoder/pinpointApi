const httpStatus = require("http-status"),
  { Order } = require("../models"),
  customLabels = require("../utils/customLabels"),
  defaultSort = require("../utils/defaultSort"),
  ApiError = require("../utils/ApiError");

const createOrder = async (orderBody) => {
  const order = await Order.create(orderBody);
  return order;
};

const queryOrders = async (filter, options) => {
  const orders = await Order.paginate(filter, {
    customLabels,
    sort: defaultSort,
    ...options,
  });
  return orders;
};

const getOrderById = async (id, populate) => {
  const order = await Order.findById(id).populate(populate);
  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
  }
  return order;
};

const updateOrderById = async (orderId, updateBody) => {
  const order = await getOrderById(orderId);
  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
  }
  Object.assign(order, updateBody);
  await order.save();
  return order;
};

const deleteOrderById = async (orderId) => {
  const order = await getOrderById(orderId);
  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
  }
  await order.delete();
  return order;
};

module.exports = {
  createOrder,
  queryOrders,
  getOrderById,
  updateOrderById,
  deleteOrderById,
};
