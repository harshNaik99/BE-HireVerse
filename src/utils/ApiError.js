class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = ""
  ) {
    super(message);
    (this.statusCode = statusCode),
      (this.data = null),
      (this.message = message),
      (this.success = false),
      (this.errors = errors);

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export const sendMsgResponse = ({ res, message, status, statusCode }) => {
  const response = {
    MESSAGE: message,
    STATUS: status,
    IS_TOKEN_EXPIRE: 0,
  };
  return res.status(statusCode).json({
    ...response,
  });
};

export { ApiError };
