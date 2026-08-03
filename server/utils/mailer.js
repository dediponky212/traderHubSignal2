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

const sendWelcomeEmail = async (email, fullname, username) => {
    try {
        // Format pengirim: "Forex Hub" <noreply@komandan-umroh.com>
        const sender = `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`;

        const mailOptions = {
            from: sender,
            to: email,
            subject: "Welcome to ForexHub! 🎉",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                    <h2 style="color: #2563eb;">Welcome to ForexHub, ${fullname}!</h2>
                    <p>Thank you for registering. We are thrilled to have you on board.</p>
                    <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #475569;">Your Account Details:</h3>
                        <p><strong>Full Name:</strong> ${fullname}</p>
                        <p><strong>Username:</strong> ${username || "Not set"}</p>
                        <p><strong>Email:</strong> ${email}</p>
                    </div>
                    <p>You can now log in to your dashboard and start exploring our features.</p>
                    <p>Happy Trading!<br/><strong>The ForexHub Team</strong></p>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Welcome email sent: " + info.response);
    } catch (error) {
        console.error("Error sending welcome email:", error);
    }
};

module.exports = { sendWelcomeEmail };