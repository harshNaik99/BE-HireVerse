// services/auth.service.js
import { User } from "../models/user.model.js";
import { StringError } from "../errors/string.error.js";
import { createAccessToken, createRefreshToken } from "../utils/jwt.util.js"

const registerUser = async (req) => {
  try {
    const { name, email, password, gender, address, userType, designation } = req.body;

    if (!name) throw new StringError("Name is required");
    if (!email) throw new StringError("Email is required");
    if (!password) throw new StringError("Password is required");
    if (!gender) throw new StringError("Gender is required");
    if (!address) throw new StringError("Address is required");

    const userExists = await User.findOne({ email });
    if (userExists) throw new StringError("Email already registered. Please login.");

    const newUser = await User.create({
      name,
      email,
      password,
      gender,
      address,
      userType,
      designation,
      is_active: true,
    });

    const accessToken = createAccessToken({ id: newUser._id, email });
    const refreshToken = createRefreshToken({ id: newUser._id, email });

    return {
      success: true,
      message: "Registration successful",
      accessToken,
      refreshToken,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      }
    };

  } catch (error) {
    if (error instanceof StringError) throw error;
    throw new StringError("Something went wrong during registration");
  }
};

const loginUser = async (req) => {
  try {
    const { email, password } = req.body;

    if (!email) throw new StringError("Email is required");
    if (!password) throw new StringError("Password is required");

    const user = await User.findOne({ email });
    if (!user) throw new StringError("Invalid email or password");

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new StringError("Invalid email or password");

    const accessToken = createAccessToken({ id: user._id, email });
    const refreshToken = createRefreshToken({ id: user._id, email });

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

const getUserProfile = async (req) => {
  try {
    const userId = req.user.id; 
    const user = await User.findById(userId).select("-password"); 

    if (!user) throw new StringError("User not found");

    return { user };
  } catch (error) {
    if (error instanceof StringError) throw error;
    throw new StringError("Failed to fetch user profile");
  }
};

export default { 
  registerUser,
  loginUser,
  getUserProfile
}