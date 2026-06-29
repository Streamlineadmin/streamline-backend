const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");
const cron = require("node-cron");
const models = require('./models');
const { Op } = require("sequelize");

cron.schedule("0 0 * * *", async () => {
  try {
    const production = await models.Production.findAll({
      where: {
        status: 2
      },
      attributes: ['id']
    });
    const productionIds = production.map(data => data.id);
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const rawMaterial = await models.ProductionRawMaterials.findAll({
      where: {
        productionId: {
          [Op.in]: productionIds
        },
        updatedAt: { [Op.gt]: twoDaysAgo }
      },
      attributes: ["productionId"],
      raw: true
    });
    const scraps = await models.ProductionScrapMaterials.findAll({
      where: {
        productionId: {
          [Op.in]: productionIds
        },
        updatedAt: { [Op.gt]: twoDaysAgo }
      },
      attributes: ["productionId"],
      raw: true
    });
    const finishedgoods = await models.ProductionFinishedGoods.findAll({
      where: {
        productionId: {
          [Op.in]: productionIds
        },
        updatedAt: { [Op.gt]: twoDaysAgo }
      },
      attributes: ["productionId"],
      raw: true
    });
    const process = await models.ProductionSalesProcess.findAll({
      where: {
        productionId: {
          [Op.in]: productionIds
        },
        updatedAt: { [Op.gt]: twoDaysAgo }
      },
      attributes: ["productionId"],
      raw: true
    });
    const charges = await models.ProductionAdditionalCharges.findAll({
      where: {
        productionId: {
          [Op.in]: productionIds
        },
        updatedAt: { [Op.gt]: twoDaysAgo }
      },
      attributes: ["productionId"],
      raw: true
    });

    const finalIds = [];
    [...rawMaterial, ...scraps, ...finishedgoods, ...process, ...charges]
      .forEach(item => {
        finalIds.push(item.productionId);
      });

    const uniqueFinalIds = [...new Set(finalIds)];

    await models.Production.update({ status: 3 }, {
      where: {
        id: {
          [Op.in]: uniqueFinalIds
        }
      }
    });

  } catch (error) {
    console.log(error)
  }
});

const authenticationRoute = require("./routes/authentication");
const fileRoute = require("./routes/file");
const blogRoute = require("./routes/blogs");
const teamRoute = require("./routes/teams");
const userRoute = require("./routes/users");
const storeRoute = require("./routes/stores");
const addressRoute = require("./routes/address");
const blogCommentsRoute = require("./routes/blogComments");
const itemsRoute = require("./routes/items");
const buyerSupplierRoute = require("./routes/buyerSupplier");
const documentSeriesRoute = require("./routes/documentSeries");
const accountDetailsRoute = require("./routes/accountDetails");
const documentsRoute = require("./routes/documents");
const notificationRoute = require("./routes/notifications");
// const botRoute = require('./routes/bot');
const uomRoute = require("./routes/uom");
const categoriesRoute = require("./routes/categories");
const packagingMasterRoute = require("./routes/packagingMaster");
const paymentTermsRoutes = require("./routes/paymentTerms");
const logisticDetailsRoutes = require("./routes/logisticDetails");
const transporterDetailsRoutes = require("./routes/transporterDetails");
const termsConditionRoutes = require("./routes/termsCondition");
const mailRoutes = require("./routes/mailer");
const contactUSRoutes = require("./routes/customerQuery");
const demoQueryRoutes = require("./routes/demoQuery");
const newsLetterRoutes = require("./routes/newsLetter");
const customfieldRoutes = require("./routes/customfields");
const dashboardRoutes = require("./routes/dashboard");
const reportColumnRoutes = require("./routes/reportColumn");
const inventoryServicesRoutes = require("./routes/inventoryServices");
const batchItemsRoutes = require("./routes/batchItems");
const productionProcessRoutes = require("./routes/productionProcess");
const bomDetailsRoutes = require("./routes/bomDetails");
const bomProductionProcessRoutes = require("./routes/bomProductionProcess");
const bomFinishedGoodsRoutes = require("./routes/bomFinishedGoods");
const bomRawMaterialsRoutes = require("./routes/bomRawMaterials");
const bomScrapMaterialsRoutes = require("./routes/bomScrapmaterials");
const bomAdditionalChargesRoutes = require("./routes/bomAdditionalCharges");
const bomSeriesRoutes = require("./routes/bomSeries");
const prouctionRoutes = require("./routes/production");
const logPaymentsRoutes = require("./routes/logPayment");
const logTDSRoutes = require("./routes/logTDS");
const itemSeriesRoutes = require("./routes/itemSeries");
const reportRoutes = require("./routes/reports");
const settingsRoutes = require("./routes/settings");
const documentApprovalRoutes = require("./routes/documentApproval");
const labelsRoute = require("./routes/labels");
const inventoryApprovalRoutes = require("./routes/inventoryApproval");
const eInvoiceRoutes = require("./routes/eInvoiceCredentials");
const eMailRoutes = require("./routes/emailCredentials");
const ShowHideColumnRoutes = require("./routes/showHideColumns");
const { mode } = require("simple-statistics");
const amyRoutes = require("./routes/amy");
const showhidecolumns = require("./models/showhidecolumns");
const gateEntryRoute = require("./routes/gateEntry");
const ledgerMappingRoute = require("./routes/ledgerMapping");
const app = express();

