const models = require("../models");
const simpleStats = require('simple-statistics'); // Simple stats library for regression
const moment = require('moment');
const { Op } = require("sequelize");
const categories = require("../models/categories");
const { getAgingBucket, getAgingBucket90Days } = require("../helpers/transfer-number");

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


        // Calculate the average daily total value
        const daysInCurrentPeriod = documents.length > 0 ? documents.length : 1; // Prevent divide by zero
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

async function getDashboardData(req, res) {
    try {
        const { companyId, dataFor, start, end, assignedTo, salesOrderNumber, salesBasis, topSellingBasis, salesYear, purchaseBasis, topPurchaseBasis, purchaseYear } = req.body;
        if (dataFor === 'Production') {
            const items = await models.Items.findAll({
                where: {
                    companyId: Number(companyId)
                },
                raw: true,
                attributes: ['id']
            });

            const startOfYear = new Date(new Date().getFullYear(), 0, 1);
            const endOfYear = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999);
            const stockTransfers = await models.StockTransfer.findAll({
                where: {
                    itemId: {
                        [Op.in]: items.map(item => item.id)
                    },
                    productionId: {
                        [Op.ne]: null
                    },
                    quantity: {
                        [Op.gt]: 0
                    },
                    createdAt: {
                        [Op.between]: [startOfYear, endOfYear]
                    }
                },
                raw: true,
                attributes: ['quantity', 'createdAt']
            });
            const monthMap = {};
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            stockTransfers.forEach((record) => {
                const monthIndex = new Date(record.createdAt).getMonth();
                const monthName = monthNames[monthIndex];
                monthMap[monthName] = (monthMap[monthName] || 0) + record.quantity;
            });
            const currentMonth = new Date().getMonth();
            const sortedMonthMap = {};
            monthNames.slice(0, currentMonth + 1).forEach((m) => {
                if (monthMap[m]) sortedMonthMap[m] = monthMap[m]?.toFixed(2);
                else sortedMonthMap[m] = 0;
            });

            const whereClause = {
                companyId: Number(companyId),
            };
            if (start && end) {
                whereClause.createdAt = {
                    [Op.gte]: new Date(start),
                    [Op.lte]: new Date(end)
                };
            }
            const production = await models.Production.findAll({
                where: {
                    ...whereClause,
                    status: {
                        [Op.ne]: 0
                    },
                    ...(assignedTo ? { assignedTo } : {}),
                    ...(salesOrderNumber ? {
                        salesOrderNumber: {
                            [Op.in]: salesOrderNumber
                        }
                    } : {})
                },
                raw: true,
                attributes: ['id', 'status', 'productionEndDate', 'productionCompletionDate']
            });
            let ongoing = 0, inplanning = 0, onhold = 0, completed = 0, onTime = 0, delay = 0;
            const finishedGoodMap = {};
            const finishedGoods = await models.ProductionFinishedGoods.findAll({
                where: {
                    productionId: {
                        [Op.in]: production.map(prod => {
                            const completion = new Date(prod.productionCompletionDate);
                            const end = new Date(prod.productionEndDate);
                            if (end > completion) {
                                delay += 1;
                            } else {
                                onTime += 1;
                            }
                            if (prod.status == 1) inplanning += 1;
                            else if (prod.status == 2) ongoing += 1;
                            else if (prod.status == 3) onhold += 1;
                            else completed += 1;
                            return prod.id
                        })
                    }
                },
                raw: true,
            });
            let total = 0, passed = 0, reject = 0;
            const pairArray = [];
            for (const element of finishedGoods) {
                passed += (element?.passedQuantity || 0);
                reject += (element?.rejectQuantity || 0);
                if (!finishedGoodMap[element.itemId]) {
                    finishedGoodMap[element.itemId] = element;
                    finishedGoodMap[element.itemId].quantity = (element.passedQuantity * (element.conversionFactor || 1));
                    finishedGoodMap[element.itemId].cost = (element.cost || 0);
                }
                else {
                    finishedGoodMap[element.itemId].quantity += (element.passedQuantity * (element.conversionFactor || 1));
                    finishedGoodMap[element.itemId].cost += (element.cost || 0);
                }
            }
            total = (passed + reject);
            const sortedItems = Object.values(finishedGoodMap).sort((a, b) => b.quantity - a.quantity).slice(0, 10);
            return res.status(200).json({
                ontimeDelayProduction: {
                    onTime, delay
                },
                quantityPerformance: {
                    total: Number(total?.toFixed(2)), reject: Number(reject?.toFixed(2)), passed: Number(passed?.toFixed(2))
                },
                workOrderStatus: {
                    inplanning, completed, ongoing, onhold
                },
                tableData: sortedItems,
                sortedMonthMap
            });
        }
        if (dataFor === 'Inventory') {
            const productions = await models.Production.findAll({
                where: {
                    companyId: Number(companyId),
                    status: {
                        [Op.ne]: 4
                    }
                },
                raw: true,
                attributes: ['id']
            });
            const rawMaterials = await models.ProductionRawMaterials.findAll({
                where: {
                    productionId: {
                        [Op.in]: productions.map(prod => prod.id)
                    }
                },
                raw: true,
                attributes: ['quantity', 'conversionFactor', 'itemId']
            });

            const items = await models.Items.findAll({
                where: {
                    companyId: Number(companyId)
                },
                raw: true,
                attributes: ['id', 'category', 'minStock', 'maxStock', 'itemId', 'price']
            });

            const stockTransfers = await models.StockTransfer.findAll({
                where: {
                    itemId: { [Op.in]: items.map(item => item.id) },
                    quantity: { [Op.ne]: 0 },
                    isRejected: false
                },
                raw: true
            });

            const fastSlowMovingMap = {};
            for (const element of stockTransfers) {
                const bucket = getAgingBucket90Days(element.createdAt);
                if (fastSlowMovingMap[bucket]) {
                    fastSlowMovingMap[bucket] = Array.from(new Set([...fastSlowMovingMap[bucket], element.itemId]));
                }
                else {
                    fastSlowMovingMap[bucket] = [element.itemId];
                }
            }
            const stores = await models.Store.findAll({
                where: {
                    companyId: Number(companyId)
                },
                raw: true,
                attributes: ['name', 'id']
            });
            const storesMap = stores.reduce((acc, curr) => {
                acc[curr.id] = curr.name;
                return acc;
            }, {});
            const categorys = await models.Categories.findAll({
                where: {
                    companyId: Number(companyId)
                },
                raw: true,
                attributes: ['id', 'name']
            });
            const categoryMap = categorys.reduce((acc, curr) => {
                acc[curr.id] = curr.name;
                return acc;
            }, {});
            const storeItems = await models.StoreItems.findAll({
                where: {
                    itemId: {
                        [Op.in]: items.map(item => item.id),
                    },
                    quantity: {
                        [Op.gt]: 0
                    },
                    isRejected: false,
                },
                attributes: ['id', 'quantity', 'price', 'storeId', 'createdAt', 'itemId'],
                raw: true
            });
            let inventoryValue = 0, storeValueMap = {}, itemsCountMap = {}, stockAgeingMap = {};
            for (const element of storeItems) {
                const bucket = getAgingBucket(element.createdAt);
                if (stockAgeingMap[bucket]) {
                    stockAgeingMap[bucket] = Array.from(new Set([...stockAgeingMap[bucket], element.itemId]));
                }
                else {
                    stockAgeingMap[bucket] = [element.itemId];
                }
                if (!itemsCountMap[element.itemId]) itemsCountMap[element.itemId] = element.quantity;
                else itemsCountMap[element.itemId] += element.quantity;
                inventoryValue += (element.quantity * (element.price || 0));
                if (!storeValueMap[storesMap[element.storeId]]) {
                    storeValueMap[storesMap[element.storeId]] = (element.quantity * (element.price || 0));
                }
                else {
                    storeValueMap[storesMap[element.storeId]] += (element.quantity * (element.price || 0));
                }
            }
            delete storeValueMap.undefined;
            let ideal = 0, min = 0, max = 0, outOfStock = 0;
            const categoryItemsMap = {}, itemMap = {};
            for (const element of items) {
                itemMap[element.itemId] = element.price || 0;
                const count = itemsCountMap[element.id] || 0;
                if (!count) outOfStock += 1;
                if (!element.minStock && !element.maxStock) {
                    ideal += 1;
                } else if (element.minStock && element.maxStock) {
                    if (count >= element.minStock && count <= element.maxStock) ideal += 1;
                    else if (count < element.minStock) min += 1;
                    else if (count > element.maxStock) max += 1;
                } else if (element.minStock && !element.maxStock) {
                    if (count >= element.minStock) ideal += 1;
                    else min += 1;
                } else if (!element.minStock && element.maxStock) {
                    if (count <= element.maxStock) ideal += 1;
                    else max += 1;
                }

                if (!element.category) continue;
                if (!categoryItemsMap[categoryMap[element.category]]) {
                    categoryItemsMap[categoryMap[element.category]] = 1;
                } else {
                    categoryItemsMap[categoryMap[element.category]] += 1;
                }
            }
            let wipCost = 0;
            for (const element of rawMaterials) {
                wipCost += ((element.quantity * (element?.conversionFactor || 1)) * (itemMap[element.itemId] || 0))
            }

            const sortedEntries = Object.entries(categoryItemsMap).sort(([, v1], [, v2]) => v2 - v1);
            const topFiveEntries = sortedEntries.slice(0, 5);
            const topFiveObj = Object.fromEntries(topFiveEntries);
            for (const element in storeValueMap) {
                storeValueMap[element] = Number(storeValueMap[element]?.toFixed(2))
            }
            for (const age in stockAgeingMap) {
                stockAgeingMap[age] = stockAgeingMap[age].length;
            }
            for (const age in fastSlowMovingMap) {
                if (age == 'Fast Moving') {
                    fastSlowMovingMap[age] = fastSlowMovingMap[age].length;
                }
                else if (age == 'Slow Moving') {
                    fastSlowMovingMap[age] = fastSlowMovingMap[age]?.filter(data => !(fastSlowMovingMap?.['Fast Moving'] || [])?.includes(data)).length;
                }
                else {
                    fastSlowMovingMap[age] = fastSlowMovingMap[age]?.filter(data => ![...(fastSlowMovingMap?.['Fast Moving'] || []), ...(fastSlowMovingMap?.['Slow Moving'] || [])]?.includes(data)).length;
                }
            }
            return res.status(200).json({
                itemsCount: items.length,
                inventoryValue,
                storeValueMap,
                topFiveCategory: topFiveObj,
                min, max, ideal,
                outOfStock,
                stockAgeingMap,
                fastSlowMovingMap,
                wipCost
            });
        }
        if (dataFor === "Sales") {
            const parseDateString = (str) => {
                if (!str) return null;
                let d = new Date(str);
                if (!isNaN(d.getTime())) return d;
                // Try parsing DD/MM/YYYY
                const parts = String(str).split('/');
                if (parts.length === 3) {
                    const day = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10) - 1;
                    const year = parseInt(parts[2], 10);
                    d = new Date(year, month, day);
                    if (!isNaN(d.getTime())) return d;
                }
                return null;
            };

            const now = new Date();
            let startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            let endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

            if (start && end) {
                const parsedStart = new Date(start);
                const parsedEnd = new Date(end);
                if (!isNaN(parsedStart.getTime()) && !isNaN(parsedEnd.getTime())) {
                    startOfMonth = parsedStart;
                    endOfMonth = parsedEnd;
                }
            }

            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

            // 1. Sales This month (invoice basics)
            const invoices = await models.Documents.findAll({
                where: {
                    companyId: Number(companyId),
                    documentType: salesBasis || 'Invoice',
                    status: {
                        [Op.ne]: 0
                    },
                    createdAt: {
                        [Op.between]: [startOfMonth, endOfMonth]
                    }
                },
                attributes: ['documentNumber'],
                raw: true
            });

            const invoiceNumbers = invoices.map(inv => inv.documentNumber);
            let salesThisMonth = 0;
            if (invoiceNumbers.length > 0) {
                const invoiceItems = await models.DocumentItems.findAll({
                    where: {
                        companyId: Number(companyId),
                        documentNumber: {
                            [Op.in]: invoiceNumbers
                        }
                    },
                    attributes: ['totalAfterTax'],
                    raw: true
                });
                salesThisMonth = invoiceItems.reduce((acc, curr) => acc + (parseFloat(curr.totalAfterTax) || 0), 0);
            }

            // 2. Sales Order Count This month
            const salesOrderCount = await models.Documents.count({
                where: {
                    companyId: Number(companyId),
                    documentType: 'Sales Order',
                    status: {
                        [Op.ne]: 0
                    },
                    createdAt: {
                        [Op.between]: [startOfMonth, endOfMonth]
                    }
                }
            });

            // Month wise Sales Order Count (selected or current year)
            const targetYear = salesYear ? Number(salesYear) : now.getFullYear();
            const startOfYear = new Date(targetYear, 0, 1);
            const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59, 999);
            const yearlySalesOrders = await models.Documents.findAll({
                where: {
                    companyId: Number(companyId),
                    documentType: 'Sales Order',
                    status: {
                        [Op.ne]: 0
                    },
                    createdAt: {
                        [Op.between]: [startOfYear, endOfYear]
                    }
                },
                attributes: ['createdAt'],
                raw: true
            });

            const salesMonthMap = {};
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            yearlySalesOrders.forEach((record) => {
                const monthIndex = new Date(record.createdAt).getMonth();
                const monthName = monthNames[monthIndex];
                salesMonthMap[monthName] = (salesMonthMap[monthName] || 0) + 1;
            });
            const isCurrentYear = targetYear === now.getFullYear();
            const monthsToInclude = isCurrentYear ? monthNames.slice(0, now.getMonth() + 1) : monthNames;
            const sortedMonthMap = {};
            monthsToInclude.forEach((m) => {
                if (salesMonthMap[m]) sortedMonthMap[m] = salesMonthMap[m];
                else sortedMonthMap[m] = 0;
            });

            // 3. Delivery Challan Count This month (to display on the cards)
            const deliveryChallanCount = await models.Documents.count({
                where: {
                    companyId: Number(companyId),
                    documentType: 'Delivery Challan',
                    status: {
                        [Op.ne]: 0
                    },
                    createdAt: {
                        [Op.between]: [startOfMonth, endOfMonth]
                    }
                }
            });

            // Order dispatch status (Sales Order status mapping)
            const dispatchSalesOrders = await models.Documents.findAll({
                where: {
                    companyId: Number(companyId),
                    documentType: 'Sales Order',
                    status: {
                        [Op.ne]: 0
                    },
                    createdAt: {
                        [Op.between]: [startOfMonth, endOfMonth]
                    }
                },
                attributes: ['status'],
                raw: true
            });

            let pendingCount = 0;
            let partiallyDeliveredCount = 0;
            let fullyDeliveredCount = 0;
            let cancelledCount = 0;

            const statusPartially = [10, 19, 20, 33, 37, 41, 42, 45, 46];
            const statusFully = [11, 21, 22, 34, 38, 43, 44, 47, 48];

            dispatchSalesOrders.forEach(order => {
                const status = order.status;
                if (status === 2) {
                    cancelledCount++;
                } else if (statusPartially.includes(status)) {
                    partiallyDeliveredCount++;
                } else if (statusFully.includes(status)) {
                    fullyDeliveredCount++;
                } else {
                    pendingCount++;
                }
            });

            // 4. Order for today's delivery
            const salesOrders = await models.Documents.findAll({
                where: {
                    companyId: Number(companyId),
                    documentType: 'Sales Order',
                    status: {
                        [Op.ne]: 0
                    }
                },
                attributes: ['id', 'documentNumber', 'buyerName', 'deliveryDate', 'status', 'createdAt'],
                raw: true
            });

            const todayDeliveries = salesOrders.filter(doc => {
                if (!doc.deliveryDate) return false;
                const d = parseDateString(doc.deliveryDate);
                if (!d) return false;
                if (start && end) {
                    return d >= startOfMonth && d <= endOfMonth;
                } else {
                    return d >= startOfToday && d <= endOfToday;
                }
            });

            // 5. Top Selling item this month (show 10 by default) (Invoice or challan basic)
            const salesDocsForTop = await models.Documents.findAll({
                where: {
                    companyId: Number(companyId),
                    documentType: topSellingBasis ? topSellingBasis : {
                        [Op.in]: ['Invoice', 'Delivery Challan']
                    },
                    status: {
                        [Op.ne]: 0
                    },
                    createdAt: {
                        [Op.between]: [startOfMonth, endOfMonth]
                    }
                },
                attributes: ['documentNumber'],
                raw: true
            });

            const salesDocNumbers = salesDocsForTop.map(doc => doc.documentNumber);
            const sellingItemsMap = {};

            if (salesDocNumbers.length > 0) {
                const docItems = await models.DocumentItems.findAll({
                    where: {
                        companyId: Number(companyId),
                        documentNumber: {
                            [Op.in]: salesDocNumbers
                        }
                    },
                    raw: true
                });

                for (const item of docItems) {
                    const key = item.itemId;
                    if (!key) continue;
                    if (!sellingItemsMap[key]) {
                        sellingItemsMap[key] = {
                            itemId: key,
                            itemName: item.itemName,
                            quantity: 0,
                            totalSales: 0,
                            UOM: item.UOM
                        };
                    }
                    sellingItemsMap[key].quantity += (parseFloat(item.quantity) || 0);
                    sellingItemsMap[key].totalSales += (parseFloat(item.totalAfterTax) || 0);
                }
            }

            const topSellingItems = Object.values(sellingItemsMap)
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 10);

            return res.status(200).json({
                salesThisMonth: Number(salesThisMonth.toFixed(2)),
                salesOrderCount,
                deliveryChallanCount,
                invoiceCount: invoices.length,
                dispatchStatus: {
                    pending: pendingCount,
                    partiallyDelivered: partiallyDeliveredCount,
                    fullyDelivered: fullyDeliveredCount,
                    cancelled: cancelledCount
                },
                todayDeliveriesCount: todayDeliveries.length,
                todayDeliveries,
                topSellingItems,
                sortedMonthMap
            });
        }
        if (dataFor === "Purchase") {
            const parseDateString = (str) => {
                if (!str) return null;
                let d = new Date(str);
                if (!isNaN(d.getTime())) return d;
                const parts = String(str).split('/');
                if (parts.length === 3) {
                    const day = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10) - 1;
                    const year = parseInt(parts[2], 10);
                    d = new Date(year, month, day);
                    if (!isNaN(d.getTime())) return d;
                }
                return null;
            };

            const now = new Date();
            let startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            let endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

            if (start && end) {
                const parsedStart = new Date(start);
                const parsedEnd = new Date(end);
                if (!isNaN(parsedStart.getTime()) && !isNaN(parsedEnd.getTime())) {
                    startOfMonth = parsedStart;
                    endOfMonth = parsedEnd;
                }
            }

            // 1. Total Purchase Value (PO Basis / Purchase Invoice )
            const activePurchaseBasis = purchaseBasis || 'Purchase Invoice';
            const purchaseDocs = await models.Documents.findAll({
                where: {
                    companyId: Number(companyId),
                    documentType: activePurchaseBasis,
                    status: {
                        [Op.ne]: 0
                    },
                    createdAt: {
                        [Op.between]: [startOfMonth, endOfMonth]
                    }
                },
                attributes: ['documentNumber'],
                raw: true
            });

            const purchaseDocNumbers = purchaseDocs.map(doc => doc.documentNumber);
            let totalPurchaseValue = 0;
            if (purchaseDocNumbers.length > 0) {
                const purchaseItems = await models.DocumentItems.findAll({
                    where: {
                        companyId: Number(companyId),
                        documentNumber: {
                            [Op.in]: purchaseDocNumbers
                        }
                    },
                    attributes: ['totalAfterTax'],
                    raw: true
                });
                totalPurchaseValue = purchaseItems.reduce((acc, curr) => acc + (parseFloat(curr.totalAfterTax) || 0), 0);
            }

            // 2. PO Count
            const purchaseOrderCount = await models.Documents.count({
                where: {
                    companyId: Number(companyId),
                    documentType: 'Purchase Order',
                    status: {
                        [Op.ne]: 0
                    },
                    createdAt: {
                        [Op.between]: [startOfMonth, endOfMonth]
                    }
                }
            });

            // 3. Purchase Invoice Count
            const purchaseInvoiceCount = await models.Documents.count({
                where: {
                    companyId: Number(companyId),
                    documentType: 'Purchase Invoice',
                    status: {
                        [Op.ne]: 0
                    },
                    createdAt: {
                        [Op.between]: [startOfMonth, endOfMonth]
                    }
                }
            });

            // 4. Supplier Count
            const supplierCount = await models.BuyerSupplier.count({
                where: {
                    companyId: Number(companyId),
                    companyType: {
                        [Op.in]: [2, 3]
                    }
                }
            });

            // 5. Monthly Purchase Trend (selected or current year)
            const targetYear = purchaseYear ? Number(purchaseYear) : now.getFullYear();
            const startOfYear = new Date(targetYear, 0, 1);
            const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59, 999);

            const yearlyPurchaseDocs = await models.Documents.findAll({
                where: {
                    companyId: Number(companyId),
                    documentType: activePurchaseBasis,
                    status: {
                        [Op.ne]: 0
                    },
                    createdAt: {
                        [Op.between]: [startOfYear, endOfYear]
                    }
                },
                attributes: ['documentNumber', 'createdAt'],
                raw: true
            });

            const yearlyDocNumbers = yearlyPurchaseDocs.map(doc => doc.documentNumber);
            const yearlyItemsMap = {};
            if (yearlyDocNumbers.length > 0) {
                const yearlyDocItems = await models.DocumentItems.findAll({
                    where: {
                        companyId: Number(companyId),
                        documentNumber: {
                            [Op.in]: yearlyDocNumbers
                        }
                    },
                    attributes: ['documentNumber', 'totalAfterTax'],
                    raw: true
                });
                yearlyDocItems.forEach(item => {
                    if (!yearlyItemsMap[item.documentNumber]) {
                        yearlyItemsMap[item.documentNumber] = 0;
                    }
                    yearlyItemsMap[item.documentNumber] += (parseFloat(item.totalAfterTax) || 0);
                });
            }

            const purchaseMonthMap = {};
            const purchaseMonthValueMap = {};
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            
            yearlyPurchaseDocs.forEach((record) => {
                const monthIndex = new Date(record.createdAt).getMonth();
                const monthName = monthNames[monthIndex];
                purchaseMonthMap[monthName] = (purchaseMonthMap[monthName] || 0) + 1;
                
                const val = yearlyItemsMap[record.documentNumber] || 0;
                purchaseMonthValueMap[monthName] = (purchaseMonthValueMap[monthName] || 0) + val;
            });

            const isCurrentYear = targetYear === now.getFullYear();
            const monthsToInclude = isCurrentYear ? monthNames.slice(0, now.getMonth() + 1) : monthNames;
            
            const sortedMonthMap = {};
            const sortedMonthValueMap = {};
            monthsToInclude.forEach((m) => {
                sortedMonthMap[m] = purchaseMonthMap[m] || 0;
                sortedMonthValueMap[m] = Number((purchaseMonthValueMap[m] || 0).toFixed(2));
            });

            // 6. Top Purchased Items
            const activeTopPurchaseBasis = topPurchaseBasis || 'Purchase Invoice';
            const purchaseDocsForTop = await models.Documents.findAll({
                where: {
                    companyId: Number(companyId),
                    documentType: activeTopPurchaseBasis,
                    status: {
                        [Op.ne]: 0
                    },
                    createdAt: {
                        [Op.between]: [startOfMonth, endOfMonth]
                    }
                },
                attributes: ['documentNumber'],
                raw: true
            });

            const topDocNumbers = purchaseDocsForTop.map(doc => doc.documentNumber);
            const purchasedItemsMap = {};

            if (topDocNumbers.length > 0) {
                const docItems = await models.DocumentItems.findAll({
                    where: {
                        companyId: Number(companyId),
                        documentNumber: {
                            [Op.in]: topDocNumbers
                        }
                    },
                    raw: true
                });

                for (const item of docItems) {
                    const key = item.itemId;
                    if (!key) continue;
                    if (!purchasedItemsMap[key]) {
                        purchasedItemsMap[key] = {
                            itemId: key,
                            itemName: item.itemName,
                            quantity: 0,
                            totalPurchase: 0,
                            UOM: item.UOM
                        };
                    }
                    purchasedItemsMap[key].quantity += (parseFloat(item.quantity) || 0);
                    purchasedItemsMap[key].totalPurchase += (parseFloat(item.totalAfterTax) || 0);
                }
            }

            const topPurchasedItems = Object.values(purchasedItemsMap)
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 10);

            // 7. Purchase Order Status (Completed, Partial, Pending, Cancelled)
            const purchaseOrders = await models.Documents.findAll({
                where: {
                    companyId: Number(companyId),
                    documentType: 'Purchase Order',
                    status: {
                        [Op.ne]: 0
                    },
                    createdAt: {
                        [Op.between]: [startOfMonth, endOfMonth]
                    }
                },
                attributes: ['status'],
                raw: true
            });

            let fullyReceivedCount = 0;
            let partiallyReceivedCount = 0;
            let pendingCount = 0;
            let cancelledCount = 0;

            const statusFullyReceived = [5, 6, 24, 25, 27, 28];
            const statusPartiallyReceived = [4, 23, 26];
            const statusCancelled = [2];

            purchaseOrders.forEach(order => {
                const status = order.status;
                if (statusCancelled.includes(status)) {
                    cancelledCount++;
                } else if (statusPartiallyReceived.includes(status)) {
                    partiallyReceivedCount++;
                } else if (statusFullyReceived.includes(status)) {
                    fullyReceivedCount++;
                } else {
                    pendingCount++;
                }
            });

            return res.status(200).json({
                totalPurchaseValue: Number(totalPurchaseValue.toFixed(2)),
                purchaseOrderCount,
                purchaseInvoiceCount,
                supplierCount,
                purchaseOrderStatus: {
                    fullyReceived: fullyReceivedCount,
                    partiallyReceived: partiallyReceivedCount,
                    pending: pendingCount,
                    cancelled: cancelledCount
                },
                topPurchasedItems,
                sortedMonthMap,
                sortedMonthValueMap
            });
        }
        return res.status(200).json({});
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Failed to fetch dashboard data",
            error: err.message || err
        });
    }
}

