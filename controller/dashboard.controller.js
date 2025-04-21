const models = require("../models");
const simpleStats = require('simple-statistics'); // Simple stats library for regression
const moment = require('moment');

async function dashboard(req, res) {
}

async function getBuyerSupplierCount(req, res) {
    try {
        const { companyId } = req.body;
        if (!companyId) return res.status(400).send({ message: 'Company Id is required.' });
        const counts = await models.BuyerSupplier.findAll({
            where: {
                companyId
            },
            attributes: [
                'customerType',
                [models.sequelize.fn('COUNT', models.sequelize.col('id')), 'count']
            ],
            group: ['customerType']
        });

        const result = {};
        counts.forEach(entry => {
            result[entry.customerType] = parseInt(entry.dataValues.count, 10);
        });

        res.status(200).json({
            message: "Buyer/Supplier counts fetched successfully",
            data: result
        });
    } catch (error) {
        console.error("Error fetching buyer/supplier counts:", error);
        res.status(500).json({
            message: "Something went wrong while fetching data!",
            error: error
        });
    }
}

async function getTotalItems(req, res) {
    try {
        const { companyId } = req.body;
        if (!companyId) return res.status(400).send({ message: 'Company Id is required.' });
        const itemCount = await models.Items.count({
            where: {
                companyId
            }
        }); // Adjust model name if needed

        res.status(200).json({
            message: "Total number of items fetched successfully",
            totalItems: itemCount
        });
    } catch (error) {
        console.error("Error fetching total items:", error);
        res.status(500).json({
            message: "Something went wrong while fetching item count",
            error
        });
    }
}

async function getTotalStores(req, res) {
    try {
        const { companyId } = req.body;
        if (!companyId) return res.status(400).send({ message: 'Company Id is required.' });
        const storeCount = await models.Store.count({
            where: {
                companyId
            }
        });

        res.status(200).json({
            message: "Total number of stores fetched successfully",
            totalStores: storeCount
        });
    } catch (error) {
        console.error("Error fetching total stores:", error);
        res.status(500).json({
            message: "Something went wrong while fetching store count",
            error
        });
    }
}

async function getTotalDocuments(req, res) {
    try {
        const { companyId } = req.body;
        if (!companyId) return res.status(400).send({ message: 'Company Id is required.' });
        const documentCount = await models.Documents.count({
            where: {
                companyId
            }
        });

        res.status(200).json({
            message: "Total number of documents fetched successfully",
            totalDocuments: documentCount
        });
    } catch (error) {
        console.error("Error fetching total documents:", error);
        res.status(500).json({
            message: "Something went wrong while fetching document count",
            error
        });
    }
}

async function getTotalUsersByCompany(req, res) {
    try {
        const { companyId } = req.body; // Or req.query.companyId if using query params

        if (!companyId) {
            return res.status(400).json({
                message: "companyId is required"
            });
        }

        const userCount = await models.Users.count({
            where: { companyId: companyId }
        });

        res.status(200).json({
            message: "Total users fetched successfully for the company",
            companyId,
            totalUsers: userCount
        });
    } catch (error) {
        console.error("Error fetching user count by company:", error);
        res.status(500).json({
            message: "Something went wrong while fetching user count",
            error
        });
    }
}

async function getItemSalesSummaryWithPrediction(req, res) {
    const { companyId } = req.body;

    if (!companyId) {
        return res.status(400).json({
            message: "Missing required parameter: companyId"
        });
    }

    try {
        // Fetch aggregated sales data
        const salesData = await models.Items.findAll({
            attributes: [
                'itemName',
                'category',
                [models.sequelize.fn('SUM', models.sequelize.col('currentStock')), 'quantitySold'],
                [models.sequelize.fn('AVG', models.sequelize.col('price')), 'unitPrice'],
                [models.sequelize.literal('SUM("currentStock" * "price")'), 'totalRevenue']
            ],
            where: { companyId },
            group: ['itemName', 'category']
        });

        const itemSales = salesData.map(item => ({
            itemName: item.itemName,
            category: item.category,
            quantitySold: parseFloat(item.dataValues.quantitySold),
            unitPriceINR: parseFloat(item.dataValues.unitPrice),
            totalRevenueINR: parseFloat(item.dataValues.totalRevenue)
        }));

        // Determine days left in current month
        const today = moment();
        const endOfMonth = moment().endOf('month');
        const daysLeft = endOfMonth.diff(today, 'days');

        const predictionResults = itemSales.map(item => {
            // Simulate sales over past 10 days to build regression
            const days = [];
            const quantities = [];
            for (let i = 1; i <= 10; i++) {
                days.push(i);
                // Slightly fluctuate quantity to simulate trend
                quantities.push(item.quantitySold * (0.8 + Math.random() * 0.4));
            }

            const regression = simpleStats.linearRegression(days.map((d, i) => [d, quantities[i]]));
            const regressionLine = simpleStats.linearRegressionLine(regression);

            // Predict sales for each remaining day in the month
            let predictedTotal = 0;
            for (let i = 11; i <= 10 + daysLeft; i++) {
                predictedTotal += regressionLine(i);
            }

            return {
                itemName: item.itemName,
                category: item.category,
                unitPriceINR: item.unitPriceINR.toFixed(2),
                currentSalesQuantity: item.quantitySold,
                predictedQuantityTillMonthEnd: parseFloat(predictedTotal).toFixed(2),
                predictedRevenueINR: (predictedTotal * item.unitPriceINR).toFixed(2)
            };
        });

        const topSellingItems = predictionResults
            .sort((a, b) => b.predictedQuantityTillMonthEnd - a.predictedQuantityTillMonthEnd)
            .slice(0, 5);

        res.status(200).json({
            message: "Predicted item sales till end of the month fetched successfully",
            numberOfItems: itemSales.length,
            topSellingItems
        });

    } catch (error) {
        console.error("Error in monthly prediction:", error);
        res.status(500).json({
            message: "Failed to generate prediction summary",
            error: error.message
        });
    }
}

