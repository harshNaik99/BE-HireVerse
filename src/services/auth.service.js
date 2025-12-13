// services/auth.service.js
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User } from "../models/user.model.js";
import { StringError } from "../errors/string.error.js";
import { createAccessToken, createRefreshToken } from "../utils/jwt.util.js";
import { generateResetToken, hashToken, timingSafeEqualHex } from "../utils/resetToken.js";
import { sendPasswordResetEmail } from "../utils/emailService.js";

const validateFields = (fields) => {
  for (const [key, value] of Object.entries(fields)) {
    if (!value) throw new StringError(`${key} is required`);
  }
};

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const refreshAccessToken = async (req,res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    console.log("refreshToken",refreshToken);
    if (!refreshToken) throw new StringError("Refresh token is required");

    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
      throw new StringError("Invalid or expired refresh token");
    }

    // Optionally: verify refresh token exists in DB for session tracking

    const user = await User.findById(payload.id);
    if (!user) throw new StringError("User not found");

    // Generate new tokens
    const newAccessToken = createAccessToken({ id: user._id, email: user.email, userType : user.userType });
    const newRefreshToken = createRefreshToken({ id: user._id, email: user.email,userType : user.userType });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: false, // change to true in production
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      accessToken: newAccessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
      },
    };

  } catch (error) {
    if (error instanceof StringError) throw error;
    throw new StringError("Could not refresh token");
  }
};

export const logoutUser = async (req) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      throw new StringError("Refresh token not found");
    }

    // No DB model? No problem. 
    // Just clear the cookie on controller level.
    return { success: true, message: "Logout successful" };

  } catch (error) {
    console.log(error);
    throw new StringError("Logout failed");
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    validateFields({ email });

    // Always return this success (even if user not found)
    const genericResult = {
      success: true,
      message: "If that email exists, a reset link has been sent.",
    };

    const user = await User.findOne({ email: normalizeEmail(email) });
    if (!user || user.is_active === false) return genericResult;

    const ttlMin = Number(process.env.RESET_TOKEN_TTL_MIN || 15);
    const { rawToken, tokenHash, expiresAt } = generateResetToken(ttlMin);

    user.passwordResetTokenHash = tokenHash;
    user.passwordResetExpiresAt = expiresAt;
    user.passwordResetUsedAt = null;
    await user.save();

    // Use a trusted configured FRONTEND_URL (do not build from req host)
    const resetLink =
      `${process.env.FRONTEND_URL}/auth/ResetPassword` +
      `?token=${encodeURIComponent(rawToken)}` +
      `&email=${encodeURIComponent(user.email)}`;

    await sendPasswordResetEmail(user.email, resetLink );

    return genericResult;
  } catch (error) {
    console.error("FORGOT_PASSWORD_SERVICE_ERROR:", error); 
    if (error instanceof StringError) throw error;
    throw new StringError("Something went wrong while processing forgot password");
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    validateFields({ email, token, newPassword });

    const user = await User.findOne({ email: normalizeEmail(email) }).select("+password");
    if (!user || user.is_active === false) throw new StringError("Invalid or expired reset token");

    const expired =
      !user.passwordResetExpiresAt || user.passwordResetExpiresAt.getTime() < Date.now();
    const used = Boolean(user.passwordResetUsedAt);

    const incomingHash = hashToken(token);
    const matches = timingSafeEqualHex(user.passwordResetTokenHash, incomingHash);

    if (expired || used || !matches) throw new StringError("Invalid or expired reset token");

    user.password = String(newPassword); // your pre-save hook should hash it

    // Single-use: invalidate now
    user.passwordResetUsedAt = new Date();
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;

    await user.save();

    return { success: true, message: "Password updated successfully" };
  } catch (error) {
    if (error instanceof StringError) throw error;
    throw new StringError("Something went wrong while resetting password");
  }
};

/**
 * PATCH /api/auth/change-password  (authenticateUser required)
 * Body: { currentPassword, newPassword }
 *
 * SECURITY:
 * - Require active authenticated session. [web:25]
 * - Verify current password before allowing change. [web:25]
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new StringError("Unauthorized");

    const { currentPassword, newPassword } = req.body;
    validateFields({ currentPassword, newPassword });

    const user = await User.findById(userId).select("+password");
    if (!user) throw new StringError("User not found");
    if (user.is_active === false) throw new StringError("Account is disabled");

    const ok = await user.comparePassword(String(currentPassword));
    if (!ok) throw new StringError("Current password is incorrect");

    user.password = String(newPassword);

    // Optional cleanup
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    user.passwordResetUsedAt = null;

    await user.save();

    return { success: true, message: "Password changed successfully" };
  } catch (error) {
    if (error instanceof StringError) throw error;
    throw new StringError("Something went wrong while changing password");
  }
};

export default { refreshAccessToken,logoutUser,forgotPassword ,changePassword ,resetPassword};
