const models = require('../models');

function getDocuments(req, res) {
    models.Documents.findAll({
        where: {
            companyId: req.body.companyId
        }
    }).then(result => {
        if (!result || result.length === 0) {
            return res.status(200).json([]);
        }
        res.status(200).json(result);
    })
        .catch(error => {
            console.error("Error fetching documents:", error);
            res.status(500).json({
                message: "Something went wrong, please try again later!"
            });
        });
}


module.exports = {
    getDocuments: getDocuments,
}