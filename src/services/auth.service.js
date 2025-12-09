// services/auth.service.js
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { StringError } from "../errors/string.error.js";
import { createAccessToken, createRefreshToken } from "../utils/jwt.util.js";

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


export default { refreshAccessToken,logoutUser };