async function predictSales(req, res) {
    try {
        const { companyId } = req.body;

        if (!companyId) {
            return res.status(400).json({ message: "companyId is required" });
        }

        // Fetch last 30 days of document entries with invoiceDate and advancePayment
        const documents = await models.Documents.findAll({
            where: {
                companyId,
                invoiceDate: {
                    [models.Sequelize.Op.ne]: null
                },
                advancePayment: {
                    [models.Sequelize.Op.ne]: null
                }
            },
            attributes: ['invoiceDate', 'advancePayment'],
            order: [['invoiceDate', 'ASC']]
        });

        if (documents.length < 30) {
            return res.status(400).json({
                message: "Insufficient data for prediction (need at least 30 documents with valid invoiceDate and advancePayment)"
            });
        }

        // Normalize dates to number of days since first invoice
        const baseDate = new Date(documents[0].invoiceDate);
        const days = documents.map(doc => {
            return (new Date(doc.invoiceDate) - baseDate) / (1000 * 3600 * 24);
        });

        const values = documents.map(doc => parseFloat(doc.advancePayment || 0));

        // Run linear regression
        const regression = simpleStats.linearRegression(days.map((d, i) => [d, values[i]]));
        const regressionLine = simpleStats.linearRegressionLine(regression);

        const lastDay = days[days.length - 1];

        // Predict next 7 and 30 days
        const next7Days = [];
        const next30Days = [];

        for (let i = 1; i <= 30; i++) {
            const futureDay = lastDay + i;
            const predictedSales = regressionLine(futureDay);
            const prediction = {
                day: i,
                predictedSales: predictedSales.toFixed(2)
            };

            if (i <= 7) next7Days.push(prediction);
            next30Days.push(prediction);
        }

        res.status(200).json({
            message: "Sales prediction for the next 7 and 30 days using Documents table",
            next7Days,
            next30Days
        });

    } catch (error) {
        console.error("Error in predictSales function:", error);
        res.status(500).json({
            message: "Error in predicting sales",
            error: error.message
        });
    }
}

async function getItemSalesSummary(req, res) {
    const { companyId } = req.body;

    if (!companyId) {
        return res.status(400).json({
            message: "Missing required parameter: companyId"
        });
    }

    try {
        const items = await models.Items.findAll({
            attributes: [
                'itemName',
                'category',
                'price',          // unit price
                'currentStock',   // quantity
                [models.sequelize.literal('(currentStock * price)'), 'stockValue']
            ],
            where: {
                companyId
            }
        });

        const formattedData = items.map(item => ({
            itemName: item.itemName,
            category: item.category,
            unitPriceINR: parseFloat(item.price || 0).toFixed(2),
            quantity: item.currentStock ?? 0,
            stockValueINR: parseFloat(item.get('stockValue') || 0).toFixed(2)
        }));

        res.status(200).json({
            message: "Item stock summary fetched successfully",
            data: formattedData
        });
    } catch (error) {
        console.error("Error fetching item summary:", error);
        res.status(500).json({
            message: "Failed to fetch item summary",
            error: error.message
        });
    }
}

async function getDocumentsInvoiceSummary(req, res) {
    try {
        const { companyId } = req.body;  // Get companyId from the request body

        if (!companyId) {
            return res.status(400).json({ message: "companyId is required" });
        }

        // Fetch documents where companyId matches and documentType is 'invoice'
        const documents = await models.Documents.findAll({
            where: {
                companyId,           // Filter documents by companyId
                documentType: 'invoice'  // Filter documents by documentType being 'invoice'
            },
            attributes: [
                'documentNumber',  // Use documentNumber as the invoice number
                'buyerName',
                [models.sequelize.literal('COALESCE(advancePayment, 0)'), 'totalValue'], // Adjusted based on available field
                [models.sequelize.literal('COALESCE(advancePayment, 0)'), 'paid'], // Adjusted based on available field
                'status',
                ['paymentTerm', 'payment'],
                'createdBy',
                ['createdAt', 'createdDate']
            ],
            order: [['createdAt', 'DESC']]
        });

        if (documents.length === 0) {
            return res.status(404).json({ message: "No invoice documents found for the given companyId" });
        }

        const summary = documents.map(doc => {
            // Ensure valid date parsing
            const createdDate = doc.createdDate ? new Date(doc.createdDate) : null;
            const formattedDate = createdDate && !isNaN(createdDate.getTime()) 
                ? createdDate.toISOString().split('T')[0]  // Correct date format (YYYY-MM-DD)
                : "Invalid Date";  // If invalid date, set fallback value

            return {
                invoiceNumber: doc.documentNumber || "N/A",  // Use documentNumber as invoiceNumber
                company: doc.buyerName,
                totalValue: parseFloat(doc.get('totalValue')).toFixed(2),
                paid: parseFloat(doc.get('paid')).toFixed(2),
                status: convertStatus(doc.status), // Optional: convert integer status to label
                payment: doc.payment,
                createdBy: doc.createdBy,
                createdDate: formattedDate
            };
        });

        res.status(200).json({
            message: "Invoice summary from documents fetched successfully",
            data: summary
        });
    } catch (err) {
        console.error("Error in getDocumentsInvoiceSummary:", err);
        res.status(500).json({
            message: "Failed to fetch invoice data",
            error: err.message || err
        });
    }
}