async function getStoreWiseItems(req, res) {
    const { storeId, isRejected = false } = req.body;
    if (!storeId) return res.status(404).json({ message: "Store Not found." });

    try {
        // Fetch StoreItems and UOMs
        const [storeItemsRaw, uomData] = await Promise.all([
            models.StoreItems.findAll({
                where: {
                    storeId, isRejected, quantity: {
                        [Op.gt]: 0
                    }
                },
                raw: true,

            }),
            models.UOM.findAll({ raw: true })
        ]);

        // Map UOM IDs to codes
        const uomMap = uomData.reduce((map, uom) => {
            map[uom.id] = uom.code;
            return map;
        }, {});

        const itemQuantityMap = {};
        const itemPriceMap = {};
        const uniqueStoreItems = {};

        for (const item of storeItemsRaw) {
            const itemId = item.itemId;
            const quantity = item.quantity;
            const price = item.price;

            // Aggregate quantity and price
            itemQuantityMap[itemId] = (itemQuantityMap[itemId] || 0) + quantity;
            if (quantity > 0) {
                itemPriceMap[itemId] = (itemPriceMap[itemId] || 0) + (price * quantity);
            }

            // Store one instance of each item
            if (!uniqueStoreItems[itemId]) {
                uniqueStoreItems[itemId] = item;
            }
        }

        const itemIds = Object.keys(uniqueStoreItems);

        // Fetch item data and alternate units in bulk
        const [itemsData, alternateUnitsData] = await Promise.all([
            models.Items.findAll({
                where: { id: itemIds },
                raw: true
            }),
            models.AlternateUnits.findAll({
                where: { itemId: itemIds },
                raw: true
            })
        ]);

        // Map alternate units by itemId
        const alternateUnitsMap = alternateUnitsData.reduce((acc, unit) => {
            const itemId = unit.itemId;
            const unitWithCode = { ...unit, code: uomMap[unit.alternateUnits] || null };
            acc[itemId] = acc[itemId] || [];
            acc[itemId].push(unitWithCode);
            return acc;
        }, {});

        // Build final store items
        const storeItems = itemIds.map(itemId => {
            const baseItem = uniqueStoreItems[itemId];
            return {
                ...baseItem,
                quantity: itemQuantityMap[itemId],
                averagePrice: itemPriceMap[itemId] || 0,
                itemId: {
                    ...itemsData.find(item => item.id === Number(itemId)),
                    alternateUnit: alternateUnitsMap[itemId] || []
                }
            };
        });

        return res.status(200).json({ storeItems });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong." });
    }
}

