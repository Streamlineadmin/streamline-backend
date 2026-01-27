const models = require('../models');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op, where } = require('sequelize');

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});


async function addUser(req, res) {
    const { email, username, contactNo, name, companyName } = req.body;

    try {
        // Execute all checks in parallel
        const [emailResult, usernameResult, contactNoResult, companyUser] = await Promise.all([
            models.Users.findOne({ where: { email, companyId: req.body.companyId } }),
            models.Users.findOne({ where: { username, companyId: req.body.companyId } }),
            models.Users.findOne({ where: { contactNo, companyId: req.body.companyId } }),
            // models.Users.findOne({ where: { companyId: req.body.companyId } }) // Check if the user is a super admin
        ]);

        if (emailResult) {
            return res.status(409).json({ message: "Email already exists!" });
        }
        if (usernameResult) {
            return res.status(409).json({ message: "Username already exists!" });
        }
        if (contactNoResult) {
            return res.status(409).json({ message: "This contact number belongs to someone else!" });
        }
        // if (companyUser) {
        //     return res.status(409).json({ message: "This user already exist in this company!" });
        // }

        // Generate a random 8-character password
        const plainPassword = crypto.randomBytes(4).toString('hex');

        // Hash the password using bcrypt
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        // Create user object with encrypted password
        const newUser = await models.Users.create({
            name,
            email,
            contactNo,
            username,
            password: hashedPassword,  // Save encrypted password
            role: req.body.role,
            companyName,
            companyId: req.body.companyId,
            ip_address: req.body.ip_address,
            status: 1
        });

        // **Email Template (HTML)**
        const emailTemplate = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <img src="https://easemargin.com/static/media/logo.254ec62d5b107c7a9405.png" alt="EaseMargin Logo" style="height: 80px; margin-bottom: 20px;">
                
                <h2 style="color: #1780fb; font-size: 22px; margin-bottom: 10px;">Welcome to EaseMargin</h2>
                <p style="color: #555; font-size: 16px;">Dear ${name},</p>
                <p style="color: #666; font-size: 14px; line-height: 1.6;">
                    Your account has been successfully created! Below are your login credentials:
                </p>

                <div style="background: #f5faff; padding: 15px; border-radius: 8px; text-align: left;">
                    <p style="margin: 8px 0;"><strong>Company Name:</strong> ${companyName}</p>
                    <p style="margin: 8px 0;"><strong>Email:</strong> ${email}</p>
                    <p style="margin: 8px 0;"><strong>Username:</strong> ${username}</p>
                    <p style="margin: 8px 0;"><strong>Password:</strong> <span style="color: red; font-weight: bold;">${plainPassword}</span></p>
                </div>

                <p style="color: #666; font-size: 14px; margin-top: 20px;">You can now log in and start using EaseMargin.</p>

                <a href="${req.get('origin')}/sign-in" style="background-color: #1780fb; color: white; padding: 10px 15px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: bold; display: inline-block; margin-top: 10px;">
                    Login Now
                </a>

                <p style="color: #888; font-size: 13px; margin-top: 20px;">
                    If you have any questions, feel free to contact our support team at <a href="mailto:info@easemargin.com">info@easemargin.com</a>
                </p>

                <p style="color: #555; font-size: 14px; margin-top: 10px;">
                    Best regards, <br><strong>EaseMargin Team</strong>
                </p>
            </div>`;

        // **Send signup confirmation email**
        const mailOptions = {
            from: process.env.SMTP_USER,
            to: email,
            subject: "Welcome to EaseMargin!",
            html: emailTemplate,
        };

        await transporter.sendMail(mailOptions);

        res.status(201).json({
            message: "User created successfully! Login details sent to email.",
        });

    } catch (error) {
        res.status(500).json({
            message: "Something went wrong! Please try again later.",
            error: error.message || error,
        });
    }
}

function editUser(req, res) {
    const userId = req.body.userId;
    const { companyName,
        contactNo,
        email,
        username,
        name,
        role,
        website } = req.body;

    const updatedUserData = {
        companyName,
        contactNo,
        email,
        username,
        name,
        role,
        website
    };

    // Check if email, username, or contactNo exists for another user (exclude current user)
    models.Users.findOne({
        where: {
            [models.Sequelize.Op.or]: [
                { email: email, id: { [models.Sequelize.Op.ne]: userId } },
                { username: username, id: { [models.Sequelize.Op.ne]: userId } },
                { contactNo: contactNo, id: { [models.Sequelize.Op.ne]: userId } }
            ]
        }
    })
        .then(existingUser => {
            if (existingUser) {
                if (existingUser.email === email) {
                    return res.status(409).json({
                        message: "Email already exists!",
                    });
                } else if (existingUser.username === username) {
                    return res.status(409).json({
                        message: "Username already exists!",
                    });
                } else if (existingUser.contactNo === contactNo) {
                    return res.status(409).json({
                        message: "Contact number already exists!",
                    });
                }
            } else {
                // No conflict, proceed with the update
                models.Users.update(updatedUserData, { where: { id: userId } })
                    .then(result => {
                        if (result[0] > 0) {
                            res.status(200).json({
                                message: "User updated successfully",
                                post: updatedUserData
                            });
                        } else {
                            res.status(404).json({
                                message: "User not found"
                            });
                        }
                    })
                    .catch(error => {
                        res.status(500).json({
                            message: "Something went wrong, please try again later!",
                            error: error.message || error
                        });
                    });
            }
        })
        .catch(error => {
            res.status(500).json({
                message: "Something went wrong, please try again later!",
                error: error.message || error
            });
        });
}

function deleteUser(req, res) {
    const userId = req.body.userId;  // Assuming the blog ID is passed as a URL parameter

    models.Users.destroy({ where: { id: userId } })
        .then(result => {
            if (result) {
                res.status(200).json({
                    message: "User deleted successfully"
                });
            } else {
                res.status(200).json({
                    message: "Blog not found"
                });
            }
        })
        .catch(error => {
            res.status(500).json({
                message: "Something went wrong, please try again later!",
                error: error
            });
        });
}

function getUsers(req, res) {
    models.Users.findAll({
        where: {
            companyId: req.body.companyId,
            ...(!req.body.admin ? {
                role: {
                    [Op.notIn]: [1, 2]
                }
            } : {})
        }
    }).then(result => {
        if (!result || result.length === 0) {
            return res.status(200).json([]);
        }
        res.status(200).json(result);
    })
        .catch(error => {
            console.error("Error fetching blogs:", error);
            res.status(500).json({
                message: "Something went wrong, please try again later!"
            });
        });
}

async function updateProfile(req, res) {
    try {
        const {
            userId,
            companyName,
            email,
            website,
            name,
            businessType,
            contactNo,
            role,
            pan,
            gstNumber,
            cin
        } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        const user = await models.Users.findOne({
            where: {
                id: userId
            }
        });

        // Update User Table
        const [affectedRows] = await models.Users.update(
            {
                companyName,
                email,
                website,
                name,
                businessType,
                contactNo,
                role,
                pan,
                gstNumber,
                cin,
            },
            { where: { id: userId } }
        );

        if (affectedRows === 0) {
            return res.status(404).json({ message: "User not found or no changes made." });
        }

        // Fetch the updated user details
        const updatedUser = await models.Users.findOne({
            where: { id: userId },
            attributes: ['id', 'name', 'email', 'companyName', 'companyId', 'contactNo', 'role', 'website', 'businessType', 'pan', 'gstNumber', 'cin']
        });

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
            username: updatedUser.username,
            email: updatedUser.email,
            companyId: user.companyId,
            companyName: updatedUser.companyName,
            businessType: updatedUser.businessType,
            profileURL: updatedUser.profileURL,
            website: updatedUser.website,
            name: updatedUser.name,
            contactPersonNumber: updatedUser.contactNo,
            role: updatedUser.role,
            pan: updatedUser.pan,
            gstNumber: updatedUser.gstNumber,
            cin: updatedUser.cin,
            permissions: rolesAccess,
            logoUrl
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET || "secret", { expiresIn: "1h" });

        // Format response
        res.status(200).json({
            message: "Profile updated successfully.",
            userId: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            companyName: updatedUser.companyName,
            companyId: updatedUser.companyId,
            contactNo: updatedUser.contactNo,
            role: updatedUser.role,
            website: updatedUser.website,
            companyBusinessType: updatedUser.businessType,
            pan: updatedUser.pan,
            gstNumber: updatedUser.gstNumber,
            cin: updatedUser.cin,
            token
        });

    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Something went wrong, please try again later!" });
    }
}

async function updateProfileURL(req, res) {
    try {
        const { userId, profileURL } = req.body;

        if (!userId || !profileURL) {
            return res.status(400).json({ message: "User ID and Profile URL are required" });
        }

        // First, check if the user exists
        const user = await models.Users.findOne({ where: { id: userId } });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update the profile URL
        await models.Users.update(
            { profileURL: profileURL },
            { where: { id: userId } }
        );

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
        let logoUrl = profileURL || "";
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
            profileURL: profileURL,
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

        // Return the updated user data
        res.status(200).json({
            message: "Profile URL updated successfully",
            token,
            email: user.email
        });

    } catch (error) {
        console.error("Error updating profile URL:", error);
        res.status(500).json({
            message: "Something went wrong, please try again later!",
            error: error.message
        });
    }
}

async function partialUser(req, res) {
    try {
        const user = await models.Users.findOne({
            where: {
                companyId: req.body.companyId,
                role: {
                    [Op.in]: [1, 2]
                }
            },
            raw: true
        });
        res.status(200).json({ ...user, logoUrl: user?.profileURL || "" });
    } catch (error) {
        res.status(500).json({
            message: "Something went wrong, please try again later!",
            error: error?.message || error
        });
    }
}

async function getCompanies(req, res) {
    try {
        const users = await models.Users.findAll({
            where: {
                role: {
                    [Op.in]: [1, 2]
                }
            },
            attributes: ['companyId', 'companyName'],
            raw: true
        });
        res.status(200).json({ users: users });
    } catch (error) {
        res.status(500).json({
            message: "Something went wrong, please try again later!",
            error: error?.message || error
        });
    }
}

module.exports = {
    addUser: addUser,
    getUsers: getUsers,
    editUser: editUser,
    deleteUser: deleteUser,
    updateProfile: updateProfile,
    updateProfileURL: updateProfileURL,
    partialUser: partialUser,
    getCompanies: getCompanies
}
