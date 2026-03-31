const { Op, fn, col, where, cast } = require('sequelize');
const models = require('../models');
const { documentTypes, purchaseDocuments, salesDocuments, serviceDocuments, serviceConfirmationDocuments } = require('../helpers/document-type');
const { generateTransferNumber, generateProductionId } = require('../helpers/transfer-number');
const { getTodayDateInIST, gstStateCodes } = require('../helpers/helper');
const { isValidJSON } = require('../helpers/add-level');
const axios = require('axios');
const nodemailer = require('nodemailer');
const path = require("path");
const fs = require("fs");

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
      serviceOrderDate = '',
      contactPerson = '',
      storeInItemLevel = false,
      hideColumns = []
    } = req.body;

    let message = '';

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
      contactPerson,
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
      serviceOrderNumber,
      hideColumns
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
      contactPerson,
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
      serviceOrderNumber,
      hideColumns
    }, {
      where: {
        companyId,
        documentNumber
      }
    });

    if (documentType != documentTypes.purchaseInvoice && !isDraft) {
      if (seriesId) {
        const documentSeries = await models.DocumentSeries.findOne({
          where: {
            id: seriesId
          }
        });
        if (documentSeries) {
          await documentSeries.update({ nextNumber: documentSeries.nextNumber + 1 });
        }
      }
      else {
        const defaultSeries = await models.DocumentSeries.findOne({
          where: {
            companyId: Number(companyId),
            DocType: documentType,
            default: 1
          }
        });
        if (defaultSeries) {
          await defaultSeries.update({ nextNumber: defaultSeries.nextNumber + 1 });
        }
      }
    }

    if (status && documentType === documentTypes.purchaseOrder && indent_number) {
      const indent_numbers = indent_number.split(',');
      const conversionFactorMap = {};
      const itemsMap = items.reduce((item, current) => {
        item[current.itemId] = current.quantity;
        conversionFactorMap[current.itemId] = current.conversionFactor || 1;
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
              if ((quantity + (itemsMap[current.itemId] * ((conversionFactorMap[current.itemId] || 1) / (current.conversionFactor || 1)))) > current.quantity) {
                remaining = (quantity + (itemsMap[current.itemId] * ((conversionFactorMap[current.itemId] || 1) / (current.conversionFactor || 1)))) - current.quantity;
                quantity = current.quantity;
                current.receivedToday = quantity;
                consumeItemsMap[current?.itemId] = (itemsMap[current.itemId] * ((conversionFactorMap[current.itemId] || 1) / (current.conversionFactor || 1))) - remaining;
              }
              else {
                quantity += (itemsMap[current.itemId] * ((conversionFactorMap[current.itemId] || 1) / (current.conversionFactor || 1)));
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
      const currentItemsMap = items.reduce((acc, current) => {
        acc[current.itemId] = Number(current.quantity);
        return acc;
      }, {});
      const orderConfirmationNumbers = await models.Documents.findAll({
        where: {
          companyId,
          documentNumber: {
            [Op.in]: orderConfirmationNumber.split(",")
          },
          documentType: 'Sales Order'
        },
        attributes: ['documentNumber'],
        order: [['createdAt', 'ASC']]
      });
      for (const oc_number of orderConfirmationNumbers) {
        const existingDocument = await models.Documents.findOne({
          where: { documentNumber: oc_number.documentNumber, companyId },
        });
        if (existingDocument) {
          // Find all Document Items against orderConfirmationNumber 
          const documentItems = await models.DocumentItems.findAll({
            where: {
              companyId,
              documentNumber: oc_number.documentNumber
            }
          });

          // Create a map of documentsItems with Items id as key and quantity as value
          const documentsItemMap = documentItems?.reduce((acc, current) => {
            acc[current.itemId] = current.quantity;
            return acc;
          }, {});

          // Create deliverychallan or invoice items map where item id is key and quantity as value
          const deliveryChallanItemsMap = documentItems?.reduce((acc, current) => {
            acc[current.itemId] = documentType === "Invoice" ? current.pendingQuantity : current?.receivedQuantity
            return acc;
          }, {});
          // Add quantity of existing items in dellivery challan items map
          for (const item of items) {
            if (!documentsItemMap?.[item.itemId] || !currentItemsMap?.[item.itemId]) continue;
            const remainingNeeded = Math.max(0, documentsItemMap[item.itemId] - (deliveryChallanItemsMap[item.itemId] || 0));
            const amountToConsume = Math.min(remainingNeeded, currentItemsMap[item.itemId]);
            if (deliveryChallanItemsMap[item.itemId]) deliveryChallanItemsMap[item.itemId] += amountToConsume;
            else deliveryChallanItemsMap[item.itemId] = amountToConsume;
            currentItemsMap[item.itemId] -= amountToConsume;
            await models.DocumentItems.update(
              documentType === "Invoice"
                ? { pendingQuantity: deliveryChallanItemsMap[item.itemId] }
                : { receivedQuantity: deliveryChallanItemsMap[item.itemId] },
              {
                where: {
                  documentNumber: oc_number.documentNumber,
                  itemId: item.itemId,
                  companyId
                }
              }
            );
          }

          let statusCode = 0, handleStatus = existingDocument.status, returned = false, existingDocStatus = existingDocument.status;
          if (handleStatus > 32) {
            returned = handleStatus;
            if (handleStatus == 33 || handleStatus == 37) {
              existingDocStatus = 10;
            }
            else if (handleStatus == 34 || handleStatus == 38) {
              existingDocStatus = 11;
            }
            else if (handleStatus == 35 || handleStatus == 39) {
              existingDocStatus = 12;
            }
            else if (handleStatus == 36 || handleStatus == 40) {
              existingDocStatus = 13;
            }
            else if (handleStatus == 41 || handleStatus == 45) {
              existingDocStatus = 19;
            }
            else if (handleStatus == 42 || handleStatus == 46) {
              existingDocStatus = 20;
            }
            else if (handleStatus == 43 || handleStatus == 47) {
              existingDocStatus = 21;
            }
            else if (handleStatus == 44 || handleStatus == 48) {
              existingDocStatus = 22;
            }
          }

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
              if (existingDocStatus === 1 || existingDocStatus === 12) {
                handleStatus = 13;
              }
              // handle partially delivered completely billed
              if (existingDocStatus === 10 || existingDocStatus == 19) {
                handleStatus = 20;
              }
              // handle completely delivered completely billed
              if (existingDocStatus === 11 || existingDocStatus === 21) {
                handleStatus = 22;
              }
            } else {
              // handle completely deliver status
              if (existingDocStatus === 1 || existingDocStatus === 10) {
                handleStatus = 11;
              }
              // handle partially billed completely deliver
              if (existingDocStatus === 12 || existingDocStatus == 19) {
                handleStatus = 21;
              }
              // handle completely delivered completely billed
              if (existingDocStatus === 13 || existingDocStatus === 20) {
                handleStatus = 22;
              }
            }
          }
          else {
            if (documentType === documentTypes.invoice) {
              // handle partially billing status
              if (existingDocStatus === 1 || existingDocStatus === 12) {
                handleStatus = 12;
              }
              // handle partially delivered partially billed
              if (existingDocStatus === 10) {
                handleStatus = 19;
              }
              // handle completely delivered partially billed
              if (existingDocStatus === 11) {
                handleStatus = 21;
              }
            } else {
              // handle partially deliver status
              if (existingDocStatus === 1 || existingDocStatus === 10) {
                handleStatus = 10;
              }
              // handle partially billed partially deliver
              if (existingDocStatus === 12) {
                handleStatus = 19;
              }
              // handle partially delivered completely billed
              if (existingDocStatus === 13) {
                handleStatus = 20;
              }
            }
          }

          if (returned) {
            let partial = false;
            if (returned == 33 || returned == 34 || returned == 35 || returned == 36 ||
              returned == 41 || returned == 42 || returned == 43 || returned == 44
            ) partial = true;
            if (handleStatus == 10) {
              if (partial) {
                handleStatus = 33;
              }
              else {
                handleStatus = 37;
              }
            }
            else if (handleStatus == 11) {
              if (partial) {
                handleStatus = 34;
              }
              else {
                handleStatus = 38;
              }
            }
            else if (handleStatus == 12) {
              if (partial) {
                handleStatus = 35;
              }
              else {
                handleStatus = 39;
              }
            }
            else if (handleStatus == 13) {
              if (partial) {
                handleStatus = 36;
              }
              else {
                handleStatus = 40;
              }
            }
            else if (handleStatus == 19) {
              if (partial) {
                handleStatus = 41;
              }
              else {
                handleStatus = 45;
              }
            }
            else if (handleStatus == 20) {
              if (partial) {
                handleStatus = 42;
              }
              else {
                handleStatus = 46;
              }
            }
            else if (handleStatus == 21) {
              if (partial) {
                handleStatus = 43;
              }
              else {
                handleStatus = 47;
              }
            }
            else if (handleStatus == 22) {
              if (partial) {
                handleStatus = 44;
              }
              else {
                handleStatus = 48;
              }
            }
          }

          // update the status accordingly
          await existingDocument.update({
            status: handleStatus
          });
        }
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
            customFields: item?.customFields,
            imageUrl: item?.imageUrl,
            category: item?.category,
            store: item?.store
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
      if ((documentType === documentTypes.goodsReceive && purchase_order.addStockOn == 'GRN') || (documentType === documentTypes.qualityReport && purchase_order.addStockOn == 'QR')) {
        const settings = await models.Settings.findOne({
          where: {
            companyId: Number(companyId)
          },
          raw: true
        });
        const approvalCount = await models.InventoryApproval.count({
          where: {
            companyId
          }
        });
        const approval = await models.InventoryApproval.create({
          approvalId: `INA${approvalCount + 1}`,
          documentType,
          documentNumber,
          approvalStatus: settings?.['purchaseDocument'] == 'manual' ? 'Pending' : 'Auto Approved',
          requestedBy: createdBy,
          companyId: companyId,
          status: 1,
          approvedBy: null
        });
        message = settings?.['purchaseDocument'] == 'manual' ? 'inventory' : '';
        const purchaseItems = await models.DocumentItems.findAll({
          where: {
            companyId: Number(companyId),
            documentNumber: purchaseOrderNumber
          }
        });
        const total = purchaseItems?.reduce((acc, curr) => {
          acc += Number(curr.totalBeforeTax);
          return acc;
        }, 0);
        const purchaseAdditionalCharges = await models.DocumentAdditionalCharges.findAll({
          where: {
            documentNumber: purchaseOrderNumber,
            companyId: Number(companyId)
          }
        });

        const additionalCost = purchaseAdditionalCharges?.reduce((acc, curr) => {
          acc += Number(curr.total);
          return acc;
        }, 0) || 0;

        const priceMap = purchaseItems?.reduce((acc, curr) => {
          const percent = (Number(curr.totalBeforeTax) / total) * 100;
          acc[curr.itemId] = ((Number(curr.totalAfterTax)) + ((percent * additionalCost) / 100)) / curr.quantity;
          return acc;
        }, {});

        const purchaseInvoice = await models.Documents.findOne({
          where: {
            purchaseOrderNumber,
            documentType: "Purchase Invoice",
            companyId: Number(companyId)
          }
        });
        if (purchaseInvoice) {
          const purchaseItems = await models.DocumentItems.findAll({
            where: {
              companyId: Number(companyId),
              documentNumber: purchaseInvoice.documentNumber
            }
          });
          if (Array.isArray(purchaseItems) && purchaseItems.length) {
            purchaseItems.forEach((item) => {
              priceMap[item.itemId] = Number(item.totalAfterTax) / item.quantity
            })
          }
        }

        await Promise.all([models.StoreItems.bulkCreate(items?.filter(item => item?.receivedToday).map(item => {
          const itemId = itemsMap.get(item.itemId) || null;
          const storeId = (!storeInItemLevel ? storesMap.get(store) : storesMap.get(item?.store)) || null;
          return {
            storeId,
            itemId,
            quantity: settings?.['purchaseDocument'] == 'manual' ? 0 : ((item?.receivedToday * (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0),
            status: 1,
            addedBy: createdBy,
            price: (priceMap?.[item.itemId] || item?.price) / (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1)),
            documentNumber: document.documentNumber,
            approvalId: approval.id,
            quantityForApproval: (item?.receivedToday * (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0
          }
        })
        ),
        models.StockTransfer.bulkCreate(items?.filter(item => item?.receivedToday).map(item => {
          const itemId = itemsMap.get(item.itemId) || null;
          const storeId = (!storeInItemLevel ? storesMap.get(store) : storesMap.get(item?.store)) || null;
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
            price: (priceMap?.[item.itemId] || item?.price) / (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1)),
            documentNumber: document.documentNumber,
            documentType,
            approvalId: approval.id,
            quantityForApproval: (item?.receivedToday * (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0
          }
        })),
        ]
        );

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

    }

    if (status && (documentType == documentTypes.salesReturn)) {
      const settings = await models.Settings.findOne({
        where: {
          companyId: Number(companyId)
        },
        raw: true
      });
      const approvalCount = await models.InventoryApproval.count({
        where: {
          companyId
        }
      });
      const approval = await models.InventoryApproval.create({
        approvalId: `INA${approvalCount + 1}`,
        documentType,
        documentNumber,
        approvalStatus: settings?.['salesDocument'] == 'manual' ? 'Pending' : 'Auto Approved',
        requestedBy: createdBy,
        companyId: companyId,
        status: 1,
        approvedBy: null
      });
      message = settings?.['salesDocument'] == 'manual' ? 'inventory' : '';
      const existingItems = await models.Items.findAll({
        where: {
          companyId: Number(companyId),
          itemId: {
            [Op.in]: items.map(item => item.itemId)
          }
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
      await Promise.all([models.StoreItems.bulkCreate(items?.filter(item => item?.quantity).map(item => {
        const itemId = itemsMap.get(item.itemId) || null;
        const storeId = (!storeInItemLevel ? storesMap.get(store) : storesMap.get(item?.store)) || null;
        return {
          storeId,
          itemId,
          quantity: settings?.['salesDocument'] == 'manual' ? 0 : ((item?.quantity * (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0),
          status: 1,
          addedBy: createdBy,
          price: item?.price / (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1)),
          documentNumber: document.documentNumber,
          approvalId: approval.id,
          quantityForApproval: (item?.quantity * (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0
        }
      })
      ),
      models.StockTransfer.bulkCreate(items?.filter(item => item?.quantity).map(item => {
        const itemId = itemsMap.get(item.itemId) || null;
        const storeId = (!storeInItemLevel ? storesMap.get(store) : storesMap.get(item?.store)) || null;
        return {
          transferNumber: item?.transferNumber,
          fromStoreId: null,
          itemId,
          quantity: settings?.['salesDocument'] == 'manual' ? 0 : ((item?.quantity * (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0),
          toStoreId: storeId,
          transferDate: new Date().toISOString(),
          transferredBy: createdBy,
          comment: '',
          companyId,
          price: item?.price / (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1)),
          documentNumber: document.documentNumber,
          documentType,
          approvalId: approval.id,
          quantityForApproval: (item?.quantity * (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0
        }
      })),
      ]
      );
    }

    if (status && (documentType == "Purchase Invoice")) {
      const settings = await models.Settings.findOne({
        where: {
          companyId: Number(companyId)
        },
        raw: true
      });
      if (settings?.addStockOnPurchaseInvoice == 'true') {
        const approvalCount = await models.InventoryApproval.count({
          where: {
            companyId
          }
        });
        const approval = await models.InventoryApproval.create({
          approvalId: `INA${approvalCount + 1}`,
          documentType,
          documentNumber,
          approvalStatus: settings?.['purchaseDocument'] == 'manual' ? 'Pending' : 'Auto Approved',
          requestedBy: createdBy,
          companyId: companyId,
          status: 1,
          approvedBy: null
        });
        message = settings?.['purchaseDocument'] == 'manual' ? 'inventory' : '';
        const existingItems = await models.Items.findAll({
          where: {
            companyId: Number(companyId),
            itemId: {
              [Op.in]: items.map(item => item.itemId)
            }
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
        await Promise.all([models.StoreItems.bulkCreate(items?.filter(item => item?.quantity).map(item => {
          const itemId = itemsMap.get(item.itemId) || null;
          const storeId = (!storeInItemLevel ? storesMap.get(store) : storesMap.get(item?.store)) || null;
          return {
            storeId,
            itemId,
            quantity: settings?.['purchaseDocument'] == 'manual' ? 0 : ((item?.quantity * (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0),
            status: 1,
            addedBy: createdBy,
            price: item?.price / (item?.conversionFactor || 1),
            documentNumber: document.documentNumber,
            approvalId: approval.id,
            quantityForApproval: (item?.quantity * (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0
          }
        })
        ),
        models.StockTransfer.bulkCreate(items?.filter(item => item?.quantity).map(item => {
          const itemId = itemsMap.get(item.itemId) || null;
          const storeId = (!storeInItemLevel ? storesMap.get(store) : storesMap.get(item?.store)) || null;
          return {
            transferNumber: item?.transferNumber,
            fromStoreId: null,
            itemId,
            quantity: settings?.['purchaseDocument'] == 'manual' ? 0 : ((item?.quantity * (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0),
            toStoreId: storeId,
            transferDate: new Date().toISOString(),
            transferredBy: createdBy,
            comment: '',
            companyId,
            price: item?.price / (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1)),
            documentNumber: document.documentNumber,
            documentType,
            approvalId: approval.id,
            quantityForApproval: (item?.quantity * (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0
          }
        })),
        ]
        );
      }
    }

    if (status && ((documentType === documentTypes.invoice && reduceStockOnIV === "true") || (documentType === documentTypes.deliveryChallan && reduceStockOnDC === "true"))) {

      const settings = await models.Settings.findOne({
        where: {
          companyId: Number(companyId)
        },
        raw: true
      });
      const approvalCount = await models.InventoryApproval.count({
        where: {
          companyId
        }
      });
      const approval = await models.InventoryApproval.create({
        approvalId: `INA${approvalCount + 1}`,
        documentType,
        documentNumber,
        approvalStatus: settings?.['salesDocument'] == 'manual' ? 'Pending' : 'Auto Approved',
        requestedBy: createdBy,
        companyId: companyId,
        status: 1,
        approvedBy: null
      });
      message = settings?.['salesDocument'] == 'manual' ? 'inventory' : ''
      for (const element of items) {
        const storeId = await models.Store.findOne({
          where: {
            name: !storeInItemLevel ? store : element.store,
            companyId
          }
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
            quantityForApproval: element.quantity * (element?.conversionFactor || 1)
          });
        }
      }
    }

    if (status && documentType == documentTypes.purchaseReturn) {

      const settings = await models.Settings.findOne({
        where: {
          companyId: Number(companyId)
        },
        raw: true
      });
      const approvalCount = await models.InventoryApproval.count({
        where: {
          companyId
        }
      });
      const approval = await models.InventoryApproval.create({
        approvalId: `INA${approvalCount + 1}`,
        documentType,
        documentNumber,
        approvalStatus: settings?.['purchaseDocument'] == 'manual' ? 'Pending' : 'Auto Approved',
        requestedBy: createdBy,
        companyId: companyId,
        status: 1,
        approvedBy: null
      });
      message = settings?.['purchaseDocument'] == 'manual' ? 'inventory' : ''
      for (const element of items) {
        const storeId = await models.Store.findOne({
          where: {
            name: !storeInItemLevel ? store : element.store,
            companyId
          }
        });
        if (settings?.['purchaseDocument'] != 'manual') {
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
            quantityForApproval: element.quantity * (element?.conversionFactor || 1)
          });
        }
      }
    }

    if (status && documentType === documentTypes.salesReturn && orderConfirmationNumber) {
      const salesOrder = await models.Documents.findOne({
        where: {
          companyId,
          documentNumber: orderConfirmationNumber
        },
        attributes: ['status', 'id']
      });
      const salesItems = await models.DocumentItems.findAll({
        where: {
          companyId,
          documentNumber: orderConfirmationNumber
        },
        raw: true,
        attributes: ['quantity', 'itemId']
      });
      const salesItemsMap = salesItems.reduce((acc, curr) => {
        acc[curr.itemId] = (acc[curr.itemId] || 0) + curr.quantity;
        return acc;
      }, {});
      const previousSalesReturn = await models.Documents.findAll({
        where: {
          companyId,
          documentType: 'Sales Return',
          orderConfirmationNumber,
          status: {
            [Op.notIn]: [0, 2]
          }
        },
        raw: true,
        attributes: ['documentNumber']
      });
      const previousSalesReturnItems = await models.DocumentItems.findAll({
        where: {
          documentNumber: {
            [Op.in]: previousSalesReturn.map(doc => doc.documentNumber)
          },
          companyId,

        },
        raw: true,
        attributes: ['quantity', 'itemId']
      });
      const previousSalesReturnItemsMap = previousSalesReturnItems.reduce((acc, curr) => {
        acc[curr.itemId] = (acc[curr.itemId] || 0) + curr.quantity;
        return acc;
      }, {});
      let partial = false;

      for (const key of Object.keys(salesItemsMap)) {
        if (salesItemsMap[key] > ((previousSalesReturnItemsMap?.[key] || 0))) {
          partial = true;
          console.log(key, 'mapmapmap')
          break;
        }
      }
      let status = 1;
      if (salesOrder.status == 10) {
        status = !partial ? 37 : 33;
      }
      else if (salesOrder.status == 11 || salesOrder.status == 34) {
        status = !partial ? 38 : 34;
      }
      else if (salesOrder.status == 12 || salesOrder.status == 35) {
        status = !partial ? 39 : 35;
      }
      else if (salesOrder.status == 13 || salesOrder.status == 36) {
        status = !partial ? 40 : 36;
      }
      else if (salesOrder.status == 19 || salesOrder.status == 41) {
        status = !partial ? 45 : 41;
      }
      else if (salesOrder.status == 20 || salesOrder.status == 42) {
        status = !partial ? 46 : 42;
      }
      else if (salesOrder.status == 21 || salesOrder.status == 43) {
        status = !partial ? 47 : 43;
      }
      else if (salesOrder.status == 22 || salesOrder.status == 44) {
        status = !partial ? 48 : 44;
      }
      await salesOrder.update({ status });
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

    if (status && (documentType === documentTypes.serviceChallan || documentType == 'Service Confirmation Challan')) {

      const settings = await models.Settings.findOne({
        where: {
          companyId: Number(companyId)
        },
        raw: true
      });
      const approvalCount = await models.InventoryApproval.count({
        where: {
          companyId
        }
      });
      const approval = await models.InventoryApproval.create({
        approvalId: `INA${approvalCount + 1}`,
        documentType,
        documentNumber,
        approvalStatus: settings?.['serviceDocument'] == 'manual' ? 'Pending' : 'Auto Approved',
        requestedBy: createdBy,
        companyId: companyId,
        status: 1,
        approvedBy: null
      });
      message = settings?.['serviceDocument'] == 'manual' ? 'inventory' : ''
      for (const element of items) {
        const storeId = await models.Store.findOne({
          where: {
            name: !storeInItemLevel ? store : element.store,
            companyId
          }
        });
        let price = 0;
        let remainingQuantity = (element.quantity * (element?.conversionFactor || 1));

        if (settings?.['serviceDocument'] != 'manual') {
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
              actualPrice: stock.price,
              approvalId: approval.id,
              quantityForApproval: (element.quantity * (element?.conversionFactor || 1))
            });
            price += (stock.price * deductQty);
          }
        } else {
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
            quantityForApproval: element.quantity * (element?.conversionFactor || 1)
          });
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
        let finishedGood = null;
        if (serviceOrderNumber) {
          const production = await models.Production.findOne({
            where: {
              serviceOrderNumber,
              companyId: Number(companyId)
            }
          });
          if (production) {
            finishedGood = await models.ProductionFinishedGoods.findOne({
              where: {
                productionId: production.id
              }
            });
          }
        }
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
        const approvalCount = await models.InventoryApproval.count({
          where: {
            companyId
          }
        });
        const approval = await models.InventoryApproval.create({
          approvalId: `INA${approvalCount + 1}`,
          documentType,
          documentNumber,
          approvalStatus: settings?.['serviceDocument'] == 'manual' ? 'Pending' : 'Auto Approved',
          requestedBy: createdBy,
          companyId: companyId,
          status: 1,
          approvedBy: null
        });
        message = settings?.['serviceDocument'] == 'manual' ? 'inventory' : ''
        const existingItems = await models.Items.findAll({ where: { companyId: Number(companyId) } });
        const stores = await models.Store.findAll({ where: { companyId: Number(companyId) } });
        const itemsMap = new Map(existingItems.map(existingItem => [existingItem.itemId, existingItem.id]));
        const storesMap = new Map(stores.map(store => [store.name, store.id]));

        await Promise.all([models.StoreItems.bulkCreate(items?.filter(item => item?.receivedToday).map(item => {
          const itemId = itemsMap.get(item.itemId) || null;
          const storeId = (!storeInItemLevel ? storesMap.get(store) : storesMap.get(item?.store)) || null;
          return {
            storeId,
            itemId,
            quantity: settings?.['serviceDocument'] == 'manual' ? 0 : (item?.receivedToday * (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0,
            status: 1,
            addedBy: createdBy,
            price: (!finishedGood ? item?.price : (finishedGood.cost || 0) / finishedGood.quantity) / (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1)),
            documentNumber: document.documentNumber,
            approvalId: approval.id,
            quantityForApproval: (item?.receivedToday * (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1))) || 0
          }
        })
        ),
        models.StockTransfer.bulkCreate(items?.filter(item => item?.receivedToday).map(item => {
          const itemId = itemsMap.get(item.itemId) || null;
          const storeId = (!storeInItemLevel ? storesMap.get(store) : storesMap.get(item?.store)) || null;
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
            price: (!finishedGood ? item?.price : (finishedGood.cost || 0) / finishedGood.quantity) / (item?.conversionFactor || (showUnits == 0 ? item.quantity / item.auQuantity : 1)),
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

    if (status && documentType === "Service Order") {
      const production = await models.Production.findOne({
        where: {
          companyId: Number(companyId),
          serviceOrderNumber: documentNumber
        },
        raw: true
      });

      if (production) {
        let cost = items?.reduce((acc, curr) => {
          acc += Number(curr?.totalAfterTax || 0)
          return acc;
        }, 0);

        if (Array.isArray(additionalCharges)) {
          for (const element of additionalCharges) {
            cost += Number(element.total || 0);
          }
        }
        const finishedGood = await models.ProductionFinishedGoods.findOne({
          where: {
            productionId: production.id
          }
        });
        await finishedGood.update({ cost: ((finishedGood.cost || 0) + cost) });
      }
    }

    if (status && documentType === "Service Challan" && serviceOrderNumber) {
      const production = await models.Production.findOne({
        where: {
          companyId: Number(companyId),
          serviceOrderNumber: serviceOrderNumber
        },
        raw: true
      });
      if (production) {
        const itemsMap = items?.reduce((acc, curr) => {
          acc[curr.itemId] = curr.quantity;
          return acc;
        }, {});
        let cost = 0;
        const itemsPriceMap = items?.reduce((acc, curr) => {
          acc[curr.itemId] = curr.price;
          cost += Number(curr?.totalAfterTax || 0)
          return acc;
        }, {});

        if (Array.isArray(additionalCharges)) {
          for (const element of additionalCharges) {
            cost += Number(element.total || 0);
          }
        }

        const productionRawMaterial = await models.ProductionRawMaterials.findAll({
          where: {
            productionId: production.id
          }
        });
        for (const element of productionRawMaterial) {
          if (itemsMap[element.itemId]) {
            await element.update({
              consumedQuantity: (element.consumedQuantity || 0) + Number(itemsMap[element.itemId]),
              averagePrice: (element?.averagePrice || 0) + (Number(itemsMap[element.itemId]) * itemsPriceMap[element.itemId])
            });
          }
        }
        const finishedGood = await models.ProductionFinishedGoods.findOne({
          where: {
            productionId: production.id
          }
        });
        await finishedGood.update({ cost: ((finishedGood.cost || 0) + cost) });
      }

    }

    if (status && (documentType === 'Service Grn' || documentType === 'Service Qr') && serviceOrderNumber) {
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
          serviceOrderNumber: serviceOrderNumber
        }
      });
      if (production && serviceChallan) {
        const finishedGoods = await models.ProductionFinishedGoods.findAll({
          where: {
            productionId: production.id
          }
        });
        for (const element of finishedGoods) {
          if (documentType === 'Service Grn') {
            await element.update({
              producedQuantity: (element.producedQuantity || 0) + items[0].receivedToday,
              passedQuantity: (element.passedQuantity || 0) + Number(serviceChallan.addStockOn === 'GRN' ? items[0].receivedToday : 0),
            });
          } else {
            await element.update({
              // producedQuantity: (element?.producedQuantity || 0) + Number(items[0].receivedToday || 0),
              passedQuantity: (element?.passedQuantity || 0) + Number(items[0].receivedToday),
              rejectQuantity: (element?.rejectQuantity || 0) + Number(items[0].pendingQuantity)
            });
          }
          if (element.passedQuantity >= element.quantity) {
            await production.update({ status: 4 });
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
      const settings = await models.Settings.findOne({
        where: {
          companyId: Number(companyId)
        },
        raw: true
      });
      const approvalCount = await models.InventoryApproval.count({
        where: {
          companyId
        }
      });
      const approval = await models.InventoryApproval.create({
        approvalId: `INA${approvalCount + 1}`,
        documentType: 'Stock Transfer',
        documentNumber,
        approvalStatus: settings?.['stockTransfer'] == 'manual' ? 'Pending' : 'Auto Approved',
        requestedBy: createdBy,
        companyId: companyId,
        status: 1,
        approvedBy: null
      });
      message = settings?.['stockTransfer'] == 'manual' ? 'inventory' : ''
      for (const element of items) {
        let remainingQuantity = element.quantity;
        const existingStock = await models.StoreItems.findAll({
          where: { storeId: fromStore.id, itemId: itemsMap[element.itemId], isRejected: (element?.isRejected || false) },
          order: [['createdAt', 'ASC']],
        });
        if (settings?.['stockTransfer'] != 'manual') {
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
              transferredBy: createdBy,
              companyId,
              price: stock.price,
              isRejected: element?.toReject || false,
              approvalId: approval.id,
              quantityForApproval: element.quantity
            });

            if (element.isRejected != element.toReject) {
              await models.StockTransfer.create({
                transferNumber: generateTransferNumber(),
                fromStoreId: fromStore?.id,
                itemId: itemsMap[element.itemId],
                quantity: deductQty,
                toStoreId: rejectStore.id,
                transferDate: new Date().toISOString(),
                transferredBy: createdBy,
                companyId,
                price: stock.price,
                isRejected: element?.isRejected || false,
                // approvalId: approval.id,
                // quantityForApproval: element.quantity
              });
            }

            await models.StoreItems.create({
              storeId: rejectStore.id,
              itemId: itemsMap[element.itemId],
              quantity: deductQty,
              status: 1,
              addedBy: companyId,
              price: stock.price,
              isRejected: element?.toReject || false,
              // approvalId: approval.id,
              // quantityForApproval: deductQty
            });
          }
        } else {
          await models.StockTransfer.create({
            transferNumber: generateTransferNumber(),
            fromStoreId: fromStore?.id,
            itemId: itemsMap[element.itemId],
            quantity: null,
            toStoreId: rejectStore.id,
            transferDate: new Date().toISOString(),
            transferredBy: createdBy,
            companyId,
            isRejected: element?.toReject || false,
            approvalId: approval.id,
            quantityForApproval: remainingQuantity,
            toReject: element?.toReject || false
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
        quantity: finishedGood.quantity,
        tax: finishedGood?.tax,
        taxType: finishedGood?.taxType,
        price: finishedGood?.price,
        totalBeforeTax: finishedGood?.totalBeforeTax,
        totalTax: finishedGood?.totalTax,
        totalAfterTax: finishedGood?.totalAfterTax,
        category: finishedGood?.category
      });
      if (addStockOn === 'GRN' || documentType === 'Service Confirmation Qr') {
        const settings = await models.Settings.findOne({
          where: {
            companyId: Number(companyId)
          },
          raw: true
        });
        const approvalCount = await models.InventoryApproval.count({
          where: {
            companyId
          }
        });
        const approval = await models.InventoryApproval.create({
          approvalId: `INA${approvalCount + 1}`,
          documentType,
          documentNumber,
          approvalStatus: settings?.['serviceDocument'] == 'manual' ? 'Pending' : 'Auto Approved',
          requestedBy: createdBy,
          companyId: companyId,
          status: 1,
          approvedBy: null
        });
        message = settings?.['serviceDocument'] == 'manual' ? 'inventory' : ''
        const existingItems = await models.Items.findAll({ where: { companyId: Number(companyId) } });
        const stores = await models.Store.findAll({ where: { companyId: Number(companyId) } });
        const itemsMap = new Map(existingItems.map(existingItem => [existingItem.itemId, existingItem.id]));
        const storesMap = new Map(stores.map(store => [store.name, store.id]));

        await Promise.all([models.StoreItems.bulkCreate(items?.filter(item => item?.receivedToday && item.type != 'Finished Good').map(item => {
          const itemId = itemsMap.get(item.itemId) || null;
          const storeId = (!storeInItemLevel ? storesMap.get(store) : storesMap.get(item?.store)) || null;
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
        models.StockTransfer.bulkCreate(items?.filter(item => item?.receivedToday && item.type != 'Finished Good').map(item => {
          const itemId = itemsMap.get(item.itemId) || null;
          const storeId = (!storeInItemLevel ? storesMap.get(store) : storesMap.get(item?.store)) || null;
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
          await Promise.all([models.StoreItems.bulkCreate(items?.filter(item => item.pendingQuantity && item.type != 'Finished Good').map(item => {
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
          models.StockTransfer.bulkCreate(items?.filter(item => item.pendingQuantity && item.type != 'Finished Good').map(item => {
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
          status: 1,
          store
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
          store
        });
      }
    }

    // handle linking docs for Sales and Purchase oreder

    if (status) {

      //SALES QUOTATION

      if (
        ["Sales Quotation"]
          .includes(documentType) &&
        enquiryNumber
      ) {
        const salesLead = await models.Documents.findOne({
          where: {
            companyId,
            documentNumber: enquiryNumber,
            documentType: 'Sales Lead'
          }
        });

        if (salesLead) {
          const linkedDocuments = isValidJSON(salesLead.linkedDocuments) || [];
          if (!linkedDocuments.includes(documentNumber)) {
            linkedDocuments.push(documentNumber);
            await salesLead.update({ linkedDocuments });
          }
        }
      }

      if (
        ["Sales Order"]
          .includes(documentType) &&
        quotationNumber
      ) {
        const salesQuotation = await models.Documents.findOne({
          where: {
            companyId,
            documentNumber: quotationNumber,
            documentType: 'Sales Quotation'
          }
        });

        if (salesQuotation) {
          const linkedDocuments = isValidJSON(salesQuotation.linkedDocuments) || [];
          if (!linkedDocuments.includes(documentNumber)) {
            linkedDocuments.push(documentNumber);
            await salesQuotation.update({ linkedDocuments });
          }
        }
      }

      // SALES FLOW
      if (
        ["Invoice", "Sales Return", "Credit Note", "Debit Note", "Delivery Challan", "Proforma Invoice"]
          .includes(documentType) &&
        orderConfirmationNumber
      ) {
        const salesOrder = await models.Documents.findOne({
          where: {
            companyId,
            documentNumber: orderConfirmationNumber,
            documentType: 'Sales Order'
          }
        });

        if (salesOrder) {
          const linkedDocuments = isValidJSON(salesOrder.linkedDocuments) || [];
          if (!linkedDocuments.includes(documentNumber)) {
            linkedDocuments.push(documentNumber);
            await salesOrder.update({ linkedDocuments });
          }
        }

      }

      if ((documentType === 'Credit Note' || documentType === 'Debit Note') && !orderConfirmationNumber) {
        const salesInvoice = await models.Documents.findOne({
          where: {
            companyId,
            documentNumber: invoiceNumber,
            documentType: 'Invoice'
          }
        });
        if (salesInvoice) {
          const linkedDocuments = isValidJSON(salesInvoice.linkedDocuments) || [];
          if (!linkedDocuments.includes(documentNumber)) {
            linkedDocuments.push(documentNumber);
            await salesInvoice.update({ linkedDocuments });
          }
        }
      }

      // PURCHASE FLOW
      if (
        ["Purchase Invoice", "Goods Received Note", "Purchase Credit Note", "Purchase Debit Note", "Quality Report", "Purchase Return"]
          .includes(documentType) &&
        purchaseOrderNumber
      ) {
        const purchaseOrder = await models.Documents.findOne({
          where: {
            companyId,
            documentNumber: purchaseOrderNumber,
            documentType: 'Purchase Order'
          }
        });

        if (purchaseOrder) {
          const linkedDocuments = isValidJSON(purchaseOrder.linkedDocuments) || [];

          if (!linkedDocuments.includes(documentNumber)) {
            linkedDocuments.push(documentNumber);
            await purchaseOrder.update({ linkedDocuments });
          }
        }

      }

      if ((documentType === 'Purchase Credit Note' || documentType === 'Purchase Debit Note') && !purchaseOrderNumber) {
        const purchaseInvoice = await models.Documents.findOne({
          where: {
            companyId,
            documentNumber: invoiceNumber,
            documentType: 'Purchase Invoice'
          }
        });
        if (purchaseInvoice) {
          const linkedDocuments = isValidJSON(purchaseInvoice.linkedDocuments) || [];
          if (!linkedDocuments.includes(documentNumber)) {
            linkedDocuments.push(documentNumber);
            await purchaseInvoice.update({ linkedDocuments });
          }
        }
      }

      if (documentType === "Purchase Order" && indent_number) {
        const purchaseRequests = await models.Documents.findAll({
          where: {
            companyId,
            documentNumber: {
              [Op.in]: indent_number.split(",")
            },
            documentType: 'Purchase Request'
          },
          attributes: ['id', 'linkedDocuments']
        });
        for (const purchaseRequest of purchaseRequests) {
          const linkedDocuments = isValidJSON(purchaseRequest.linkedDocuments) || [];
          if (!linkedDocuments.includes(documentNumber)) {
            linkedDocuments.push(documentNumber);
            await purchaseRequest.update({ linkedDocuments });
          }
        }
      }

      // Service Order Flow
      if (
        ["Service Challan", "Service GRN", "Service QR", "Service Debit Note", "Service Credit Note", "Service Invoice", "Service Proforma Invoice"]
          .includes(documentType) &&
        serviceOrderNumber
      ) {
        const serviceOrder = await models.Documents.findOne({
          where: {
            companyId,
            documentNumber: serviceOrderNumber,
            documentType: 'Service Order'
          }
        });

        if (serviceOrder) {
          const linkedDocuments = isValidJSON(serviceOrder.linkedDocuments) || [];
          if (!linkedDocuments.includes(documentNumber)) {
            linkedDocuments.push(documentNumber);
            await serviceOrder.update({ linkedDocuments });
          }
        }

      }

      // Service Confirmation Flow
      if (
        ["Service Confirmation Challan", "Service Confirmation GRN", "Service Confirmation QR", "Service Confirmation Debit Note", "Service Confirmation Credit Note", "Service Confirmation Invoice", "Service Confirmation Proforma Invoice"]
          .includes(documentType) &&
        ServiceConfirmationNumber
      ) {
        const serviceConfirmation = await models.Documents.findOne({
          where: {
            companyId,
            documentNumber: ServiceConfirmationNumber,
            documentType: 'Service Confirmation'
          }
        });

        if (serviceConfirmation) {
          const linkedDocuments = isValidJSON(serviceConfirmation.linkedDocuments) || [];
          if (!linkedDocuments.includes(documentNumber)) {
            linkedDocuments.push(documentNumber);
            await serviceConfirmation.update({ linkedDocuments });
          }
        }

      }
    }

    if (status && documentType === "Sales Return" && challan_number && !invoiceNumber) {
      const challan = await models.Documents.findOne({
        where: {
          companyId,
          documentNumber: challan_number
        },
        attributes: ['status', 'id']
      });
      if (challan) {
        const challanItems = await models.DocumentItems.findAll({
          where: {
            companyId,
            documentNumber: challan_number
          }
        });
        const challanItemsMap = challanItems.reduce((acc, curr) => {
          acc[curr.itemId] = curr.quantity;
          return acc;
        }, {});
        const previousSalesReturn = await models.Documents.findAll({
          where: {
            companyId,
            documentType: 'Sales Return',
            challan_number,
          },
          raw: true,
          attributes: ['documentNumber']
        });
        const previousSalesReturnItems = await models.DocumentItems.findAll({
          where: {
            companyId,
            documentNumber: {
              [Op.in]: previousSalesReturn.map(doc => doc.documentNumber)
            }
          },
          raw: true
        });
        const salesItemsMap = [...previousSalesReturnItems].reduce((acc, curr) => {
          acc[curr.itemId] = (acc[curr.itemId] || 0) + Number(curr.quantity);
          return acc;
        }, {});

        let partial = false;
        for (const key in challanItemsMap) {
          if (!salesItemsMap[key] || salesItemsMap[key] < challanItemsMap[key]) {
            partial = true;
            break;
          }
        }
        await challan.update({ status: partial ? 31 : 32 });
      }
    }

    if (status && documentType === "Sales Return" && invoiceNumber) {
      const challan = await models.Documents.findOne({
        where: {
          companyId,
          documentNumber: invoiceNumber
        },
        attributes: ['status', 'id']
      });
      if (challan) {
        const challanItems = await models.DocumentItems.findAll({
          where: {
            companyId,
            documentNumber: invoiceNumber
          }
        });
        const challanItemsMap = challanItems.reduce((acc, curr) => {
          acc[curr.itemId] = curr.quantity;
          return acc;
        }, {});
        const previousSalesReturn = await models.Documents.findAll({
          where: {
            companyId,
            documentType: 'Sales Return',
            invoiceNumber,
          },
          raw: true,
          attributes: ['documentNumber']
        });
        const previousSalesReturnItems = await models.DocumentItems.findAll({
          where: {
            companyId,
            documentNumber: {
              [Op.in]: previousSalesReturn.map(doc => doc.documentNumber)
            }
          },
          raw: true
        });
        const salesItemsMap = [...previousSalesReturnItems].reduce((acc, curr) => {
          acc[curr.itemId] = (acc[curr.itemId] || 0) + Number(curr.quantity);
          return acc;
        }, {});

        let partial = false;
        for (const key in challanItemsMap) {
          if (!salesItemsMap[key] || salesItemsMap[key] < challanItemsMap[key]) {
            partial = true;
            break;
          }
        }
        await challan.update({ status: partial ? 31 : 32 });
      }
    }

    if (status && documentType === "Service Invoice" && serviceOrderNumber) {
      const documentItems = await models.DocumentItems.findAll({
        where: {
          companyId,
          documentNumber: serviceOrderNumber
        },
        attributes: ['serviceId', 'quantity']
      });

      const documentItemsMap = documentItems.reduce((acc, curr) => {
        acc[curr.serviceId] = curr.quantity;
        return acc;
      }, {});

      const previousServiceInvoice = await models.Documents.findAll({
        where: {
          companyId,
          documentType: 'Service Invoice',
          serviceOrderNumber,
        },
        attributes: ['documentNumber'],
        raw: true
      });

      const previousServiceInvoiceItems = await models.DocumentItems.findAll({
        where: {
          companyId,
          documentNumber: {
            [Op.in]: previousServiceInvoice.map(doc => doc.documentNumber)
          },
        },
        attributes: ['serviceId', 'quantity'],
      });

      const serviceInvoiceItemsMap = previousServiceInvoiceItems.reduce((acc, curr) => {
        acc[curr.serviceId] = (acc[curr.serviceId] || 0) + Number(curr.quantity);
        return acc;
      }, {});

      let partial = false;
      for (const key in documentItemsMap) {
        if (!serviceInvoiceItemsMap[key] || serviceInvoiceItemsMap[key] < documentItemsMap[key]) {
          partial = true;
          break;
        }
      }
      await models.Documents.update({ status: partial ? 49 : 50 }, {
        where: {
          companyId,
          documentNumber: serviceOrderNumber
        }
      });
    }

    res.status(201).json({
      message: !status ? "Document Saved as Draft Successfully" : message ? "Document created successfully and Inventory approval requested." : "Document created successfully!"
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Something went wrong', error });
  }
}
async function getDocuments(req, res) {
  try {

    const { companyId, documentNumber, buyerName, field, counts, createdBy, approvedBy, requestedBy, currentPage, labels, pageSize, documentType = '', search = '', dealStatus, docTypeFilter, dateRange } = req.body;

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
          ...(Array.isArray(documentNumber) && documentNumber.length
            ? {
              [Op.or]: documentNumber
                .filter(num => num && num.trim() !== "")
                .map(num => ({
                  documentNumber: { [Op.like]: `%${num.trim()}%` }
                })),
            }
            : {}),
          ...(Array.isArray(buyerName) && buyerName.length
            ? {
              [Op.or]: buyerName
                .filter(name => name && name.trim() !== "")
                .map(name => ({
                  buyerName: { [Op.like]: `%${name.trim()}%` }
                })),
            }
            : buyerName
              ? { buyerName: { [Op.like]: `%${buyerName.trim()}%` } }
              : {}),
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
          ...(Array.isArray(search) && search.length
            ? {
              [Op.or]: search
                .filter(val => val && val.trim() !== "")
                .flatMap(val => [
                  { documentNumber: { [Op.like]: `%${val.trim()}%` } },
                  { documentType: { [Op.like]: `%${val.trim()}%` } },
                  { buyerName: { [Op.like]: `%${val.trim()}%` } },
                ]),
            }
            : {}),

          ...(labels?.length > 0 && {
            [Op.or]: labels.map(label =>
              where(
                fn("LOWER", cast(col("labels"), "text")),
                { [Op.like]: `%${label?.toLowerCase()}%` }
              )
            ),
          }),
          ...(field?.length > 0 && {
            [Op.or]: field.map(data =>
              where(
                fn("LOWER", cast(col("customFields"), "text")),
                { [Op.like]: `%${data?.toLowerCase()}%` }
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

async function fetchCurrentDoc(req, res) {
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
      if (document.indent_number) {
        const indentNumbers = document.indent_number.split(",");
        const purchaseRequests = await models.Documents.findAll({
          where: {
            companyId,
            documentNumber: {
              [Op.in]: indentNumbers
            },
            documentType: 'Purchase Request'
          },
          attributes: ['id', 'linkedDocuments']
        });
        for (const purchaseRequest of purchaseRequests) {
          const linkedDocuments = isValidJSON(purchaseRequest.linkedDocuments) || [];
          if (linkedDocuments.includes(document.documentNumber)) {
            linkedDocuments.splice(linkedDocuments.indexOf(document.documentNumber), 1);
            await purchaseRequest.update({ linkedDocuments });
          }
        }
      }
    }
    if (document.documentType === documentTypes.goodsReceive) {
      const batch = await models.BatchItems.findOne({
        where: {
          companyId,
          documentNumber: document.documentNumber,
          [Op.or]: [
            {
              outQuantity: {
                [Op.gt]: 0
              }
            },
            {
              consumedQuantity: {
                [Op.gt]: 0
              }
            }
          ]
        }
      });
      if (batch) {
        return res.status(409).json({
          message: 'You can not discard this document after Batches Consumption.'
        });
      }
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
    }
    if (document.documentType === documentTypes.qualityReport) {
      const batch = await models.BatchItems.findOne({
        where: {
          companyId,
          documentNumber: document.documentNumber,
          [Op.or]: [
            {
              outQuantity: {
                [Op.gt]: 0
              }
            },
            {
              consumedQuantity: {
                [Op.gt]: 0
              }
            }
          ]
        }
      });
      if (batch) {
        return res.status(409).json({
          message: 'You can not discard this document after Batches Consumption.'
        });
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
    if (document.documentType === "Service Order") {
      await models.Production.update({ serviceOrderNumber: null }, {
        where: {
          serviceOrderNumber: document.documentNumber,
          companyId
        }
      });
    }

    if (document.documentType === "Service Challan") {
      const stockTransfers = await models.StockTransfer.findAll({
        where: {
          companyId,
          documentNumber: document.documentNumber,
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
      if (document.serviceOrderNumber) {
        const production = await models.Production.findOne({
          where: {
            companyId,
            serviceOrderNumber: document.serviceOrderNumber,
          }
        });
        if (production) {
          const documentItems = await models.DocumentItems.findAll({
            where: {
              companyId,
              documentNumber: document.documentNumber,
            }
          });
          const documentItemsMap = documentItems.reduce((acc, curr) => {
            acc[curr.itemId] = curr.quantity;
            return acc;
          }, {});
          const rawMaterial = await models.ProductionRawMaterials.findAll({
            where: {
              productionId: production.id
            }
          });
          for (const element of rawMaterial) {
            if (documentItemsMap[element.itemId]) {
              await element.update({ consumedQuantity: element.consumedQuantity - documentItemsMap[element.itemId] });
            }
          }
        }
      }
    }

    if (document.documentType === "Service Grn" && document.challan_number) {
      const serviceChallan = await models.Documents.findOne({
        where: {
          companyId,
          documentNumber: document.challan_number,
          documentType: 'Service Challan'
        }
      });
      if (serviceChallan?.addStockOn === "GRN") {
        const stockTransfers = await models.StockTransfer.findAll({
          where: {
            companyId,
            documentNumber: document.documentNumber,
          }
        });
        const store = await models.Store.findOne({
          where: {
            companyId,
            name: document?.store,
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
      }
      if (serviceChallan?.serviceOrderNumber) {
        const production = await models.Production.findOne({
          where: {
            companyId,
            serviceOrderNumber: serviceChallan?.serviceOrderNumber
          }
        });
        if (production) {
          const finishedGoods = await models.ProductionFinishedGoods.findAll({
            where: {
              productionId: production.id
            }
          });
          const documentItems = await models.DocumentItems.findAll({
            where: {
              companyId,
              documentNumber: document.documentNumber
            }
          });
          const documentItemsMap = documentItems.reduce((acc, curr) => {
            acc[curr.itemId] = curr.quantity;
            return acc;
          }, {});
          for (const element of finishedGoods) {
            if (serviceChallan.addStockOn === "GRN") {
              await element.update({
                producedQuantity: element.producedQuantity - documentItemsMap?.[element.itemId],
                passedQuantity: element.passedQuantity - documentItemsMap?.[element.itemId]
              })
            } else {
              await element.update({
                producedQuantity: element.producedQuantity - documentItemsMap?.[element.itemId],
              });
            }
          }
        }
      }
    }

    if (document.documentType === "Service Qr") {
      const stockTransfers = await models.StockTransfer.findAll({
        where: {
          companyId,
          documentNumber: document.documentNumber,
        }
      });
      const store = await models.Store.findOne({
        where: {
          companyId,
          name: document.store,
        }
      });
      const stockHistory = [];
      await models.StoreItems.update({ quantity: 0 }, {
        where: {
          documentNumber: document.documentNumber,
          storeId: store?.id
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

      if (document?.serviceOrderNumber) {
        const production = await models.Production.findOne({
          where: {
            companyId,
            serviceOrderNumber: document?.serviceOrderNumber
          }
        });
        if (production) {
          const finishedGoods = await models.ProductionFinishedGoods.findAll({
            where: {
              productionId: production.id
            }
          });
          const documentItems = await models.DocumentItems.findAll({
            where: {
              companyId,
              documentNumber: document.documentNumber
            }
          });
          const rejectMap = {};
          const documentItemsMap = documentItems.reduce((acc, curr) => {
            acc[curr.itemId] = curr.receivedToday || 0;
            rejectMap[curr.itemId] = curr.pendingQuantity || 0;
            return acc;
          }, {});
          for (const element of finishedGoods) {
            await element.update({
              rejectQuantity: element.rejectQuantity - rejectMap?.[element.itemId],
              passedQuantity: element.passedQuantity - documentItemsMap?.[element.itemId]
            });
          }
        }
      }
    }

    if (
      ["Sales Quotation"]
        .includes(document.documentType) &&
      document.enquiryNumber
    ) {
      const salesLead = await models.Documents.findOne({
        where: {
          companyId,
          documentNumber: document.enquiryNumber,
          documentType: 'Sales Lead'
        }
      });

      if (salesLead && Array.isArray(isValidJSON(salesLead.linkedDocuments))) {
        const updatedLinkedDocuments = isValidJSON(salesLead.linkedDocuments)
          .filter(docNo => docNo !== document.documentNumber);

        // Update only if something changed
        if (updatedLinkedDocuments.length !== isValidJSON(salesLead.linkedDocuments).length) {
          await salesLead.update({ linkedDocuments: updatedLinkedDocuments });
        }
      }
    }

    if (
      ["Sales Order"]
        .includes(document.documentType) &&
      document.quotationNumber
    ) {
      const salesQuotation = await models.Documents.findOne({
        where: {
          companyId,
          documentNumber: document.quotationNumber,
          documentType: 'Sales Quotation'
        }
      });

      if (salesQuotation && Array.isArray(isValidJSON(salesQuotation.linkedDocuments))) {
        const updatedLinkedDocuments = isValidJSON(salesQuotation.linkedDocuments)
          .filter(docNo => docNo !== document.documentNumber);

        // Update only if something changed
        if (updatedLinkedDocuments.length !== isValidJSON(salesQuotation.linkedDocuments).length) {
          await salesQuotation.update({ linkedDocuments: updatedLinkedDocuments });
        }
      }
    }
    if (
      ["Invoice", "Sales Return", "Credit Note", "Debit Note", "Delivery Challan", "Proforma Invoice"]
        .includes(document.documentType) &&
      document.orderConfirmationNumber
    ) {
      const salesOrder = await models.Documents.findOne({
        where: {
          companyId,
          documentNumber: document.orderConfirmationNumber,
          documentType: 'Sales Order'
        }
      });

      if (salesOrder && Array.isArray(isValidJSON(salesOrder.linkedDocuments))) {
        const updatedLinkedDocuments = isValidJSON(salesOrder.linkedDocuments)
          .filter(docNo => docNo !== document.documentNumber);

        // Update only if something changed
        if (updatedLinkedDocuments.length !== isValidJSON(salesOrder.linkedDocuments).length) {
          await salesOrder.update({ linkedDocuments: updatedLinkedDocuments });
        }
      }
    }

    if (document.documentType === 'Credit Note' || document.documentType === 'Debit Note' && !document.orderConfirmationNumber) {
      const salesInvoice = await models.Documents.findOne({
        where: {
          companyId,
          documentNumber: document.invoiceNumber,
          documentType: 'Invoice'
        }
      });
      if (salesInvoice && Array.isArray(isValidJSON(salesInvoice.linkedDocuments))) {
        const updatedLinkedDocuments = isValidJSON(salesInvoice.linkedDocuments)
          .filter(docNo => docNo !== document.documentNumber);

        if (updatedLinkedDocuments.length !== isValidJSON(salesInvoice.linkedDocuments).length) {
          await salesInvoice.update({ linkedDocuments: updatedLinkedDocuments });
        }
      }
    }

    if (
      ["Purchase Invoice", "Goods Received Note", "Purchase Credit Note", "Purchase Debit Note", "Quality Report", "Purchase Return"]
        .includes(document.documentType) &&
      document.purchaseOrderNumber
    ) {
      const purchaseOrder = await models.Documents.findOne({
        where: {
          companyId,
          documentNumber: document.purchaseOrderNumber,
          documentType: 'Purchase Order'
        }
      });

      if (purchaseOrder && Array.isArray(isValidJSON(purchaseOrder.linkedDocuments))) {
        const updatedLinkedDocuments = isValidJSON(purchaseOrder.linkedDocuments)
          .filter(docNo => docNo !== document.documentNumber);

        if (updatedLinkedDocuments.length !== isValidJSON(purchaseOrder.linkedDocuments).length) {
          await purchaseOrder.update({ linkedDocuments: updatedLinkedDocuments });
        }
      }


    }

    if (document.documentType === 'Purchase Credit Note' || document.documentType === 'Purchase Debit Note' && !document.purchaseOrderNumber) {
      const purchaseInvoice = await models.Documents.findOne({
        where: {
          companyId,
          documentNumber: document.invoiceNumber,
          documentType: 'Purchase Invoice'
        }
      });
      if (purchaseInvoice && Array.isArray(isValidJSON(purchaseInvoice.linkedDocuments))) {
        const updatedLinkedDocuments = isValidJSON(purchaseInvoice.linkedDocuments)
          .filter(docNo => docNo !== document.documentNumber);

        if (updatedLinkedDocuments.length !== isValidJSON(purchaseInvoice.linkedDocuments).length) {
          await purchaseInvoice.update({ linkedDocuments: updatedLinkedDocuments });
        }
      }
    }

    if (
      ["Service Challan", "Service GRN", "Service QR", "Service Debit Note", "Service Credit Note", "Service Invoice", "Service Proforma Invoice"]
        .includes(document.documentType) &&
      document.serviceOrderNumber
    ) {
      const serviceOrder = await models.Documents.findOne({
        where: {
          companyId,
          documentNumber: document.serviceOrderNumber,
          documentType: 'Service Order'
        }
      });

      if (serviceOrder && Array.isArray(isValidJSON(serviceOrder.linkedDocuments))) {
        const updatedLinkedDocuments = isValidJSON(serviceOrder.linkedDocuments)
          .filter(docNo => docNo !== document.documentNumber);

        if (updatedLinkedDocuments.length !== isValidJSON(serviceOrder.linkedDocuments).length) {
          await serviceOrder.update({ linkedDocuments: updatedLinkedDocuments });
        }
      }


    }

    if (
      ["Service Confirmation Challan", "Service Confirmation GRN", "Service Confirmation QR", "Service Confirmation Debit Note", "Service Confirmation Credit Note", "Service Confirmation Invoice", "Service Confirmation Proforma Invoice"]
        .includes(document.documentType) &&
      document.ServiceConfirmationNumber
    ) {
      const serviceConfirmation = await models.Documents.findOne({
        where: {
          companyId,
          documentNumber: document.ServiceConfirmationNumber,
          documentType: 'Service Confirmation'
        }
      });

      if (serviceConfirmation && Array.isArray(isValidJSON(serviceConfirmation.linkedDocuments))) {
        const updatedLinkedDocuments = isValidJSON(serviceConfirmation.linkedDocuments)
          .filter(docNo => docNo !== document.documentNumber);

        if (updatedLinkedDocuments.length !== isValidJSON(serviceConfirmation.linkedDocuments).length) {
          await serviceConfirmation.update({ linkedDocuments: updatedLinkedDocuments });
        }
      }


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
      where:
      {
        purchaseOrderNumber,
        companyId: Number(req.body.companyId),
        documentType: documentTypes.goodsReceive,
        status: {
          [Op.ne]: 2
        }
      },
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
    if (documentType === "Service Grn") {
      const documents = await models.Documents.findAll({
        where: {
          companyId: Number(companyId),
          documentType,
          challan_number: documentNumber,
          status: {
            [Op.notIn]: [0, 2]
          }
        },
        attributes: ['id', 'documentNumber'],
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
        acc[curr.itemId] = (acc[curr.itemId] || 0) + curr.receivedToday;
        return acc;
      }, {});

      const challanItems = await models.DocumentItems.findAll({
        where: {
          companyId: Number(companyId),
          documentNumber
        },
        raw: true
      });

      const challanItemsMap = challanItems?.reduce((acc, curr) => {
        acc[curr.itemId] = (acc[curr.itemId] || 0) + curr.quantity;
        return acc;
      }, {});

      return res.status(200).json({
        itemsData: itemsmap,
        salesOrderItems: challanItemsMap,
        message: 'Data Fetched Successfully.'
      });
    }
    const documents = await models.Documents.findAll({
      where: {
        companyId: Number(companyId),
        documentType,
        orderConfirmationNumber: documentNumber,
        status: {
          [Op.notIn]: [0, 2]
        }
      },
      attributes: ['id', 'documentNumber'],
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

    const salesOrderItems = await models.DocumentItems.findAll({
      where: {
        companyId: Number(companyId),
        documentNumber
      },
      raw: true
    });

    const salesOrderItemsMap = salesOrderItems?.reduce((acc, curr) => {
      acc[curr.itemId] = (acc[curr.itemId] || 0) + curr.quantity;
      return acc;
    }, {});

    return res.status(200).json({
      itemsData: itemsmap,
      salesOrderItems: salesOrderItemsMap,
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
            [Op.ne]: 'Sales Lead',
          },
          status: {
            [Op.ne]: 2,
          }
        }
      });
      if (document) {
        return res.status(400).json({ message: 'This document reference is available in other document. It is not be Edited.' });
      }
    }
    else if (documentType == 'Sales Quotation') {
      const document = await models.Documents.findOne({
        where: {
          quotationNumber: documentNumber,
          companyId: Number(companyId),
          documentType: {
            [Op.notIn]: ['Sales Lead', 'Sales Quotation']
          },
          status: {
            [Op.ne]: 2,
          }
        }
      });
      if (document) {
        return res.status(400).json({ message: 'This document reference is available in other document. It is not be Edited.' });
      }
    }
    else if (documentType == 'Sales Order') {
      const document = await models.Documents.findOne({
        where: {
          orderConfirmationNumber: documentNumber,
          companyId: Number(companyId),
          status: {
            [Op.ne]: 2,
          },
          documentType: 'Proforma Invoice'
        }
      });
      if (document) {
        return res.status(400).json({ message: 'This document reference is available in other document. It is not be Edited.' });
      }
      const invoiceChallanDocument = await models.Documents.findAll({
        where: {
          orderConfirmationNumber: documentNumber,
          companyId: Number(companyId),
          status: {
            [Op.ne]: 2,
          },
          documentType: {
            [Op.in]: ['Invoice', 'Delivery Challan']
          }
        }
      });
      const documentTypeMap = invoiceChallanDocument?.reduce((acc, curr) => {
        acc[curr.documentNumber] = curr.documentType;
        return acc;
      }, {});
      const documentItems = await models.DocumentItems.findAll({
        where: {
          documentNumber: {
            [Op.in]: invoiceChallanDocument?.map(doc => doc.documentNumber)
          },
          companyId: Number(companyId),
        },
        raw: true
      });
      const invoiceItemsMap = {}, challanItemsMap = {};
      documentItems.forEach(item => {
        if (documentTypeMap[item.documentNumber] === 'Invoice') {
          invoiceItemsMap[item.itemId] = (invoiceItemsMap[item.itemId] || 0) + Number(item.quantity);
        } else if (documentTypeMap[item.documentNumber] === 'Delivery Challan') {
          challanItemsMap[item.itemId] = (challanItemsMap[item.itemId] || 0) + Number(item.quantity);
        }
      });

      const itemsMap = items.reduce((acc, curr) => {
        acc[curr.itemId] = Number(curr.quantity);
        return acc;
      }, {});

      for (const element of Object.keys(invoiceItemsMap)) {
        if (!itemsMap[element] || itemsMap[element] < invoiceItemsMap[element]) {
          return res.status(400).json({ message: 'Sales Order Items Quantity Must be greater Than Invoice Items Quantity.' });
        }
      }

      for (const element of Object.keys(challanItemsMap)) {
        if (!itemsMap[element] || itemsMap[element] < challanItemsMap[element]) {
          return res.status(400).json({ message: 'Sales Order Items Quantity Must be greater Than Delivery Challan Items Quantity.' });
        }
      }
    }
    else if (documentType == 'Proforma Invoice') {
      const document = await models.Documents.findOne({
        where: {
          performaInvoiceNumber: documentNumber,
          companyId: Number(companyId),
          status: {
            [Op.ne]: 2,
          }
        }
      });
      if (document) {
        return res.status(400).json({ message: 'This document reference is available in other document. It is not be Edited.' });
      }
    }
    else if (documentType == 'Purchase Request') {
      const document = await models.Documents.findOne({
        where: {
          companyId: Number(companyId),
          status: {
            [Op.ne]: 2,
          },
          [Op.or]: [
            { indent_number: documentNumber },                    // only one value
            { indent_number: { [Op.like]: `${documentNumber},%` } }, // at start
            { indent_number: { [Op.like]: `%,${documentNumber},%` } }, // in middle
            { indent_number: { [Op.like]: `%,${documentNumber}` } },   // at end
          ],
        },
      });

      if (document) {
        return res.status(400).json({ message: 'This document reference is available in other document. It is not be Edited.' });
      }
    }
    else if (documentType == 'Purchase Order') {
      const document = await models.Documents.findOne({
        where: {
          purchaseOrderNumber: documentNumber,
          companyId: Number(companyId),
          status: {
            [Op.ne]: 2,
          }
        }
      });
      if (document) {
        return res.status(400).json({ message: 'This document reference is available in other document. It is not be Edited.' });
      }
    }
    else if (documentType == 'Service Order') {
      const document = await models.Documents.findOne({
        where: {
          serviceOrderNumber: documentNumber,
          companyId: Number(companyId),
          status: {
            [Op.ne]: 2,
          }
        }
      });
      if (document) {
        return res.status(400).json({ message: 'This document reference is available in other document. It is not be Edited.' });
      }
    }

    else if (documentType == 'Service Confirmation') {
      const document = await models.Documents.findOne({
        where: {
          ServiceConfirmationNumber: documentNumber,
          companyId: Number(companyId),
          status: {
            [Op.ne]: 2,
          }
        }
      });
      if (document) {
        return res.status(400).json({ message: 'This document reference is available in other document. It is not be Edited.' });
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
            customFields: item?.customFields,
            imageUrl: item?.imageUrl,
            category: item?.category,
            store: item?.store
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
    console.log(error);
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

async function createEInvoice(req, res) {
  try {
    const { document, userName, password, gst, pin } = req.body;
    const uoms = await models.UOM.findAll({
      where: {
        [Op.or]: [
          { companyId: document.companyId, status: 1 },
          { companyId: null, status: 0 }
        ]
      }
    });
    const uomMap = uoms.reduce((acc, curr) => {
      acc[curr.name] = curr.code;
      return acc;
    }, {});
    const authResponse = await axios.get(
      "https://api.perione.in/einvoice/authenticate",
      {
        params: { email: process.env.EMAIL },
        headers: {
          "client_id": process.env.CLIENT_ID,
          "client_secret": process.env.CLIENT_SECRET,
          "gstin": gst,
          "username": userName,
          "password": password,
          "ip_address": "192.68.45.37",
        },
      }
    );

    const authToken = authResponse?.data?.data?.AuthToken;
    if (!authToken) {
      return res.status(400).json({
        message: "Failed to generate Auth Token",
        errors: authResponse?.data?.data || authResponse?.data
      });
    }

    const supplierAddress = isValidJSON(document?.supplierBillingAddress);
    const buyerAddress = isValidJSON(document?.buyerDeliveryAddress);

    const isIgst = document?.supplyState?.toLowerCase?.() !== supplierAddress?.state?.toLowerCase?.();

    // Compute totals from items
    let AssVal = 0,
      CgstVal = 0,
      SgstVal = 0,
      IgstVal = 0,
      TotInvVal = 0;

    const items = document.items?.map((item, index) => {
      const qty = Number(item?.quantity || 1);
      const price = Number(item?.price || 100);
      const taxRate = Number(item?.tax || 0);
      const totalBeforeTax = qty * price;
      const totalTax = (totalBeforeTax * taxRate) / 100;
      const cgst = isIgst ? 0 : totalTax / 2;
      const sgst = isIgst ? 0 : totalTax / 2;
      const igst = isIgst ? totalTax : 0;
      const totalAfterTax = totalBeforeTax + totalTax;

      AssVal += totalBeforeTax;
      CgstVal += cgst;
      SgstVal += sgst;
      IgstVal += igst;
      TotInvVal += totalAfterTax;

      return {
        SlNo: (index + 1).toString(),
        IsServc: "N",
        PrdDesc: item?.itemName || " ",
        HsnCd: item?.HSN,
        Qty: qty,
        Unit: uomMap[item.UOM],
        UnitPrice: price,
        TotAmt: totalBeforeTax,
        AssAmt: totalBeforeTax,
        GstRt: taxRate,
        SgstAmt: sgst,
        CgstAmt: cgst,
        IgstAmt: igst,
        TotItemVal: totalAfterTax,
      };
    });

    // STEP 3: Build E-Invoice Payload
    const round2 = (num) => {
      return Number(parseFloat(num || 0).toFixed(2));
    };

    const eInvoice = {
      Version: "1.1",
      TranDtls: {
        TaxSch: "GST",
        SupTyp: "B2B",
      },
      DocDtls: {
        Typ: "INV",
        No: document?.documentNumber,
        Dt: getTodayDateInIST()
      },

      SellerDtls: {
        Gstin: gst,
        LglNm: document?.supplierName,
        TrdNm: document?.supplierName,
        Addr1: supplierAddress?.addressLineOne || 'Test',
        Addr2: supplierAddress?.city || ' ',
        Loc: supplierAddress?.state || ' ',
        Pin: String(pin || ''),
        Stcd: gst?.slice(0, 2),
        Ph: document?.supplierContactNo,
        Em: document?.supplierEmail
      },

      BuyerDtls: {
        Gstin: document?.buyerGSTNumber,
        LglNm: document?.buyerName,
        TrdNm: document?.buyerName,
        Pos: gstStateCodes?.[document?.supplyState] || '23',
        Addr1: buyerAddress?.addressLineOne || 'Test',
        Addr2: buyerAddress?.city || ' ',
        Loc: buyerAddress?.state || ' ',
        Pin: String(buyerAddress?.pincode || ''),
        Stcd: document?.buyerGSTNumber?.slice(0, 2),
        Ph: document?.buyerContactNumber,
        Em: document?.buyerEmail
      },

      ItemList: items.map(item => ({
        ...item,
        UnitPrice: round2(item.UnitPrice),
        TotAmt: round2(item.TotAmt),
        AssAmt: round2(item.AssAmt),
        IgstAmt: round2(item.IgstAmt),
        CgstAmt: round2(item.CgstAmt),
        SgstAmt: round2(item.SgstAmt),
        TotItemVal: round2(item.TotItemVal),
      })),

      ValDtls: {
        AssVal: round2(AssVal),
        CgstVal: round2(CgstVal),
        SgstVal: round2(SgstVal),
        IgstVal: round2(IgstVal),
        TotInvVal: round2(TotInvVal)
      }
    };

    // STEP 4: Generate E-Invoice
    const response = await axios.post(
      "https://api.perione.in/einvoice/type/GENERATE/version/V1_03",
      eInvoice,
      {
        params: { email: process.env.EMAIL },
        headers: {
          "Content-Type": "application/json",
          "client_id": process.env.CLIENT_ID,
          "client_secret": process.env.CLIENT_SECRET,
          "gstin": gst,
          "username": userName,
          "password": password,
          "auth-token": authToken,
          "ip_address": "192.68.45.37",
        },
      }
    );

    // STEP 5: Extract IRN + QR
    const irnNumber = response?.data?.data?.Irn || null;
    const qrCode = response?.data?.data?.SignedQRCode || null;

    if (!irnNumber) {
      return res.status(400).send({
        message: "E-Invoice generation failed.",
        errors: response?.data?.data || response?.data,
      });
    }

    // STEP 6: Save in DB
    const existingDocument = await models.Documents.findOne({
      where: {
        companyId: document.companyId,
        documentNumber: document.documentNumber,
      },
    });

    if (existingDocument) {
      await existingDocument.update({ irnNumber, qrCode });
    }

    return res.status(200).json({
      message: "E-Invoice Created Successfully.",
    });
  } catch (error) {
    console.error("E-Invoice Error:", error.response?.data || error.message);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.response?.data || error.message,
    });
  }
}

const createEWayBill = async (req, res) => {
  const { document, formData } = req.body;
  try {
    const uoms = await models.UOM.findAll({
      where: {
        [Op.or]: [
          { companyId: document.companyId, status: 1 },
          { companyId: null, status: 0 }
        ]
      }
    });
    const uomMap = uoms.reduce((acc, curr) => {
      acc[curr.name] = curr.code;
      return acc;
    }, {});
    const supplierAddress = isValidJSON(document?.supplierBillingAddress);
    const buyerAddress = isValidJSON(document?.buyerDeliveryAddress);
    const isIgst = document?.supplyState !== supplierAddress?.state;

    // Compute totals from items
    let AssVal = 0,
      CgstVal = 0,
      SgstVal = 0,
      IgstVal = 0,
      TotInvVal = 0;

    const items = document.items?.map((item, index) => {
      const qty = Number(item?.quantity || 1);
      const price = Number(item?.price || 100);
      const taxRate = Number(item?.tax || 0);
      const totalBeforeTax = qty * price;
      const totalTax = (totalBeforeTax * taxRate) / 100;
      const cgst = isIgst ? 0 : totalTax / 2;
      const sgst = isIgst ? 0 : totalTax / 2;
      const igst = isIgst ? totalTax : 0;
      const totalAfterTax = totalBeforeTax + totalTax;

      AssVal += totalBeforeTax;
      CgstVal += cgst;
      SgstVal += sgst;
      IgstVal += igst;
      TotInvVal += totalAfterTax;

      return {
        productName: item?.itemName,
        productDesc: item?.itemName,
        hsnCode: item?.HSN,
        quantity: item?.quantity,
        qtyUnit: uomMap[item?.UOM],
        taxableAmount: totalBeforeTax,
        sgstRate: isIgst ? 0 : taxRate / 2,
        cgstRate: isIgst ? 0 : taxRate / 2,
        igstRate: isIgst ? taxRate : 0
      }
    });
    const eWayBillPayload = {
      supplyType: formData?.supplyType,
      subSupplyType: formData?.subSupplyType,
      subSupplyDesc: " ",
      docType: "CHL",
      docNo: document.documentNumber,
      docDate: getTodayDateInIST(),
      fromGstin: document?.supplierGSTNumber,
      fromTrdName: document?.supplierName,
      fromAddr1: supplierAddress?.addressLineOne || ' ',
      fromAddr2: supplierAddress?.city || ' ',
      actFromStateCode: Number(gstStateCodes[supplierAddress?.state]),
      fromPincode: Number(supplierAddress?.pincode),
      fromStateCode: Number(gstStateCodes[supplierAddress?.state]),
      toGstin: document?.buyerGSTNumber,
      toTrdName: document?.buyerName,
      toAddr1: buyerAddress?.addressLineOne,
      toAddr2: buyerAddress?.city,
      toPlace: buyerAddress?.state,
      toPincode: Number(buyerAddress?.pincode),
      actToStateCode: Number(gstStateCodes[buyerAddress?.state]),
      toStateCode: Number(gstStateCodes[buyerAddress?.state]),
      transactionType: formData?.transactionType,
      dispatchFromGSTIN: document?.supplierGSTNumber,
      dispatchFromTradeName: document?.supplierName,
      shipToGSTIN: document?.buyerGSTNumber,
      shipToTradeName: document?.buyerName,
      totalValue: AssVal,
      cgstValue: CgstVal,
      sgstValue: SgstVal,
      igstValue: IgstVal,
      totInvValue: TotInvVal,
      transMode: formData?.transportMode,
      transDistance: "67",
      transporterName: formData?.transporterName,
      transporterId: formData?.transporterId,
      transDocNo: formData?.transportDocNo,
      transDocDate: formData?.transporterDocDate,
      vehicleNo: formData?.vehicleNo,
      vehicleType: formData?.vehicleType,
      itemList: items,
    };


    const response = await axios.post(
      "https://api.mastergst.com/ewaybillapi/v1.03/ewayapi/genewaybill",
      eWayBillPayload,
      {
        headers: {
          "Content-Type": "application/json",
          "client_id": process.env.LOCAL_CLIENT_ID,
          "client_secret": process.env.LOCAL_CLIENT_SECRET,
          "gstin": document?.supplierGSTNumber,
          "ip_address": "192.68.45.45"
        },
        params: {
          email: process.env.EMAIL,
        },
      }
    );

    if (response.data?.status_cd == '0') {
      return res.status(400).send({
        message: "E-Invoice generation failed.",
        errors: response?.data?.data || response?.data,
      });
    }

    const existingDocument = await models.Documents.findOne({
      where: {
        companyId: document.companyId,
        documentNumber: document.documentNumber,
      },
    });

    if (existingDocument) {
      await existingDocument.update({ ewayBillCreated: true });
    }

    return res.status(200).json({
      message: "E-Way Bill Created Successfully.",
    });

  } catch (error) {
    console.log(error);
    console.error(error.response?.data || error.message);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.response?.data || error.message,
    });
  }
}

async function emailDocument(req, res) {
  const directory = path.join(__dirname, '..', 'uploads', req.file.filename);
  try {
    const { fileName, to, subject, htmlContent, companyId, userId } = req.body;

    const emailCredential = await models.EMailCredential.findOne({
      where: {
        userId: Number(userId)
      }
    });

    const user = emailCredential?.email || process.env.SMTP_USER;
    const pass = emailCredential?.password || process.env.SMTP_PASS;
    const from = emailCredential?.email || process.env.SMTP_USER;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: user,
        pass: pass
      }
    });

    const formattedHtml = htmlContent
      .split("\n\n")
      .map(p => `<p>${p.replace(/\n/g, "<br />")}<br/>
    <div style="display: flex; align-items: center; margin: 10px 0;">
      <a href="https://easemargin.com" target="_blank" style="text-decoration:none; color: inherit; display:flex; align-items:center;">
        Powered By 
        <img src="https://testapi.easemargin.com/uploads/1750521347467-ease%20logo.png" 
             style="width:90px; height:16px; object-fit:contain; margin-left:5px;" />
      </a>
    </div>
  </p>`)
      .join("");



    await transporter.sendMail({
      from: from,
      to,
      subject: subject || "Sharing Document",
      html: formattedHtml,
      attachments: [
        {
          filename: fileName || "document.pdf",
          path: req.file.path,
          contentType: "application/pdf"
        }
      ]
    });

    fs.unlink(directory, (err) => {
    });

    res.json({ message: "Document Emailed Successfully." });
  } catch (err) {
    fs.unlink(directory, (err) => {
    });
    console.error("responseCode", err);
    res.status(500).json({
      error: err.responseCode == 535 ? "Invalid App Credential." : "Something Went Wrong."
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
  approveDocument,
  createEInvoice,
  createEWayBill,
  fetchCurrentDoc,
  emailDocument
};
