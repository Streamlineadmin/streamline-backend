const { Op, where } = require('sequelize');
const models = require('../models');
const { documentTypes, purchaseDocuments, salesDocuments, serviceDocuments } = require('../helpers/document-type');
const { generateTransferNumber } = require('../helpers/transfer-number');

async function createDocument(req, res) {
  try {
    const {
      documentType = null,
      documentNumber = null,
      documentTo = null,
      buyerName = null,
      buyerBillingAddress = null,
      advancePayment = null,
      buyerDeliveryAddress = null,
      buyerContactNumber = null,
      buyerEmail = null,
      supplierName = null,
      supplierBillingAddress = null,
      supplierDeliverAddress = null,
      supplierContactNo = null,
      supplierEmail = null,
      documentDate = null,
      ammendment = null,
      deliveryDate = null,
      ServiceConfirmationNumber = null,
      ServiceConfirmationDate = null,
      paymentTerm = null,
      store = null,
      rejectedStore = null,
      enquiryNumber = null,
      enquiryDate = null,
      logisticDetailsId = null,
      additionalDetails = null,
      signature = null,
      companyId = null,
      createdBy = null,
      status = null,
      ip_address = null,
      paymentDate = null,
      POCName = null,
      POCNumber = null,
      POCDate = null,
      OCNumber = null,
      OCDate = null,
      transporterName = null,
      TGNumber = null,
      TDNumber = null,
      TDDate = null,
      VehicleNumber = null,
      replyDate = null,
      Attention = null,
      invoiceNumber = null,
      invoiceDate = null,
      billDate = null,
      returnRecieveDate = null,
      creditNoteNumber = null,
      creditNotedate = null,
      items = [],
      additionalCharges = [],
      bankDetails = {},
      termsCondition = null,
      quotationNumber = null,
      quotationDate = null,
      orderConfirmationNumber = null,
      orderConfirmationDate = null,
      purchaseOrderNumber = null,
      purchaseOrderDate = null,
      grn_number = null,
      grn_Date = null,
      indent_number = null,
      indent_date = null,
      supplier_invoice_number = null,
      supplier_invoice_date = null,
      challan_number = null,
      challan_date = null,
      debit_note_number = null,
      performaInvoiceNumber = null,
      performaInvoiceDate = null,
      salesReturnNumber = null,
      salesReturnDate = null,
      debit_note_date = null,
      pay_to_transporter = null,
      inspection_date = null,
      attachments = [],
      documentComments = null,
      tcsData = [],
      BuyerPANNumber = null,
      buyerSupplierKYCDetails = null,
      isRounded = null,
      reduceStockOnDC = '',
      reduceStockOnIV = '',
      GSTValue = null,
      buyerGSTNumber = null,
      is_refered = null,
      addStockOn = '',
      isDraft = false,
      purpose = '',
      requiredDate = null,
      requestedBy = '',
      department = '',
      showUnits = null
    } = req.body;

    if (!isDraft) {
      const doc = await models.Documents.findOne({
        where: {
          documentNumber,
          companyId,
        }
      });
      if (doc) {
        return res.status(409).json({
          message: 'Document Already Exist with this Document Number.'
        })
      }
    }
    let document = null;
    if (!isDraft) document = await models.Documents.create({
      documentType,
      documentNumber,
      buyerName,
      documentTo,
      buyerBillingAddress,
      advancePayment,
      GSTValue,
      buyerGSTNumber,
      buyerSupplierKYCDetails,
      is_refered,
      buyerDeliveryAddress,
      buyerContactNumber,
      buyerEmail,
      supplierName,
      supplierBillingAddress,
      supplierDeliverAddress,
      supplierContactNo,
      supplierEmail,
      documentDate,
      ammendment,
      deliveryDate,
      ServiceConfirmationNumber,
      ServiceConfirmationDate,
      paymentTerm,
      store,
      rejectedStore,
      enquiryNumber,
      enquiryDate,
      logisticDetailsId,
      additionalDetails,
      signature,
      companyId,
      createdBy,
      status,
      ip_address,
      paymentDate,
      POCName,
      POCNumber,
      POCDate,
      OCNumber,
      OCDate,
      transporterName,
      TGNumber,
      TDNumber,
      TDDate,
      VehicleNumber,
      replyDate,
      Attention,
      invoiceNumber,
      invoiceDate,
      billDate,
      returnRecieveDate,
      creditNoteNumber,
      creditNotedate,
      quotationNumber,
      quotationDate,
      orderConfirmationNumber,
      orderConfirmationDate,
      purchaseOrderNumber,
      purchaseOrderDate,
      grn_number,
      grn_Date,
      indent_number,
      indent_date,
      supplier_invoice_number,
      supplier_invoice_date,
      challan_number,
      challan_date,
      debit_note_number,
      debit_note_date,
      performaInvoiceNumber,
      salesReturnNumber,
      salesReturnDate,
      performaInvoiceDate,
      pay_to_transporter,
      inspection_date,
      BuyerPANNumber,
      isRounded,
      tcsData,
      addStockOn,
      purpose,
      requiredDate,
      requestedBy,
      department,
      showUnits
    });

    else {
      document = await models.Documents.findOne({
        where: {
          companyId,
          documentNumber
        }
      });
    }

    if (isDraft) document.update({
      documentType,
      documentNumber,
      buyerName,
      documentTo,
      buyerBillingAddress,
      advancePayment,
      GSTValue,
      buyerGSTNumber,
      is_refered,
      buyerDeliveryAddress,
      buyerContactNumber,
      buyerEmail,
      supplierName,
      supplierBillingAddress,
      supplierDeliverAddress,
      supplierContactNo,
      supplierEmail,
      documentDate,
      ammendment,
      deliveryDate,
      ServiceConfirmationNumber,
      ServiceConfirmationDate,
      paymentTerm,
      store,
      rejectedStore,
      enquiryNumber,
      enquiryDate,
      logisticDetailsId,
      additionalDetails,
      signature,
      companyId,
      createdBy,
      status,
      ip_address,
      paymentDate,
      POCName,
      POCNumber,
      POCDate,
      OCNumber,
      OCDate,
      transporterName,
      TGNumber,
      TDNumber,
      TDDate,
      VehicleNumber,
      replyDate,
      Attention,
      invoiceNumber,
      invoiceDate,
      billDate,
      returnRecieveDate,
      creditNoteNumber,
      creditNotedate,
      quotationNumber,
      quotationDate,
      orderConfirmationNumber,
      orderConfirmationDate,
      purchaseOrderNumber,
      purchaseOrderDate,
      grn_number,
      grn_Date,
      indent_number,
      indent_date,
      supplier_invoice_number,
      supplier_invoice_date,
      challan_number,
      challan_date,
      debit_note_number,
      debit_note_date,
      performaInvoiceNumber,
      salesReturnNumber,
      salesReturnDate,
      performaInvoiceDate,
      pay_to_transporter,
      inspection_date,
      BuyerPANNumber,
      isRounded,
      tcsData,
      addStockOn,
      purpose,
      requiredDate,
      requestedBy,
      department,
      showUnits
    }, {
      where: {
        companyId,
        documentNumber
      }
    });

    if (status && documentType === documentTypes.purchaseOrder && indent_number) {
      const indent_numbers = indent_number.split(',');
      const itemsMap = items.reduce((item, current) => {
        item[current.itemId] = current.quantity;
        return item;
      }, {});
      for (const ind_number of indent_numbers) {
        const purchaseRequest = await models.Documents.findOne({
          where: {
            companyId,
            documentNumber: ind_number
          }
        });
        if (purchaseRequest) {
          const purchaseRequestItems = await models.DocumentItems.findAll({
            where: {
              companyId,
              documentNumber: ind_number
            }
          });
          const purchaseRequestItemsMap = {};
          const consumeItemsMap = {};

          for (const current of purchaseRequestItems) {
            let quantity = 0, remaining = 0;
            if (current.receivedToday) quantity += current.receivedToday;
            if (itemsMap[current.itemId]) {
              if ((quantity + itemsMap[current.itemId]) > current.quantity) {
                remaining = (quantity + itemsMap[current.itemId]) - current.quantity;
                quantity = current.quantity;
                current.receivedToday = quantity;
                consumeItemsMap[current?.itemId] = itemsMap[current.itemId] - remaining;
              }
              else {
                quantity += itemsMap[current.itemId];
                current.receivedToday = quantity;
              }
            }

            itemsMap[current.itemId] && await current.update({ receivedToday: quantity });
            itemsMap[current.itemId] = remaining;
            if (purchaseRequestItemsMap[current.itemId]) {
              purchaseRequestItemsMap[current.itemId] += current.quantity;
            } else {
              purchaseRequestItemsMap[current.itemId] = current.quantity;
            }
          }

          let status = purchaseRequest.status, isPartial = false;
          for (const current of purchaseRequestItems) {
            if (current?.quantity > current?.receivedToday) {
              isPartial = true;
              if (status == 1) {
                status = 14;
              }
              break;
            }
          }
          if (!isPartial) {
            if (status == 1 || status == 14) {
              status = 16;
            }
            else if (status == 15) status = 17;
          }
          await purchaseRequest.update({ status });
        }
      }
    }

    if (status && (documentType === documentTypes.salesQuotation && enquiryNumber)) {
      const existingDocument = await models.Documents.findOne({
        where: { documentNumber: enquiryNumber, companyId },
      });

      if (existingDocument) {
        await existingDocument.update({
          quotationNumber: documentNumber,
          is_refered: true,
          status: 8
        });
      }
    }

    if (status && documentType === documentTypes.orderConfirmation && quotationNumber) {
      const existingDocument = await models.Documents.findOne({
        where: { documentNumber: quotationNumber, companyId },
      });

      if (existingDocument) {
        await existingDocument.update({
          orderConfirmationNumber: documentNumber,
          is_refered: true,
          status: 9
        });
      }
    }

    // if (status && documentType === documentTypes.deliveryChallan && orderConfirmationNumber) {
    //   const existingDocument = await models.Documents.findOne({
    //     where: { documentNumber: orderConfirmationNumber, companyId },
    //   });

    //   if (existingDocument) {
    //     await existingDocument.update({
    //       challan_number: documentNumber,
    //       is_refered: true,
    //       status: 10,
    //     });
    //   }
    // }

    // if (status && documentType === documentTypes.proformaInvoice && orderConfirmationNumber) {
    //   const existingDocument = await models.Documents.findOne({
    //     where: { documentNumber: orderConfirmationNumber, companyId },
    //   });

    //   if (existingDocument) {
    //     await existingDocument.update({
    //       performaInvoiceNumber: documentNumber,
    //       is_refered: true,
    //       status: 11,
    //     });
    //   }
    // }

    // Invoice from Order Confirmation
    // if (status && documentType === documentTypes.invoice && orderConfirmationNumber) {
    //   const existingDocument = await models.Documents.findOne({
    //     where: { documentNumber: orderConfirmationNumber, companyId },
    //   });

    //   if (existingDocument) {
    //     await existingDocument.update({
    //       invoiceNumber: documentNumber,
    //       is_refered: true,
    //       status: 12,
    //     });
    //   }
    // }

    // Invoice from Proforma Invoice
    // if (status && documentType === documentTypes.invoice && performaInvoiceNumber) {
    //   const existingDocument = await models.Documents.findOne({
    //     where: { documentNumber: performaInvoiceNumber, companyId },
    //   });

    //   if (existingDocument) {
    //     await existingDocument.update({
    //       invoiceNumber: documentNumber,
    //       is_refered: true,
    //       status: 20
    //     });
    //   }
    // }

    // Invoice from Delivery Challan
    // if (
    //   status &&
    //   documentType === documentTypes.invoice &&
    //   challan_number
    // ) {
    //   const existingDocument = await models.Documents.findOne({
    //     where: { documentNumber: challan_number, companyId },
    //   });

    //   if (existingDocument) {
    //     await existingDocument.update({
    //       invoiceNumber: documentNumber,
    //       is_refered: true,
    //       status: 13,
    //     });
    //   }
    // }

    // Debit Note from Invoice
    // if (status && documentType === documentTypes.debitNote && invoiceNumber) {
    //   const existingDocument = await models.Documents.findOne({
    //     where: { documentNumber: invoiceNumber, companyId },
    //   });

    //   if (existingDocument) {
    //     await existingDocument.update({
    //       debit_note_number: documentNumber,
    //       is_refered: true,
    //       status: 14,
    //     });
    //   }
    // }

    // Credit Note from Invoice
    // if (status && documentType === documentTypes.creditNote && invoiceNumber) {
    //   const existingDocument = await models.Documents.findOne({
    //     where: { documentNumber: invoiceNumber, companyId },
    //   });

    //   if (existingDocument) {
    //     await existingDocument.update({
    //       creditNoteNumber: documentNumber,
    //       is_refered: true,
    //       status: 15,
    //     });
    //   }
    // }

    // Sales Return from Invoice
    // if (status && documentType === documentTypes.salesReturn && invoiceNumber) {
    //   const existingDocument = await models.Documents.findOne({
    //     where: { documentNumber: invoiceNumber, companyId },
    //   });

    //   if (existingDocument) {
    //     await existingDocument.update({
    //       salesReturnNumber: documentNumber,
    //       is_refered: true,
    //       status: 17,
    //     });
    //   }
    // }

    // Sales Return from Delivery Challan
    // if (
    //   status &&
    //   documentType === documentTypes.salesReturn &&
    //   challan_number
    // ) {
    //   const existingDocument = await models.Documents.findOne({
    //     where: { documentNumber: challan_number, companyId },
    //   });

    //   if (existingDocument) {
    //     await existingDocument.update({
    //       salesReturnNumber: documentNumber,
    //       is_refered: true,
    //       status: 16,
    //     });
    //   }
    // }

    // Sales Return from Order Confirmation
    // if (status && documentType === documentTypes.salesReturn && orderConfirmationNumber) {
    //   const existingDocument = await models.Documents.findOne({
    //     where: { documentNumber: orderConfirmationNumber, companyId },
    //   });

    //   if (existingDocument) {
    //     await existingDocument.update({
    //       salesReturnNumber: documentNumber,
    //       is_refered: true,
    //       status: 19
    //     });
    //   }
    // }
    // Sales Return from Debit Note
    // if (
    //   status &&
    //   documentType === documentTypes.salesReturn &&
    //   debit_note_number
    // ) {
    //   const existingDocument = await models.Documents.findOne({
    //     where: { documentNumber: debit_note_number, companyId },
    //   });

    //   if (existingDocument) {
    //     await existingDocument.update({
    //       salesReturnNumber: documentNumber,
    //       is_refered: true,
    //       status: 18,
    //     });
    //   }
    // }

    // Goods Receive Note from Purchase Order
    // if (status && documentType === documentTypes.goodsReceiveNotes && purchaseOrderNumber) {
    //   const existingDocument = await models.Documents.findOne({
    //     where: { documentNumber: purchaseOrderNumber, companyId },
    //   });

    //   if (existingDocument) {
    //     await existingDocument.update({
    //       grn_number: documentNumber,
    //       is_refered: true,
    //       status: 21 // Update with your actual status code
    //     });
    //   }
    // }

    // Quality Report from Goods Receive Note
    // if (status && documentType === documentTypes.qualityReport && grn_number) {
    //   const existingDocument = await models.Documents.findOne({
    //     where: { documentNumber: grn_number, companyId },
    //   });

    //   if (existingDocument) {
    //     await existingDocument.update({
    //       qualityReportNumber: documentNumber,
    //       is_refered: true,
    //       status: 22
    //     });
    //   }
    // }

    if (status && ((documentType === documentTypes.deliveryChallan || documentType === documentTypes.invoice) && orderConfirmationNumber)) {
      const existingDocument = await models.Documents.findOne({
        where: { documentNumber: orderConfirmationNumber, companyId },
      });
      if (existingDocument) {
        // Find all Document Items against orderConfirmationNumber 
        const documentItems = await models.DocumentItems.findAll({
          where: {
            companyId,
            documentNumber: orderConfirmationNumber
          }
        });

        // Create a map of documentsItems with Items id as key and quantity as value
        const documentsItemMap = documentItems?.reduce((acc, current) => {
          acc[current.itemId] = current.quantity;
          return acc;
        }, {});

        // find all previously created Delivery Challan against same orderConfirmationNumber
        const deliveryChallan = await models.Documents.findAll({
          where: {
            orderConfirmationNumber,
            documentType,
            companyId
          }
        });

        const documentNumbers = deliveryChallan.map(doc => doc.documentNumber);

        // find All Document Items against previously created delivery challan 
        const deliveryChallanItems = await models.DocumentItems.findAll({
          where: {
            documentNumber: documentNumbers,
            companyId
          }
        });

        // Create deliverychallan items map where item id is key and quantity as value
        const deliveryChallanItemsMap = deliveryChallanItems?.reduce((acc, current) => {
          !acc[current?.itemId] ? acc[current?.itemId] = current.quantity : acc[current?.itemId] += current.quantity;
          return acc;
        }, {});

        // Add quantity of existing items in dellivery challan items map
        for (const item of items) {
          if (deliveryChallanItemsMap[item.itemId]) deliveryChallanItemsMap[item.itemId] += item.quantity;
          else deliveryChallanItemsMap[item.itemId] = item.quantity;
        }

        let statusCode = documentType === documentTypes.invoice ? 13 : 11;

        // comapare documentsItem map and delivery challam items map 
        for (const elem of Object.keys(documentsItemMap)) {
          if (documentsItemMap[elem] > deliveryChallanItemsMap[elem]) {
            statusCode = documentType === documentTypes.invoice ? 12 : 10;
            break;
          }
        }

        // update the status accordingly
        await existingDocument.update({
          status: statusCode
        });
      }
    }

    if (isDraft) {
      await models.CompanyTermsCondition.destroy({
        where: {
          companyId,
          documentNumber
        }
      });
    }
    const companyTermsCondition = await models.CompanyTermsCondition.create({
      companyId: companyId,
      termsCondition: termsCondition || [],
      ip_address: ip_address,
      documentNumber: document.documentNumber,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    companyTermsCondition?.id && await models.Documents.update({
      companyTermsConditionId: companyTermsCondition.id
    }, {
      where: {
        companyId,
        documentNumber
      }
    });

    if (isDraft) {
      await Promise.all([
        models.DocumentItems.destroy({
          where: {
            companyId,
            documentNumber
          }
        }),
        models.DocumentAdditionalCharges.destroy({
          where: {
            companyId,
            documentNumber
          }
        }),
        models.DocumentBankDetails.destroy({
          where: {
            companyId,
            documentNumber
          }
        }),
        models.DocumentAttachments.destroy({
          where: {
            companyId,
            documentNumber
          }
        }),
        models.DocumentComments.destroy(
          {
            where: { documentId: document.id },
          })
      ]);
    }

    await Promise.all([
      models.DocumentItems.bulkCreate(
        items.map(item => {
          return ({
            documentNumber: document.documentNumber,
            companyId: companyId,
            itemId: item.itemId,
            itemName: item.itemName,
            HSN: item.HSN,
            UOM: item.UOM,
            quantity: item.quantity,
            price: item.price,
            discountOne: item.discountOne,
            discountTwo: item.discountTwo,
            totalDiscount: item.totalDiscount,
            taxType: item.taxType,
            tax: item.tax,
            totalTax: item.totalTax,
            totalBeforeTax: item.totalBeforeTax,
            totalAfterTax: item.totalAfterTax,
            receivedToday: item.receivedToday || 0,
            pendingQuantity: item.pendingQuantity || 0,
            receivedQuantity: item.receivedQuantity || 0,
            auQuantity: item?.auQuantity,
            alternateUnit: item?.alternateUnit,
            conversionFactor: item?.conversionFactor,
            ServiceID: item?.ServiceID,
            ServiceName: item?.ServiceName,
            additionalDetails: item?.additionalDetails
          })
        })
      ),
      models.DocumentAdditionalCharges.bulkCreate(
        additionalCharges.map(charge => ({
          companyId: companyId,
          documentNumber: document.documentNumber,
          chargingFor: charge.chargingFor,
          price: charge.price,
          tax: charge.tax,
          total: charge.total,
          status: charge.status,
          ip_address: charge.ip_address
        }))
      ),
      models.DocumentBankDetails.create({
        documentNumber: document.documentNumber,
        companyId: companyId,
        bankName: bankDetails.bankName || null,
        accountName: bankDetails.accountName || null,
        accountNumber: bankDetails.accountNumber || null,
        branch: bankDetails.branch || null,
        IFSCCode: bankDetails.IFSCCode || null,
        MICRCode: bankDetails.MICRCode || null,
        address: bankDetails.address || null,
        SWIFTCode: bankDetails.SWIFTCode || null,
        status: bankDetails.status || 1,
        ip_address: bankDetails.ip_address || null,
      }),
      models.DocumentAttachments.bulkCreate(
        attachments.map(attachment => ({
          documentNumber: document.documentNumber,
          companyId: companyId,
          attachmentName: attachment
        }))
      ),
      models.DocumentComments.create(
        {
          documentId: document.id,   // Ensure documentId is used as FK
          commentText: documentComments,
          createdBy: createdBy,
          createdAt: new Date(),
          updatedAt: new Date()
        }),
    ]);

    if (status && (documentType == documentTypes.goodsReceive || documentType == documentTypes.qualityReport)) {
      let purchase_order = '';
      if (documentType === documentTypes.goodsReceive) {
        purchase_order = await models.Documents.findOne({
          where: {
            documentNumber: purchaseOrderNumber,
            companyId
          }
        });
        if (purchase_order) {
          if (purchase_order?.addStockOn === 'GRN') {
            await models.Documents.update({ addStockOn: 'GRN' },
              {
                where: {
                  documentNumber,
                  companyId
                }
              }
            );
          }
          let partiallyReceived = false, accessQuantityReceived = false;
          for (const item of items) {
            if (item.quantity < item.receivedQuantity) {
              accessQuantityReceived = true;
            }
            if (item.quantity > item.receivedQuantity) {
              partiallyReceived = true;
              break;
            }
          }
          const status = partiallyReceived ? 4 : accessQuantityReceived ? 6 : 5;
          await models.Documents.update(
            { status },
            {
              where: {
                id: purchase_order.id,
                companyId
              }
            }
          );
        }
      }
      else {
        const grn = await models.Documents.findOne({
          where: {
            documentNumber: grn_number,
            companyId
          }
        });
        purchase_order = await models.Documents.findOne({
          where: {
            documentNumber: grn.purchaseOrderNumber,
            companyId
          }
        });
        await models.Documents.update(
          { status: 7 },
          {
            where: {
              documentNumber: grn_number,
              companyId
            }
          }
        );
      }
      const existingItems = await models.Items.findAll({});
      const stores = await models.Store.findAll({});
      const itemsMap = new Map(existingItems.map(existingItem => [existingItem.itemId, existingItem.id]));
      const storesMap = new Map(stores.map(store => [store.name, store.id]));
      if ((documentType === documentTypes.goodsReceive && purchase_order.addStockOn == 'GRN') || (documentType === documentTypes.qualityReport && purchase_order.addStockOn == 'QR')) {
        await Promise.all([models.StoreItems.bulkCreate(items?.filter(item => item?.receivedToday).map(item => {
          const itemId = itemsMap.get(item.itemId) || null;
          const storeId = storesMap.get(store) || null;
          return {
            storeId,
            itemId,
            quantity: (item?.receivedToday * (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0,
            status: 1,
            addedBy: createdBy,
            price: item?.price / (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1)),
            documentNumber: document.documentNumber
          }
        })
        ),
        models.StockTransfer.bulkCreate(items?.filter(item => item?.receivedToday).map(item => {
          const itemId = itemsMap.get(item.itemId) || null;
          const storeId = storesMap.get(store) || null;
          return {
            transferNumber: item?.transferNumber,
            fromStoreId: null,
            itemId,
            quantity: (item?.receivedToday * (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0,
            toStoreId: storeId,
            transferDate: new Date().toISOString(),
            transferredBy: createdBy,
            comment: '',
            companyId,
            price: item?.price / (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1)),
            documentNumber: document.documentNumber,
            documentType
          }
        })),
        ]
        );

        for (const item of items) {
          const existItem = await models.Items.findOne({
            where: {
              id: itemsMap.get(item.itemId)
            }
          });
          if (existItem) {
            await models.Items.update(
              { currentStock: (item.currentStock || 0) + ((item.receivedToday * (item.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0) },
              {
                where: {
                  id: itemsMap.get(item.itemId)
                }
              }
            );
          }

        }
      }
      if (documentType === documentTypes.qualityReport) {
        await Promise.all([models.StoreItems.bulkCreate(items?.filter(item => item.pendingQuantity).map(item => {
          const itemId = itemsMap.get(item.itemId) || null;
          const storeId = storesMap.get(rejectedStore) || null;
          return {
            storeId,
            itemId,
            quantity: (item.pendingQuantity * (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0,
            status: 1,
            addedBy: createdBy,
            price: item?.price / (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1)),
            isRejected: true,
            documentNumber: document.documentNumber
          }
        })
        ),
        models.StockTransfer.bulkCreate(items?.filter(item => item.pendingQuantity).map(item => {
          const itemId = itemsMap.get(item.itemId) || null;
          const storeId = storesMap.get(rejectedStore) || null;
          return {
            transferNumber: generateTransferNumber(),
            fromStoreId: null,
            itemId,
            quantity: (item.pendingQuantity * (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0,
            toStoreId: storeId,
            transferDate: new Date().toISOString(),
            transferredBy: createdBy,
            comment: '',
            companyId,
            price: item?.price / (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1)),
            documentNumber: document.documentNumber,
            documentType,
            isRejected: true
          }
        })),
        ]);
      }
    }

    if (status && ((documentType === documentTypes.invoice && reduceStockOnIV === "true") || (documentType === documentTypes.deliveryChallan && reduceStockOnDC === "true"))) {
      const storeId = await models.Store.findOne({
        where: {
          name: store,
          companyId
        }
      });
      for (const element of items) {
        let price = 0;
        let remainingQuantity = (element.quantity * (element?.conversionFactor || 1));;
        const item = await models.Items.findOne({
          where: {
            itemId: element.itemId,
            companyId
          }
        });
        const existingStock = await models.StoreItems.findAll({
          where: { storeId: storeId.id, itemId: item.id },
          order: [['createdAt', 'ASC']],
        });
        for (const stock of existingStock) {
          if (remainingQuantity <= 0) break;
          if (stock.quantity <= 0) continue;
          const deductQty = Math.min(stock.quantity, remainingQuantity);
          remainingQuantity -= deductQty;

          await models.StoreItems.update(
            { quantity: (stock.quantity - deductQty) },
            { where: { id: stock.id } }
          );
          await models.StockTransfer.create({
            transferNumber: element.transferNumber,
            fromStoreId: storeId.id || null,
            itemId: item.id,
            quantity: deductQty * -1,
            toStoreId: null,
            transferDate: new Date().toISOString(),
            transferredBy: createdBy,
            comment: '',
            companyId,
            price: element.price / (element.conversionFactor || 1),
            documentNumber: document.documentNumber,
            documentType,
            actualPrice: stock.price
          });
          price += (stock.price * deductQty);
        }

        // await models.StockTransfer.create({
        //   transferNumber: element.transferNumber,
        //   fromStoreId: storeId.id || null,
        //   itemId: item.id,
        //   quantity: (element?.quantity * (element?.conversionFactor || 1)) * -1,
        //   toStoreId: null,
        //   transferDate: new Date().toISOString(),
        //   transferredBy: createdBy,
        //   comment: '',
        //   companyId,
        //   price: element.price / (element.conversionFactor || 1),
        //   documentNumber: document.documentNumber,
        //   documentType
        // });

        await models.Items.update(
          {
            currentStock: item.currentStock - (element.quantity * (element?.conversionFactor || (showUnits == 0 ? element.quantity / element.auQuantity : 1))),
          },
          { where: { id: item.id, companyId } }
        );
      }
    }

    if (status && documentType === documentTypes.goodsReceive) {
      // find purchase order against grn
      const purchase_order = await models.Documents.findOne({
        where: {
          documentNumber: purchaseOrderNumber,
          companyId
        }
      });

      if (purchase_order && purchase_order.indent_number) {
        const indent_numbers = purchase_order.indent_number.split(",");
        for (const ind_number of indent_numbers) {
          // find purchse request against purchase order
          const purchase_request = await models.Documents.findOne({
            where: {
              companyId,
              documentNumber: ind_number
            }
          });

          // if purchase request status is 14 or 15 then directly update the status to 15
          if (purchase_request.status == 14 || purchase_request.status == 15) {
            await purchase_request.update({
              status: 15
            });
          }
          else {
            // find all purchase orders against same purchase request 
            const purchase_orders = await models.Documents.findAll({
              where: {
                companyId,
                indent_number: ind_number
              }
            });

            // iterate through all purchase orders
            for (const purchase_order of purchase_orders) {
              // find latest grn against evvery purchase order
              const latest_grn = await models.Documents.findOne({
                where: {
                  companyId,
                  documentType,
                  purchaseOrderNumber: purchase_order.documentNumber
                },
                order: [['createdAt', 'DESC']]
              });

              let isBreak = false;
              // if latest grn is not found then directly update the status to 17 and break all loops
              if (!latest_grn) {
                await purchase_request.update({
                  status: 17
                });
                break;
              }
              else {
                // find all grnItems against latest grn 
                const grnsItems = await models.DocumentItems.findAll({
                  where: {
                    documentNumber: latest_grn.documentNumber,
                    companyId
                  }
                });
                // iterate through all grns
                for (const grn of grnsItems) {
                  // any one grn items is partially received update purchase request status to 17 and break all loops
                  if ((showUnits == 0 ? grn.auQuantity : grn.quantity) < grn.receivedQuantity) {
                    await purchase_request.update({
                      status: 17
                    });
                    isBreak = true;
                    break;
                  }
                }
              }
              if (isBreak) break;
            }
            // if all purchase orders against purchase request have received full quantity then update purchase request status to 18
            await purchase_request.update({
              status: 18
            });
          }

        }
      }
    }

    res.status(201).json({
      message: "Document and related data created successfully!"
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Something went wrong', error });
  }
}

async function getDocuments(req, res) {
  const { companyId, currentPage, pageSize, documentType = '', search = '', dealStatus, docTypeFilter } = req.body;

  const offset = ((currentPage || 1) - 1) * (pageSize || 10);
  let documentstype = [];
  switch (documentType) {
    case "sales":
      documentstype = salesDocuments;
      break;
    case "purchase":
      documentstype = purchaseDocuments;
      break;
    case "documentServices":
      documentstype = serviceDocuments;
      break;
    default:
      break;
  }

  let documents = [];
  if (!currentPage || !pageSize) {
    documents = await models.Documents.findAll({
      where: { companyId },
      include: [
        {
          model: models.LogisticDetails,
          as: 'logisticDetails'
        },
        {
          model: models.Users,
          as: 'creator',
          attributes: ['id', 'name', 'gstNumber']
        },
      ],
      distinct: true
    });
  } else {

    documents = await models.Documents.findAndCountAll({
      where: {
        companyId,
        ...(documentstype.length > 0 && {
          documentType: {
            [Op.in]: documentstype
          }
        }),
        ...(dealStatus?.length > 0 && {
          status: {
            [Op.in]: dealStatus,
          },
        }),
        ...(docTypeFilter?.length > 0 && {
          documentType: {
            [Op.in]: docTypeFilter,
          },
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
      distinct: true,
      limit: pageSize,
      offset,
    });
  }

  if (!documents || (documents?.rows?.length === 0 || documents?.length === 0)) {
    return res.status(200).json({
      total: 0,
      currentPage,
      pageSize,
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
  const uniqueItems = Array.from(uniqueItemsMap.values());

  const formattedResult = (documents?.rows || documents)?.map(document => ({
    ...document.toJSON(),
    items: uniqueItems.filter(item => item.documentNumber === document.documentNumber),
    additionalCharges: additionalCharges.filter(charge => charge.documentNumber === document.documentNumber),
    bankDetails: bankDetails.find(bank => bank.documentNumber === document.documentNumber) || {},
    termsCondition: termsConditions.find(tc => tc.documentNumber === document.documentNumber) || {},
    attachments: attachments.filter(att => att.documentNumber === document.documentNumber),
    documentComments: documentComments.filter(comment => comment.documentId === document.id),
  }));

  if (!currentPage || !pageSize) {
    return res.status(200).json(formattedResult)
  }
  res.status(200).json({
    total: documents.count,
    currentPage,
    pageSize,
    data: formattedResult,
  });
}

async function getDocumentById(req, res) {
  try {
    const { documentNumber, companyId } = req.body;

    const document = await models.Documents.findOne({
      where: { documentNumber, companyId },
      include: [{ model: models.LogisticDetails, as: 'logisticDetails' }]
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    const [items, additionalCharges, bankDetails, termsCondition, attachments, documentComments] = await Promise.all([
      models.DocumentItems.findAll({ where: { documentNumber, companyId } }),
      models.DocumentAdditionalCharges.findAll({ where: { documentNumber, companyId } }),
      models.DocumentBankDetails.findOne({ where: { documentNumber, companyId } }),
      models.CompanyTermsCondition.findOne({ where: { companyId, documentNumber } }),
      models.DocumentAttachments.findAll({ where: { documentNumber, companyId } }),
      models.DocumentComments.findAll({ where: { documentId: document.id } })
    ]);

    const response = {
      ...document.toJSON(),
      items,
      additionalCharges,
      bankDetails: bankDetails || {},
      termsCondition: termsCondition
        ? JSON.parse(termsCondition.termsCondition)
        : [],
      attachments: attachments.map(att => att.attachmentName),
      logisticDetails: document.logisticDetails || null,
      documentComments,
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error("Error fetching document:", error);
    return res.status(500).json({ message: "Something went wrong, please try again later!" });
  }
}

async function discardDocument(req, res) {
  const { documentId, companyId } = req.body;
  let linkedDocument = null;
  try {
    const document = await models.Documents.findOne({
      where: { id: documentId, companyId },
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found!" });
    }
    if (document.documentType === documentTypes.salesEnquiry) {
      linkedDocument = await models.Documents.findOne({
        where: {
          companyId,
          enquiryNumber: document.documentNumber,
          status: {
            [Op.ne]: 2,
          },
        }
      });
      if (linkedDocument) {
        return res.status(409).json({ message: 'You can not discard this document, It is linked with other documents.' })
      }
    }
    if (document.documentType === documentTypes.salesQuotation) {
      linkedDocument = await models.Documents.findOne({
        where: {
          companyId,
          quotationNumber: document.documentNumber,
          status: {
            [Op.ne]: 2,
          },
          documentType: documentTypes.orderConfirmation
        }
      });
      if (linkedDocument) {
        return res.status(409).json({ message: 'You can not discard this document, It is linked with other documents.' })
      }
      await models.Documents.update({ quotationNumber: null }, {
        where: {
          quotationNumber: document.documentNumber,
          DocumentType: documentTypes.salesEnquiry
        }
      })
    }
    if (document.documentType === documentTypes.orderConfirmation) {
      const purchaseRequest = await models.Documents.findOne({
        where: {
          orderConfirmationNumber: {
            [Op.like]: `%${document.documentNumber},%`,
          },
          status: {
            [Op.ne]: 2,
          },
        }
      });
      linkedDocument = await models.Documents.findOne({
        where: {
          companyId,
          orderConfirmationNumber: document.documentNumber,
          status: {
            [Op.ne]: 2,
          },
        }
      });
      if (linkedDocument || purchaseRequest) {
        return res.status(409).json({ message: 'You can not discard this document, It is linked with other documents.' })
      }
      await models.Documents.update({ status: 1 }, {
        where: {
          documentNumber: document.quotationNumber,
        }
      });
    }
    if (document.documentType === documentTypes.deliveryChallan) {
      linkedDocument = await models.Documents.findOne({
        where: {
          companyId,
          challan_number: document.documentNumber,
          status: {
            [Op.ne]: 2,
          },
        }
      });
      if (linkedDocument) {
        return res.status(409).json({ message: 'You can not discard this document, It is linked with other documents.' })
      }
      const stockTransfers = await models.StockTransfer.findAll({
        where: {
          documentNumber: document.documentNumber,
          companyId
        }
      });
      const storeItems = [], stockHistory = [];
      const transferNumber = generateTransferNumber();
      for (const stockTransfer of stockTransfers) {
        stockHistory.push({
          transferNumber,
          fromStoreId: null,
          itemId: stockTransfer.itemId,
          quantity: stockTransfer.quantity * -1,
          toStoreId: stockTransfer.fromStoreId,
          transferDate: new Date().toISOString(),
          transferredBy: stockTransfer.transferredBy,
          comment: '',
          companyId: stockTransfer.companyId,
          price: stockTransfer?.price,
          documentNumber: document.documentNumber,
          documentType: stockTransfer.documentType,
        });
        storeItems.push({
          storeId: stockTransfer.fromStoreId,
          itemId: stockTransfer.itemId,
          quantity: stockTransfer.quantity * -1,
          status: 1,
          addedBy: stockTransfer.transferredBy,
          price: stockTransfer?.actualPrice
        })
      }
      await Promise.all([
        models.StoreItems.bulkCreate(storeItems),
        models.StockTransfer.bulkCreate(stockHistory)
      ]);
      if (document.orderConfirmationNumber) {
        await models.Documents.update({ status: 1 }, {
          where: {
            companyId,
            documentNumber: document.orderConfirmationNumber
          }
        })
      }
    }
    if (document.documentType === documentTypes.invoice) {
      linkedDocument = await models.Documents.findOne({
        where: {
          companyId,
          invoiceNumber: document.documentNumber,
          status: {
            [Op.ne]: 2,
          },
        }
      });
      if (linkedDocument) {
        return res.status(409).json({ message: 'You can not discard this document, It is linked with other documents.' })
      }
      const stockTransfers = await models.StockTransfer.findAll({
        where: {
          documentNumber: document.documentNumber,
          companyId
        }
      });
      const storeItems = [], stockHistory = [];
      const transferNumber = generateTransferNumber();
      for (const stockTransfer of stockTransfers) {
        stockHistory.push({
          transferNumber,
          fromStoreId: null,
          itemId: stockTransfer.itemId,
          quantity: stockTransfer.quantity * -1,
          toStoreId: stockTransfer.fromStoreId,
          transferDate: new Date().toISOString(),
          transferredBy: stockTransfer.transferredBy,
          comment: '',
          companyId: stockTransfer.companyId,
          price: stockTransfer?.price,
          documentNumber: document.documentNumber,
          documentType: stockTransfer.documentType,
        });
        storeItems.push({
          storeId: stockTransfer.fromStoreId,
          itemId: stockTransfer.itemId,
          quantity: stockTransfer.quantity * -1,
          status: 1,
          addedBy: stockTransfer.transferredBy,
          price: stockTransfer?.actualPrice
        })
      }
      await Promise.all([
        models.StoreItems.bulkCreate(storeItems),
        models.StockTransfer.bulkCreate(stockHistory)
      ]);
      if (document.orderConfirmationNumber) {
        await models.Documents.update({ status: 1 }, {
          where: {
            companyId,
            documentNumber: document.orderConfirmationNumber
          }
        })
      }
    }
    if (document.documentType === documentTypes.proformaInvoice) {
      linkedDocument = await models.Documents.findOne({
        where: {
          companyId,
          performaInvoiceNumber: document.documentNumber,
          status: {
            [Op.ne]: 2,
          },
        }
      });
      if (linkedDocument) {
        return res.status(409).json({ message: 'You can not discard this document, It is linked with other documents.' })
      }
    }
    if (document.documentType === documentTypes.purchaseRequest) {
      const purchaseOrder = await models.Documents.findOne({
        where: {
          indent_number: {
            [Op.like]: `%${document.documentNumber},%`,
          },
          status: {
            [Op.ne]: 2,
          },
        }
      })
      linkedDocument = await models.Documents.findOne({
        where: {
          companyId,
          indent_number: document.documentNumber,
          status: {
            [Op.ne]: 2,
          },
        }
      });
      if (linkedDocument || purchaseOrder) {
        return res.status(409).json({ message: 'You can not discard this document, It is linked with other documents.' })
      }
    }
    if (document.documentType === documentTypes.purchaseOrder) {
      linkedDocument = await models.Documents.findOne({
        where: {
          companyId,
          purchaseOrderNumber: document.documentNumber,
          status: {
            [Op.ne]: 2,
          },
        }
      });
      if (linkedDocument) {
        return res.status(409).json({ message: 'You can not discard this document, It is linked with other documents.' })
      }
    }
    if (document.documentType === documentTypes.goodsReceive) {
      linkedDocument = await models.Documents.findOne({
        where: {
          companyId,
          grn_number: document.documentNumber,
          status: {
            [Op.ne]: 2,
          },
        }
      });
      if (linkedDocument) {
        return res.status(409).json({ message: 'You can not discard this document, It is linked with other documents.' })
      }
      const stockTransfers = await models.StockTransfer.findAll({
        where: {
          companyId,
          documentNumber: document.documentNumber,
        }
      });
      const store = await models.Store.findOne({
        where: {
          name: document.store,
          companyId
        }
      });
      const stockHistory = [];
      await models.StoreItems.update({ quantity: 0 }, {
        where: {
          documentNumber: document.documentNumber,
          storeId: store.id
        }
      });
      const transferNumber = generateTransferNumber();
      for (const stockTransfer of stockTransfers) {
        stockHistory.push({
          transferNumber,
          fromStoreId: stockTransfer.toStoreId,
          itemId: stockTransfer.itemId,
          quantity: stockTransfer.quantity * -1,
          toStoreId: null,
          transferDate: new Date().toISOString(),
          transferredBy: stockTransfer.transferredBy,
          comment: '',
          companyId: stockTransfer.companyId,
          price: stockTransfer?.price,
          documentNumber: document.documentNumber,
          documentType: stockTransfer.documentType,
          actualPrice: stockTransfer.price
        });
      }
      await models.StockTransfer.bulkCreate(stockHistory);
      await models.Documents.update({ status: 1 }, {
        where: {
          companyId,
          documentNumber: document.purchaseOrderNumber
        }
      })
    }
    if (document.documentType === documentTypes.purchaseInvoice) {
      linkedDocument = await models.Documents.findOne({
        where: {
          companyId,
          invoiceNumber: document.documentNumber,
          status: {
            [Op.ne]: 2,
          },
        }
      });
      if (linkedDocument) {
        return res.status(409).json({ message: 'You can not discard this document, It is linked with other documents.' })
      }
    }
    if (document.documentType === documentTypes.qualityReport) {
      const stockTransfers = await models.StockTransfer.findAll({
        where: {
          companyId,
          documentNumber: document.documentNumber,
        }
      });
      const store = await models.Store.findOne({
        where: {
          name: document.store,
          companyId
        }
      });
      const rejectStore = await models.Store.findOne({
        where: {
          name: document.rejectedStore,
          companyId
        }
      })
      const stockHistory = [];
      await models.StoreItems.update({ quantity: 0 }, {
        where: {
          documentNumber: document.documentNumber,
          storeId: store.id,
        }
      });
      await models.StoreItems.update({ quantity: 0 }, {
        where: {
          documentNumber: document.documentNumber,
          storeId: rejectStore.id,
        }
      });
      const transferNumber = generateTransferNumber();
      console.log('Stock Transfer', stockTransfers[0]);
      for (const stockTransfer of stockTransfers) {
        stockHistory.push({
          transferNumber,
          fromStoreId: stockTransfer.toStoreId,
          itemId: stockTransfer.itemId,
          quantity: stockTransfer.quantity * -1,
          toStoreId: null,
          transferDate: new Date().toISOString(),
          transferredBy: stockTransfer.transferredBy,
          comment: '',
          companyId: stockTransfer.companyId,
          price: stockTransfer?.price,
          documentNumber: document.documentNumber,
          documentType: stockTransfer.documentType,
          actualPrice: stockTransfer.price,
          isRejected: stockTransfer?.isRejected
        });
      }
      await models.StockTransfer.bulkCreate(stockHistory);
      await models.Documents.update({ status: 1 }, {
        where: {
          documentNumber: document.grn_number
        }
      });
    }
    await document.update({ status: 2 });
    res.status(200).json({ message: 'Document Discarded Successfully.' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal Server Error' })
  }
}

function deleteDocument(req, res) {
  const { documentId } = req.body;

  // Check if documentId is provided
  if (!documentId) {
    return res.status(400).json({
      message: "Document ID is required",
    });
  }

  // Attempt to delete the document
  models.Documents.destroy({ where: { id: documentId } })
    .then((result) => {
      if (result) {
        // Document was successfully deleted
        res.status(200).json({
          message: "Document deleted successfully",
        });
      } else {
        // No document was found with the given ID
        res.status(404).json({
          message: "Document not found",
        });
      }
    })
    .catch((error) => {
      // Handle errors
      res.status(500).json({
        message: "Something went wrong, please try again later!",
        error: error.message || error,
      });
    });
}

function getPreviewDocuments(req, res) {
  const { documentType } = req.body;

  if (!documentType) {
    return res.status(400).json({ message: "documentType is required" });
  }

  models.PreviewDocument.findAll({
    where: {
      documentType: req.body.documentType,
    },
  })
    .then((previewDocuments) => {
      if (!previewDocuments.length) {
        return res.status(200).json([]);
      }

      res.status(200).json(previewDocuments.map((doc) => doc.toJSON()));
    })
    .catch((error) => {
      console.error("Error fetching preview documents:", error);
      res
        .status(500)
        .json({ message: "Something went wrong, please try again later!" });
    });
}

async function getDocumentItems(req, res) {
  try {
    const { purchaseOrderNumber } = req.body;
    if (!purchaseOrderNumber) {
      return res.status(404).json({ message: 'Purchase order not found.' });
    }

    const purchaseOrders = await models.Documents.findAll({
      where: { purchaseOrderNumber, companyId: Number(req.body.companyId), documentType: documentTypes.goodsReceive },
      attributes: ['documentNumber']
    });

    if (!purchaseOrders.length) {
      return res.status(200).json({ receivedByItem: {} });
    }

    const documentNumbers = purchaseOrders.map(doc => doc.documentNumber);

    const documentItems = await models.DocumentItems.findAll({
      where: {
        documentNumber: { [Op.in]: documentNumbers },
        companyId: req.body.companyId
      },
      attributes: ['itemId', 'receivedToday']
    });

    const receivedByItem = documentItems.reduce((acc, item) => {
      acc[item.itemId] = (acc[item.itemId] || 0) + item.receivedToday;
      return acc;
    }, {});

    res.status(200).json({ receivedByItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
}


module.exports = {
  getDocuments,
  getDocumentById,
  createDocument,
  discardDocument,
  deleteDocument,
  getPreviewDocuments,
  getDocumentItems
};
