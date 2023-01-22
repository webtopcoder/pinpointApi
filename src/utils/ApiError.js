class ApiError extends Error {
  constructor(statusCode, message, isoperational = true, stack = "") {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isoperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = ApiError;
