// services/auth.service.js
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { StringError } from "../errors/string.error.js";
import { createAccessToken, createRefreshToken } from "../utils/jwt.util.js";

const refreshAccessToken = async (req) => {
  try {
    const { refreshToken } = req.body; // frontend sends refresh token

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
    const newAccessToken = createAccessToken({ id: user._id, email: user.email });
    const newRefreshToken = createRefreshToken({ id: user._id, email: user.email });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };

  } catch (error) {
    if (error instanceof StringError) throw error;
    throw new StringError("Could not refresh token");
  }
};

const logoutUser = async (req) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) throw new StringError("Refresh token required");

    // Optional: remove refresh token from DB/session
    // await TokenModel.deleteOne({ token: refreshToken });

    return { message: "Logout successful" };
  } catch (error) {
    if (error instanceof StringError) throw error;
    throw new StringError("Logout failed");
  }
};


export default { refreshAccessToken,logoutUser };
