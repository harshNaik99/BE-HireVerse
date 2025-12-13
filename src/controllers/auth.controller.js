import { handleServiceCall } from "./user.controller.js";
import authService from "../services/auth.service.js";

export const refreshToken = (req, res) =>
  handleServiceCall({
    req,
    res,
    serviceMethod: (req) => authService.refreshAccessToken(req,res),
    successMessage: "Access token refreshed",
  });

export const logoutUser = (req, res) =>
    handleServiceCall({
      req,
      res,
      serviceMethod: authService.logoutUser,
      successMessage: "Logout successful",
      clearRefreshToken: true,
    });

    export const forgotPassword = (req, res) =>
      handleServiceCall({
        req,
        res,
        serviceMethod: authService.forgotPassword,
        successMessage: "Request processed",
      });

      export const resetPassword = (req, res) =>
        handleServiceCall({
          req,
          res,
          serviceMethod: authService.resetPassword,
          successMessage: "Password reset successful",
        });
      
      export const changePassword = (req, res) =>
        handleServiceCall({
          req,
          res,
          serviceMethod: authService.changePassword,
          successMessage: "Password changed successfully",
        });