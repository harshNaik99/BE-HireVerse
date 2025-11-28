class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    (this.statusCode = statusCode),
      (this.data = data),
      (this.message = message),
      (this.success = statusCode < 400);
  }
}

export const sendObjectResponse = ({
  res,
  result,
  message,
  status = 1,
  statusCode = httpStatusCodes.OK,
}) => {
  const response = {
    RESULT: result,
    MESSAGE: message,
    STATUS: status,
    IS_TOKEN_EXPIRE: 0,
  };
  return res.status(statusCode).json({
    ...response,
  });
};

export { ApiResponse };
