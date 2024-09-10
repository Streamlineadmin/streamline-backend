const models = require('../models');

function addBuyerSupplier(req, res) {
    const buyerSupplierData = {
        name: req.body.name,
        companyId: req.body.companyId,
        email: req.body.email,
        phone: req.body.phone,
        companyName: req.body.companyName,
        companyEmail: req.body.companyEmail,
        companyType: req.body.companyType,
        GSTNumber: req.body.gstNumber,
        GSTType: req.body.gstType,
        ip_address: req.body.ip_address,
        status: 1
    }

    models.BuyerSupplier.create(buyerSupplierData).then(result => {
        req.body.addresses.map((elem) => {
            let addressData = {
                buyerSupplierId: result.id,
                addressLineOne: elem.addressLine1,
                addressLineTwo: elem.addressLine2,
                addressType: elem.addressType,
                city: elem.city,
                country: elem.country,
                pincode: elem.pincode,
                state: elem.state,
                ip_address: req.body.ip_address,
                status: 1
            }
            models.BuyerSupplierAddress.create(addressData);
        })
        res.status(200).json({
            message: "Buyer/Supplier added successfully",
            post: result
        });
    }).catch(error => {
        res.status(500).json({
            message: "Something went wrong, please try again later!",
            error: error
        });
    });
}

function deleteBuyerSupplier(req, res) {
    const id = req.body.id;  // Assuming the team ID is passed as a URL parameter

    models.BuyerSupplier.destroy({ where: { id: id } })
        .then(result => {
            if (result) {
                res.status(200).json({
                    message: "Buyer/Supplier deleted successfully"
                });
            } else {
                res.status(200).json({
                    message: "Item not found"
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

function getBuyerSupplier(req, res) {
    models.BuyerSupplier.findAll({
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
            console.error("Error fetching blogs:", error);
            res.status(500).json({
                message: "Something went wrong, please try again later!"
            });
        });
}


module.exports = {
    addBuyerSupplier: addBuyerSupplier,
    getBuyerSupplier: getBuyerSupplier,
    deleteBuyerSupplier: deleteBuyerSupplier
}