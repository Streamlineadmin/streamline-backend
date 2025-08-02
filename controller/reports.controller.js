const { documentTypes } = require('../helpers/document-type');
const models = require('../models');
const { Op } = require('sequelize');

async function getReports(req, res) {
    try {
        const { companyId, documentType = '', search = '' } = req.body;
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
        let salesItemsMap = {}, deliveryChallanItemsMap = {}, prToPoMap = {};
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
            return ({
                ...document.toJSON(),
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