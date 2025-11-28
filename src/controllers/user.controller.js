import { sendMsgResponse } from "../utils/ApiError.js";
import { sendObjectResponse } from "../utils/ApiResponse.js";
import { StringError } from "../errors/string.error.js";
import httpStatusCodes from "http-status-codes";
import userService from "../services/user.service.js";

export const handleServiceCall = async ({ req, res, serviceMethod, successMessage }) => {
  try {
    const result = await serviceMethod(req);

    return sendObjectResponse({
      res,
      result,
      message: successMessage,
      status: 1,
      statusCode: httpStatusCodes.OK,
    });

  } catch (error) {
    console.error({ error });

    const errorMessage =
      error instanceof StringError
        ? error.message
        : "Something went wrong!";

    return sendMsgResponse({
      res,
      message: errorMessage,
      status: 0,
      statusCode: httpStatusCodes.BAD_REQUEST,
    });
  }
};

export const registerUser = (req, res) =>
  handleServiceCall({
    req,
    res,
    serviceMethod: userService.registerUser,
    successMessage: "Registration successful",
  });

export const loginUser = (req, res) =>
  handleServiceCall({
    req,
    res,
    serviceMethod: userService.loginUser,
    successMessage: "Login successful",
  });

export const getProfile = (req, res) =>
  handleServiceCall({
    req,
    res,
    serviceMethod: userService.getUserProfile,
    successMessage: "User profile fetched",
});

