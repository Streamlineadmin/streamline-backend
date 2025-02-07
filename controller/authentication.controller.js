const models = require('../models');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});


async function signUp(req, res) {
    try {
        const { companyName, businessType, email, username, password, contactNo, name, role } = req.body;

        // Check if email, username, or companyName already exists
        const existingUser = await models.Users.findOne({ where: { email } });
        if (existingUser) return res.status(409).json({ message: "Email already exists!" });

        const existingUsername = await models.Users.findOne({ where: { username } });
        if (existingUsername) return res.status(409).json({ message: "Username already exists!" });

        const existingCompany = await models.Users.findOne({ where: { companyName } });
        if (existingCompany) return res.status(409).json({ message: "Company Name already exists!" });

        // Hash password
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(password, salt);

        // Create new user
        const newUser = await models.Users.create({
            companyName,
            businessType,
            email,
            username,
            password: hashedPassword,
            contactNo,
            name,
            role,
            status: 1
        });

        // Update the same row with companyId
        await models.Users.update(
            { companyId: newUser.id }, // Set companyId as the newly created user’s id
            { where: { id: newUser.id } }
        );

        // Send response
        res.status(201).json({ message: "Signed up successfully" });

        // Email Template (HTML)
        const emailTemplate = `<div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; ">
            <img src="https://easemargin.com/static/media/ease-primary.3d606f37b10fdb7c34fe36ebf9ce65ff.svg" alt="EaseMargin Logo" style="height: 120px; margin-bottom: 20px;">
            
            <h2 style="color: #1780fb; font-size: 24px; margin-bottom: 10px;">Welcome to EaseMargin</h2>
            <p style="color: #555; font-size: 16px;">Dear ${name},</p>
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
                We’re excited to have you on board! Your account has been successfully created. Below are your details:
            </p>

            <div style="background: #f5faff; padding: 15px; border-radius: 8px; text-align: left;">
                <p style="margin: 8px 0;"><strong>Company Name:</strong> ${companyName}</p>
                <p style="margin: 8px 0;"><strong>Business Type:</strong> ${businessType}</p>
                <p style="margin: 8px 0;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 8px 0;"><strong>Username:</strong> ${username}</p>
            </div>

            <p style="color: #666; font-size: 14px; margin-top: 20px;">You can now log in and explore all our features.</p>

            <a href="https://easemargin.com/sign-in" style="background-color: #1780fb; color: white; padding: 10px 15px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: bold; display: inline-block; margin-top: 10px;">
                Login Now
            </a>

            <p style="color: #888; font-size: 13px; margin-top: 20px;">
                If you have any questions, feel free to contact our support team or mail us at info@easemargin.com
            </p>

            <p style="color: #555; font-size: 14px; margin-top: 10px;">
                Best regards, <br><strong>EaseMargin Team</strong>
            </p>
        </div>`;

        // Send signup confirmation email
        const mailOptions = {
            from: process.env.SMTP_USER,
            to: email,
            subject: "Welcome to EaseMargin!",
            html: emailTemplate,
        };
        await transporter.sendMail(mailOptions);

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({
            message: "Something went wrong! Please try again later.",
            error: error.message,
        });
    }
}



function login(req, res) {
    models.Users.findOne({ where: { email: req.body.email } }).then(user => {
        if (user === null) {
            res.status(401).json({
                message: "Invalid Credentials!",
            });
        } else {
            bcryptjs.compare(req.body.password, user.password, function (err, result) {
                if (result) {
                    const token = jwt.sign({
                        username: user.username,
                        email: user.email,
                        userId: user.id,
                        companyId: user.companyId,
                        companyName: user.companyName
                    }, 'secret', function (err, token) {
                        res.status(200).json({
                            message: "Authentication successful.",
                            token: token
                        });
                    });
                } else {
                    res.status(401).json({
                        message: "Invalid credentials !"
                    })
                }
            })
        }
    }).catch(error => {
        res.status(500).json({
            message: "Something went wrong, Please try again later!",
        })
    })
}

module.exports = {
    signUp: signUp,
    login: login
}