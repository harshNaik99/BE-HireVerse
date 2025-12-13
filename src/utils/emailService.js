// services/emailService.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true", // true for 465
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
});

export async function sendPasswordResetEmail(toEmail, resetLink) {
    const from = process.env.EMAIL_FROM;
    const subject = "Reset your password";
    const text = `Reset your password using this link: ${resetLink} (expires soon).`;
  
    try {
      await transporter.sendMail({
        from,
        to: toEmail,
        subject,
        text,
        html: `<p>Click to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`,
      });
      return true;
    } catch (err) {
      console.error("BREVO_SMTP_ERROR:", err);
      throw new StringError("Unable to send reset email right now");
    }
  }
  