async function getCategoryWiseItems(req, res) {
    try {
        const { companyId, categoryId } = req.body;
        if (!companyId || !categoryId) {
            return res.status(400).json({
                message: "companyId and categoryId are required"
            });
        }
        const items = await models.Items.findAll({
            where: {
                companyId,
                category: categoryId
            },
            raw: true,
        });
        res.status(200).json({
            message: "Category wise items fetched successfully",
            data: items
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Failed to fetch category wise items",
            error: err.message || err
        });
    }
}

async function fastMovingSlowMovingItems(req, res) {
    try {
        const { companyId, type } = req.body;

        if (!companyId || !type) {
            return res.status(400).json({
                message: "companyId and type are required"
            });
        }

        const validTypes = ['Fast Moving', 'Slow Moving', 'Non Moving'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                message: "Invalid type. Must be 'Fast Moving', 'Slow Moving', or 'Non Moving'"
            });
        }

        const items = await models.Items.findAll({
            where: {
                companyId: Number(companyId)
            },
            raw: true
        });

        const stockTransfers = await models.StockTransfer.findAll({
            where: {
                itemId: { [Op.in]: items.map(item => item.id) },
                quantity: { [Op.ne]: 0 },
                isRejected: false
            },
            raw: true
        });

        const fastSlowMovingMap = {};
        for (const element of stockTransfers) {
            const bucket = getAgingBucket90Days(element.createdAt);
            if (fastSlowMovingMap[bucket]) {
                fastSlowMovingMap[bucket] = Array.from(new Set([...fastSlowMovingMap[bucket], element.itemId]));
            } else {
                fastSlowMovingMap[bucket] = [element.itemId];
            }
        }

        const categorizedItems = {};
        for (const age in fastSlowMovingMap) {
            let itemIds = [];
            if (age === 'Fast Moving') {
                itemIds = fastSlowMovingMap[age];
            } else if (age === 'Slow Moving') {
                itemIds = fastSlowMovingMap[age]?.filter(data => !(fastSlowMovingMap?.['Fast Moving'] || [])?.includes(data));
            } else {
                itemIds = fastSlowMovingMap[age]?.filter(data => ![...(fastSlowMovingMap?.['Fast Moving'] || []), ...(fastSlowMovingMap?.['Slow Moving'] || [])]?.includes(data));
            }
            categorizedItems[age] = items.filter(item => itemIds.includes(item.id));
        }

        const requestedData = categorizedItems[type] || [];

        return res.status(200).json({
            message: `${type} items fetched successfully`,
            data: requestedData
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Failed to fetch categorized items",
            error: err.message || err
        });
    }
}

