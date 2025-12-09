import { sendMsgResponse } from "../utils/ApiError.js";
import { sendObjectResponse } from "../utils/ApiResponse.js";
import { StringError } from "../errors/string.error.js";
import httpStatusCodes from "http-status-codes";
import userService from "../services/user.service.js";

export const handleServiceCall = async ({ 
  req, 
  res, 
  serviceMethod, 
  successMessage, 
  clearRefreshToken = false  // <-- added
}) => {
  try {
    const result = await serviceMethod(req, res);

    // Set refresh token if login/register returns one
    if (result?.refreshToken) {
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    // SPECIAL CASE: Logout → remove refresh token cookie
    if (clearRefreshToken) {
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });
    }

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