// Apply body-parser middleware to handle JSON request bodies
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Define the CORS options
const corsOptions = {
  origin: "*",
  credentials: true, // Allow credentials (e.g., cookies, authorization headers)
};

// Use the cors middleware with your options
app.use(cors(corsOptions));

// Define route for the root URL
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/index.html"));
  //res.send("Welcome to EaseMargin APIs !");
});
// Serve files from the 'uploads' folder
app.use("/uploads", express.static("uploads"), fileRoute);

app.post("/migrateBomProcess", async (req, res) => {
  try {
    const processes = await models.ProductionProcess.findAll({
      raw: true,
    });

    const processMap = processes.reduce((acc, curr) => {
      acc[curr.id] = curr;
      return acc;
    }, {});

    const bomProcesses = await models.BOMProductionProcess.findAll({
      raw: true,
    });

    const updateData = bomProcesses.map((process) => ({
      id: process.id,
      processCode: processMap[process.processId]?.processCode || null,
      processName: processMap[process.processId]?.processName || null,
      description: processMap[process.processId]?.description || null,
      plannedTime: processMap[process.processId]?.plannedTime || null,
      cost: processMap[process.processId]?.cost || null,
    }));

    await models.BOMProductionProcess.bulkCreate(updateData, {
      updateOnDuplicate: [
        "processCode",
        "processName",
        "description",
        "plannedTime",
        "cost",
      ],
    });

    res.status(200).json({
      message: "BOM processes migrated successfully",
    });
  } catch (error) {
    console.error("Error occurred while migrating BOM processes:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
});

app.post("/deleteCompaniesData", async (req, res) => {
  const t = await models.sequelize.transaction();
  try {
    const { companyId, dataToDelete } = req.body;

    if (dataToDelete.includes('sales')) {
      const documents = await models.Documents.findAll({
        where: {
          companyId: companyId,
          documentType: { [Op.in]: ['Sales Lead', 'Sales Quotation', 'Credit Note', 'Debit Note', 'Delivery Challan', 'Stock Transfer Delivery Challan', 'Sales Order', 'Sales Invoice', 'Proforma Invoice', 'Sales Return'] }
        },
        attributes: ['id', 'documentNumber'],
        transaction: t,
        raw: true
      });
      await models.DocumentItems.destroy({
        where: {
          companyId: companyId,
          documentNumber: { [Op.in]: documents.map(doc => doc.documentNumber) }
        },
        transaction: t,
      });
      await models.Documents.destroy({
        where: {
          companyId: companyId,
          id: { [Op.in]: documents.map(doc => doc.id) }
        },
        transaction: t,
      });
    }

    if (dataToDelete.includes('purchase')) {
      const documents = await models.Documents.findAll({
        where: {
          companyId: companyId,
          documentType: {
            [Op.in]: [
              'Purchase Request',
              'Purchase Order', 'Purchase Credit Note',
              'Purchase Debit Note', 'Goods Received Note',
              'Quality Report', 'Purchase Invoice', 'Purchase Return']
          }
        },
        transaction: t,
        attributes: ['id', 'documentNumber'],
        raw: true
      });
      await models.DocumentItems.destroy({
        where: {
          companyId: companyId,
          documentNumber: { [Op.in]: documents.map(doc => doc.documentNumber) }
        },
        transaction: t,
      });
      await models.Documents.destroy({
        where: {
          companyId: companyId,
          id: { [Op.in]: documents.map(doc => doc.id) }
        },
        transaction: t,
      });
    }

    if (dataToDelete.includes('serviceOrder')) {
      const documents = await models.Documents.findAll({
        where: {
          companyId: companyId,
          documentType: {
            [Op.in]: ["Service Order", "Service Challan", "Service GRN", "Service QR", "Service Debit Note", "Service Credit Note", "Service Invoice", "Service Proforma Invoice"]
          }
        },
        transaction: t,
        attributes: ['id', 'documentNumber'],
        raw: true
      });
      await models.DocumentItems.destroy({
        where: {
          companyId: companyId,
          documentNumber: { [Op.in]: documents.map(doc => doc.documentNumber) }
        },
        transaction: t,
      });
      await models.Documents.destroy({
        where: {
          companyId: companyId,
          id: { [Op.in]: documents.map(doc => doc.id) }
        },
        transaction: t,
      });
    }

    if (dataToDelete.includes('serviceConfirmation')) {
      const documents = await models.Documents.findAll({
        where: {
          companyId: companyId,
          documentType: {
            [Op.in]: ["Service Confirmation", "Service Confirmation Challan", "Service Confirmation GRN", "Service Confirmation QR", "Service Confirmation Debit Note", "Service Confirmation Credit Note", "Service Confirmation Invoice", "Service Confirmation Proforma Invoice"]
          }
        },
        transaction: t,
        attributes: ['id', 'documentNumber'],
        raw: true
      });
      await models.DocumentItems.destroy({
        where: {
          companyId: companyId,
          documentNumber: { [Op.in]: documents.map(doc => doc.documentNumber) }
        },
        transaction: t,
      });
      await models.Documents.destroy({
        where: {
          companyId: companyId,
          id: { [Op.in]: documents.map(doc => doc.id) }
        },
        transaction: t,
      });
    }

    if (dataToDelete.includes('items')) {
      const items = await models.Items.findAll({
        where: {
          companyId: companyId
        },
        transaction: t,
        attributes: ['id'],
        raw: true
      });
      await models.StoreItems.destroy({
        where: {
          itemId: { [Op.in]: items.map(item => item.id) }
        },
        transaction: t,
      });
      await models.BOMDetails.destroy({
        where: {
          companyId: companyId
        },
        transaction: t,
      });
      await models.StockTransfer.destroy({
        where: {
          companyId: companyId
        },
        transaction: t,
      });
      await models.Items.destroy({
        where: {
          companyId: companyId
        },
        transaction: t,
      });
      await models.DocumentItems.destroy({
        where: {
          companyId: companyId
        },
        transaction: t,
      });
      await models.Documents.destroy({
        where: {
          companyId: companyId
        },
        transaction: t,
      });
      await models.Production.destroy({
        where: {
          companyId: companyId
        },
        transaction: t,
      });
      await models.InventoryApproval.destroy({
        where: {
          companyId: companyId
        },
        transaction: t,
      });
    }

    if (dataToDelete.includes('store')) {
      const stores = await models.Store.findAll({
        where: {
          companyId: companyId
        },
        transaction: t,
        attributes: ['id'],
        raw: true
      });
      await models.StoreItems.destroy({
        where: {
          storeId: { [Op.in]: stores.map(store => store.id) }
        },
        transaction: t,
      });
      await models.Store.destroy({
        where: {
          companyId: companyId
        },
        transaction: t,
      });
      await models.StockTransfer.destroy({
        where: {
          companyId: companyId
        },
        transaction: t,
      });
      await models.InventoryApproval.destroy({
        where: {
          companyId: companyId
        },
        transaction: t,
      });
    }

    if (dataToDelete.includes('storeitem')) {
      const stores = await models.Store.findAll({
        where: {
          companyId: companyId
        },
        transaction: t,
        attributes: ['id'],
        raw: true
      });
      await models.StoreItems.destroy({
        where: {
          storeId: { [Op.in]: stores.map(store => store.id) }
        },
        transaction: t,
      });
      await models.StockTransfer.destroy({
        where: {
          companyId: companyId
        },
        transaction: t,
      });
      await models.InventoryApproval.destroy({
        where: {
          companyId: companyId
        },
        transaction: t,
      });
    }

    if (dataToDelete.includes('production')) {
      await models.Production.destroy({
        where: {
          companyId: companyId
        },
        transaction: t,
      });
    }

    if (dataToDelete.includes('bom')) {
      await models.BOMDetails.destroy({
        where: {
          companyId: companyId
        },
        transaction: t,
      });
      await models.Production.destroy({
        where: {
          companyId: companyId
        },
        transaction: t,
      });
    }

    await t.commit();


    res.status(200).json({ message: "Data deleted successfully." });
  } catch (error) {
    await t.rollback();
    console.error("Error deleting data:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Use authentication routes for `/authentication` path
app.use("/authentication", authenticationRoute);
app.use("/blogs", blogRoute);
app.use("/teams", teamRoute);
app.use("/users", userRoute);
app.use("/stores", storeRoute);
app.use("/address", addressRoute);
app.use("/blogComments", blogCommentsRoute);
app.use("/items", itemsRoute);
app.use("/buyerSupplier", buyerSupplierRoute);
app.use("/documentSeries", documentSeriesRoute);
app.use("/accountDetails", accountDetailsRoute);
app.use("/documents", documentsRoute);
app.use("/notification", notificationRoute);
// app.use('/bot', botRoute);
app.use("/uom", uomRoute);
app.use("/categories", categoriesRoute);
app.use("/packagingMaster", packagingMasterRoute);
app.use("/paymentTerms", paymentTermsRoutes);
app.use("/logisticDetails", logisticDetailsRoutes);
app.use("/transporterDetails", transporterDetailsRoutes);
app.use("/termsCondition", termsConditionRoutes);
app.use("/mail", mailRoutes);
app.use("/contactUs", contactUSRoutes);
app.use("/demoQuery", demoQueryRoutes);
app.use("/newsLetter", newsLetterRoutes);
app.use("/customFields", customfieldRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/reportColumns", reportColumnRoutes);
app.use("/inventoryServices", inventoryServicesRoutes);
app.use("/batchItems", batchItemsRoutes);
app.use("/productionProcess", productionProcessRoutes);
app.use("/bomDetails", bomDetailsRoutes);
app.use("/bomProductionProcess", bomProductionProcessRoutes);
app.use("/bomFinishedGoods", bomFinishedGoodsRoutes);
app.use("/bomRawMaterials", bomRawMaterialsRoutes);
app.use("/bomScrapMaterials", bomScrapMaterialsRoutes);
app.use("/bomAdditionalCharges", bomAdditionalChargesRoutes);
app.use("/bomSeries", bomSeriesRoutes);
app.use("/production", prouctionRoutes);
app.use("/logPayments", logPaymentsRoutes);
app.use("/logTDS", logTDSRoutes);
app.use("/itemSeries", itemSeriesRoutes);
app.use("/reports", reportRoutes);
app.use("/settings", settingsRoutes);
app.use("/documentApproval", documentApprovalRoutes);
app.use("/labels", labelsRoute);
app.use("/inventoryApproval", inventoryApprovalRoutes);
app.use("/eInvoice", eInvoiceRoutes);
app.use("/email", eMailRoutes);
app.use("/showHideColumns", ShowHideColumnRoutes);
app.use("/amy", amyRoutes);
app.use("/gateEntry", gateEntryRoute);
app.use("/ledgerMapping", ledgerMappingRoute);

module.exports = app;
