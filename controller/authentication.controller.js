const models = require('../models');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");
const { Op } = require("sequelize");
require("dotenv").config();

const crypto = require('crypto');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * ================================
 * CLIENT IP RESTRICTIONS
 * ================================
 */
const CLIENT_IP_RESTRICTIONS = {
    "SATVIJ INTERNATIONAL": [
        "122.176.135.194",
        // add more if needed
        // "122.176.135.195"
    ]
};

/**
 * Get real client IP (proxy-safe)
 */
function getClientIp(req) {
    const xForwardedFor = req.headers["x-forwarded-for"];
    if (xForwardedFor) {
        return xForwardedFor.split(",")[0].trim();
    }

    return (
        req.headers["x-real-ip"] ||
        req.socket?.remoteAddress ||
        req.connection?.remoteAddress ||
        null
    );
}

/**
 * Normalize IPv6 → IPv4
 * Example: ::ffff:103.21.244.0 → 103.21.244.0
 */
function normalizeIp(ip) {
    if (!ip) return null;
    if (ip.startsWith("::ffff:")) {
        return ip.replace("::ffff:", "");
    }
    return ip;
}

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
            <img src="https://easemargin.com/static/media/logo.254ec62d5b107c7a9405.png" alt="EaseMargin Logo" style="height: 120px; margin-bottom: 20px;">
            
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
                <p style="margin: 8px 0;"><strong>Password:</strong> ${password}</p>
            </div>

            <p style="color: #666; font-size: 14px; margin-top: 20px;">You can now log in and explore all our features.</p>

            <a href="${req.get('origin')}/sign-in" style="background-color: #1780fb; color: white; padding: 10px 15px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: bold; display: inline-block; margin-top: 10px;">
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

async function login(req, res) {
    try {
        const { email, password } = req.body;

        // 🌐 Get client IP
        const rawIp = getClientIp(req);
        const userIp = normalizeIp(rawIp);


        // 1️⃣ Fetch user
        const user = await models.Users.findOne({
            where: {
                [Op.or]: [{ email }, { username: email }]
            },
            attributes: { exclude: ["createdAt", "updatedAt"] },
            raw: true
        });

        if (!user) {
            return res.status(401).json({ message: "Invalid credentials!" });
        }

        // 🚨 2️⃣ IP restriction for Satvij International
        const allowedIps = CLIENT_IP_RESTRICTIONS[user.companyName];

        if (allowedIps && !allowedIps.includes(userIp)) {
            console.warn(
                `Blocked login for ${user.companyName} from IP ${userIp}`
            );
            return res.status(401).json({ message: "Logic is Blocked by this IP" });
        }

        // 2️⃣ Verify password
        const isPasswordValid = await bcryptjs.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials!" });
        }

        // 3️⃣ Fetch role permissions
        const rolePermissionsData = await models.RolePermissions.findAll({
            where: { companyId: user.companyId, role: user.role },
            raw: true
        });

        let rolesAccess = [];
        if (rolePermissionsData.length) {
            // Collect unique IDs
            const permissionIds = [...new Set(rolePermissionsData.map(rp => rp.permission))];
            const subpermissionIds = [...new Set(rolePermissionsData.map(rp => rp.subpermission))];

            // 4️⃣ Fetch all features & subfeatures in one go
            const [features, subfeatures] = await Promise.all([
                models.PermissionsFeatures.findAll({
                    where: { id: { [Op.in]: permissionIds } },
                    attributes: ["id", "feature"],
                    raw: true
                }),
                models.PermissionsSubFeatures.findAll({
                    where: { id: { [Op.in]: subpermissionIds } },
                    attributes: ["id", "subfeature"],
                    raw: true
                })
            ]);

            const featureMap = Object.fromEntries(features.map(f => [f.id, f.feature]));
            const subfeatureMap = Object.fromEntries(subfeatures.map(s => [s.id, s.subfeature]));

            // 5️⃣ Build access array
            rolesAccess = rolePermissionsData.map(rp => ({
                feature: featureMap[rp.permission] || null,
                subfeature: subfeatureMap[rp.subpermission] || null,
                create: rp.create,
                edit: rp.edit,
                view: Number(rp.view),
                delete: rp.delete
            }));
        }

        // 6️⃣ Attach admin logo if needed
        let logoUrl = user.profileURL || "";
        if (user.role !== 1 && !logoUrl) {
            const admin = await models.Users.findOne({
                where: { role: 1, companyId: user.companyId },
                attributes: ["profileURL"],
                raw: true
            });
            logoUrl = admin?.profileURL || "";
        }

        // 7️⃣ JWT payload
        const payload = {
            userId: user.id,
            username: user.username,
            email: user.email,
            companyId: user.companyId,
            companyName: user.companyName,
            businessType: user.businessType,
            profileURL: user.profileURL,
            website: user.website,
            name: user.name,
            contactPersonNumber: user.contactNo,
            role: user.role,
            pan: user.pan,
            gstNumber: user.gstNumber,
            cin: user.cin,
            permissions: rolesAccess,
            logoUrl
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET || "secret", { expiresIn: "1h" });

        return res.status(200).json({
            message: "Login successful.",
            token
        });

    } catch (error) {
        console.error("Error during login:", error);
        return res.status(500).json({
            message: "Something went wrong, please try again later.",
            error: error.message
        });
    }
}

