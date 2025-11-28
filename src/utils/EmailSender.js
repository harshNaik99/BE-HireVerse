import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify connection
transporter.verify((error) => {
    if (error) {
        console.error('Error with email server connection:', error);
    } else {
        console.log('Server is ready to send emails');
    }
});

/**
 * Send verification email to user
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 * @param {string} token - Verification token
 * @returns {Promise} - Nodemailer send mail promise
 */
export const sendVerificationEmail = async (to, name, token) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

    const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
        to,
        subject: 'Verify Your Email Address',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Hello ${name || 'there'}!</h2>
                <p>Thank you for registering with our service. To verify your email address, please click the button below:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 15px 25px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                        Verify Email
                    </a>
                </div>
                <p>Or copy and paste this link in your browser:</p>
                <p>${verificationUrl}</p>
                <p>This link will expire in 24 hours.</p>
                <p>If you did not create an account, please ignore this email.</p>
                <p>Best regards,<br>Your App Team</p>
            </div>
        `
    };

    return transporter.sendMail(mailOptions);
};

export const sendInquiryAcceptedEmail = async (name, bar_name, to, url) => {

    const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
        to,
        subject: 'Cograts, Your inquiry has been approved!',
        html: `
            <div>
            <h1>Congratulations ${name}!</h1>
            <p>Your inquiry for ${bar_name} has been accepted.</p>
            <p>Please click the link below to complete your onboarding process:</p>
            <p><a href="${url.toString()}" style="padding: 10px 15px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Complete Onboarding</a></p>
            <p>Or copy and paste this URL into your browser:</p>
            <p>${url.toString()}</p>
            <p>Thank you for choosing Bar-Gain!</p>
          </div>
        `
    };

    return transporter.sendMail(mailOptions);
};

/**
 * Send OTP verification email to user
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 * @param {string} otp - One-time password
 * @returns {Promise} - Nodemailer send mail promise
 */
export const sendOTPVerificationEmail = async (to, name, otp) => {
    const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
        to,
        subject: 'Your Verification Code',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Hello ${name || 'there'}!</h2>
                <p>Thank you for registering with our service. To verify your email address, please use the following verification code:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; padding: 20px; background-color: #f5f5f5; border-radius: 5px;">
                        ${otp}
                    </div>
                </div>
                <p>This code will expire in 10 minutes.</p>
                <p>If you did not request this code, please ignore this email.</p>
                <p>Best regards,<br>Your App Team</p>
            </div>
        `
    };

    return transporter.sendMail(mailOptions);
};

export default {
    sendVerificationEmail,
    sendInquiryAcceptedEmail,
    sendOTPVerificationEmail
};