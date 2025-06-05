require("dotenv").config(); // Load .env file

const nodemailer = require("nodemailer");

// Ensure required environment variables are set
if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error("Missing required SMTP environment variables. Check your .env file.");
    process.exit(1); // Exit the process if variables are missing
}

// Create reusable transporter object
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_PORT == "465", // True for 465 (SSL), false for 587 (TLS)
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false, // Prevent SSL certificate issues
    },
});

// Send Email Function (Now using async/await)
async function sendEmail(req, res) {
    try {
        const { to, subject, text } = req.body;

        if (!to || !subject || !text) {
            return res.status(400).json({ message: "Missing required fields: to, subject, text" });
        }

        const mailOptions = {
            from: process.env.SMTP_USER, // Use configured email
            to,
            subject,
            text,
        };

        const info = await transporter.sendMail(mailOptions);
        
        res.status(200).json({
            message: "Email sent successfully",
            info: info,
        });

    } catch (error) {
        res.status(500).json({
            message: "Something went wrong, please try again later!",
            error: error.message,
        });
    }
}

module.exports = { sendEmail };
