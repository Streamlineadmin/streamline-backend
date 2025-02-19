const { json } = require('body-parser');
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
                addressLineOne: elem.addressLineOne,
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

async function getBuyerSupplier(req, res) {
    try {
        // Find all BuyerSupplier records for the given companyId
        const result = await models.BuyerSupplier.findAll({
            where: { companyId: req.body.companyId }
        });

        // If no results, return an empty array
        if (!result || result.length === 0) {
            return res.status(200).json([]);
        }

        // Map over result and fetch BuyerSupplierAddress for each BuyerSupplier record
        const buyerSupplierWithAddresses = await Promise.all(
            result.map(async (buyerSupplier) => {
                const addresses = await models.BuyerSupplierAddress.findAll({
                    where: { buyerSupplierId: buyerSupplier.id }
                });

                return {
                    ...buyerSupplier.toJSON(),
                    addresses: addresses || []
                };
            })
        );

        // Send the result with addresses
        res.status(200).json(buyerSupplierWithAddresses);
    } catch (error) {
        console.error("Error fetching BuyerSupplier data:", error);
        res.status(500).json({
            message: "Something went wrong, please try again later!"
        });
    }
}

module.exports = {
    addBuyerSupplier: addBuyerSupplier,
    getBuyerSupplier: getBuyerSupplier,
    deleteBuyerSupplier: deleteBuyerSupplier
}