async function predictNext30DaysTotalValue(req, res) {
    try {
        // Get the companyId from the request body
        const { companyId } = req.body;

        // Ensure companyId is provided and is a valid number
        if (!companyId || isNaN(companyId)) {
            return res.status(400).json({
                message: "Invalid companyId provided"
            });
        }

        // Get the current date and the date from 30 days ago
        const currentDate = new Date();
        const thirtyDaysAgo = new Date(currentDate);
        thirtyDaysAgo.setDate(currentDate.getDate() - 30);

        // Convert both to ISO string (UTC) to avoid timezone discrepancies
        const currentDateUTC = currentDate.toISOString();
        const thirtyDaysAgoUTC = thirtyDaysAgo.toISOString();

        console.log("Current Date (UTC): ", currentDateUTC);
        console.log("30 Days Ago (UTC): ", thirtyDaysAgoUTC);

        // Fetch documents (invoices) from the last 30 days based on companyId
        const documents = await models.Documents.findAll({
            attributes: [
                'documentNumber', // Use documentNumber as invoice number
                'advancePayment', // Using advancePayment as part of total invoice amount
                'GSTValue', // Assuming GSTValue is part of the total value
                'createdAt'
            ],
            where: {
                createdAt: {
                    [models.Sequelize.Op.gte]: thirtyDaysAgoUTC // Ensure using the correct operator
                },
                documentType: 'invoice', // Ensure only invoices are considered
                companyId: companyId // Filter based on companyId
            },
            order: [['createdAt', 'ASC']]
        });

        console.log("Fetched Documents: ", documents);

        // If no documents found, return a message
        if (documents.length === 0) {
            return res.status(404).json({
                message: "No invoices found for the given company in the last 30 days"
            });
        }

        // Calculate the total value from the documents fetched
        const totalValueCurrentPeriod = documents.reduce((acc, doc) => {
            // Handle cases where advancePayment or GSTValue might not be set or are not numbers
            const advancePayment = parseFloat(doc.advancePayment) || 0;
            const gstValue = parseFloat(doc.GSTValue) || 0;

            // Assuming the total value is advancePayment + GSTValue
            return acc + advancePayment + gstValue;
        }, 0);

        console.log("Total Value Current Period: ", totalValueCurrentPeriod);

        // Calculate the average daily total value
        const daysInCurrentPeriod = documents.length > 0 ? documents.length : 1; // Prevent divide by zero
        const avgDailyTotalValue = totalValueCurrentPeriod / daysInCurrentPeriod;

        console.log("Average Daily Total Value: ", avgDailyTotalValue);

        // Predict the total value for the next 30 days based on the average daily value
        const predictedTotalValueNext30Days = avgDailyTotalValue * 30;

        res.status(200).json({
            message: "Next 30 days total value prediction",
            predictedTotalValueNext30Days: predictedTotalValueNext30Days.toFixed(2)
        });
    } catch (err) {
        console.error("Error in predictNext30DaysTotalValue:", err);
        res.status(500).json({
            message: "Failed to predict next 30 days' total value",
            error: err.message || err
        });
    }
}




// Optional: convert status codes to readable labels
function convertStatus(statusCode) {
    switch (statusCode) {
        case 0: return "Draft";
        case 1: return "Sent";
        case 2: return "Paid";
        case 3: return "Overdue";
        default: return "Unknown";
    }
}

module.exports = {
    dashboard: dashboard,
    getBuyerSupplierCount: getBuyerSupplierCount,
    predictNext30DaysTotalValue: predictNext30DaysTotalValue,
    getDocumentsInvoiceSummary: getDocumentsInvoiceSummary,
    getItemSalesSummary: getItemSalesSummary,
    getTotalStores: getTotalStores,
    getTotalItems: getTotalItems,
    getTotalDocuments: getTotalDocuments,
    getTotalUsersByCompany: getTotalUsersByCompany,
    getItemSalesSummaryWithPrediction: getItemSalesSummaryWithPrediction,
    predictSales: predictSales
};
