// services/auth.service.js
import { User } from "../models/user.model.js";
import { StringError } from "../errors/string.error.js";
import { createAccessToken, createRefreshToken } from "../utils/jwt.util.js";

// -----------------------------
// Helper: Validate required fields
// -----------------------------
const validateFields = (fields) => {
  for (const [key, value] of Object.entries(fields)) {
    if (!value) throw new StringError(`${key} is required`);
  }
};

// -----------------------------
// REGISTER USER
// -----------------------------
const registerUser = async (req, res) => {
  try {
    const { name, email, password, gender, address, userType, designation } = req.body;

    validateFields({ name, email, password, gender, address });

    const userExists = await User.findOne({ email });
    if (userExists) throw new StringError("Email already registered. Please login.");

    const newUser = await User.create({
      name,
      email,
      password,
      gender,
      address,
      userType: userType || "Candidate",
      designation: designation || "",
      is_active: true,
    });

    // Generate tokens
    const accessToken = createAccessToken({ id: newUser._id, email: newUser.email, userType: newUser.userType });
    const refreshToken = createRefreshToken({ id: newUser._id,  email: newUser.email, userType: newUser.userType });

    return {
      success: true,
      message: "Registration successful",
      accessToken,
      refreshToken,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        userType: newUser.userType,
      },
    };

  } catch (error) {
    if (error instanceof StringError) throw error;
    throw new StringError("Something went wrong during registration");
  }
};

// -----------------------------
// LOGIN USER
// -----------------------------
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    validateFields({ email, password });

    const user = await User.findOne({ email });
    if (!user) throw new StringError("Invalid email or password");

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new StringError("Invalid email or password");

    const accessToken = createAccessToken({ id: user._id, email: user.email, userType: user.userType, });
    const refreshToken = createRefreshToken({ id: user._id, email: user.email, userType: user.userType, });

    return {
      success: true,
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
      },
    };

  } catch (error) {
    if (error instanceof StringError) throw error;
    throw new StringError("Something went wrong during login");
  }
};

// -----------------------------
// GET USER PROFILE
// -----------------------------
const getUserProfile = async (req) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("-password");

    if (!user) throw new StringError("User not found");

    return {
      success: true,
      user,
    };

  } catch (error) {
    if (error instanceof StringError) throw error;
    throw new StringError("Failed to fetch user profile");
  }
};

// -----------------------------
export default {
  registerUser,
  loginUser,
  getUserProfile,
};
