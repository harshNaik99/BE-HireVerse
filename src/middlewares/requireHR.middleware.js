// src/middlewares/requireHR.js
import { sendMsgResponse } from "../utils/ApiError.js";
import httpStatusCodes from "http-status-codes";

export const requireHR = (req, res, next) => {
  if (!req.user || req.user.userType !== "hr") {
    return sendMsgResponse({
      res,
      message: "Only HR users can perform this action",
      status: 0,
      statusCode: httpStatusCodes.FORBIDDEN,
    });
  }
  next();
};
