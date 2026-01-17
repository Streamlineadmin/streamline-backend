const { isValidJSON, istToUtc, getAllDatesInRange, formatToIstDate, getIndianTime } = require('../helpers/add-level');
const { documentTypes } = require('../helpers/document-type');
const models = require('../models');
const { Op } = require('sequelize');

async function getReports(req, res) {
    try {
        const { companyId, documentType = '', search = '', dateRange } = req.body;
        let startDate = null, endDate = null;

        if (dateRange?.length === 2) {
            const IST_OFFSET = 5.5 * 60 * 60 * 1000;
            const startIst = new Date(new Date(dateRange[0]).getTime());
            const endIst = new Date(new Date(dateRange[1]).getTime());
            startIst.setHours(0, 0, 0, 0);
            endIst.setHours(23, 59, 59, 999);
            startDate = new Date(startIst.getTime() - IST_OFFSET);
            endDate = new Date(endIst.getTime());
        }
        if (documentType === "productionReport") {
            const { toStore, dateRange, itemType, quickRange } = req.body;
            let startDate = null, endDate = null;

            if (dateRange?.length === 2) {
                const IST_OFFSET = 5.5 * 60 * 60 * 1000;
                const startIst = new Date(new Date(dateRange[0]).getTime());
                const endIst = new Date(new Date(dateRange[1]).getTime());
                startIst.setHours(0, 0, 0, 0);
                endIst.setHours(23, 59, 59, 999);
                startDate = new Date(startIst.getTime() - IST_OFFSET);
                endDate = new Date(endIst.getTime());
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

            const alternateUnits = await models.AlternateUnits.findAll({
                where: { itemId: itemIds },
                attributes: ['itemId', 'alternateUnits', 'conversionfactor',],
                raw: true,
            });

            const alternateUnitMap = {};
            for (const unit of alternateUnits) {
                if (!alternateUnitMap[unit.itemId]) {
                    alternateUnitMap[unit.itemId] = [];
                }
                alternateUnitMap[unit.itemId].push({ ...unit, alternateUnits: uomMap[unit.alternateUnits] });
            }

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
                    documentNumber: itemId,
                    alternateUnits: alternateUnitMap[itemId] || [],
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
                    category: categorysMap[itemsMap[element.itemId]?.category],
                    subCategory: categorysMap[itemsMap[element.itemId]?.subCategory],
                    microCategory: categorysMap[itemsMap[element.itemId]?.microCategory],
                    producedQuantity: element?.producedQuantity || 0,
                    pendingQuantity: Math.max(element.quantity - (element.producedQuantity || 0), 0),
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
                    bomNavigationId: bomMap[productionMap[element.productionId]?.bomId]?.id,
                    productionNavigationId: productionMap[element.productionId]?.id
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
                    bomNavigationId: bomMap[productionMap[element.productionId]?.bomId]?.id,
                    productionNavigationId: productionMap[element.productionId]?.id,
                    category: categorysMap[itemsMap[finishedGoodsMap[element.productionId]?.itemId]?.category],
                    subCategory: categorysMap[itemsMap[finishedGoodsMap[element.productionId]?.itemId]?.subCategory],
                    microCategory: categorysMap[itemsMap[element.itemId]?.microCategory],
                    documentNumber: element.id,
                    salesOrderNumber: productionMap[element.productionId]?.documentNumber,
                    pendingQuantity: Math.max(finishedGoodsMap[element.productionId]?.quantity - (element.processCompleteOn || 0), 0)
                });
            }
            return res.status(200).json({ data, total: data.length });
        }
        if (documentType === "Inventory Approval report") {
            const { fromStore, toStore, dateRange, status } = req.body;
            let startDate = null, endDate = null;

            if (dateRange?.length === 2) {
                const IST_OFFSET = 5.5 * 60 * 60 * 1000;
                const startIst = new Date(new Date(dateRange[0]).getTime());
                const endIst = new Date(new Date(dateRange[1]).getTime());
                startIst.setHours(0, 0, 0, 0);
                endIst.setHours(23, 59, 59, 999);
                startDate = new Date(startIst.getTime() - IST_OFFSET);
                endDate = new Date(endIst.getTime());
            }
            const stockTransfers = await models.StockTransfer.findAll({
                where: {
                    companyId: Number(companyId),
                    ...(fromStore?.length ? {
                        fromStoreId: {
                            [Op.in]: fromStore
                        }
                    } : {}),
                    ...(toStore?.length ? {
                        toStoreId: {
                            [Op.in]: toStore
                        }
                    } : {}),
                },
                raw: true,
                attributes: ['approvalId', 'quantity', 'quantityForApproval', 'id',
                    'itemId', 'isRejected', 'fromStoreId', 'toStoreId'],
                order: [['createdAt', 'DESC']],
            });
            const uoms = await models.UOM.findAll({
                where: {
                    [Op.or]: [
                        { companyId: req.body.companyId, status: 1 },
                        { companyId: null, status: 0 }
                    ]
                },
                raw: true,
                attributes: ['id', 'name']
            });
            const uomMap = uoms.reduce((acc, curr) => {
                acc[curr.id] = curr.name;
                return acc;
            }, {});
            const categories = await models.Categories.findAll({
                where: {
                    companyId: Number(companyId),
                },
                raw: true,
                attributes: ['id', 'name']
            });
            const categoryMap = categories.reduce((acc, curr) => {
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
                acc[curr.id] = curr;
                return acc;
            }, {});
            const startUtc = startDate
            const endUtc = endDate
            const approvals = await models.InventoryApproval.findAll({
                where: {
                    id: {
                        [Op.in]: stockTransfers.map(data => data.approvalId),
                    },
                    ...(status?.length ? {
                        approvalStatus: {
                            [Op.in]: status
                        }
                    } : {}),
                    ...(dateRange?.length == 2 ? {
                        createdAt: { [Op.between]: [startUtc, endUtc] },
                    } : {})
                },
                raw: true
            });
            const users = await models.Users.findAll({
                where: {
                    companyId: Number(companyId)
                },
                raw: true,
                attributes: ['id', 'name']
            });
            const userMap = users.reduce((acc, curr) => {
                acc[curr.id] = curr.name;
                return acc;
            }, {});

            const stores = await models.Store.findAll({
                where: {
                    companyId: Number(companyId)
                },
                raw: true,
                attributes: ['id', 'name']
            });
            const storeMap = stores.reduce((acc, curr) => {
                acc[curr.id] = curr.name;
                return acc;
            }, {})
            const validDocumentType = ['Delivery Challan', 'Invoice', 'Sales Return',
                'Purchase Return', 'Quality Report', 'Goods Received Note', 'Service Challan',
                'Service Grn', 'Service Qr', 'Service Confirmation Challan', 'Service Confirmation Grn',
                'Service Service Confirmation Qr'
            ];
            const approvalMap = {};
            approvals.forEach(data => {
                const documentNumber = validDocumentType.includes(data?.documentType) ? data?.documentNumber : '';

                approvalMap[data.id] = {
                    data: {
                        ...data,
                        number: documentNumber,
                        requestedBy: userMap?.[data?.requestedBy],
                        approvedBy: userMap?.[data?.approvedBy] || '',
                        requestedDate: formatToIstDate(data?.createdAt),
                        requestedTime: getIndianTime(data?.createdAt),
                        approvedDate: data?.approvalDate ? formatToIstDate(data?.approvalDate) : '',
                        approvedTime: data?.approvalDate ? getIndianTime(data?.approvalDate) : '',
                        inStock: {},
                    },
                    reject: {}
                };
            });

            for (const element of stockTransfers) {
                if (!approvalMap[element.approvalId]) continue;
                const key = element?.isRejected ? 'reject' : 'inStock';

                // If approvalId missing → create a base object
                if (!approvalMap[element.approvalId]) {
                    approvalMap[element.approvalId] = { inStock: {}, reject: {} };
                }

                // If key missing → create object
                if (!approvalMap[element.approvalId][key]) {
                    approvalMap[element.approvalId][key] = {};
                }

                // If item missing → create entry
                if (!approvalMap[element.approvalId][key][element.itemId]) {
                    approvalMap[element.approvalId][key][element.itemId] = {
                        ...element,
                        items: itemsMap?.[element?.itemId]?.itemId,
                        itemName: itemsMap?.[element?.itemId]?.itemName,
                        category: categoryMap?.[itemsMap?.[element?.itemId]?.category],
                        subCategory: categoryMap?.[itemsMap?.[element?.itemId]?.subCategory],
                        microCategory: categoryMap?.[itemsMap?.[element?.itemId]?.microCategory],
                        uom: uomMap?.[itemsMap?.[element?.itemId]?.metricsUnit],
                        fromStore: storeMap?.[element?.fromStoreId],
                        toStore: storeMap?.[element?.toStoreId]
                    };
                } else {
                    approvalMap[element.approvalId][key][element.itemId].quantity += element.quantity;
                }
            }


            const formattedResult = [];
            for (const approvalId in approvalMap) {
                const approval = approvalMap[approvalId];

                // inStock items
                for (const itemId in approval.inStock) {
                    const item = approval.inStock[itemId];

                    formattedResult.push({
                        ...approval.data,
                        ...item,
                        approvalId: approval?.data?.approvalId,
                        documentNumber: item.id
                    });
                }

                // rejected items
                for (const itemId in approval.reject) {
                    const item = approval.reject[itemId];

                    formattedResult.push({
                        ...approval.data,
                        ...item,
                        approvalId: approval?.data?.approvalId,
                        documentNumber: item.id
                    });
                }
            }

            return res.status(200).json({
                data: formattedResult,
                total: formattedResult?.length
            });
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

            if (dateRange?.length === 2) {
                const IST_OFFSET = 5.5 * 60 * 60 * 1000;
                const startIst = new Date(new Date(dateRange[0]).getTime());
                const endIst = new Date(new Date(dateRange[1]).getTime());
                startIst.setHours(0, 0, 0, 0);
                endIst.setHours(23, 59, 59, 999);
                startDate = new Date(startIst.getTime() - IST_OFFSET);
                endDate = new Date(endIst.getTime());
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
                const IST_OFFSET = 5.5 * 60 * 60 * 1000;
                const startIst = new Date(new Date(dateRange[0]).getTime());
                const endIst = new Date(new Date(dateRange[1]).getTime());
                startIst.setHours(0, 0, 0, 0);
                endIst.setHours(23, 59, 59, 999);
                startDate = new Date(startIst.getTime() - IST_OFFSET);
                endDate = new Date(endIst.getTime());
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
        if (documentType === 'Opening & Closing Stock report') {
            const { store, dateRange } = req.body;
            let startDate = null, endDate = null;

            if (dateRange?.length === 2) {
                const IST_OFFSET = 5.5 * 60 * 60 * 1000;
                const startIst = new Date(new Date(dateRange[0]).getTime());
                const endIst = new Date(new Date(dateRange[1]).getTime());
                startIst.setHours(0, 0, 0, 0);
                endIst.setHours(23, 59, 59, 999);
                startDate = new Date(startIst.getTime() - IST_OFFSET);
                endDate = new Date(endIst.getTime());
            }
            const compareDate = startDate
                ? startDate
                : new Date(new Date().setHours(0, 0, 0, 0));
            const items = await models.Items.findAll({
                where: {
                    companyId: Number(companyId)
                },
                order: [['createdAt', 'DESC']],
                attributes: ['id', 'itemId', 'itemName', 'category', 'subCategory', 'microCategory', 'metricsUnit'],
                raw: true
            });
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
            const storeItems = await models.StoreItems.findAll({
                where: {
                    quantity: {
                        [Op.gt]: 0
                    },
                    itemId: {
                        [Op.in]: items.map(item => item.id),
                    },
                    isRejected: false
                },
                order: [['createdAt', 'ASC']],
                attributes: ['itemId', 'price'],
                raw: true
            });
            const fifoPrice = {};
            storeItems.forEach((item) => {
                if (!fifoPrice[item.itemId]) {
                    fifoPrice[item.itemId] = item?.price || 0
                }
            });
            const stockTransfers = await models.StockTransfer.findAll({
                where: {
                    companyId: Number(companyId),
                    quantity: {
                        [Op.ne]: 0
                    },
                    ...(store?.length > 0
                        ? {
                            [Op.or]: [
                                { fromStoreId: { [Op.in]: store } },
                                { toStoreId: { [Op.in]: store } }
                            ]
                        }
                        : {}),
                    ...(endDate ? { updatedAt: { [Op.lt]: endDate } } : {}),
                    isRejected: false
                },
                order: [['updatedAt', 'ASC']],
                raw: true
            });

            const stocksMap = {};
            for (const element of stockTransfers) {
                if (element.fromStoreId && element.toStoreId && (!store || store?.length == 0)) continue;
                if (!stocksMap[element.itemId]) stocksMap[element.itemId] = {};
                if (new Date(element.updatedAt) < compareDate) {
                    stocksMap[element.itemId].openingQty = (stocksMap?.[element.itemId].openingQty || 0) + element.quantity;
                    stocksMap[element.itemId].openingStockValue = (stocksMap?.[element.itemId].openingStockValue || 0) + (element.quantity * (element.price || 0));
                }
                else {
                    if (element?.quantity > 0) {
                        if (element.documentNumber || element.productionId || (element.fromStoreId && element.toStoreId)) {
                            stocksMap[element.itemId].inwardQty = (stocksMap?.[element.itemId].inwardQty || 0) + element.quantity;
                            stocksMap[element.itemId].inwardStockValue = (stocksMap?.[element.itemId].inwardStockValue || 0) + (element.quantity * (element.price || 0));
                        }
                        else {
                            stocksMap[element.itemId].adjustmentQty = (stocksMap?.[element.itemId].adjustmentQty || 0) + element.quantity;
                        }
                    } else {
                        if (element.documentNumber || element.productionId || (element.fromStoreId && element.toStoreId)) {
                            stocksMap[element.itemId].outwardQty = (stocksMap?.[element.itemId].outwardQty || 0) + element.quantity;
                            stocksMap[element.itemId].outwardStockValue = (stocksMap?.[element.itemId].outwardStockValue || 0) + (element.quantity * (element.price || 0));
                        }
                        else {
                            stocksMap[element.itemId].adjustmentQty = (stocksMap?.[element.itemId].adjustmentQty || 0) + element.quantity;
                        }
                    }
                }
            }
            for (const element of items) {
                element.documentNumber = element.id;
                element.category = categoryMap?.[element.category];
                element.subCategory = categoryMap?.[element.subCategory];
                element.microCategory = categoryMap?.[element.microCategory];
                element.metricsUnit = uomMap?.[element?.metricsUnit];
                element.openingQty = Math.abs(stocksMap[element.id]?.openingQty || 0)?.toFixed(2) || 0;
                element.inwardQty = Math.abs(stocksMap[element.id]?.inwardQty || 0)?.toFixed(2) || 0;
                element.outwardQty = Math.abs(stocksMap[element.id]?.outwardQty || 0)?.toFixed(2) || 0;
                element.adjustmentQty = stocksMap[element.id]?.adjustmentQty?.toFixed(2) || 0;
                element.closingQty = (Number(Math.abs(stocksMap[element.id]?.openingQty || 0)?.toFixed(2) || 0) +
                    Number(Math.abs(stocksMap[element.id]?.inwardQty) || 0) -
                    Number(Math.abs(stocksMap[element.id]?.outwardQty) || 0) +
                    Number(stocksMap[element.id]?.adjustmentQty || 0))?.toFixed(2);
                element.openingStockValue = Math.abs(stocksMap[element.id]?.openingStockValue || 0)?.toFixed(2) || 0;
                element.inwardStockValue = stocksMap[element.id]?.inwardStockValue?.toFixed(2) || 0;
                element.outwardStockValue = Math.abs(stocksMap[element.id]?.outwardStockValue || 0)?.toFixed(2) || 0;
                element.fifoPrice = fifoPrice[element.id]?.toFixed(2) || 0;
            }

            return res.status(200).json({ data: items, total: items?.length });
        }
        if (documentType === 'Daily Stock report') {
            const { store, dateRange } = req.body;
            const IST = 'Asia/Kolkata';

            const toIST_YMD = (date) =>
                new Intl.DateTimeFormat('en-CA', {
                    timeZone: IST,
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                }).format(new Date(date));

            const toIST_DMY = (date) => {
                const d = new Date(
                    new Date(date).toLocaleString('en-US', { timeZone: IST })
                );

                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const year = d.getFullYear();

                return `${day}-${month}-${year}`;
            };


            const startOfISTDay = (date) => {
                const d = new Date(date);
                const ist = new Date(d.toLocaleString('en-US', { timeZone: IST }));
                ist.setHours(0, 0, 0, 0);
                return ist;
            };

            const endOfISTDay = (date) => {
                const d = startOfISTDay(date);
                d.setHours(23, 59, 59, 999);
                return d;
            };

            const getAllDatesInRange = (start, end) => {
                const dates = [];
                const current = startOfISTDay(start);

                while (current <= end) {
                    dates.push(toIST_YMD(current)); // YYYY-MM-DD
                    current.setDate(current.getDate() + 1);
                }
                return dates;
            };

            let startDate, endDate;

            if (dateRange?.length === 2) {
                startDate = startOfISTDay(dateRange[0]);
                endDate = endOfISTDay(dateRange[1]);
            } else {
                endDate = endOfISTDay(new Date());
                startDate = startOfISTDay(new Date());
                startDate.setMonth(startDate.getMonth() - 1);
            }

            const dateList = getAllDatesInRange(startDate, endDate);
            const startDateKey = toIST_YMD(startDate);

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

            const stockTransfers = await models.StockTransfer.findAll({
                where: {
                    companyId: Number(companyId),
                    ...(store?.length > 0 && {
                        [Op.or]: [
                            { fromStoreId: { [Op.in]: store } },
                            { toStoreId: { [Op.in]: store } }
                        ]
                    }),
                    quantity: { [Op.ne]: 0 },
                    updatedAt: { [Op.lte]: endDate },
                    isRejected: false
                },
                order: [['updatedAt', 'ASC']],
                attributes: ['itemId', 'quantity', 'updatedAt', "price", 'toStoreId', 'fromStoreId'],
                raw: true
            });

            const items = await models.Items.findAll({
                where: {
                    companyId: Number(companyId)
                },
                raw: true
            });

            const itemIds = items.map(item => item.id);

            const alternateUnits = await models.AlternateUnits.findAll({
                where: { itemId: itemIds },
                attributes: ['itemId', 'alternateUnits', 'conversionfactor',],
                raw: true,
            });

            const alternateUnitMap = {};
            for (const unit of alternateUnits) {
                if (!alternateUnitMap[unit.itemId]) {
                    alternateUnitMap[unit.itemId] = [];
                }
                alternateUnitMap[unit.itemId].push({ ...unit, alternateUnits: uomMap[unit.alternateUnits] });
            }

            const transferByDate = {};

            for (const trx of stockTransfers) {
                if (trx.toStoreId && trx.fromStoreId && (!store || store?.length === 0)) continue;
                const dateKey = toIST_YMD(trx.updatedAt);
                if (!transferByDate[dateKey]) {
                    transferByDate[dateKey] = [];
                }
                transferByDate[dateKey].push(trx);
            }

            const runningBalance = {};
            const resultMap = {};

            items.forEach(item => {
                runningBalance[item.id] = 0;
                resultMap[item.id] = {
                    documentNumber: item.id,
                    itemId: item.itemId,
                    category: categoryMap?.[item.category],
                    subCategory: categoryMap?.[item.subCategory],
                    microCategory: categoryMap?.[item.microCategory],
                    itemName: item.itemName,
                    price: item.price,
                    metricsUnit: uomMap?.[item.metricsUnit],
                    stockValue: 0,
                    alternateUnits: alternateUnitMap[item.id] || [],
                    customFields: isValidJSON(item.customFields) || {}
                };
            });

            for (const trx of stockTransfers) {
                if (trx.toStoreId && trx.fromStoreId && (!store || store?.length === 0)) continue;
                if (toIST_YMD(trx.updatedAt) < startDateKey) {
                    runningBalance[trx.itemId] += trx.quantity;
                }
            }

            for (const date of dateList) {
                const todaysTransfers = transferByDate[date] || [];

                for (const trx of todaysTransfers) {
                    runningBalance[trx.itemId] += trx.quantity;
                    if (resultMap[trx.itemId]) resultMap[trx.itemId].stockValue += trx.quantity * (trx.price || 0);
                }

                for (const item of items) {
                    const dmyKey = toIST_DMY(date);
                    resultMap[item.id][dmyKey] =
                        Number(runningBalance[item.id]).toFixed(2);
                }
            }

            return res.status(200).json({
                data: Object.values(resultMap),
                total: items.length
            });
        }

        if (documentType === 'Stock Update Ledger') {
            const { dateRange } = req.body;
            let startDate, endDate;

            const startOfISTDay = (date) => {
                const d = new Date(date);
                const ist = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
                ist.setHours(0, 0, 0, 0);
                return ist;
            };

            const endOfISTDay = (date) => {
                const d = startOfISTDay(date);
                d.setHours(23, 59, 59, 999);
                return d;
            };

            if (dateRange?.length === 2) {
                startDate = startOfISTDay(dateRange[0]);
                endDate = endOfISTDay(dateRange[1]);
            } else {
                endDate = endOfISTDay(new Date());
                startDate = startOfISTDay(new Date());
                startDate.setMonth(startDate.getMonth() - 1);
            }

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

            const stockTransfers = await models.StockTransfer.findAll({
                where: {
                    companyId: Number(companyId),
                    updatedAt: { [Op.between]: [startDate, endDate] },
                    isRejected: false,
                    quantity: { [Op.ne]: 0 },
                    [Op.or]: [
                        { toStoreId: null },
                        { fromStoreId: null }
                    ]
                },
                raw: true
            });

            const stores = await models.Store.findAll({
                where: {
                    companyId: Number(companyId)
                }
            });
            const storeMap = stores.reduce((acc, curr) => {
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
                acc[curr.id] = curr;
                return acc;
            }, {});

            for (const element of stockTransfers) {
                element.category = categoryMap?.[itemsMap?.[element?.itemId]?.category];
                element.subCategory = categoryMap?.[itemsMap?.[element?.itemId]?.subCategory];
                element.microCategory = categoryMap?.[itemsMap?.[element?.itemId]?.microCategory];
                element.itemName = itemsMap?.[element?.itemId]?.itemName;
                element.metricsUnit = uomMap?.[itemsMap?.[element?.itemId]?.metricsUnit];
                element.store = storeMap?.[element?.fromStoreId] || '';
                element.itemId = itemsMap?.[element?.itemId]?.itemId || '';
                element.documentNumber = element.id;
                element.type = element?.quantity > 0 ? 'Add' : 'Reduce';
                element.quantity = Math.abs(element?.quantity);
            }

            return res.status(200).json({
                data: stockTransfers,
                total: stockTransfers.length
            });
        }

        const documents = await models.Documents.findAndCountAll({
            where: {
                companyId,
                ...(documentType && {
                    documentType: {
                        [Op.in]: [documentType]
                    }
                }),
                ...((startDate && endDate) ? {
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                } : {}),
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
            order: [['createdAt', 'ASC']],
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
            item.customFields = isValidJSON(item.customFields);
            if (!uniqueItemsMap.has(key)) {
                uniqueItemsMap.set(key, item);
            }
        }
        let uniqueItems = Array.from(uniqueItemsMap.values());
        let salesItemsMap = {}, salesReturnItemsMap = {}, deliveryChallanItemsMap = {}, prToPoMap = {}, creditNoteMap = {}, debitNoteMap = {}, creditNoteNumber = {}, debitNoteNumber = {};
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

            if (documentTypes.invoice == documentType) {
                const salesReturn = await models.Documents.findAll({
                    where: {
                        companyId: Number(companyId),
                        invoiceNumber: {
                            [Op.in]: documents?.rows?.filter(doc => doc?.documentNumber)?.map(doc => doc.documentNumber)
                        },
                    },
                    raw: true
                });
                const docmap = salesReturn?.reduce((acc, curr) => {
                    acc[curr.documentNumber] = curr.invoiceNumber;
                    return acc;
                }, {})
                const salesReturnItems = await models.DocumentItems.findAll({
                    where: {
                        companyId: Number(companyId),
                        documentNumber: {
                            [Op.in]: salesReturn?.map(doc => doc.documentNumber)
                        }
                    },
                    raw: true
                });
                salesReturnItemsMap = salesReturnItems?.reduce((acc, curr) => {
                    if (!acc[docmap[curr.documentNumber]]) acc[docmap[curr.documentNumber]] = {};
                    acc[docmap[curr.documentNumber]][curr.itemId] = curr.quantity;
                    return acc;
                }, {});
                console.log('iammap', salesReturnItemsMap)
            }
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
                salesItemsMap[purchaseOrderToGrnMap[element.documentNumber]][element.itemId] = (salesItemsMap[purchaseOrderToGrnMap[element.documentNumber]][element.itemId] || 0) + element.receivedToday;
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

        if (documentType === documentTypes.purchaseReturn || documentType === documentTypes.goodsReceive || documentType === documentTypes.qualityReport) {
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
                const salesReturnCount = salesReturnItemsMap?.[document?.documentNumber]?.[item.itemId];
                const existingQuantity = pendingItemsMap?.[document?.orderConfirmationNumber]?.[item.itemId] || 0 + item?.quantity;
                if (!pendingItemsMap?.[document?.orderConfirmationNumber]) {
                    pendingItemsMap[document?.orderConfirmationNumber] = {};
                }
                pendingItemsMap[document?.orderConfirmationNumber][item.itemId] = (pendingItemsMap[document?.orderConfirmationNumber][item.itemId] || 0) + item.quantity;
                return ({ ...item, salesItemsCount, salesReturnCount, pendingQuantity: Math.max(salesItemsCount - existingQuantity, 0) });
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
            if (documentType === documentTypes.purchaseReturn || documentType === documentTypes.goodsReceive || documentType === documentTypes.qualityReport) itemToSend = itemToSend?.map(item => {
                const poQuantity = salesItemsMap?.[document?.purchaseOrderNumber]?.[item.itemId];
                return ({ ...item, poQuantity });
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