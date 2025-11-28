import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

/**
 * Compares a given unhashed string password with a hashed string password.
 * 
 * @param {string} passwordToCompare - The unhashed password to compare.
 * @param {string} password - The hashed password to compare with.
 * 
 * @returns {Promise<boolean>} - A promise that resolves to true if the passwords match, false otherwise.
 */
export const comparePasswords = async (
  passwordToCompare, // Unhashed string
  password // Hashed string
) => {
  return await bcrypt.compare(passwordToCompare, password);
};

/**
 * Hashes a given string password using bcrypt
 * @param {string} password - The password to hash
 * @returns {Promise<string>} - The hashed password
 */
export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

/**
 * Creates a JWT token for a given user.
 * @param {Object} user - The user data to sign into the token.
 * @returns {string} A JWT token.
 */
export const createJWT = (user) => {
  const token = jwt.sign(user, process.env.TOKEN_SECRET_KEY);
  return token;
};

export function generateUniquePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const passwordLength = 10;
  let password = '';
  const usedChars = new Set();

  while (password.length < passwordLength) {
      const randomChar = chars.charAt(Math.floor(Math.random() * chars.length));

      // Ensure uniqueness by checking if the character has already been used
      if (!usedChars.has(randomChar)) {
          password += randomChar;
          usedChars.add(randomChar);
      }
  }

  return password;
}
