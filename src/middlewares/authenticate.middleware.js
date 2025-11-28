import jwt from "jsonwebtoken";
import { sendMsgResponse } from "../utils/ApiError.js";
import httpStatusCodes from "http-status-codes";

const authenticateUser = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendMsgResponse({
        res,
        message: "Unauthorized: Missing token",
        status: 0,
        statusCode: httpStatusCodes.UNAUTHORIZED,
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return sendMsgResponse({
        res,
        message: "Unauthorized: Token not found",
        status: 0,
        statusCode: httpStatusCodes.UNAUTHORIZED,
      });
    }

    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = payload; // Attach user info for downstream routes
    next();
  } catch (err) {
    console.error("JWT Error:", err.message);
    return sendMsgResponse({
      res,
      message: "Unauthorized: Invalid or expired token",
      status: 0,
      statusCode: httpStatusCodes.UNAUTHORIZED,
    });
  }
};

export default authenticateUser;