async function stockLevelAnalysis(req, res) {
    try {
        const { companyId, type } = req.body;

        if (!companyId || !type) {
            return res.status(400).json({
                message: "companyId and type are required"
            });
        }

        const validTypes = ['ideal', 'min', 'max', 'outOfStock'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                message: "Invalid type. Must be one of: 'ideal', 'min', 'max', 'outOfStock'"
            });
        }

        const items = await models.Items.findAll({
            where: {
                companyId: Number(companyId)
            },
            raw: true
        });

        const storeItems = await models.StoreItems.findAll({
            where: {
                itemId: {
                    [Op.in]: items.map(item => item.id),
                },
                quantity: {
                    [Op.gt]: 0
                },
                isRejected: false,
            },
            attributes: ['quantity', 'itemId'],
            raw: true
        });

        const itemsCountMap = {};
        for (const element of storeItems) {
            itemsCountMap[element.itemId] = (itemsCountMap[element.itemId] || 0) + element.quantity;
        }

        const idealItems = [];
        const minItems = [];
        const maxItems = [];
        const outOfStockItems = [];

        for (const element of items) {
            const count = itemsCountMap[element.id] || 0;
            // Add current quantity so frontend can see what the stock level is
            const itemData = { ...element, currentQuantity: count };

            if (!count) {
                outOfStockItems.push(itemData);
            }

            if (!element.minStock && !element.maxStock) {
                idealItems.push(itemData);
            } else if (element.minStock && element.maxStock) {
                if (count >= element.minStock && count <= element.maxStock) idealItems.push(itemData);
                else if (count < element.minStock) minItems.push(itemData);
                else if (count > element.maxStock) maxItems.push(itemData);
            } else if (element.minStock && !element.maxStock) {
                if (count >= element.minStock) idealItems.push(itemData);
                else minItems.push(itemData);
            } else if (!element.minStock && element.maxStock) {
                if (count <= element.maxStock) idealItems.push(itemData);
                else maxItems.push(itemData);
            }
        }

        const categorizedItems = {
            ideal: idealItems,
            min: minItems,
            max: maxItems,
            outOfStock: outOfStockItems
        };

        const requestedData = categorizedItems[type] || [];

        return res.status(200).json({
            message: `${type} stock level analysis fetched successfully`,
            data: requestedData
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Failed to fetch stock level analysis",
            error: err.message || err
        });
    }
}

