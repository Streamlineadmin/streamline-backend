const { json } = require('body-parser');
const models = require('../models');
const axios = require('axios');
const convertXlsxToJson = require('../helpers/bulk-upload');


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
        PAN: req.body.pan,
        GSTType: req.body.gstType,
        ip_address: req.body.ip_address,
        status: req.body.status,
        customerType: req.body?.customerType || "company",
        pocDetails: req.body?.pocDetails || []
    }

    models.BuyerSupplier.create(buyerSupplierData).then(result => {
        req.body.addresses.map((elem) => {
            let addressData = {
                buyerSupplierId: result.id,
                addressLineOne: elem.addressLineOne,
                addressLineTwo: elem.addressLineTwo,
                addressType: elem.addressType,
                city: elem.city,
                country: elem.country,
                pincode: elem.pincode,
                state: elem.state,
                ip_address: req.body.ip_address,
                status: elem.status,
                gstNumber: elem?.gstNumber
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

async function editBuyerSupplier(req, res) {
    const { id, name, companyId, email, phone, companyName, companyEmail, companyType, gstNumber, pan, gstType, ip_address, addresses } = req.body;

    try {
        const buyerSupplier = await models.BuyerSupplier.findByPk(id);
        if (!buyerSupplier) {
            return res.status(404).json({ message: "Buyer/Supplier not found" });
        }

        await buyerSupplier.update({
            name,
            companyId,
            email,
            phone,
            companyName,
            companyEmail,
            companyType,
            GSTNumber: gstNumber,
            GSTType: gstType,
            ip_address,
            PAN: pan,
            pocDetails: req.body?.pocDetails || []
        });

        if (addresses && addresses.length > 0) {
            const existingAddresses = await models.BuyerSupplierAddress.findAll({
                where: { buyerSupplierId: id },
            });

            const existingAddressMap = new Map(existingAddresses.map(addr => [addr.id, addr]));

            for (const address of addresses) {
                if (address.id && existingAddressMap.has(address.id)) {
                    await existingAddressMap.get(address.id).update({
                        addressLineOne: address.addressLineOne,
                        addressLineTwo: address.addressLineTwo,
                        addressType: address.addressType,
                        city: address.city,
                        country: address.country,
                        pincode: address.pincode,
                        state: address.state,
                        ip_address,
                        status: address.status,
                        gstNumber: address?.gstNumber
                    });

                    existingAddressMap.delete(address.id);
                } else {
                    await models.BuyerSupplierAddress.create({
                        buyerSupplierId: id,
                        addressLineOne: address.addressLineOne,
                        addressLineTwo: address.addressLineTwo,
                        addressType: address.addressType,
                        city: address.city,
                        country: address.country,
                        pincode: address.pincode,
                        state: address.state,
                        ip_address,
                        status: address.status || 1,
                        gstNumber: address?.gstNumber
                    });
                }
            }

            for (const address of existingAddressMap.values()) {
                await address.destroy();
            }
        } else {
            await models.BuyerSupplierAddress.destroy({ where: { buyerSupplierId: id } });
        }

        res.status(200).json({ message: "Buyer/Supplier updated successfully" });
    } catch (error) {
        res.status(500).json({
            message: "Something went wrong, please try again later!",
            error: error.message,
        });
    }
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

async function bulkDeleteBuyerSupplier(req, res) {
    const buyerSupplierIds = req.body;

    if (!Array.isArray(buyerSupplierIds) || buyerSupplierIds.length === 0) {
        return res.status(400).json({
            message:
                "Invalid or empty 'buyerSuppliers' array in the request payload.",
        });
    }

    try {
        await models.BuyerSupplierAddress.destroy({
            where: { buyerSupplierId: buyerSupplierIds },
        });

        const deletedCount = await models.BuyerSupplier.destroy({
            where: { id: buyerSupplierIds },
        });

        if (deletedCount > 0) {
            return res.status(200).json({
                message: `Successfully deleted ${deletedCount} Buyer/Supplier(s).`,
            });
        } else {
            return res.status(404).json({
                message: "No Buyer/Supplier records found with the provided IDs.",
            });
        }
    } catch (error) {
        console.error("Error in bulk delete:", error);
        return res.status(500).json({
            message: "Something went wrong during bulk deletion.",
            error: error.message,
        });
    }
}

async function getBuyerSupplier(req, res) {
    try {
        const companyId = req.body.companyId;
        const buyerSuppliers = await models.BuyerSupplier.findAll({
            where: { companyId },
            order: [['createdAt', 'DESC']]
        });

        if (!buyerSuppliers || buyerSuppliers.length === 0) {
            return res.status(200).json([]);
        }

        const buyerSupplierIds = buyerSuppliers.map(bs => bs.id);
        const addresses = await models.BuyerSupplierAddress.findAll({
            where: {
                buyerSupplierId: buyerSupplierIds
            }
        });

        const addressMap = {};
        addresses.forEach(addr => {
            const id = addr.buyerSupplierId;
            if (!addressMap[id]) addressMap[id] = [];
            addressMap[id].push(addr);
        });

        const result = buyerSuppliers.map(bs => ({
            ...bs.toJSON(),
            addresses: addressMap[bs.id] || []
        }));

        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching BuyerSupplier data:", error);
        res.status(500).json({
            message: "Something went wrong, please try again later!"
        });
    }
}

async function bulkUploadBuyerSuppliers(req, res) {
    try {
        const { file, body } = req;
        const { companyId } = body;

        if (!file || !companyId) {
            return res.status(400).json({ message: "Missing required data." });
        }

        const existingBuyerSupplier = await models.BuyerSupplier.findAll({
            where: {
                companyId: Number(companyId)
            },
            raw: true
        });

        const existingBuyerSupplierMap = existingBuyerSupplier?.reduce((acc, curr) => {
            acc[curr?.companyName?.toLowerCase?.()] = 1;
            return acc;
        }, {});

        const sheetDataBuyerSupplierMap = {};

        const sheetData = await convertXlsxToJson(file.filename, "bulkUploadCompany");

        const buyerSuppliersPayload = [];
        const addressPayload = [];
        const errorData = [];
        const requiredFields = [
            "* Company Name",
            "* Company Type",
            "* Address",
            "* Address Type",
            "* City",
            "* State",
        ];

        for (const row of sheetData) {
            const missingFields = [];

            for (const field of requiredFields) {
                const value = row[field];
                if (!value || `${value}`.trim() === "") {
                    missingFields.push(field.replace("* ", ""));
                }
            }

            const {
                "Person Name": personName,
                "Person Email": personEmail,
                "Phone": phone,
                "* Company Name": companyName,
                "Company Email": companyEmail,
                "* Company Type": companyType,
                "GST Number": gstNumber,
                "GST Type": gstType,
                "* Address": address,
                "* Address Type": addressType,
                "Pin Code": pinCode,
                "* City": city,
                "* State": state,
                "PAN Number": PAN
            } = row;

            if (existingBuyerSupplierMap[companyName?.toLowerCase?.()]) {
                row["Error"] = 'Company Name Already Exist.'
                errorData.push(row);
                continue;
            }

            if (sheetDataBuyerSupplierMap?.[companyName?.toLowerCase?.()]) {
                row["Error"] = 'Company Name Already Exist in Sheet.'
                errorData.push(row);
                continue;
            }

            sheetDataBuyerSupplierMap[companyName?.toLowerCase?.()] = 1;

            if (missingFields.length > 0) {
                row["Error"] = `Missing required fields: ${missingFields.join(", ")}`;
                errorData.push(row);
                continue;
            }

            buyerSuppliersPayload.push({
                name: personName?.trim() || "",
                email: personEmail?.trim() || "",
                phone: phone || "",
                companyId: Number(companyId),
                companyName: companyName?.trim?.(),
                companyEmail: companyEmail?.trim?.(),
                companyType: companyType == 'Both' ? 3 : companyType == 'Buyer' ? 1 : 2,
                GSTNumber: gstNumber?.toString()?.trim() || "",
                GSTType: gstType?.trim() ? gstType == 'Regular' ? 1 : 2 : '',
                status: 1,
                customerType: "company",
                pocDetails: personName?.trim() ? [{ name: personName?.trim(), email: personEmail?.trim(), phone: phone || "" }] : [],
                PAN: PAN?.trim?.()?.toUpperCase?.()
            });

            addressPayload.push({
                addressLineOne: address?.trim?.(),
                addressType: addressType,
                city: city?.trim?.(),
                state: state?.trim?.(),
                country: "India",
                pincode: pinCode || "",
                status: 1,
            });
        }

        if (buyerSuppliersPayload.length) {
            const buyerSuppliers = await models.BuyerSupplier.bulkCreate(buyerSuppliersPayload, {
                returning: true,
            });

            const bulkAddress = [];
            let i = 0;
            for (const element of addressPayload) {
                if (element.addressType === 'Both') {
                    bulkAddress.push({ ...element, addressType: 1, buyerSupplierId: buyerSuppliers[i].id });
                    bulkAddress.push({ ...element, addressType: 2, buyerSupplierId: buyerSuppliers[i].id });
                }
                else {
                    if (element.addressType === 'Delivery Address') {
                        bulkAddress.push({ ...element, addressType: 1, buyerSupplierId: buyerSuppliers[i].id });
                    } else {
                        bulkAddress.push({ ...element, addressType: 2, buyerSupplierId: buyerSuppliers[i].id });
                    }
                }
                i++;
            }

            await models.BuyerSupplierAddress.bulkCreate(bulkAddress);
        }

        const msg = !errorData.length
            ? 'Bulk Company uploaded successfully.'
            : errorData.length !== sheetData.length
                ? 'Bulk company uploaded successfully. Some rows contain invalid data. We Download Those Rows for you.'
                : 'All rows contain invalid data. We Download Those Rows for you.';

        res.status(200).json({ message: msg, invalidData: errorData });

    } catch (error) {
        console.error("Bulk Upload Error:", error);
        return res.status(500).json({
            message: "Something went wrong during bulk upload.",
            error,
        });
    }
}

async function getCompanyDetailsByGstNumber(req, res) {
    const { gstNumber } = req.body;

    try {
        if (!gstNumber) {
            return res.status(400).json({ message: "GST number is required" });
        }

        const response = await axios.get("https://api.whitebooks.in/public/search", {
            params: {
                email: "apisales@whitebooks.in",
                gstin: gstNumber,
            },
            headers: {
                "Content-Type": "application/json",
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET
            },
        });

        if (!response?.data?.error) {
            return res.status(200).json({
                success: true,
                ...response?.data,
                message: 'Data Fetched'
            });
        } else {
            return res.status(400).json({
                success: false,
                error: response?.data?.error?.message
            });
        }
    } catch (error) {
        console.error("Error fetching company details:", error.message);
        return res.status(500).json({
            success: false,
            message: "Something went wrong, please try again later!",
            error: error.response?.data || error.message,
        });
    }
}

module.exports = {
    addBuyerSupplier: addBuyerSupplier,
    getBuyerSupplier: getBuyerSupplier,
    deleteBuyerSupplier: deleteBuyerSupplier,
    bulkDeleteBuyerSupplier: bulkDeleteBuyerSupplier,
    editBuyerSupplier: editBuyerSupplier,
    bulkUploadBuyerSuppliers: bulkUploadBuyerSuppliers,
    getCompanyDetailsByGstNumber: getCompanyDetailsByGstNumber
}