const { Op, fn, col, where, cast } = require('sequelize');
const models = require('../models');
const { documentTypes, purchaseDocuments, salesDocuments, serviceDocuments, serviceConfirmationDocuments } = require('../helpers/document-type');
const { generateTransferNumber, generateProductionId } = require('../helpers/transfer-number');

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
      supplierGSTNumber = null,
      is_refered = null,
      addStockOn = '',
      isDraft = false,
      purpose = '',
      requiredDate = null,
      requestedBy = '',
      department = '',
      showUnits = null,
      batches = null,
      supplyState = '',
      customFields = {},
      productionId = null,
      requestForApproval = false,
      seriesId = null,
      bomName = '',
      finishedGood = {},
      serviceOrderNumber = '',
      serviceOrderDate = ''
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
      supplierGSTNumber,
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
      status: requestForApproval ? 29 : status,
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
      showUnits,
      supplyState,
      customFields,
      serviceOrderDate,
      serviceOrderNumber
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
      supplierGSTNumber,
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
      showUnits,
      supplyState,
      customFields,
      serviceOrderDate,
      serviceOrderNumber
    }, {
      where: {
        companyId,
        documentNumber
      }
    });

    if (documentType != documentTypes.purchaseInvoice) {
      const documentSeries = await models.DocumentSeries.findOne({
        where: {
          id: seriesId
        }
      });
      if (documentSeries) {
        await documentSeries.update({ nextNumber: documentSeries.nextNumber + 1 });
      }
    }

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

        // find all previously created Delivery Challan or invoice against same orderConfirmationNumber
        const deliveryChallan = await models.Documents.findAll({
          where: {
            orderConfirmationNumber,
            documentType,
            companyId,
            status: {
              [Op.notIn]: [0, 2]
            }
          }
        });

        const documentNumbers = deliveryChallan.map(doc => doc.documentNumber);

        // find All Document Items against previously created delivery challan or Invoice
        const deliveryChallanItems = await models.DocumentItems.findAll({
          where: {
            documentNumber: documentNumbers,
            companyId
          }
        });

        // Create deliverychallan or invoice items map where item id is key and quantity as value
        const deliveryChallanItemsMap = deliveryChallanItems?.reduce((acc, current) => {
          !acc[current?.itemId] ? acc[current?.itemId] = current.quantity : acc[current?.itemId] += current.quantity;
          return acc;
        }, {});
        // Add quantity of existing items in dellivery challan items map
        for (const item of items) {
          if (deliveryChallanItemsMap[item.itemId]) deliveryChallanItemsMap[item.itemId] += Number(item.quantity);
          else deliveryChallanItemsMap[item.itemId] = Number(item.quantity);
        }

        let statusCode = 0, handleStatus = existingDocument.status;

        // comapare documentsItem map and delivery challam items map 
        for (const elem of Object.keys(documentsItemMap)) {
          if (documentsItemMap[elem] > deliveryChallanItemsMap[elem] || !deliveryChallanItemsMap[elem]) {
            statusCode = documentType === documentTypes.invoice ? 12 : 10;
            break;
          }
        }

        if (!statusCode) {
          if (documentType === documentTypes.invoice) {
            // handle completely billing status
            if (existingDocument.status === 1 || existingDocument.status === 12) {
              handleStatus = 13;
            }
            // handle partially delivered completely billed
            if (existingDocument.status === 10 || existingDocument.status == 19) {
              handleStatus = 20;
            }
            // handle completely delivered completely billed
            if (existingDocument.status === 11 || existingDocument.status === 21) {
              handleStatus = 22;
            }
          } else {
            // handle completely deliver status
            if (existingDocument.status === 1 || existingDocument.status === 10) {
              handleStatus = 11;
            }
            // handle partially billed completely deliver
            if (existingDocument.status === 12 || existingDocument.status == 19) {
              handleStatus = 21;
            }
            // handle completely delivered completely billed
            if (existingDocument.status === 13 || existingDocument.status === 20) {
              handleStatus = 22;
            }
          }
        }
        else {
          if (documentType === documentTypes.invoice) {
            // handle partially billing status
            if (existingDocument.status === 1 || existingDocument.status === 12) {
              handleStatus = 12;
            }
            // handle partially delivered partially billed
            if (existingDocument.status === 10) {
              handleStatus = 19;
            }
            // handle completely delivered partially billed
            if (existingDocument.status === 11) {
              handleStatus = 21;
            }
          } else {
            // handle partially deliver status
            if (existingDocument.status === 1 || existingDocument.status === 10) {
              handleStatus = 10;
            }
            // handle partially billed partially deliver
            if (existingDocument.status === 12) {
              handleStatus = 19;
            }
            // handle partially delivered completely billed
            if (existingDocument.status === 13) {
              handleStatus = 20;
            }
          }
        }

        // update the status accordingly
        await existingDocument.update({
          status: handleStatus
        });
      }
    }

    if (status && ((documentType === documentTypes.goodsReceive) || documentType === documentTypes.purchaseInvoice) && purchaseOrderNumber) {
      const existingDocument = await models.Documents.findOne({
        where: { documentNumber: purchaseOrderNumber, companyId },
      });
      const documentItems = await models.DocumentItems.findAll({
        where: {
          companyId,
          documentNumber: purchaseOrderNumber
        }
      });
      const documentsItemMap = documentItems?.reduce((acc, current) => {
        acc[current.itemId] = current.quantity;
        return acc;
      }, {});

      console.log('documentmap', documentsItemMap);

      const purchaseDoc = await models.Documents.findAll({
        where: {
          purchaseOrderNumber,
          documentType,
          companyId,
          status: {
            [Op.notIn]: [0, 2]
          }
        }
      });

      const documentNumbers = purchaseDoc.map(doc => doc.documentNumber);

      const purchaseDocItems = await models.DocumentItems.findAll({
        where: {
          documentNumber: documentNumbers,
          companyId
        }
      });

      const purchaseDocItemsMap = purchaseDocItems?.reduce((acc, current) => {
        !acc[current?.itemId] ? acc[current?.itemId] = (current.receivedToday || current.quantity) : acc[current?.itemId] += (current.receivedToday || current.quantity);
        return acc;
      }, {});
      console.log(purchaseDocItemsMap);
      // Add quantity of existing items in purchase documents items map
      for (const item of items) {
        if (purchaseDocItemsMap[item.itemId]) purchaseDocItemsMap[item.itemId] += Number(item.receivedToday || item.quantity);
        else purchaseDocItemsMap[item.itemId] = Number(item.receivedToday || item.quantity);
      }

      console.log('objectdata', purchaseDocItemsMap, documentsItemMap)
      let statusCode = 0, handleStatus = existingDocument.status;

      // comapare documentsItem map and delivery challam items map 
      for (const elem of Object.keys(documentsItemMap)) {
        if (documentsItemMap[elem] > purchaseDocItemsMap[elem]) {
          statusCode = 1;
          break;
        }
      }

      if (!statusCode) {
        for (const elem of Object.keys(documentsItemMap)) {
          if (documentsItemMap[elem] < purchaseDocItemsMap[elem]) {
            statusCode = 2;
            break;
          }
        }
      }

      if (statusCode == 1) {
        if (documentType === documentTypes.goodsReceive) {
          if (existingDocument.status === 1 || existingDocument.status === 4) {
            handleStatus = 4;
          }
          if (existingDocument.status === 12) {
            handleStatus = 23;
          }
          if (existingDocument.status === 13) {
            handleStatus = 26;
          }
        } else {
          if (existingDocument.status === 1 || existingDocument.status === 12) {
            handleStatus = 12;
          }
          if (existingDocument.status === 4) {
            handleStatus = 23;
          }
          if (existingDocument.status === 5) {
            handleStatus = 24;
          }
          if (existingDocument.status === 6) {
            handleStatus = 25;
          }
        }
      } else if (statusCode == 0) {
        if (documentType === documentTypes.goodsReceive) {
          if (existingDocument.status === 1 || existingDocument.status === 4) {
            handleStatus = 5;
          }
          if (existingDocument.status === 12) {
            handleStatus = 24;
          }
          if (existingDocument.status === 13) {
            handleStatus = 27;
          }
        } else {
          if (existingDocument.status === 1 || existingDocument.status === 12) {
            handleStatus = 12;
          }
          if (existingDocument.status === 4 || existingDocument.status === 23) {
            handleStatus = 26;
          }
          if (existingDocument.status === 5 || existingDocument.status === 24) {
            handleStatus = 27;
          }
          if (existingDocument.status === 6 || existingDocument.status === 25) {
            handleStatus = 28;
          }
        }
      } else {
        if (documentType === documentTypes.goodsReceive) {
          if (existingDocument.status === 1 || existingDocument.status === 4 || existingDocument.status === 5) {
            handleStatus = 6;
          }
          if (existingDocument.status === 12) {
            handleStatus = 25;
          }
          if (existingDocument.status === 13) {
            handleStatus = 28;
          }
        } else {
          if (existingDocument.status === 1 || existingDocument.status === 12) {
            handleStatus = 12;
          }
          if (existingDocument.status === 4 || existingDocument.status === 23) {
            handleStatus = 26;
          }
          if (existingDocument.status === 5 || existingDocument.status === 24) {
            handleStatus = 27;
          }
          if (existingDocument.status === 6 || existingDocument.status === 25) {
            handleStatus = 28;
          }
        }
      }
      await existingDocument.update({
        status: handleStatus
      });

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
            additionalDetails: item?.additionalDetails,
            customFields: item?.customFields
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
      const existingItems = await models.Items.findAll({
        where: {
          companyId: Number(companyId)
        },
        raw: true
      });
      const stores = await models.Store.findAll({
        where: {
          companyId: Number(companyId)
        },
        raw: true
      });
      const itemsMap = new Map(existingItems.map(existingItem => [existingItem.itemId, existingItem.id]));
      const storesMap = new Map(stores.map(store => [store.name, store.id]));
      const settings = await models.Settings.findOne({
        where: {
          companyId: Number(companyId)
        },
        raw: true
      });
      const approval = await models.InventoryApproval.create({
        approvalId: generateProductionId(),
        documentType,
        documentNumber,
        approvalStatus: settings?.['purchaseDocument'] == 'manual' ? 'Pending' : 'Auto Approved',
        requestedBy: createdBy,
        companyId: companyId,
        status: 1,
        approvedBy: null
      });
      if ((documentType === documentTypes.goodsReceive && purchase_order.addStockOn == 'GRN') || (documentType === documentTypes.qualityReport && purchase_order.addStockOn == 'QR')) {
        await Promise.all([models.StoreItems.bulkCreate(items?.filter(item => item?.receivedToday).map(item => {
          const itemId = itemsMap.get(item.itemId) || null;
          const storeId = storesMap.get(store) || null;
          return {
            storeId,
            itemId,
            quantity: settings?.['purchaseDocument'] == 'manual' ? 0 : ((item?.receivedToday * (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0),
            status: 1,
            addedBy: createdBy,
            price: item?.price / (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1)),
            documentNumber: document.documentNumber,
            approvalId: approval.id,
            quantityForApproval: (item?.receivedToday * (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0
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
            quantity: settings?.['purchaseDocument'] == 'manual' ? 0 : ((item?.receivedToday * (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0),
            toStoreId: storeId,
            transferDate: new Date().toISOString(),
            transferredBy: createdBy,
            comment: '',
            companyId,
            price: item?.price / (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1)),
            documentNumber: document.documentNumber,
            documentType,
            approvalId: approval.id,
            quantityForApproval: (item?.receivedToday * (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0
          }
        })),
        ]
        );
      }
      if (documentType === documentTypes.qualityReport) {
        await Promise.all([models.StoreItems.bulkCreate(items?.filter(item => item.pendingQuantity).map(item => {
          const itemId = itemsMap.get(item.itemId) || null;
          const storeId = storesMap.get(rejectedStore) || null;
          return {
            storeId,
            itemId,
            quantity: settings?.['purchaseDocument'] == 'manual' ? 0 : (item.pendingQuantity * (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0,
            status: 1,
            addedBy: createdBy,
            price: item?.price / (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1)),
            isRejected: true,
            documentNumber: document.documentNumber,
            approvalId: approval.id,
            quantityForApproval: (item.pendingQuantity * (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0
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
            quantity: settings?.['purchaseDocument'] == 'manual' ? null : (item.pendingQuantity * (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0,
            toStoreId: storeId,
            transferDate: new Date().toISOString(),
            transferredBy: createdBy,
            comment: '',
            companyId,
            price: item?.price / (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1)),
            documentNumber: document.documentNumber,
            documentType,
            isRejected: true,
            approvalId: approval.id,
            quantityForApproval: (item.pendingQuantity * (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0
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
        const settings = await models.Settings.findOne({
          where: {
            companyId: Number(companyId)
          },
          raw: true
        });
        const approval = await models.InventoryApproval.create({
          approvalId: generateProductionId(),
          documentType,
          documentNumber,
          approvalStatus: settings?.['salesDocument'] == 'manual' ? 'Pending' : 'Auto Approved',
          requestedBy: createdBy,
          companyId: companyId,
          status: 1,
          approvedBy: null
        });
        if (settings?.['salesDocument'] != 'manual') {
          let price = 0;
          let remainingQuantity = (element.quantity * (element?.conversionFactor || 1));
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
              actualPrice: stock.price,
              approvalId: approval.id,
              quantityForApproval: element.quantity
            });
            price += (stock.price * deductQty);
          }
        }
        else {
          const item = await models.Items.findOne({
            where: {
              itemId: element.itemId,
              companyId
            }
          });
          await models.StockTransfer.create({
            transferNumber: element.transferNumber,
            fromStoreId: storeId.id || null,
            itemId: item.id,
            quantity: null,
            toStoreId: null,
            transferDate: new Date().toISOString(),
            transferredBy: createdBy,
            comment: '',
            companyId,
            price: element.price / (element.conversionFactor || 1),
            documentNumber: document.documentNumber,
            documentType,
            actualPrice: element.price / (element.conversionFactor || 1),
            approvalId: approval.id,
            quantityForApproval: element.quantity
          });
        }
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

    if (status && (documentType === documentTypes.goodsReceive || documentType === documentTypes.qualityReport)) {
      if (batches && batches?.length) {
        const bulkBatches = [], bulkBatchItems = [];
        for (const batch of batches) {
          bulkBatches.push({
            companyId: Number(companyId),
            createdBy: Number(createdBy),
            documentNumber,
            documentType,
            item: batch.item,
            status: 1,
            isRejected: batch?.isRejected || false
          });
          for (const batchItem of batch.batchItems) {
            bulkBatchItems.push({
              companyId: Number(companyId),
              createdBy: Number(createdBy),
              documentNumber,
              documentType,
              item: batch.item,
              iterationCount: batch?.batchItems?.length,
              barCodeNumber: batchItem.barCodeNumber,
              manufacturingDate: batchItem.manufacturingDate,
              expiryDate: batchItem.expiryDate,
              quantity: batchItem.quantity,
              outQuantity: 0,
              store: store,
              status: 1,
              isRejected: batch?.isRejected || false
            })
          }
        }
        await Promise.all([
          models?.Batches?.bulkCreate(bulkBatches),
          models?.BatchItems?.bulkCreate(bulkBatchItems)
        ]);
      }
    }

    if (status && (documentType === documentTypes.serviceChallan)) {
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
          where: { storeId: storeId?.id, itemId: item?.id },
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
      }
    }

    if (status && (documentType === documentTypes.serviceGrn || documentType === documentTypes.serviceQr)) {
      const serviceChallan = await models.Documents.findOne({
        where: {
          companyId,
          documentNumber: challan_number,
          documentType: documentTypes.serviceChallan
        }
      });

      if (serviceChallan && (serviceChallan.addStockOn === 'GRN' || documentType === documentTypes.serviceQr)) {
        documentType === documentTypes.serviceGrn && await models.Documents.update({ addStockOn: 'GRN' },
          {
            where: {
              documentNumber,
              companyId
            }
          });
        const settings = await models.Settings.findOne({
          where: {
            companyId: Number(companyId)
          },
          raw: true
        });
        const approval = await models.InventoryApproval.create({
          approvalId: generateProductionId(),
          documentType,
          documentNumber,
          approvalStatus: settings?.['serviceDocument'] == 'manual' ? 'Pending' : 'Auto Approved',
          requestedBy: createdBy,
          companyId: companyId,
          status: 1,
          approvedBy: null
        });
        const existingItems = await models.Items.findAll({ where: { companyId: Number(companyId) } });
        const stores = await models.Store.findAll({ where: { companyId: Number(companyId) } });
        const itemsMap = new Map(existingItems.map(existingItem => [existingItem.itemId, existingItem.id]));
        const storesMap = new Map(stores.map(store => [store.name, store.id]));

        await Promise.all([models.StoreItems.bulkCreate(items?.filter(item => item?.receivedToday).map(item => {
          const itemId = itemsMap.get(item.itemId) || null;
          const storeId = storesMap.get(store) || null;
          return {
            storeId,
            itemId,
            quantity: settings?.['serviceDocument'] == 'manual' ? 0 : (item?.receivedToday * (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0,
            status: 1,
            addedBy: createdBy,
            price: item?.price / (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1)),
            documentNumber: document.documentNumber,
            approvalId: approval.id,
            quantityForApproval: (item?.receivedToday * (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0
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
            quantity: settings?.['serviceDocument'] == 'manual' ? null : (item?.receivedToday * (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0,
            toStoreId: storeId,
            transferDate: new Date().toISOString(),
            transferredBy: createdBy,
            comment: '',
            companyId,
            price: item?.price / (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1)),
            documentNumber: document.documentNumber,
            documentType,
            approvalId: approval.id,
            quantityForApproval: (item?.receivedToday * (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0
          }
        })),
        ]
        );

        if (documentType === documentTypes.serviceQr) {
          await Promise.all([models.StoreItems.bulkCreate(items?.filter(item => item.pendingQuantity).map(item => {
            const itemId = itemsMap.get(item.itemId) || null;
            const storeId = storesMap.get(rejectedStore) || null;
            return {
              storeId,
              itemId,
              quantity: settings?.['serviceDocument'] == 'manual' ? 0 : (item.pendingQuantity * (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0,
              status: 1,
              addedBy: createdBy,
              price: item?.price / (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1)),
              isRejected: true,
              documentNumber: document.documentNumber,
              approvalId: approval.id,
              quantityForApproval: (item.pendingQuantity * (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0
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
              quantity: settings?.['serviceDocument'] == 'manual' ? 0 : (item.pendingQuantity * (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0,
              toStoreId: storeId,
              transferDate: new Date().toISOString(),
              transferredBy: createdBy,
              comment: '',
              companyId,
              price: item?.price / (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1)),
              documentNumber: document.documentNumber,
              documentType,
              isRejected: true,
              approvalId: approval.id,
              quantityForApproval: (item.pendingQuantity * (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0
            }
          })),
          ]);
        }
      }
    }

    if (status && (documentType === documentTypes.debitNote || documentType === documentTypes.creditNote) && invoiceNumber) {
      const invoice = await models.Documents.findOne({
        where: {
          companyId,
          documentNumber: invoiceNumber
        }
      });
      const total = items?.reduce((acc, curr) => acc + (curr?.totalAfterTax || 0), 0);
      if (invoice) {
        if (documentType === documentTypes.creditNote) {
          await invoice.update({
            creditSetOff: Number(invoice.creditSetOff || 0) + Number(total)
          });
        } else {
          await invoice.update({
            debitSetOff: Number(invoice.debitSetOff || 0) + Number(total)
          });
        }
      }
    }

    if (status && productionId && documentType === 'Service Order') {
      await models.Production.update({ serviceOrderNumber: documentNumber }, {
        where: {
          id: Number(productionId)
        }
      });
    }

    if (status && documentType === "Service Challan" && ServiceConfirmationNumber) {
      const production = await models.Production.findOne({
        where: {
          companyId: Number(companyId),
          serviceOrderNumber: ServiceConfirmationNumber
        },
        raw: true
      });
      if (production) {

        const itemsMap = items?.reduce((acc, curr) => {
          acc[curr.itemId] = curr.quantity;
          return acc;
        }, {});
        const itemsPriceMap = items?.reduce((acc, curr) => {
          acc[curr.itemId] = curr.price;
          return acc;
        }, {});
        const productionRawMaterial = await models.ProductionRawMaterials.findAll({
          where: {
            productionId: production.id
          }
        });
        for (const element of productionRawMaterial) {
          if (itemsMap[element.itemId]) {
            await element.update({
              consumedQuantity: (element.consumedQuantity || 0) + itemsMap[element.itemId],
              averagePrice: itemsMap[element.itemId] * itemsPriceMap[element.itemId]
            });
          }
        }
      }

    }

    if (status && (documentType === 'Service Grn' || documentType === 'Service Qr') && ServiceConfirmationNumber) {
      const serviceChallan = await models.Documents.findOne({
        where: {
          companyId,
          documentNumber: challan_number,
          documentType: documentTypes.serviceChallan
        }
      });
      const production = await models.Production.findOne({
        where: {
          companyId: Number(companyId),
          serviceOrderNumber: ServiceConfirmationNumber
        },
        raw: true
      });
      if (production && serviceChallan) {
        const finishedGoods = await models.ProductionFinishedGoods.findAll({
          where: {
            productionId: production.id
          }
        });
        for (const element of finishedGoods) {
          if (documentType === 'Service Grn') {
            element.update({
              producedQuantity: items[0].receivedToday,
              passedQuantity: serviceChallan.addStockOn === 'GRN' ? items[0].receivedToday : 0,
              rejectQuantity: 0
            });
          } else {
            element.update({
              producedQuantity: (items[0].receivedToday || 0) + (items[0].pendingQuantity || 0),
              passedQuantity: items[0].receivedToday,
              rejectQuantity: items[0].pendingQuantity
            });
          }
        }
      }
    }

    if (status && (documentType == documentTypes.stockTransferDeliveryChallan)) {
      const existingItems = await models.Items.findAll({
        where: {
          companyId,
          itemId: {
            [Op.in]: items.map(item => item.itemId)
          }
        },
        attributes: ['id', 'itemId'],
        raw: true
      });

      const itemsMap = existingItems.reduce((acc, curr) => {
        acc[curr.itemId] = curr.id;
        return acc;
      }, {});

      const fromStore = await models.Store.findOne({
        where: {
          companyId,
          name: store
        }
      });
      const rejectStore = await models.Store.findOne({
        where: {
          companyId,
          name: rejectedStore
        }
      });
      for (const element of items) {
        let remainingQuantity = element.quantity;
        const existingStock = await models.StoreItems.findAll({
          where: { storeId: fromStore.id, itemId: itemsMap[element.itemId], isRejected: (element?.isRejected || false) },
          order: [['createdAt', 'ASC']],
        });
        for (const stock of existingStock) {
          if (remainingQuantity <= 0) break;
          if (stock.quantity <= 0) continue;
          const deductQty = Math.min(stock.quantity, remainingQuantity);
          remainingQuantity -= deductQty;

          // Reduce quantity from source store
          await models.StoreItems.update(
            { quantity: (stock.quantity - deductQty) },
            { where: { id: stock.id } }
          );

          await models.StockTransfer.create({
            transferNumber: generateTransferNumber(),
            fromStoreId: fromStore?.id,
            itemId: itemsMap[element.itemId],
            quantity: deductQty,
            toStoreId: rejectStore.id,
            transferDate: new Date().toISOString(),
            transferredBy: companyId,
            companyId,
            price: stock.price,
            isRejected: element?.toReject || false
          });

          if (element.isRejected != element.toReject) {
            await models.StockTransfer.create({
              transferNumber: generateTransferNumber(),
              fromStoreId: fromStore?.id,
              itemId: itemsMap[element.itemId],
              quantity: deductQty,
              toStoreId: rejectStore.id,
              transferDate: new Date().toISOString(),
              transferredBy: companyId,
              companyId,
              price: stock.price,
              isRejected: element?.isRejected || false
            });
          }

          await models.StoreItems.create({
            storeId: rejectStore.id,
            itemId: itemsMap[element.itemId],
            quantity: deductQty,
            status: 1,
            addedBy: companyId,
            price: stock.price,
            isRejected: element?.toReject || false
          });
        }
      }
    }

    if (status && (documentType === 'Service Confirmation Grn' || documentType === 'Service Confirmation Qr')) {
      await models.DocumentItems.create({
        documentNumber,
        companyId: companyId,
        itemId: finishedGood.itemId,
        itemName: finishedGood.itemName,
        UOM: finishedGood.uom,
        type: 'Finished Good',
        quantity: finishedGood.quantity
      });
      if (addStockOn === 'GRN' || documentType === 'Service Confirmation Qr') {
        const settings = await models.Settings.findOne({
          where: {
            companyId: Number(companyId)
          },
          raw: true
        });
        const approval = await models.InventoryApproval.create({
          approvalId: generateProductionId(),
          documentType,
          documentNumber,
          approvalStatus: settings?.['serviceDocument'] == 'manual' ? 'Pending' : 'Auto Approved',
          requestedBy: createdBy,
          companyId: companyId,
          status: 1,
          approvedBy: null
        });
        const existingItems = await models.Items.findAll({ where: { companyId: Number(companyId) } });
        const stores = await models.Store.findAll({ where: { companyId: Number(companyId) } });
        const itemsMap = new Map(existingItems.map(existingItem => [existingItem.itemId, existingItem.id]));
        const storesMap = new Map(stores.map(store => [store.name, store.id]));

        await Promise.all([models.StoreItems.bulkCreate(items?.filter(item => item?.receivedToday).map(item => {
          const itemId = itemsMap.get(item.itemId) || null;
          const storeId = storesMap.get(store) || null;
          return {
            storeId,
            itemId,
            quantity: settings?.['serviceDocument'] == 'manual' ? 0 : (item?.receivedToday * (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0,
            status: 1,
            addedBy: createdBy,
            price: item?.price / (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1)),
            documentNumber: document.documentNumber,
            approvalId: approval.id,
            quantityForApproval: (item?.receivedToday * (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0
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
            quantity: settings?.['serviceDocument'] == 'manual' ? null : (item?.receivedToday * (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0,
            toStoreId: storeId,
            transferDate: new Date().toISOString(),
            transferredBy: createdBy,
            comment: '',
            companyId,
            price: item?.price / (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1)),
            documentNumber: document.documentNumber,
            documentType,
            approvalId: approval.id,
            quantityForApproval: (item?.receivedToday * (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0
          }
        })),
        ]
        );

        if (documentType === 'Service Confirmation Qr') {
          await Promise.all([models.StoreItems.bulkCreate(items?.filter(item => item.pendingQuantity).map(item => {
            const itemId = itemsMap.get(item.itemId) || null;
            const storeId = storesMap.get(rejectedStore) || null;
            return {
              storeId,
              itemId,
              quantity: settings?.['serviceDocument'] == 'manual' ? 0 : (item.pendingQuantity * (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0,
              status: 1,
              addedBy: createdBy,
              price: item?.price / (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1)),
              isRejected: true,
              documentNumber: document.documentNumber,
              approvalId: approval.id,
              quantityForApproval: (item.pendingQuantity * (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0
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
              quantity: settings?.['serviceDocument'] == 'manual' ? 0 : (item.pendingQuantity * (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0,
              toStoreId: storeId,
              transferDate: new Date().toISOString(),
              transferredBy: createdBy,
              comment: '',
              companyId,
              price: item?.price / (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1)),
              documentNumber: document.documentNumber,
              documentType,
              isRejected: true,
              approvalId: approval.id,
              quantityForApproval: (item.pendingQuantity * (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0
            }
          })),
          ]);
        }
      }
    }

    if (status && (documentType == 'Service Confirmation Grn')) {
      if (bomName) {
        const bomSeries = await models.BOMSeries.findOne({
          where: {
            companyId: Number(companyId),
            default: 1
          }
        });
        const bom = await models.BOMDetails.create(
          {
            bomId: bomSeries ? (bomSeries?.prefix + bomSeries?.nextNumber) : generateProductionId(),
            bomName,
            status: 1,
            bomDescription: '',
            companyId: Number(companyId),
            userId: Number(createdBy)
          }
        );
        bomSeries && await bomSeries.update({ nextNumber: bomSeries?.nextNumber + 1 });
        const itemIds = [...items, finishedGood]?.map(item => item?.itemId);
        const existingItems = await models.Items.findAll({
          where: {
            companyId: Number(companyId),
            itemId: {
              [Op.in]: itemIds
            }
          },
          raw: true,
          attributes: ['id', 'itemId', 'metricsUnit']
        });
        const itemsMap = existingItems?.reduce((acc, curr) => {
          acc[curr.itemId] = curr.metricsUnit;
          return acc;
        }, {});
        const payload = items.map((item) => ({
          bomId: bom.id,
          itemId: item.itemId,
          itemName: item.itemName,
          uom: itemsMap[item.itemId],
          quantity: item.receivedToday || item.quantity,
          userId: Number(createdBy) || null,
          companyId: companyId || null,
          status: 1
        }));

        await models.BOMRawMaterial.bulkCreate(payload);
        await models.BOMFinishedGoods.create({
          bomId: bom.id,
          itemId: finishedGood.itemId,
          itemName: finishedGood.itemName,
          uom: itemsMap[finishedGood.itemId],
          quantity: finishedGood.quantity,
          userId: Number(createdBy),
          companyId,
          status: 1,
        });
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
  try {

    const { companyId, counts, createdBy, approvedBy, requestedBy, currentPage, labels, pageSize, documentType = '', search = '', dealStatus, docTypeFilter, dateRange } = req.body;

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
      case "serviceConfirmation":
        documentstype = serviceConfirmationDocuments;
        break;
      default:
        break;
    }

    let dateFilter = {};
    if (dateRange && Array.isArray(dateRange) && dateRange.length === 2) {
      const [startDate, endDate] = dateRange;
      dateFilter = {
        createdAt: {
          [Op.between]: [
            new Date(startDate + 'T00:00:00.000Z'),
            new Date(endDate + 'T23:59:59.999Z')
          ]
        }
      };
    }

    let documents = [];
    if (!currentPage || !pageSize) {
      documents = await models.Documents.findAll({
        where: {
          companyId,
          ...dateFilter
        },
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
          ...dateFilter,
          ...(documentstype.length > 0 && {
            documentType: {
              [Op.in]: documentstype
            }
          }),
          ...(requestedBy ? { createdBy: requestedBy } : {}),
          ...(approvedBy ? { approvedBy: approvedBy } : {}),
          ...(Array.isArray(dealStatus) && dealStatus.length > 0
            ? {
              status: {
                [Op.in]: dealStatus,
              },
            }
            : {
              status: {
                [Op.not]: 2,
              },
            }),
          ...(!dealStatus && counts
            ? {
              status: {
                [Op.notIn]: [29, 30],
              },
            }
            : {
            }),
          ...(docTypeFilter?.length > 0 ? !createdBy ? {
            documentType: {
              [Op.in]: docTypeFilter,
            },
          } : {
            [Op.or]: [
              {
                documentType: {
                  [Op.in]: docTypeFilter
                }
              },
              {
                createdBy: Number(createdBy),
                documentType: {
                  [Op.in]: [
                    'Sales Quotation',
                    'Sales Order',
                    'Invoice',
                    'Purchase Request',
                    'Purchase Order',
                    'Purchase Invoice',
                  ]
                }
              }
            ],
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
          ...(labels?.length > 0 && {
            [Op.or]: labels.map(label =>
              where(
                fn("LOWER", cast(col("labels"), "text")),
                { [Op.like]: `%${label?.toLowerCase()}%` }
              )
            ),
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
        limit: pageSize,
        offset,
      });
    }

    if (!documents || ((documents?.rows?.length === 0 || documents?.length === 0) && !counts)) {
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

    if ((!currentPage || !pageSize) || (pageSize == 5000)) {
      return res.status(200).json(formattedResult)
    }

    if (counts) {
      const [pending, reject, approved] = await Promise.all([
        models.Documents.count({
          where: {
            status: 29,
            companyId: Number(companyId),
            [Op.or]: [
              {
                documentType: {
                  [Op.in]: docTypeFilter
                }
              },
              {
                createdBy: Number(createdBy),
                documentType: {
                  [Op.in]: [
                    'Sales Quotation',
                    'Sales Order',
                    'Invoice',
                    'Purchase Request',
                    'Purchase Order',
                    'Purchase Invoice',
                  ]
                }
              }
            ]
          }
        }),
        models.Documents.count({
          where: {
            status: 30,
            companyId: Number(companyId),
            [Op.or]: [
              {
                documentType: {
                  [Op.in]: docTypeFilter
                }
              },
              {
                createdBy: Number(createdBy),
                documentType: {
                  [Op.in]: [
                    'Sales Quotation',
                    'Sales Order',
                    'Invoice',
                    'Purchase Request',
                    'Purchase Order',
                    'Purchase Invoice',
                  ]
                }
              }
            ]
          }
        }),
        models.Documents.count({
          where: {
            companyId: Number(companyId),
            status: {
              [Op.notIn]: [2, 29, 30]
            },
            [Op.or]: [
              {
                documentType: {
                  [Op.in]: docTypeFilter
                }
              },
              {
                createdBy: Number(createdBy),
                documentType: {
                  [Op.in]: [
                    'Sales Quotation',
                    'Sales Order',
                    'Invoice',
                    'Purchase Request',
                    'Purchase Order',
                    'Purchase Invoice',
                  ]
                }
              }
            ]

          }
        })
      ]);
      return res.status(200).json({
        total: documents.count,
        currentPage,
        pageSize,
        data: formattedResult,
        approveCount: approved,
        rejectedCount: reject,
        pendingCount: pending
      });
    }

    res.status(200).json({
      total: documents.count,
      currentPage,
      pageSize,
      data: formattedResult
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong, please try again later!" });
  }
}

async function getDocumentById(req, res) {
  try {
    const { documentNumber, companyId } = req.body;

    const document = await models.Documents.findOne({
      where: { documentNumber, companyId },
      include: [{ model: models.LogisticDetails, as: 'logisticDetails' }],
      raw: true,
      nest: true
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    const [items, additionalCharges, bankDetails, termsCondition, attachments, documentComments] = await Promise.all([
      models.DocumentItems.findAll({ where: { documentNumber, companyId }, raw: true }),
      models.DocumentAdditionalCharges.findAll({ where: { documentNumber, companyId }, raw: true }),
      models.DocumentBankDetails.findOne({ where: { documentNumber, companyId }, raw: true }),
      models.CompanyTermsCondition.findOne({ where: { companyId, documentNumber }, raw: true }),
      models.DocumentAttachments.findAll({ where: { documentNumber, companyId }, raw: true }),
      models.DocumentComments.findAll({ where: { documentId: document.id }, raw: true }),
    ]);

    const response = {
      ...document,
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

    if (document.documentType === documentTypes.goodsReceive || document.documentType === documentTypes.qualityReport) {
      const batchItems = await models.BatchItems.findAll({
        where: {
          companyId,
          documentNumber: document.documentNumber
        },
        raw: true
      });
      const batchMap = batchItems.reduce((acc, current) => {
        if (acc[current.item]) {
          const obj = acc[current.item];
          acc[current.item] = [...obj, current];
        }
        else {
          acc[current.item] = [current];
        }
        return acc;
      }, {});
      const itemsId = batchItems.map(batch => batch.item);
      const items = await models.Items.findAll({
        where: {
          id: {
            [Op.in]: itemsId
          }
        },
        attributes: ['id', 'itemName', 'itemId'],
        raw: true
      });
      const batches = {};
      for (const item of items) {
        batches[item.itemId] = batchMap[item.id];
      }
      response.batches = batches;
    }

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
      });
      await models.BatchItems.update({ status: 0 }, {
        where: {
          documentNumber: document.documentNumber,
          companyId
        }
      });
      await models.Batches.update({ status: 0 }, {
        where: {
          documentNumber: document.documentNumber,
          companyId
        }
      });
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

async function shortCloseTransaction(req, res) {
  const { documentId } = req.body;
  try {
    if (!documentId) {
      return res.status(400).json({
        message: "Document ID is required",
      });
    }
    const document = await models.Documents.findOne({
      where: {
        id: documentId
      }
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }
    const status = document.documentType === documentTypes.purchaseOrder ? 27 : 22;
    await document.update({ status });

    return res.status(200).json({
      message: 'Transction Short Closed Successfully.'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
}

async function getSalesDocumentItems(req, res) {
  const { documentNumber, documentType, companyId } = req.body;
  try {
    const documents = await models.Documents.findAll({
      where: {
        companyId: Number(companyId),
        documentType,
        orderConfirmationNumber: documentNumber
      },
      raw: true
    });

    const documentIds = documents?.map(data => data.documentNumber);

    const documentItems = await models.DocumentItems.findAll({
      where: {
        companyId: Number(companyId),
        documentNumber: {
          [Op.in]: documentIds
        }
      },
      raw: true
    });
    const itemsmap = documentItems?.reduce((acc, curr) => {
      acc[curr.itemId] = (acc[curr.itemId] || 0) + curr.quantity;
      return acc;
    }, {});

    return res.status(200).json({
      itemsData: itemsmap,
      message: 'Data Fetched Successfully.'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
}

async function editDocument(req, res) {
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
      supplierGSTNumber = null,
      is_refered = null,
      addStockOn = '',
      isDraft = false,
      purpose = '',
      requiredDate = null,
      requestedBy = '',
      department = '',
      showUnits = null,
      batches = null,
      supplyState = ''
    } = req.body;

    const document = await models.Documents.findOne({
      where: {
        documentNumber,
        companyId: Number(companyId)
      }
    });
    if (!document) return res.status(404).json({ message: 'Document not found.' });

    if (documentType == 'Sales Lead') {
      const document = await models.Documents.findOne({
        where: {
          enquiryNumber: documentNumber,
          companyId: Number(companyId),
          documentType: {
            [Op.ne]: 'Sales Lead'
          }
        }
      });
      if (document) {
        return res.status(400).json({ message: 'This document reference is available in other document. It is not be deleted.' });
      }
    }
    else if (documentType == 'Sales Quotation') {
      const document = await models.Documents.findOne({
        where: {
          quotationNumber: documentNumber,
          companyId: Number(companyId),
          documentType: {
            [Op.notIn]: ['Sales Lead', 'Sales Quotation']
          }
        }
      });
      if (document) {
        return res.status(400).json({ message: 'This document reference is available in other document. It is not be deleted.' });
      }
    }
    else if (documentType == 'Sales Order') {
      const document = await models.Documents.findOne({
        where: {
          orderConfirmationNumber: documentNumber,
          companyId: Number(companyId)
        }
      });
      if (document) {
        return res.status(400).json({ message: 'This document reference is available in other document. It is not be deleted.' });
      }
    }
    else if (documentType == 'Proforma Invoice') {
      const document = await models.Documents.findOne({
        where: {
          performaInvoiceNumber: documentNumber,
          companyId: Number(companyId)
        }
      });
      if (document) {
        return res.status(400).json({ message: 'This document reference is available in other document. It is not be deleted.' });
      }
    }
    else if (documentType == 'Purchase Request') {
      const document = await models.Documents.findOne({
        where: {
          indent_number: {
            [Op.like]: `%${documentNumber},%`,
          },
          companyId: Number(companyId)
        }
      });
      if (document) {
        return res.status(400).json({ message: 'This document reference is available in other document. It is not be deleted.' });
      }
    }
    else if (documentType == 'Purchase Order') {
      const document = await models.Documents.findOne({
        where: {
          purchaseOrderNumber: documentNumber,
          companyId: Number(companyId)
        }
      });
      if (document) {
        return res.status(400).json({ message: 'This document reference is available in other document. It is not be deleted.' });
      }
    }

    await document.update({
      documentType,
      documentNumber,
      buyerName,
      documentTo,
      buyerBillingAddress,
      advancePayment,
      GSTValue,
      buyerGSTNumber,
      supplierGSTNumber,
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
      showUnits,
      supplyState
    });

    await models.CompanyTermsCondition.destroy({
      where: {
        companyId,
        documentNumber
      }
    });

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
            additionalDetails: item?.additionalDetails,
            customFields: item?.customFields
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
          documentId: document.id,
          commentText: documentComments,
          createdBy: createdBy,
          createdAt: new Date(),
          updatedAt: new Date()
        }),
    ]);

    res.status(200).json({ message: 'Document Updated Successfully' });

  } catch (error) {
    res.status(400).json({
      message: 'Something went wrong',
      error
    });
  }

}

async function getServiceChallanItems(req, res) {
  const { serviceOrderNumber, companyId, grn } = req.body;
  try {
    const production = await models.Production.findOne({
      where: {
        serviceOrderNumber: serviceOrderNumber,
        companyId: Number(companyId)
      }, raw: true
    });
    if (!production) {
      return res.status(200).json({
        data: []
      });
    }

    const productionRawMaterial = !grn ? await models.ProductionRawMaterials.findAll({
      where: {
        productionId: production.id
      }, raw: true
    }) : await models.ProductionFinishedGoods.findAll({
      where: {
        productionId: production.id
      }, raw: true
    })

    res.status(200).json({
      data: productionRawMaterial
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
}

async function approveDocument(req, res) {
  try {
    const { isApproved, documentNumber, companyId, userId, reduceStockOnIV } = req.body;
    if (!isApproved) {
      await models.Documents.update({ status: 30, approvedBy: userId }, {
        where: {
          companyId: Number(companyId),
          documentNumber
        }
      })
    } else {
      const document = await models.Documents.findOne({
        where: {
          companyId: Number(companyId),
          documentNumber
        }
      });

      const items = await models.DocumentItems.findAll({
        where: {
          companyId,
          documentNumber
        }
      })
      // Handle Sales Quotation Approval
      if (document?.documentType === documentTypes.salesQuotation && document?.enquiryNumber) {
        const existingDocument = await models.Documents.findOne({
          where: { documentNumber: document?.enquiryNumber, companyId },
        });

        if (existingDocument) {
          await existingDocument.update({
            quotationNumber: documentNumber,
            is_refered: true,
            status: 8
          });
        }
      }

      // Handle Sales Order Approval
      if (document?.documentType === documentTypes.orderConfirmation && document?.quotationNumber) {
        const existingDocument = await models.Documents.findOne({
          where: { documentNumber: document?.quotationNumber, companyId },
        });

        if (existingDocument) {
          await existingDocument.update({
            orderConfirmationNumber: documentNumber,
            is_refered: true,
            status: 9
          });
        }
      }

      // Handle Invoice Approval
      if (document?.documentType === documentTypes.invoice && document?.orderConfirmationNumber) {
        const existingDocument = await models.Documents.findOne({
          where: { documentNumber: document?.orderConfirmationNumber, companyId },
        });
        if (existingDocument) {
          // Find all Document Items against orderConfirmationNumber 
          const documentItems = await models.DocumentItems.findAll({
            where: {
              companyId,
              documentNumber: document?.orderConfirmationNumber
            }
          });

          // Create a map of documentsItems with Items id as key and quantity as value
          const documentsItemMap = documentItems?.reduce((acc, current) => {
            acc[current.itemId] = current.quantity;
            return acc;
          }, {});

          // find all previously created Delivery Challan or invoice against same orderConfirmationNumber
          const deliveryChallan = await models.Documents.findAll({
            where: {
              orderConfirmationNumber: document.orderConfirmationNumber,
              documentType: 'Invoice',
              companyId,
              status: {
                [Op.notIn]: [0, 2, 29, 30]
              }
            }
          });

          const documentNumbers = deliveryChallan.map(doc => doc.documentNumber);

          // find All Document Items against previously created delivery challan or Invoice
          const deliveryChallanItems = await models.DocumentItems.findAll({
            where: {
              documentNumber: documentNumbers,
              companyId
            }
          });

          // Create deliverychallan or invoice items map where item id is key and quantity as value
          const deliveryChallanItemsMap = deliveryChallanItems?.reduce((acc, current) => {
            !acc[current?.itemId] ? acc[current?.itemId] = current.quantity : acc[current?.itemId] += current.quantity;
            return acc;
          }, {});
          // // Add quantity of existing items in dellivery challan items map
          for (const item of items) {
            if (deliveryChallanItemsMap[item.itemId]) deliveryChallanItemsMap[item.itemId] += Number(item.quantity);
            else deliveryChallanItemsMap[item.itemId] = Number(item.quantity);
          }

          let statusCode = 0, handleStatus = existingDocument.status;

          // comapare documentsItem map and delivery challam items map 
          for (const elem of Object.keys(documentsItemMap)) {
            if (documentsItemMap[elem] > deliveryChallanItemsMap[elem] || !deliveryChallanItemsMap[elem]) {
              statusCode = document.documentType === documentTypes.invoice ? 12 : 10;
              break;
            }
          }

          if (!statusCode) {
            // handle completely billing status
            if (existingDocument.status === 1 || existingDocument.status === 12) {
              handleStatus = 13;
            }
            // handle partially delivered completely billed
            if (existingDocument.status === 10 || existingDocument.status == 19) {
              handleStatus = 20;
            }
            // handle completely delivered completely billed
            if (existingDocument.status === 11 || existingDocument.status === 21) {
              handleStatus = 22;
            }
          }
          else {
            // handle partially billing status
            if (existingDocument.status === 1 || existingDocument.status === 12) {
              handleStatus = 12;
            }
            // handle partially delivered partially billed
            if (existingDocument.status === 10) {
              handleStatus = 19;
            }
            // handle completely delivered partially billed
            if (existingDocument.status === 11) {
              handleStatus = 21;
            }
          }

          // update the status accordingly
          await existingDocument.update({
            status: handleStatus
          });
        }
      }

      if (document?.documentType === documentTypes.invoice && reduceStockOnIV === "true") {
        const storeId = await models.Store.findOne({
          where: {
            name: document.store,
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
              transferNumber: generateTransferNumber(),
              fromStoreId: storeId.id || null,
              itemId: item.id,
              quantity: deductQty * -1,
              toStoreId: null,
              transferDate: new Date().toISOString(),
              transferredBy: companyId,
              comment: '',
              companyId,
              price: element.price / (element.conversionFactor || 1),
              documentNumber: document.documentNumber,
              documentType: 'Invoice',
              actualPrice: stock.price
            });
            price += (stock.price * deductQty);
          }
        }
      }
      // Handle Purchase Order Approval
      if (document?.documentType === documentTypes.purchaseOrder && document?.indent_number) {
        const indent_numbers = document?.indent_number.split(',');
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

      // Handle Purchase Invoice
      if ((document?.documentType === documentTypes.purchaseInvoice) && document?.purchaseOrderNumber) {
        const existingDocument = await models.Documents.findOne({
          where: { documentNumber: document?.purchaseOrderNumber, companyId },
        });
        const documentItems = await models.DocumentItems.findAll({
          where: {
            companyId,
            documentNumber: document.purchaseOrderNumber
          }
        });
        const documentsItemMap = documentItems?.reduce((acc, current) => {
          acc[current.itemId] = current.quantity;
          return acc;
        }, {});

        console.log('documentmap', documentsItemMap);

        const purchaseDoc = await models.Documents.findAll({
          where: {
            purchaseOrderNumber: document.purchaseOrderNumber,
            documentType: 'Purchase Invoice',
            companyId,
            status: {
              [Op.notIn]: [0, 2, 29, 30]
            }
          }
        });

        const documentNumbers = purchaseDoc.map(doc => doc.documentNumber);

        const purchaseDocItems = await models.DocumentItems.findAll({
          where: {
            documentNumber: documentNumbers,
            companyId
          }
        });

        const purchaseDocItemsMap = purchaseDocItems?.reduce((acc, current) => {
          !acc[current?.itemId] ? acc[current?.itemId] = (current.receivedToday || current.quantity) : acc[current?.itemId] += (current.receivedToday || current.quantity);
          return acc;
        }, {});
        console.log(purchaseDocItemsMap);
        // Add quantity of existing items in purchase documents items map
        for (const item of items) {
          if (purchaseDocItemsMap[item.itemId]) purchaseDocItemsMap[item.itemId] += Number(item.receivedToday || item.quantity);
          else purchaseDocItemsMap[item.itemId] = Number(item.receivedToday || item.quantity);
        }

        console.log('objectdata', purchaseDocItemsMap, documentsItemMap)
        let statusCode = 0, handleStatus = existingDocument.status;

        // comapare documentsItem map and delivery challam items map 
        for (const elem of Object.keys(documentsItemMap)) {
          if (documentsItemMap[elem] > purchaseDocItemsMap[elem]) {
            statusCode = 1;
            break;
          }
        }

        if (!statusCode) {
          for (const elem of Object.keys(documentsItemMap)) {
            if (documentsItemMap[elem] < purchaseDocItemsMap[elem]) {
              statusCode = 2;
              break;
            }
          }
        }

        if (statusCode == 1) {
          if (existingDocument.status === 1 || existingDocument.status === 12) {
            handleStatus = 12;
          }
          if (existingDocument.status === 4) {
            handleStatus = 23;
          }
          if (existingDocument.status === 5) {
            handleStatus = 24;
          }
          if (existingDocument.status === 6) {
            handleStatus = 25;
          }
        } else if (statusCode == 0) {
          if (existingDocument.status === 1 || existingDocument.status === 12) {
            handleStatus = 12;
          }
          if (existingDocument.status === 4 || existingDocument.status === 23) {
            handleStatus = 26;
          }
          if (existingDocument.status === 5 || existingDocument.status === 24) {
            handleStatus = 27;
          }
          if (existingDocument.status === 6 || existingDocument.status === 25) {
            handleStatus = 28;
          }
        } else {
          if (existingDocument.status === 1 || existingDocument.status === 12) {
            handleStatus = 12;
          }
          if (existingDocument.status === 4 || existingDocument.status === 23) {
            handleStatus = 26;
          }
          if (existingDocument.status === 5 || existingDocument.status === 24) {
            handleStatus = 27;
          }
          if (existingDocument.status === 6 || existingDocument.status === 25) {
            handleStatus = 28;
          }
        }
        await existingDocument.update({
          status: handleStatus
        });

      }

      await models.Documents.update({ status: 1, approvedBy: userId }, {
        where: {
          companyId: Number(companyId),
          documentNumber
        }
      })

    }
    res.status(200).json({
      message: 'Document Status Updated.'
    });
  } catch (error) {
    console.log(error)
    res.status(500).json({
      message: 'Something went wrong',
      error
    });
  }
}

module.exports = {
  getDocuments,
  getDocumentById,
  createDocument,
  discardDocument,
  deleteDocument,
  getPreviewDocuments,
  getDocumentItems,
  shortCloseTransaction,
  getSalesDocumentItems,
  editDocument,
  getServiceChallanItems,
  approveDocument
};