async function forgotPassword(req, res) {
    try {
        const { email } = req.body;

        // Check if user exists
        const user = await models.Users.findOne({ where: { email } });
        if (!user) return res.status(404).json({ message: "User not found!" });

        // Generate a secure reset token
        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

        // Save reset token in the database
        await models.Users.update(
            { resetToken, resetTokenExpiry },
            { where: { email } }
        );

        // Reset password link (frontend URL)
        const resetLink = `${req.get('origin')}/reset-password?token=${resetToken}`;

        // Email template
        const emailTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border-radius: 10px;">
        <div>
            <img src="https://easemargin.com/static/media/logo.254ec62d5b107c7a9405.png" 
                 alt="EaseMargin Logo" 
                 style="height: 60px;">
        </div>

        <div style="background: #ffffff; border-radius: 8px; padding: 20px;">
            <h2 style="color: #1780fb; font-weight: 600;">Reset Your Password</h2>

            <p style="color: #333; font-size: 16px;">Hello <strong>${user.name}</strong>,</p>
            <p style="color: #555; font-size: 14px; line-height: 1.6;">
                We received a request to reset your password. Click the button below to set a new password:
            </p>

            <div style="margin: 20px 0;">
                <a href="${resetLink}" 
                   style="background-color: #1780fb; color: white; padding: 10px 15px; text-decoration: none; 
                          border-radius: 3px; font-size: 14px; font-weight: normal; display: inline-block;">
                    Reset Password
                </a>
            </div>

            <p style="color: #666; font-size: 14px;">
                This link will expire in <strong>1 hour</strong>. If you didn’t request this, please ignore this email.
            </p>

            <div style="border-top: 1px solid #ddd; margin-top: 20px; padding-top: 10px;">
                <p style="color: #888; font-size: 13px;">
                    If you have any questions, feel free to contact our support team at 
                    <a href="mailto:info@easemargin.com" style="color: #1780fb; text-decoration: none;">
                        info@easemargin.com
                    </a>.
                </p>
            </div>

            <p style="color: #555; font-size: 14px; margin-top: 10px;">
                Best regards, <br><strong>EaseMargin Team</strong>
            </p>
        </div>
    </div>
        `;

        // Send email
        const mailOptions = {
            from: process.env.SMTP_USER,
            to: email,
            subject: "Reset Your Password - EaseMargin",
            html: emailTemplate,
        };
        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: "Password reset email sent successfully!" });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Something went wrong!", error: error.message });
    }
}

async function resetPassword(req, res) {
    try {
        const { token, newPassword } = req.body;

        // Find user by reset token and check if token is valid
        const user = await models.Users.findOne({ where: { resetToken: token, resetTokenExpiry: { [Op.gt]: Date.now() } } });
        if (!user) return res.status(400).json({ message: "Invalid or expired reset token!" });

        // Hash new password
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(newPassword, salt);

        // Update user's password and clear reset token fields
        await models.Users.update(
            { password: hashedPassword, resetToken: null, resetTokenExpiry: null },
            { where: { id: user.id } }
        );

        res.status(200).json({ message: "Password reset successfully!" });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Something went wrong!", error: error.message });
    }
}

module.exports = {
    signUp: signUp,
    login: login,
    forgotPassword: forgotPassword,
    resetPassword: resetPassword,
}