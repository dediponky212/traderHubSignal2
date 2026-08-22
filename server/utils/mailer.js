const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: process.env.MAIL_PORT == 465, // true jika port 465, false untuk port lain (seperti 587)
    auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
    },
});

// The app is rebranding from "ForexHub" to "TraderHub" (the EA is already
// named TraderHub.mq5) - one constant here so the rest of the rename is a
// single edit instead of hunting every string in this file again.
const BRAND_NAME = "TraderHub";
const BRAND_COLOR = "#2563eb"; // matches Tailwind's blue-600, the app's primary action color

// Shared shell so every email looks like it belongs to the same app as the
// web dashboard: text brand header (no logo image - keeps every email
// client rendering it identically and avoids it showing up as a file
// attachment), white rounded card body, footer matching DashboardFooter's
// tagline style.
function wrapEmail({ title, bodyHtml }) {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px 16px; background: #f8fafc;">
        <div style="text-align: center; margin-bottom: 20px;">
            <span style="font-size: 22px; font-weight: bold; color: ${BRAND_COLOR};">${BRAND_NAME}</span>
        </div>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px;">
            ${title ? `<h2 style="color: ${BRAND_COLOR}; margin-top: 0;">${title}</h2>` : ""}
            ${bodyHtml}
        </div>
        <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">
            Powered by <strong style="color: #7c3aed;">${BRAND_NAME}</strong> for Smarter Trading<br/>
            © ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.
        </p>
    </div>`;
}

function buildMailOptions(to, subject, html) {
    const sender = `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`;
    return { from: sender, to, subject, html };
}

const sendWelcomeEmail = async (email, fullname, username) => {
    try {
        const html = wrapEmail({
            title: `Welcome to ${BRAND_NAME}, ${fullname}!`,
            bodyHtml: `
                <p>Thank you for registering. We are thrilled to have you on board.</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #475569;">Your Account Details:</h3>
                    <p><strong>Full Name:</strong> ${fullname}</p>
                    <p><strong>Username:</strong> ${username || "Not set"}</p>
                    <p><strong>Email:</strong> ${email}</p>
                </div>
                <p>You can now log in to your dashboard and start exploring our features.</p>
                <p>Happy Trading!<br/><strong>The ${BRAND_NAME} Team</strong></p>
            `,
        });

        const info = await transporter.sendMail(buildMailOptions(email, `Welcome to ${BRAND_NAME}! 🎉`, html));
        console.log("Welcome email sent: " + info.response);
    } catch (error) {
        console.error("Error sending welcome email:", error);
    }
};

// Sent after a successful PATCH /api/auth/profile - a lightweight security
// notice ("did you make this change?") as much as a confirmation.
const sendProfileUpdatedEmail = async (email, fullname, changedFields) => {
    try {
        const rows = changedFields
            .map(({ label, value }) => `<p style="margin:4px 0;"><strong>${label}:</strong> ${value || "-"}</p>`)
            .join("");

        const html = wrapEmail({
            title: "Your profile was updated",
            bodyHtml: `
                <p>Hi ${fullname},</p>
                <p>Your ${BRAND_NAME} profile was just updated with the following details:</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    ${rows}
                </div>
                <p>If you didn't make this change, please contact support immediately.</p>
            `,
        });

        const info = await transporter.sendMail(buildMailOptions(email, `Your ${BRAND_NAME} profile was updated`, html));
        console.log("Profile update email sent: " + info.response);
    } catch (error) {
        console.error("Error sending profile update email:", error);
    }
};

// Part of the password-change flow: the new password is only ever applied
// after the user proves they control the account's inbox by echoing this
// code back (see authController.confirmPasswordChange).
const sendPasswordChangeCode = async (email, fullname, code) => {
    try {
        const html = wrapEmail({
            title: "Confirm your password change",
            bodyHtml: `
                <p>Hi ${fullname},</p>
                <p>Use the code below to confirm your password change. It expires in 10 minutes.</p>
                <div style="text-align: center; margin: 24px 0;">
                    <span style="display: inline-block; font-size: 28px; font-weight: bold; letter-spacing: 8px; color: ${BRAND_COLOR}; background: #eff6ff; padding: 14px 24px; border-radius: 12px;">
                        ${code}
                    </span>
                </div>
                <p>If you didn't request this, you can safely ignore this email - your password will not be changed.</p>
            `,
        });

        const info = await transporter.sendMail(buildMailOptions(email, `Your ${BRAND_NAME} password change code`, html));
        console.log("Password change code email sent: " + info.response);
    } catch (error) {
        console.error("Error sending password change code email:", error);
    }
};

// Confirms the user actually controls this inbox - sent on registration and
// whenever they hit "Verify Email" / "Resend code" from the Profile page.
const sendEmailVerificationCode = async (email, fullname, code) => {
    try {
        const html = wrapEmail({
            title: "Verify your email address",
            bodyHtml: `
                <p>Hi ${fullname},</p>
                <p>Use the code below to confirm this is your email address. It expires in 10 minutes.</p>
                <div style="text-align: center; margin: 24px 0;">
                    <span style="display: inline-block; font-size: 28px; font-weight: bold; letter-spacing: 8px; color: ${BRAND_COLOR}; background: #eff6ff; padding: 14px 24px; border-radius: 12px;">
                        ${code}
                    </span>
                </div>
                <p>If you didn't request this, you can safely ignore this email.</p>
            `,
        });

        const info = await transporter.sendMail(buildMailOptions(email, `Verify your ${BRAND_NAME} email address`, html));
        console.log("Email verification code sent: " + info.response);
    } catch (error) {
        console.error("Error sending email verification code:", error);
    }
};

module.exports = {
    sendWelcomeEmail,
    sendProfileUpdatedEmail,
    sendPasswordChangeCode,
    sendEmailVerificationCode,
};