async function stockAgeing(req, res) {
    try {
        const { companyId, type } = req.body;

        if (!companyId || !type) {
            return res.status(400).json({
                message: "companyId and type are required"
            });
        }

        const validTypes = ['0–30 days', '31–60 days', '61–90 days', '91–180 days', '180+ days'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                message: "Invalid type. Must be one of: '0–30 days', '31–60 days', '61–90 days', '91–180 days', '180+ days'"
            });
        }

        const items = await models.Items.findAll({
            where: {
                companyId: Number(companyId)
            },
            raw: true
        });

        const storeItems = await models.StoreItems.findAll({
            where: {
                itemId: {
                    [Op.in]: items.map(item => item.id),
                },
                quantity: {
                    [Op.gt]: 0
                },
                isRejected: false,
            },
            attributes: ['id', 'itemId', 'createdAt'],
            raw: true
        });

        const stockAgeingMap = {};
        for (const element of storeItems) {
            const bucket = getAgingBucket(element.createdAt);
            if (stockAgeingMap[bucket]) {
                stockAgeingMap[bucket] = Array.from(new Set([...stockAgeingMap[bucket], element.itemId]));
            } else {
                stockAgeingMap[bucket] = [element.itemId];
            }
        }

        const responseData = {};
        for (const bucket in stockAgeingMap) {
            const itemIds = stockAgeingMap[bucket];
            responseData[bucket] = items.filter(item => itemIds.includes(item.id));
        }

        const requestedData = responseData[type] || [];

        return res.status(200).json({
            message: `${type} stock ageing data fetched successfully`,
            data: requestedData
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Failed to fetch stock ageing",
            error: err.message || err
        });
    }
}

