import { handleServiceCall } from "./user.controller.js";
import authService from "../services/auth.service.js";

export const refreshToken = (req, res) =>
  handleServiceCall({
    req,
    res,
    serviceMethod: authService.refreshAccessToken,
    successMessage: "Access token refreshed",
  });

export const logoutUser = (req, res) =>
    handleServiceCall({
      req,
      res,
      serviceMethod: authService.logoutUser,
      successMessage: "Logout successful",
    });