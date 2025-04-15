const models = require("../models");
const simpleStats = require('simple-statistics'); // Simple stats library for regression

async function dashboard(req, res) {

}

async function getBuyerSupplierCount(req, res) {
    try {
        const counts = await models.BuyerSupplier.findAll({
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

async function getItemSalesSummary(req, res) {
    try {
        const salesData = await models.Item.findAll({
            attributes: [
                'name',
                'category',
                [models.sequelize.fn('SUM', models.sequelize.col('quantity')), 'quantitySold'],
                [models.sequelize.fn('AVG', models.sequelize.col('unitPrice')), 'unitPrice'],
                [models.sequelize.literal('SUM(quantity * unitPrice)'), 'totalRevenue']
            ],
            group: ['name', 'category']
        });

        const formattedData = salesData.map(item => ({
            itemName: item.name,
            category: item.category,
            quantitySold: parseFloat(item.dataValues.quantitySold),
            unitPriceINR: parseFloat(item.dataValues.unitPrice).toFixed(2),
            totalRevenueINR: parseFloat(item.dataValues.totalRevenue).toFixed(2)
        }));

        res.status(200).json({
            message: "Item sales summary fetched successfully",
            data: formattedData
        });
    } catch (error) {
        console.error("Error fetching item sales summary:", error);
        res.status(500).json({
            message: "Failed to fetch item sales summary",
            error
        });
    }
}

async function getDocumentsInvoiceSummary(req, res) {
    try {
        const documents = await models.Documents.findAll({
            attributes: [
                'invoiceNumber',
                'buyerName',
                [sequelize.literal('COALESCE(totalValue, 0)'), 'totalValue'], // You can add this field in DB or compute dynamically
                [sequelize.literal('COALESCE(paidAmount, 0)'), 'paid'],
                'status',
                ['paymentTerm', 'payment'],
                'createdBy',
                ['createdAt', 'createdDate']
            ],
            order: [['createdAt', 'DESC']]
        });

        const summary = documents.map(doc => ({
            invoiceNumber: doc.invoiceNumber,
            company: doc.buyerName,
            totalValue: parseFloat(doc.get('totalValue')).toFixed(2),
            paid: parseFloat(doc.get('paid')).toFixed(2),
            status: convertStatus(doc.status), // optional, convert integer to label
            payment: doc.payment,
            createdBy: doc.createdBy,
            createdDate: new Date(doc.createdDate).toISOString().split('T')[0]
        }));

        res.status(200).json({
            message: "Invoice summary from documents fetched successfully",
            data: summary
        });
    } catch (err) {
        console.error("Error in getDocumentsInvoiceSummary:", err);
        res.status(500).json({
            message: "Failed to fetch invoice data",
            error: err
        });
    }
}

async function predictNext30DaysTotalValue(req, res) {
    try {
        // Fetch documents (invoices) from the last 30 days or as needed
        const documents = await models.Documents.findAll({
            attributes: [
                'invoiceNumber',
                'totalValue', // Ensure totalValue is being fetched correctly
                'createdAt'
            ],
            where: {
                createdAt: {
                    [sequelize.Op.gte]: sequelize.fn('NOW', '-30 days') // Get invoices from the last 30 days
                }
            },
            order: [['createdAt', 'ASC']]
        });

        // Calculate the total value from the documents fetched
        const totalValueCurrentPeriod = documents.reduce((acc, doc) => acc + parseFloat(doc.totalValue || 0), 0);

        // Calculate the average daily total value from the last period (for example, last 30 days)
        const daysInCurrentPeriod = documents.length > 0 ? documents.length : 1; // To prevent divide by zero
        const avgDailyTotalValue = totalValueCurrentPeriod / daysInCurrentPeriod;

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
            error: err
        });
    }
}

async function getTotalItems(req, res) {
    try {
        const itemCount = await models.Item.count(); // Adjust model name if needed

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
        const storeCount = await models.Store.count(); // Replace with models.Stores if that's your model name

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
        const documentCount = await models.Documents.count();

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

        const userCount = await models.User.count({
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
    try {
        // Fetch the sales data for all items
        const salesData = await models.Item.findAll({
            attributes: [
                'name',
                'category',
                [models.sequelize.fn('SUM', models.sequelize.col('quantity')), 'quantitySold'],
                [models.sequelize.fn('AVG', models.sequelize.col('unitPrice')), 'unitPrice'],
                [models.sequelize.literal('SUM(quantity * unitPrice)'), 'totalRevenue']
            ],
            group: ['name', 'category']
        });

        // Process the sales data
        const itemSales = salesData.map(item => ({
            itemName: item.name,
            category: item.category,
            quantitySold: parseFloat(item.dataValues.quantitySold),
            unitPriceINR: parseFloat(item.dataValues.unitPrice),
            totalRevenueINR: parseFloat(item.dataValues.totalRevenue)
        }));

        // Predict sales for the next 30 days using simple linear regression
        const predictionResults = itemSales.map(item => {
            // Generate data for linear regression (Days vs Quantity Sold)
            const days = [];
            const quantities = [];

            // For simplicity, assume quantity sold for each item follows a linear trend
            for (let i = 1; i <= 30; i++) {
                days.push(i); // Day number (1 to 30)
                quantities.push(item.quantitySold * (1 + (Math.random() * 0.1))); // Simulated quantity (random fluctuation)
            }

            // Perform linear regression on the data
            const regression = simpleStats.linearRegression(days.map((day, idx) => [day, quantities[idx]]));
            const regressionLine = simpleStats.linearRegressionLine(regression);

            // Predict sales for the next 30 days
            const predictedSalesNext30Days = [];
            for (let i = 1; i <= 30; i++) {
                const predictedSales = regressionLine(i); // Predict for each day
                predictedSalesNext30Days.push({
                    day: i,
                    predictedSales: parseFloat(predictedSales).toFixed(2)
                });
            }

            return {
                ...item,
                predictedSalesNext30Days
            };
        });

        // Number of items
        const numberOfItems = itemSales.length;

        // Filter or rank items by predicted sales (for example, top 5 items predicted to sell the most)
        const topSellingItems = predictionResults.sort((a, b) => {
            const totalPredictedSalesA = a.predictedSalesNext30Days.reduce((acc, curr) => acc + parseFloat(curr.predictedSales), 0);
            const totalPredictedSalesB = b.predictedSalesNext30Days.reduce((acc, curr) => acc + parseFloat(curr.predictedSales), 0);
            return totalPredictedSalesB - totalPredictedSalesA; // Sort descending
        }).slice(0, 5); // Get top 5 items

        res.status(200).json({
            message: "Item sales summary with prediction for next 30 days fetched successfully",
            numberOfItems,
            topSellingItems
        });

    } catch (error) {
        console.error("Error fetching item sales summary with prediction:", error);
        res.status(500).json({
            message: "Failed to fetch item sales summary with prediction",
            error
        });
    }
}


async function predictSales(req, res) {
    try {
        const { companyId } = req.body;
        
        if (!companyId) {
            return res.status(400).json({ message: "companyId is required" });
        }

        // Fetch sales data for the last 30 days for the given company
        const salesData = await models.Sales.findAll({
            where: { companyId },
            attributes: ['date', 'totalValue'],
            order: [['date', 'ASC']]
        });

        if (salesData.length < 30) {
            return res.status(400).json({ message: "Insufficient data for prediction (need at least 30 days)" });
        }

        // Prepare the data for regression (Date -> number of days, Total Sales Value)
        const dates = salesData.map((data) => (new Date(data.date) - new Date(salesData[0].date)) / (1000 * 3600 * 24)); // Days since first sale
        const salesValues = salesData.map((data) => data.totalValue);

        // Train a linear regression model
        const regression = simpleStats.linearRegression(dates.map((date, idx) => [date, salesValues[idx]]));
        const regressionLine = simpleStats.linearRegressionLine(regression);

        // Predict the next 7 days and 30 days
        const next7Days = [];
        const next30Days = [];
        for (let i = 1; i <= 30; i++) {
            const predictedValue7 = regressionLine(dates[dates.length - 1] + i); // Prediction for next 7 days
            if (i <= 7) next7Days.push({ day: i, predictedSales: predictedValue7.toFixed(2) });

            const predictedValue30 = regressionLine(dates[dates.length - 1] + i); // Prediction for next 30 days
            next30Days.push({ day: i, predictedSales: predictedValue30.toFixed(2) });
        }

        res.status(200).json({
            message: "Sales prediction for the next 7 and 30 days",
            next7Days,
            next30Days
        });
    } catch (error) {
        console.error("Error in predictSales function:", error);
        res.status(500).json({
            message: "Error in predicting sales",
            error
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
    dashboard: dashboard
};
