// utils/resetToken.js
import crypto from "crypto";

export function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function generateResetToken(ttlMinutes = 15) {
  const rawToken = crypto.randomBytes(32).toString("hex"); // 64 chars
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
  return { rawToken, tokenHash, expiresAt };
}

export function timingSafeEqualHex(aHex, bHex) {
  if (!aHex || !bHex) return false;
  const a = Buffer.from(aHex, "hex");
  const b = Buffer.from(bHex, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