async function onTimeDelayProduction(req, res) {
    try {
        const { companyId, start, end, assignedTo, salesOrderNumber, type } = req.body;

        if (!companyId || !type) {
            return res.status(400).json({
                message: "companyId and type are required"
            });
        }

        const validTypes = ['onTime', 'delay'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                message: "Invalid type. Must be 'onTime' or 'delay'"
            });
        }

        const whereClause = { companyId: Number(companyId) };
        if (start && end) {
            whereClause.createdAt = {
                [Op.gte]: new Date(start),
                [Op.lte]: new Date(end)
            };
        }

        const production = await models.Production.findAll({
            where: {
                ...whereClause,
                status: {
                    [Op.ne]: 0
                },
                productionId: {
                    [Op.ne]: null
                },
                ...(assignedTo ? { assignedTo } : {}),
                ...(salesOrderNumber ? {
                    salesOrderNumber: {
                        [Op.in]: salesOrderNumber
                    }
                } : {})
            },
            raw: true
        });

        const onTimeItems = [];
        const delayItems = [];

        for (const prod of production) {
            const completion = new Date(prod.productionCompletionDate);
            const endDate = new Date(prod.productionEndDate);
            if (endDate > completion) {
                delayItems.push(prod);
            } else {
                onTimeItems.push(prod);
            }
        }

        const categorizedItems = {
            onTime: onTimeItems,
            delay: delayItems
        };

        const requestedData = categorizedItems[type] || [];

        return res.status(200).json({
            message: `${type} production records fetched successfully`,
            data: requestedData
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Failed to fetch onTimeDelayProduction",
            error: err.message || err
        });
    }
}

