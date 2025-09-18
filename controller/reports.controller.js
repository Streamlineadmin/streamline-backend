const { isValidJSON, istToUtc, getAllDatesInRange, formatToIstDate } = require('../helpers/add-level');
const { documentTypes } = require('../helpers/document-type');
const models = require('../models');
const { Op } = require('sequelize');

async function getReports(req, res) {
    try {
        const { companyId, documentType = '', search = '' } = req.body;
        if (documentType === "productionReport") {
            const { toStore, dateRange, itemType, quickRange } = req.body;
            let startDate = null, endDate = null;

            if (dateRange?.length === 2) {
                startDate = new Date(new Date(dateRange[0]).getTime() - (5.5 * 60 * 60 * 1000));

                const endDateRaw = new Date(dateRange[1]);
                endDateRaw.setHours(23, 59, 59, 999);
                endDate = new Date(endDateRaw.getTime() - (5.5 * 60 * 60 * 1000));
            } else if (quickRange) {
                const nowIst = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000);
                const startIst = new Date(nowIst);
                startIst.setDate(nowIst.getDate() - quickRange);
                startDate = istToUtc(startIst);
                endDate = istToUtc(nowIst);
            }

            const nowIst = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000);
            const oneMonthAgoIst = new Date(nowIst);
            oneMonthAgoIst.setMonth(nowIst.getMonth() - 1);

            const startUtc = istToUtc(startDate || oneMonthAgoIst);
            const endUtc = istToUtc(endDate || nowIst);

            const whereClause = {
                companyId: Number(companyId),
                productionId: { [Op.ne]: null },
                createdAt: { [Op.between]: [startUtc, endUtc] },
                quantity: { [Op.gt]: 0 }
            };
            if (toStore?.length) {
                whereClause.toStoreId = { [Op.in]: toStore };
            }

            const StockTransfers = await models.StockTransfer.findAll({
                where: whereClause,
                raw: true
            });

            const itemIds = StockTransfers.map(t => t.itemId);

            const uoms = await models.UOM.findAll({
                where: { companyId: { [Op.or]: [null, Number(companyId)] } },
                raw: true
            });
            const uomMap = uoms.reduce((acc, curr) => {
                acc[curr.id] = curr.code;
                return acc;
            }, {});

            const items = await models.Items.findAll({
                where: {
                    companyId: Number(companyId),
                    id: { [Op.in]: itemIds }
                },
                raw: true
            });
            const itemsMap = items.reduce((acc, curr) => {
                acc[curr.id] = curr;
                return acc;
            }, {});

            const itemDailyData = {};
            StockTransfers.forEach(transfer => {
                const itemId = transfer.itemId;
                const dateKey = formatToIstDate(new Date(transfer.createdAt));
                const qty = transfer.quantity || 0;

                if (!itemDailyData[itemId]) {
                    itemDailyData[itemId] = { totalQuantity: 0 };
                }
                if (!itemDailyData[itemId][dateKey]) {
                    itemDailyData[itemId][dateKey] = 0;
                }

                itemDailyData[itemId][dateKey] += qty;
                itemDailyData[itemId].totalQuantity += qty;
            });

            // build list of all dates between start and end
            const allDates = getAllDatesInRange(startUtc, endUtc);

            const finalReport = Object.keys(itemDailyData).map(itemId => {
                const row = {
                    itemId: itemsMap[itemId]?.itemId || null,
                    itemName: itemsMap[itemId]?.itemName || null,
                    uom: uomMap[itemsMap[itemId]?.metricsUnit] || null,
                    totalQuantity: itemDailyData[itemId].totalQuantity,
                    documentNumber: itemId
                };

                allDates.forEach(dateKey => {
                    row[dateKey] = itemDailyData[itemId][dateKey] || 0;
                });

                return row;
            });

            return res.status(200).json({
                message: 'reports fetched.',
                data: finalReport
            });
        }
        if (documentType === "productionSummary") {
            const items = await models.Items.findAll({
                where: {
                    companyId: Number(companyId)
                },
                attributes: ['microCategory', 'subCategory', 'category', 'itemId'],
                raw: true
            });
            const itemsMap = items.reduce((acc, curr) => {
                acc[curr.itemId] = curr;
                return acc;
            }, {});
            const categorys = await models.Categories.findAll({
                where: {
                    companyId: Number(companyId)
                },
                attributes: ['id', 'name'],
                raw: true
            });
            const categorysMap = categorys.reduce((acc, curr) => {
                acc[curr.id] = curr.name;
                return acc;
            }, {});

            const users = await models.Users.findAll({
                where: { companyId: companyId },
                attributes: ["id", "username"],
                raw: true
            });
            const userMap = users.reduce((acc, curr) => {
                acc[curr.id] = curr.username;
                return acc;
            }, {})
            const uoms = await models.UOM.findAll({
                where: {
                    [Op.or]: [
                        { companyId: companyId, status: 1 },
                        { companyId: null, status: 0 }
                    ]
                },
                attributes: ["id", "code"],
                raw: true
            });
            const uomMap = uoms.reduce((acc, curr) => {
                acc[curr.id?.toString()] = curr.code;
                return acc;
            }, {})
            const productions = await models.Production.findAll({
                where: {
                    companyId: Number(companyId)
                },
                raw: true
            });
            const productionMap = {}, ids = [];
            for (const element of productions) {
                productionMap[element.id] = element;
                ids.push(element.id);
            }
            const finishedGoods = await models.ProductionFinishedGoods.findAll({
                where: {
                    productionId: {
                        [Op.in]: ids
                    }
                },
                raw: true,
               
            });

            const rawMaterials = await models.ProductionRawMaterials.findAll({
                where: {
                    productionId: {
                        [Op.in]: ids
                    }
                },
                raw: true,
                order: [["createdAt", "DESC"]],
            });

            const rawMaterialMap = rawMaterials.reduce((acc, curr) => {
                if (acc[curr.productionId]) acc[curr.productionId].push(curr);
                else acc[curr.productionId] = [curr];
                return acc;
            }, {});

            const bomData = await models.BOMDetails.findAll({
                where: {
                    companyId: Number(companyId)
                },
                attributes: ["id", "bomName", "bomId"],
                raw: true
            });
            const bomMap = bomData.reduce((acc, curr) => {
                acc[curr.id] = curr;
                return acc;
            }, {})

            const data = [];
            const statusArray = ['In Planning', 'Ongoing', 'On Hold', 'Completed'];
            for (const element of finishedGoods) {
                data.push({
                    ...element,
                    ...productionMap[element.productionId],
                    uom: uomMap[element.uom],
                    producedQuantity: element?.producedQuantity || 0,
                    perUnitCost: ((element.cost || 0) / (element?.passedQuantity || 1))?.toFixed?.(2) || 0,
                    rejectQuantity: element?.rejectQuantity || 0,
                    assignedTo: userMap[productionMap[element.productionId]?.assignedTo],
                    status: statusArray[productionMap[element.productionId]?.status - 1],
                    completedBy: userMap[productionMap[element.productionId]?.completedBy],
                    rawMaterials: (rawMaterialMap[element.productionId] || [])?.map(raw => {
                        return {
                            ...raw,
                            uom: uomMap[raw.uom],
                            category: categorysMap[itemsMap[raw.itemId]?.category],
                            subCategory: categorysMap[itemsMap[raw.itemId]?.subCategory],
                            microCategory: categorysMap[itemsMap[raw.itemId]?.microCategory],
                        }
                    }),
                    category: categorysMap[itemsMap[element.itemId]?.category],
                    subCategory: categorysMap[itemsMap[element.itemId]?.subCategory],
                    microCategory: categorysMap[itemsMap[element.itemId]?.microCategory],
                    documentNumber: element.id,
                    salesOrderNumber: productionMap[element.productionId]?.documentNumber,
                    bomId: bomMap[productionMap[element.productionId]?.bomId]?.bomId,
                    bomName: bomMap[productionMap[element.productionId]?.bomId]?.bomName,
                });
            }
            return res.status(200).json({ data, total: data.length });
        }
        if (documentType === "productionProcess") {
            const items = await models.Items.findAll({
                where: {
                    companyId: Number(companyId)
                },
                attributes: ['microCategory', 'subCategory', 'category', 'itemId'],
                raw: true
            });
            const itemsMap = items.reduce((acc, curr) => {
                acc[curr.itemId] = curr;
                return acc;
            }, {});
            const categorys = await models.Categories.findAll({
                where: {
                    companyId: Number(companyId)
                },
                attributes: ['id', 'name'],
                raw: true
            });
            const categorysMap = categorys.reduce((acc, curr) => {
                acc[curr.id] = curr.name;
                return acc;
            }, {});

            const uoms = await models.UOM.findAll({
                where: {
                    [Op.or]: [
                        { companyId: companyId, status: 1 },
                        { companyId: null, status: 0 }
                    ]
                },
                attributes: ["id", "code"],
                raw: true
            });
            const uomMap = uoms.reduce((acc, curr) => {
                acc[curr.id?.toString()] = curr.code;
                return acc;
            }, {})
            const productions = await models.Production.findAll({
                where: {
                    companyId: Number(companyId)
                },
                raw: true
            });
            const productionMap = {}, ids = [];
            for (const element of productions) {
                productionMap[element.id] = element;
                ids.push(element.id);
            }
            const finishedGoods = await models.ProductionFinishedGoods.findAll({
                where: {
                    productionId: {
                        [Op.in]: ids
                    }
                },
                raw: true,
                order: [["createdAt", "DESC"]],
            });

            const finishedGoodsMap = finishedGoods.reduce((acc, curr) => {
                acc[curr.productionId] = curr;
                return acc;
            }, {});

            const bomData = await models.BOMDetails.findAll({
                where: {
                    companyId: Number(companyId)
                },
                attributes: ["id", "bomName", "bomId"],
                raw: true
            });
            const bomMap = bomData.reduce((acc, curr) => {
                acc[curr.id] = curr;
                return acc;
            }, {});

            const process = await models.ProductionSalesProcess.findAll({
                where: {
                    productionId: {
                        [Op.in]: ids
                    }
                },
                raw: true
            });

            const data = [];
            for (const element of process) {
                data.push({
                    ...element,
                    ...finishedGoodsMap[element.productionId],
                    ...productionMap[element.productionId],
                    completionPercent: element?.processCompleteOn ? ((element?.processCompleteOn * 100) / finishedGoodsMap[element.productionId]?.quantity) : 0,
                    uom: uomMap[finishedGoodsMap[element.productionId]?.uom],
                    bomId: bomMap[productionMap[element.productionId]?.bomId]?.bomId,
                    bomName: bomMap[productionMap[element.productionId]?.bomId]?.bomName,
                    category: categorysMap[itemsMap[finishedGoodsMap[element.productionId]?.itemId]?.category],
                    subCategory: categorysMap[itemsMap[finishedGoodsMap[element.productionId]?.itemId]?.subCategory],
                    microCategory: categorysMap[itemsMap[element.itemId]?.microCategory],
                    documentNumber: element.id,
                    salesOrderNumber: productionMap[element.productionId]?.documentNumber
                });
            }
            return res.status(200).json({ data, total: data.length });
        }
        if (documentType === 'Store wise item stock') {
            const stores = await models.Store.findAll({
                where: {
                    companyId: Number(companyId)
                }
            });
            const storesMap = stores.reduce((acc, curr) => {
                acc[curr.id] = curr.name;
                return acc;
            }, {});
            const items = await models.Items.findAll({
                where: {
                    companyId: Number(companyId)
                },
                raw: true
            });
            const itemsMap = items.reduce((acc, curr) => {
                acc[curr.id] = curr.itemId;
                return acc;
            }, {});
            const categorys = await models.Categories.findAll({
                where: {
                    companyId: Number(companyId)
                }
            });
            const categoryMap = categorys?.reduce((acc, curr) => {
                acc[curr.id] = curr.name;
                return acc;
            }, {});
            const StoreItems = await models.StoreItems.findAll({
                where: {
                    storeId: {
                        [Op.in]: stores.map(store => store.id)
                    },
                    quantity: {
                        [Op.gt]: 0
                    }
                },
                raw: true
            });
            const quantityMaps = {};
            for (const element of StoreItems) {
                if (!quantityMaps?.[element.itemId]) {
                    quantityMaps[element.itemId] = {};
                    if (!element.isRejected) {
                        quantityMaps[element.itemId].fifoPrice = element.price;
                    }
                }
                if (!quantityMaps[element.itemId][storesMap[element.storeId]])
                    quantityMaps[element.itemId][storesMap[element.storeId]] = {};
                if (element?.isRejected) {
                    quantityMaps[element.itemId][storesMap[element.storeId]].rejectedQuantity = (quantityMaps[element.itemId][storesMap[element.storeId]].rejectedQuantity || 0) + element.quantity;
                    quantityMaps[element.itemId][storesMap[element.storeId]].rejectedQuantityValue = (quantityMaps[element.itemId][storesMap[element.storeId]].rejectedQuantityValue || 0) + (element.quantity * (element.price || 0));
                }
                else {
                    quantityMaps[element.itemId][storesMap[element.storeId]].inStockQuantity = (quantityMaps[element.itemId][storesMap[element.storeId]].inStockQuantity || 0) + element.quantity;
                    quantityMaps[element.itemId][storesMap[element.storeId]].inStockValue = (quantityMaps[element.itemId][storesMap[element.storeId]].inStockValue || 0) + (element.quantity * (element.price || 0));
                }
            }
            for (const item of items) {
                item.documentNumber = item.id;
                item.stockInfo = quantityMaps[item.id] || {};
                item.customFields = isValidJSON(item.customFields) || {};
                if (item.category) item.category = categoryMap[item.category] || '';
                if (item.subCategory) item.subCategory = categoryMap[item.subCategory] || '';
                if (item.microCategory) item.microCategory = categoryMap[item.microCategory] || '';
            }
            return res.status(200).json({ data: items, total: items.length });

        }
        if (documentType === 'Store to store transfer report') {
            const { fromStore, toStore, isReject, itemType, dateRange } = req.body;
            const stores = await models.Store.findAll({
                where: {
                    companyId: Number(companyId)
                }
            });
            const storesMap = stores.reduce((acc, curr) => {
                acc[curr.id] = curr.name;
                return acc;
            }, {});
            const items = await models.Items.findAll({
                where: {
                    companyId: Number(companyId),
                    ...(itemType.length && { itemType: { [Op.in]: itemType } })
                },
                raw: true
            });
            const itemsIds = items.map(item => item.id);
            const itemsMap = items.reduce((acc, curr) => {
                acc[curr.id] = curr;
                return acc;
            }, {});
            const categorys = await models.Categories.findAll({
                where: {
                    companyId: Number(companyId)
                }
            });
            const categoryMap = categorys?.reduce((acc, curr) => {
                acc[curr.id] = curr.name;
                return acc;
            }, {});
            const uoms = await models.UOM.findAll({
                where: {
                    [Op.or]: [
                        { companyId: req.body.companyId, status: 1 },
                        { companyId: null, status: 0 }
                    ]
                }
            });
            const uomMap = uoms.reduce((acc, curr) => {
                acc[curr.id] = curr.code;
                return acc;
            }, {});
            const users = await models.Users.findAll({
                where: {
                    companyId: Number(companyId)
                }
            });
            const usersMap = users.reduce((acc, curr) => {
                acc[curr.id] = curr.username;
                return acc;
            }, {});

            let startDate, endDate;

            if (dateRange.length === 2) {
                startDate = new Date(new Date(dateRange[0]).getTime() - (5.5 * 60 * 60 * 1000));

                const endDateRaw = new Date(dateRange[1]);
                endDateRaw.setHours(23, 59, 59, 999); // move to end of day
                endDate = new Date(endDateRaw.getTime() - (5.5 * 60 * 60 * 1000));
            }
            const whereCondition = {
                companyId: Number(companyId),
                itemId: {
                    [Op.in]: itemsIds
                },
                fromStoreId: {
                    ...(fromStore?.length > 0 ? { [Op.in]: fromStore } : {}),
                    [Op.not]: null
                },
                toStoreId: {
                    ...(toStore?.length > 0 ? { [Op.in]: toStore } : {}),
                    [Op.not]: null
                },
                isRejected: isReject,
                ...(Array.isArray(dateRange) && dateRange.length === 2 && dateRange[0] && dateRange[1] && {
                    createdAt: {
                        [Op.between]: [
                            startDate, endDate
                        ]
                    }
                })
            };

            const transferHistory = await models.StockTransfer.findAll({
                where: whereCondition,
                raw: true
            });
            const data = [];
            for (const element of transferHistory) {
                const item = itemsMap[element.itemId];
                item.category = categoryMap[item.category];
                item.subCategory = categoryMap[item.subCategory];
                item.microCategory = categoryMap[item.microCategory];
                data.push({
                    documentNumber: element.id,
                    ...element,
                    fromStore: storesMap[element.fromStoreId],
                    toStore: storesMap[element.toStoreId],
                    ...item,
                    customFields: isValidJSON(item.customFields) || {},
                    price: element.price,
                    metricsUnit: uomMap[item.metricsUnit],
                    user: usersMap[element.transferredBy]
                });

            }

            return res.status(200).json({ data: data, total: data.length });
        }
        if (documentType === 'Stock change report') {
            const { toStore, isReject, itemType, dateRange } = req.body;
            const stores = await models.Store.findAll({
                where: {
                    companyId: Number(companyId)
                }
            });
            const storesMap = stores.reduce((acc, curr) => {
                acc[curr.id] = curr.name;
                return acc;
            }, {});
            const items = await models.Items.findAll({
                where: {
                    companyId: Number(companyId),
                    ...(itemType.length && { itemType: { [Op.in]: itemType } })
                },
                raw: true
            });
            const itemsIds = items.map(item => item.id);
            const itemsMap = items.reduce((acc, curr) => {
                acc[curr.id] = curr;
                return acc;
            }, {});
            const categorys = await models.Categories.findAll({
                where: {
                    companyId: Number(companyId)
                }
            });
            const categoryMap = categorys?.reduce((acc, curr) => {
                acc[curr.id] = curr.name;
                return acc;
            }, {});
            const uoms = await models.UOM.findAll({
                where: {
                    [Op.or]: [
                        { companyId: req.body.companyId, status: 1 },
                        { companyId: null, status: 0 }
                    ]
                }
            });
            const uomMap = uoms.reduce((acc, curr) => {
                acc[curr.id] = curr.code;
                return acc;
            }, {});
            const users = await models.Users.findAll({
                where: {
                    companyId: Number(companyId)
                }
            });
            const usersMap = users.reduce((acc, curr) => {
                acc[curr.id] = curr.username;
                return acc;
            }, {});

            let startDate, endDate;

            if (dateRange?.length === 2) {
                startDate = new Date(new Date(dateRange[0]).getTime() - (5.5 * 60 * 60 * 1000));

                const endDateRaw = new Date(dateRange[1]);
                endDateRaw.setHours(23, 59, 59, 999); // move to end of day
                endDate = new Date(endDateRaw.getTime() - (5.5 * 60 * 60 * 1000));
            }
            const whereCondition = {
                companyId: Number(companyId),
                itemId: {
                    [Op.in]: itemsIds
                },
                fromStoreId: null,
                toStoreId: {
                    [Op.in]: toStore
                },
                isRejected: isReject,
                ...(Array.isArray(dateRange) && dateRange.length === 2 && dateRange[0] && dateRange[1] && {
                    createdAt: {
                        [Op.between]: [
                            startDate, endDate
                        ]
                    }
                })
            };

            const transferHistory = await models.StockTransfer.findAll({
                where: whereCondition,
                raw: true
            });
            const data = [];
            for (const element of transferHistory) {
                const item = itemsMap[element.itemId];
                item.category = categoryMap[item.category];
                item.subCategory = categoryMap[item.subCategory];
                item.microCategory = categoryMap[item.microCategory];
                data.push({
                    documentNumber: element.id,
                    ...element,
                    toStore: storesMap[element.toStoreId],
                    ...item,
                    customFields: isValidJSON(item.customFields) || {},
                    price: element.price,
                    metricsUnit: uomMap[item.metricsUnit],
                    user: usersMap[element.transferredBy]
                });

            }
            return res.status(200).json({ data: data, total: data.length });
        }
        const documents = await models.Documents.findAndCountAll({
            where: {
                companyId,
                ...(documentType && {
                    documentType: {
                        [Op.in]: [documentType]
                    }
                }),
                ...(search && {
                    [Op.or]: [
                        {
                            documentNumber: {
                                [Op.like]: `%${search.trim()}%`,
                            },
                        },
                        {
                            documentType: {
                                [Op.like]: `%${search.trim()}%`,
                            },
                        },
                        {
                            buyerName: {
                                [Op.like]: `%${search.trim()}%`,
                            },
                        }
                    ],
                }),
            },
            include: [
                {
                    model: models.LogisticDetails,
                    as: 'logisticDetails',
                },
                {
                    model: models.Users,
                    as: 'creator',
                    attributes: ['id', 'name'],
                },
            ],
            order: [['createdAt', 'DESC']],
            distinct: true,
        });

        if (documents?.rows?.length === 0) {
            return res.status(200).json({
                total: 0,
                data: [],
            });
        }
        const documentNumbers = (documents?.rows || documents)?.map(doc => doc.documentNumber);
        const documentIds = (documents?.rows || documents).map(doc => doc.id);

        const [
            items,
            additionalCharges,
            bankDetails,
            termsConditions,
            attachments,
            documentComments
        ] = await Promise.all([
            models.DocumentItems.findAll({
                where: { documentNumber: documentNumbers, companyId },
                raw: true,
                include: [
                    {
                        model: models.Items,
                        as: 'itemDetails',
                        attributes: ['itemId', 'category', 'subCategory', 'microCategory']
                    }
                ]
            }),
            models.DocumentAdditionalCharges.findAll({ where: { documentNumber: documentNumbers, companyId } }),
            models.DocumentBankDetails.findAll({ where: { documentNumber: documentNumbers, companyId } }),
            models.CompanyTermsCondition.findAll({ where: { documentNumber: documentNumbers, companyId } }),
            models.DocumentAttachments.findAll({ where: { documentNumber: documentNumbers, companyId } }),
            models.DocumentComments.findAll({ where: { documentId: documentIds } }),
        ]);

        const uniqueItemsMap = new Map();
        for (const item of items) {
            const key = `${item.documentNumber}_${item.itemId}`;
            if (!uniqueItemsMap.has(key)) {
                uniqueItemsMap.set(key, item);
            }
        }
        let uniqueItems = Array.from(uniqueItemsMap.values());
        let salesItemsMap = {}, deliveryChallanItemsMap = {}, prToPoMap = {}, creditNoteMap = {}, debitNoteMap = {}, creditNoteNumber = {}, debitNoteNumber = {};
        const pendingItemsMap = {};
        if (documentType === documentTypes.invoice || documentType === documentTypes.deliveryChallan || documentType === documentTypes.proformaInvoice) {
            const salesOrder = await models.Documents.findAll({
                where: {
                    companyId: Number(companyId),
                    documentNumber: {
                        [Op.in]: documents?.rows?.filter(doc => doc?.orderConfirmationNumber)?.map(doc => doc.orderConfirmationNumber)
                    },
                },
                raw: true
            });
            const salesItems = await models.DocumentItems.findAll({
                where: {
                    companyId: Number(companyId),
                    documentNumber: {
                        [Op.in]: salesOrder?.map(doc => doc.documentNumber)
                    }
                },
                raw: true
            });
            salesItemsMap = salesItems?.reduce((acc, curr) => {
                if (!acc[curr.documentNumber]) acc[curr.documentNumber] = {};
                acc[curr.documentNumber][curr.itemId] = curr.quantity;
                return acc;
            }, {});
        }

        if (documentType === documentTypes.creditNote || documentType === documentTypes.debitNote ||
            documentType === documentTypes.purchaseCreditNote || documentType === documentTypes.purchaseDebitNote
        ) {
            const invoices = await models.Documents.findAll({
                where: {
                    companyId: Number(companyId),
                    documentNumber: {
                        [Op.in]: documents?.rows?.filter(doc => doc?.invoiceNumber)?.map(doc => doc.invoiceNumber)
                    }
                },
                raw: true
            });
            const invoiceItems = await models.DocumentItems.findAll({
                where: {
                    companyId: Number(companyId),
                    documentNumber: {
                        [Op.in]: invoices?.map(doc => doc.documentNumber)
                    }
                },
                raw: true
            });
            salesItemsMap = invoiceItems?.reduce((acc, curr) => {
                if (!acc[curr.documentNumber]) acc[curr.documentNumber] = {};
                acc[curr.documentNumber][curr.itemId] = {
                    quantity: curr.quantity,
                    price: curr.price
                }
                return acc;
            }, {});
        }

        if (documentType === documentTypes.salesReturn) {
            const invoices = await models.Documents.findAll({
                where: {
                    companyId: Number(companyId),
                    documentNumber: {
                        [Op.in]: documents?.rows?.filter(doc => doc?.invoiceNumber)?.map(doc => doc.invoiceNumber)
                    }
                },
                raw: true
            });
            const invoiceItems = await models.DocumentItems.findAll({
                where: {
                    companyId: Number(companyId),
                    documentNumber: {
                        [Op.in]: invoices?.map(doc => doc.documentNumber)
                    }
                },
                raw: true
            });

            salesItemsMap = invoiceItems?.reduce((acc, curr) => {
                if (!acc[curr.documentNumber]) acc[curr.documentNumber] = {};
                acc[curr.documentNumber][curr.itemId] = curr.quantity;
                return acc;
            }, {});

            const challans = await models.Documents.findAll({
                where: {
                    companyId: Number(companyId),
                    documentNumber: {
                        [Op.in]: documents?.rows?.filter(doc => doc?.challan_number)?.map(doc => doc.challan_number)
                    }
                },
                raw: true
            });
            const challanItems = await models.DocumentItems.findAll({
                where: {
                    companyId: Number(companyId),
                    documentNumber: {
                        [Op.in]: challans?.map(doc => doc.documentNumber)
                    }
                },
                raw: true
            });

            deliveryChallanItemsMap = challanItems?.reduce((acc, curr) => {
                if (!acc[curr.documentNumber]) acc[curr.documentNumber] = {};
                acc[curr.documentNumber][curr.itemId] = curr.quantity;
                return acc;
            }, {});
        }
        const purchaseOrderToGrnMap = {}, purchaseOrderToInvoiceMap = {}, qualityToGrnMap = {}, qualityReportAcceptQuantityMap = {}, purchaseInvoiceQuantityMap = {};
        if (documentType === documentTypes.purchaseOrder) {
            const grns = await models.Documents.findAll({
                where: {
                    companyId: Number(companyId),
                    purchaseOrderNumber: {
                        [Op.in]: documentNumbers
                    },
                    documentType: 'Goods Received Note'
                },
                raw: true
            });

            const qualityReports = await models.Documents.findAll({
                where: {
                    companyId: Number(companyId),
                    grn_number: {
                        [Op.in]: grns.map(doc => doc.documentNumber)
                    },
                    documentType: 'Quality Report'
                },
                raw: true
            });

            const purchaseInvoice = await models.Documents.findAll({
                where: {
                    companyId: Number(companyId),
                    grn_number: {
                        [Op.in]: documentNumbers
                    },
                    documentType: 'Purchase Invoice'
                },
                raw: true
            });


            for (const element of grns) {
                purchaseOrderToGrnMap[element.documentNumber] = element.purchaseOrderNumber;
            }

            for (const element of purchaseInvoice) {
                purchaseOrderToInvoiceMap[element.documentNumber] = element.purchaseOrderNumber;
            }

            for (const element of qualityReports) {
                qualityToGrnMap[element.documentNumber] = element.grn_number;
            }

            const documentItems = await models.DocumentItems.findAll({
                where: {
                    companyId: Number(companyId),
                    documentNumber: {
                        [Op.in]: grns.map(grn => grn.documentNumber)
                    }
                },
                raw: true
            });

            const purchaseInvoiceItems = await models.DocumentItems.findAll({
                where: {
                    companyId: Number(companyId),
                    documentNumber: {
                        [Op.in]: purchaseInvoice.map(invoice => invoice.documentNumber)
                    }
                },
                raw: true
            });

            const qualityReportItems = await models.DocumentItems.findAll({
                where: {
                    companyId: Number(companyId),
                    documentNumber: {
                        [Op.in]: qualityReports.map(qr => qr.documentNumber)
                    }
                },
                raw: true
            });

            for (const element of documentItems) {
                if (!salesItemsMap[purchaseOrderToGrnMap[element.documentNumber]]) {
                    salesItemsMap[purchaseOrderToGrnMap[element.documentNumber]] = {};
                }
                salesItemsMap[purchaseOrderToGrnMap[element.documentNumber]][element.itemId] = (salesItemsMap[purchaseOrderToGrnMap[element.documentNumber]][element.itemId] || 0) + element.quantity;
            }

            for (const element of purchaseInvoiceItems) {
                if (!purchaseInvoiceQuantityMap[purchaseOrderToInvoiceMap[element.documentNumber]]) {
                    purchaseInvoiceQuantityMap[purchaseOrderToInvoiceMap[element.documentNumber]] = {};
                }
                purchaseInvoiceQuantityMap[purchaseOrderToInvoiceMap[element.documentNumber]][element.itemId] = (purchaseInvoiceQuantityMap[purchaseOrderToInvoiceMap[element.documentNumber]][element.itemId] || 0) + element.quantity;
            }

            for (const element of qualityReportItems) {
                if (!qualityReportAcceptQuantityMap[purchaseOrderToGrnMap[qualityToGrnMap[element.documentNumber]]]) {
                    qualityReportAcceptQuantityMap[purchaseOrderToGrnMap[qualityToGrnMap[element.documentNumber]]] = {};
                }
                if (!qualityReportAcceptQuantityMap[purchaseOrderToGrnMap[qualityToGrnMap[element.documentNumber]]][element.itemId]) {
                    qualityReportAcceptQuantityMap[purchaseOrderToGrnMap[qualityToGrnMap[element.documentNumber]]][element.itemId] = {};
                }
                qualityReportAcceptQuantityMap[purchaseOrderToGrnMap[qualityToGrnMap[element.documentNumber]]][element.itemId].accepted = (qualityReportAcceptQuantityMap[purchaseOrderToGrnMap[qualityToGrnMap[element.documentNumber]]][element.itemId].accepted || 0) + element.receivedToday;
                qualityReportAcceptQuantityMap[purchaseOrderToGrnMap[qualityToGrnMap[element.documentNumber]]][element.itemId].rejected = (qualityReportAcceptQuantityMap[purchaseOrderToGrnMap[qualityToGrnMap[element.documentNumber]]][element.itemId].rejected || 0) + element.pendingQuantity;
            }
        }

        if (documentType === documentTypes.purchaseRequest) {
            const indentConditions = documentNumbers.flatMap((docNum) => [
                {
                    indent_number: {
                        [Op.like]: `%,${docNum},%`,
                    },
                },
                {
                    indent_number: {
                        [Op.like]: `${docNum},%`,
                    },
                },
                {
                    indent_number: {
                        [Op.like]: `%,${docNum}`,
                    },
                },
                {
                    indent_number: docNum,
                },
            ]);

            const purchaseOrders = await models.Documents.findAll({
                where: {
                    companyId: Number(companyId),
                    [Op.and]: [
                        {
                            [Op.or]: indentConditions,
                        },
                        {
                            status: {
                                [Op.ne]: 2,
                            },
                        },
                    ],
                },
                attributes: ['documentNumber', 'indent_number'],
                raw: true
            });

            for (const element of purchaseOrders) {
                for (const child of element.indent_number?.split(',')) {
                    if (!child) continue;
                    if (prToPoMap[child]) {
                        prToPoMap[child].push(element.documentNumber);
                    } else {
                        prToPoMap[child] = [element.documentNumber];
                    }
                }
            }

            const purchaseOrderDocuments = await models.DocumentItems.findAll({
                where: {
                    companyId: Number(companyId),
                    documentNumber: {
                        [Op.in]: purchaseOrders.map(doc => doc.documentNumber)
                    }
                },
                raw: true
            });
            salesItemsMap = purchaseOrderDocuments.reduce((acc, curr) => {
                if (!acc[curr.documentNumber]) acc[curr.documentNumber] = {};
                acc[curr.documentNumber][curr.itemId] = 1;
                return acc;
            }, {});

        }

        if (documentType === documentTypes.purchaseInvoice) {
            const purchaseOrders = await models.Documents.findAll({
                where: {
                    companyId: Number(companyId),
                    documentType: 'Purchase Order',
                    documentNumber: {
                        [Op.in]: documents?.rows?.filter(doc => doc?.purchaseOrderNumber)?.map(doc => doc.purchaseOrderNumber)
                    }
                },
                raw: true
            });
            const purchaseOrdersItems = await models.DocumentItems.findAll({
                where: {
                    companyId: Number(companyId),
                    documentNumber: {
                        [Op.in]: purchaseOrders?.map(doc => doc.documentNumber)
                    }
                },
                raw: true
            });
            const purchaseCreditNotes = await models.Documents.findAll({
                where: {
                    companyId: Number(companyId),
                    documentType: 'Purchase Credit Note',
                    invoiceNumber: {
                        [Op.in]: documentNumbers
                    }
                },
                raw: true
            });
            const purchaseToInvoiceMap = purchaseCreditNotes.reduce((acc, curr) => {
                acc[curr.documentNumber] = curr.invoiceNumber;
                if (creditNoteNumber[curr.invoiceNumber]) creditNoteNumber[curr.invoiceNumber].push(curr.documentNumber);
                else creditNoteNumber[curr.invoiceNumber] = [curr.documentNumber];
                return acc;
            }, {});
            const purchaseCreditNoteItems = await models.DocumentItems.findAll({
                where: {
                    companyId: Number(companyId),
                    documentNumber: {
                        [Op.in]: purchaseCreditNotes.map(doc => doc.documentNumber)
                    }
                },
                raw: true
            });
            for (const element of purchaseCreditNoteItems) {
                creditNoteMap[purchaseToInvoiceMap[element.documentNumber]] = (creditNoteMap[purchaseToInvoiceMap[element.documentNumber]] || 0) + Number(element.totalAfterTax);
            }

            const purchaseDebitNotes = await models.Documents.findAll({
                where: {
                    companyId: Number(companyId),
                    documentType: 'Purchase Debit Note',
                    invoiceNumber: {
                        [Op.in]: documentNumbers
                    }
                },
                raw: true
            });
            const debitToInvoiceMap = purchaseDebitNotes.reduce((acc, curr) => {
                acc[curr.documentNumber] = curr.invoiceNumber;
                if (debitNoteNumber[curr.invoiceNumber]) debitNoteNumber[curr.invoiceNumber].push(curr.documentNumber);
                else debitNoteNumber[curr.invoiceNumber] = [curr.documentNumber];
                return acc;
            }, {});
            const purchaseDebitNoteItems = await models.DocumentItems.findAll({
                where: {
                    companyId: Number(companyId),
                    documentNumber: {
                        [Op.in]: purchaseDebitNotes.map(doc => doc.documentNumber)
                    }
                },
                raw: true
            });
            for (const element of purchaseDebitNoteItems) {
                debitNoteMap[debitToInvoiceMap[element.documentNumber]] = (debitNoteMap[debitToInvoiceMap[element.documentNumber]] || 0) + Number(element.totalAfterTax);
            }
            salesItemsMap = purchaseOrdersItems?.reduce((acc, curr) => {
                if (!acc[curr.documentNumber]) acc[curr.documentNumber] = {};
                acc[curr.documentNumber][curr.itemId] = curr.quantity;
                return acc;
            }, {});
        }

        const formattedResult = (documents?.rows || documents)?.map(document => {
            let itemToSend = uniqueItems.filter(item => item.documentNumber === document.documentNumber);
            if (documentType === documentTypes.invoice) itemToSend = itemToSend?.map(item => {
                const salesItemsCount = salesItemsMap?.[document?.orderConfirmationNumber]?.[item.itemId];
                const existingQuantity = pendingItemsMap?.[document?.orderConfirmationNumber]?.[item.itemId] || 0 + item?.quantity;
                if (!pendingItemsMap?.[document?.orderConfirmationNumber]) {
                    pendingItemsMap[document?.orderConfirmationNumber] = {};
                }
                pendingItemsMap[document?.orderConfirmationNumber][item.itemId] = (pendingItemsMap[document?.orderConfirmationNumber][item.itemId] || 0) + item.quantity;
                return ({ ...item, salesItemsCount, pendingQuantity: Math.max(salesItemsCount - existingQuantity, 0) });
            })
            if (documentType === documentTypes.creditNote || documentType === documentTypes.debitNote ||
                documentType === documentTypes.purchaseCreditNote || documentType === documentTypes.purchaseDebitNote
            ) itemToSend = itemToSend?.map(item => {
                const invoiceItemsCount = salesItemsMap?.[document?.invoiceNumber]?.[item.itemId]?.quantity;
                const invoicePrice = salesItemsMap?.[document?.invoiceNumber]?.[item.itemId]?.price;
                return ({ ...item, invoiceItemsCount, invoicePrice });
            })
            if (documentType === documentTypes.deliveryChallan || documentType === documentTypes.proformaInvoice) itemToSend = itemToSend?.map(item => {
                const salesItemsCount = salesItemsMap?.[document?.orderConfirmationNumber]?.[item.itemId];
                return ({ ...item, salesItemsCount });
            })

            if (documentType === documentTypes.salesReturn) itemToSend = itemToSend?.map(item => {
                const invoiceItemsCount = salesItemsMap?.[document?.invoiceNumber]?.[item.itemId];
                const challanItemsCount = deliveryChallanItemsMap?.[document?.challan_number]?.[item.itemId];
                return ({ ...item, invoiceItemsCount, challanItemsCount });
            });
            if (documentType === documentTypes.purchaseRequest) itemToSend = itemToSend?.map(item => {
                const arr = [];
                for (const element of prToPoMap?.[document.documentNumber] || []) {
                    if (element) {
                        if (salesItemsMap?.[element]?.[item.itemId]) {
                            arr.push(element);
                        }
                    }
                }
                return ({ ...item, poList: arr });
            });
            if (documentType === documentTypes.purchaseOrder) itemToSend = itemToSend?.map(item => {
                const grnItemsCount = salesItemsMap?.[document?.documentNumber]?.[item.itemId] || 0;
                const purchaseInvoiceItemsCount = purchaseInvoiceQuantityMap?.[document?.documentNumber]?.[item.itemId] || 0;
                const accepted = qualityReportAcceptQuantityMap?.[document?.documentNumber]?.[item.itemId]?.accepted || 0;
                const rejected = qualityReportAcceptQuantityMap?.[document?.documentNumber]?.[item.itemId]?.rejected || 0;
                return ({ ...item, grnItemsCount, accepted, rejected, purchaseInvoiceItemsCount });
            });
            if (documentType === documentTypes.purchaseInvoice) itemToSend = itemToSend?.map(item => {
                const purchaseOrderItemsCount = salesItemsMap?.[document?.purchaseOrderNumber]?.[item.itemId];
                const existingQuantity = pendingItemsMap?.[document?.purchaseOrderNumber]?.[item.itemId] || 0 + item?.quantity;
                if (!pendingItemsMap?.[document?.purchaseOrderNumber]) {
                    pendingItemsMap[document?.purchaseOrderNumber] = {};
                }
                pendingItemsMap[document?.purchaseOrderNumber][item.itemId] = (pendingItemsMap[document?.purchaseOrderNumber][item.itemId] || 0) + item.quantity;
                return ({ ...item, purchaseOrderItemsCount, pendingQuantity: Math.max(purchaseOrderItemsCount - existingQuantity, 0) });
            })
            return ({
                ...{
                    ...document.toJSON(),
                    creditNoteTotal: creditNoteMap?.[document.documentNumber] || 0,
                    debitNoteTotal: debitNoteMap?.[document.documentNumber] || 0,
                    creditNoteNumber: creditNoteNumber?.[document.documentNumber],
                    debitNoteNumber: debitNoteNumber?.[document.documentNumber]
                },
                items: itemToSend,
                additionalCharges: additionalCharges.filter(charge => charge.documentNumber === document.documentNumber),
                bankDetails: bankDetails.find(bank => bank.documentNumber === document.documentNumber) || {},
                termsCondition: termsConditions.find(tc => tc.documentNumber === document.documentNumber) || {},
                attachments: attachments.filter(att => att.documentNumber === document.documentNumber),
                documentComments: documentComments.filter(comment => comment.documentId === document.id),
            })
        });
        res.status(200).json({
            total: documents.count,
            data: formattedResult,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Something went wrong' });
    }
}

module.exports = {
    getReports
}