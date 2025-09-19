const models = require("../models");

async function addApprovalPermission(req, res) {
    try {
        
    } catch (error) {
        console.error("Error submitting demo request:", error);
        return res.status(500).json({ message: "Server error" });
    }
}

module.exports = {
    addApprovalPermission
};