async function workOrderStatus(req, res) {
    try {
        const { companyId, start, end, assignedTo, salesOrderNumber, type } = req.body;

        if (!companyId || !type) {
            return res.status(400).json({
                message: "companyId and type are required"
            });
        }

        const validTypes = ['inplanning', 'ongoing', 'onhold', 'completed'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                message: "Invalid type. Must be 'inplanning', 'ongoing', 'onhold', or 'completed'"
            });
        }

        const whereClause = { companyId: Number(companyId) };
        if (start && end) {
            whereClause.createdAt = {
                [Op.gte]: new Date(start),
                [Op.lte]: new Date(end)
            };
        }

        const production = await models.Production.findAll({
            where: {
                ...whereClause,
                status: {
                    [Op.ne]: 0
                },
                productionId: {
                    [Op.ne]: null
                },
                ...(assignedTo ? { assignedTo } : {}),
                ...(salesOrderNumber ? {
                    salesOrderNumber: {
                        [Op.in]: salesOrderNumber
                    }
                } : {})
            },
            raw: true
        });

        const inplanningItems = [];
        const ongoingItems = [];
        const onholdItems = [];
        const completedItems = [];

        for (const prod of production) {
            if (prod.status == 1) inplanningItems.push(prod);
            else if (prod.status == 2) ongoingItems.push(prod);
            else if (prod.status == 3) onholdItems.push(prod);
            else completedItems.push(prod);
        }

        const categorizedItems = {
            inplanning: inplanningItems,
            ongoing: ongoingItems,
            onhold: onholdItems,
            completed: completedItems
        };

        const requestedData = categorizedItems[type] || [];

        return res.status(200).json({
            message: `${type} production records fetched successfully`,
            data: requestedData
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Failed to fetch workOrder status",
            error: err.message || err
        });
    }
}

async function getSalesDashboardDetails(req, res) {
    try {
        const { companyId, types, type, start, end } = req.body;

        let typesArray = [];
        if (Array.isArray(types) && types.length > 0) {
            typesArray = types;
        } else if (Array.isArray(type) && type.length > 0) {
            typesArray = type;
        } else if (typeof type === 'string' && type.trim()) {
            typesArray = [type];
        }

        if (!companyId || typesArray.length === 0) {
            return res.status(400).json({
                message: "companyId and at least one valid type are required"
            });
        }

        const validTypes = ['salesOrder', 'todayDeliveries', 'deliveryChallan', 'invoice', 'pendingDispatch', 'partiallyDeliveredDispatch', 'fullyDeliveredDispatch', 'cancelledDispatch', 'purchaseOrder', 'purchaseInvoice'];
        const invalidTypes = typesArray.filter(t => !validTypes.includes(t));
        if (invalidTypes.length > 0) {
            return res.status(400).json({
                message: `Invalid type(s): ${invalidTypes.join(', ')}. Must be one of: ${validTypes.join(', ')}`
            });
        }

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        let hasDateFilter = false;
        let parsedStart = null;
        let parsedEnd = null;

        if (start && end) {
            const s = new Date(start);
            const e = new Date(end);
            if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
                parsedStart = s;
                parsedEnd = e;
                hasDateFilter = true;
            }
        }

        const parseDateString = (str) => {
            if (!str) return null;
            let d = new Date(str);
            if (!isNaN(d.getTime())) return d;
            const parts = String(str).split('/');
            if (parts.length === 3) {
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const year = parseInt(parts[2], 10);
                d = new Date(year, month, day);
                if (!isNaN(d.getTime())) return d;
            }
            return null;
        };

        const statusPartially = [10, 19, 20, 33, 37, 41, 42, 45, 46];
        const statusFully = [11, 21, 22, 34, 38, 43, 44, 47, 48];

        const buildWhere = (docType) => {
            const where = {
                companyId: Number(companyId),
                documentType: docType,
                status: {
                    [Op.ne]: 0
                }
            };
            if (hasDateFilter) {
                where.createdAt = {
                    [Op.between]: [parsedStart, parsedEnd]
                };
            }
            return where;
        };

        let combinedData = [];

        for (const currentType of typesArray) {
            let dataForType = [];

            if (currentType === 'salesOrder') {
                dataForType = await models.Documents.findAll({
                    where: buildWhere('Sales Order'),
                    order: [['createdAt', 'DESC']],
                    raw: true
                });
            } else if (currentType === 'todayDeliveries') {
                const salesOrders = await models.Documents.findAll({
                    where: {
                        companyId: Number(companyId),
                        documentType: 'Sales Order',
                        status: {
                            [Op.ne]: 0
                        }
                    },
                    order: [['createdAt', 'DESC']],
                    raw: true
                });

                dataForType = salesOrders.filter(doc => {
                    if (!doc.deliveryDate) return false;
                    const d = parseDateString(doc.deliveryDate);
                    if (!d) return false;
                    if (hasDateFilter) {
                        return d >= parsedStart && d <= parsedEnd;
                    } else {
                        return d >= startOfToday && d <= endOfToday;
                    }
                });
            } else if (currentType === 'deliveryChallan') {
                dataForType = await models.Documents.findAll({
                    where: buildWhere('Delivery Challan'),
                    order: [['createdAt', 'DESC']],
                    raw: true
                });
            } else if (['pendingDispatch', 'partiallyDeliveredDispatch', 'fullyDeliveredDispatch', 'cancelledDispatch'].includes(currentType)) {
                const salesOrders = await models.Documents.findAll({
                    where: buildWhere('Sales Order'),
                    order: [['createdAt', 'DESC']],
                    raw: true
                });

                if (currentType === 'cancelledDispatch') {
                    dataForType = salesOrders.filter(doc => doc.status === 2);
                } else if (currentType === 'partiallyDeliveredDispatch') {
                    dataForType = salesOrders.filter(doc => statusPartially.includes(doc.status));
                } else if (currentType === 'fullyDeliveredDispatch') {
                    dataForType = salesOrders.filter(doc => statusFully.includes(doc.status));
                } else if (currentType === 'pendingDispatch') {
                    dataForType = salesOrders.filter(doc => doc.status !== 2 && !statusPartially.includes(doc.status) && !statusFully.includes(doc.status));
                }
            } else if (currentType === 'invoice') {
                dataForType = await models.Documents.findAll({
                    where: buildWhere('Invoice'),
                    order: [['createdAt', 'DESC']],
                    raw: true
                });
            } else if (currentType === 'purchaseOrder') {
                dataForType = await models.Documents.findAll({
                    where: buildWhere('Purchase Order'),
                    order: [['createdAt', 'DESC']],
                    raw: true
                });
            } else if (currentType === 'purchaseInvoice') {
                dataForType = await models.Documents.findAll({
                    where: buildWhere('Purchase Invoice'),
                    order: [['createdAt', 'DESC']],
                    raw: true
                });
            }

            combinedData.push(...dataForType);
        }

        const seenIds = new Set();
        const uniqueData = [];
        for (const item of combinedData) {
            const key = item.id || item.documentNumber;
            if (key) {
                if (!seenIds.has(key)) {
                    seenIds.add(key);
                    uniqueData.push(item);
                }
            } else {
                uniqueData.push(item);
            }
        }

        uniqueData.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        const documentNumbers = uniqueData.map(doc => doc.documentNumber).filter(Boolean);

        if (documentNumbers.length > 0) {
            const documentItems = await models.DocumentItems.findAll({
                where: {
                    documentNumber: documentNumbers,
                    companyId: Number(companyId)
                },
                raw: true,
            });

            const itemsMap = new Map();
            for (const item of documentItems) {
                if (!itemsMap.has(item.documentNumber)) {
                    itemsMap.set(item.documentNumber, []);
                }
                itemsMap.get(item.documentNumber).push(item);
            }

            for (const doc of uniqueData) {
                doc.items = itemsMap.get(doc.documentNumber) || [];
            }
        }

        return res.status(200).json({
            message: `Records fetched successfully for types: ${typesArray.join(', ')}`,
            data: uniqueData
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Failed to fetch sales dashboard details",
            error: err.message || err
        });
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
    predictSales: predictSales,
    getDashboardData: getDashboardData,
    getStoreWiseItems: getStoreWiseItems,
    getCategoryWiseItems: getCategoryWiseItems,
    fastMovingSlowMovingItems: fastMovingSlowMovingItems,
    stockLevelAnalysis: stockLevelAnalysis,
    stockAgeing: stockAgeing,
    onTimeDelayProduction: onTimeDelayProduction,
    workOrderStatus: workOrderStatus,
    getSalesDashboardDetails: getSalesDashboardDetails
};
