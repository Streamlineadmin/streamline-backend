const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");

const authenticationRoute = require('./routes/authentication');
const fileRoute = require('./routes/file');
const blogRoute = require('./routes/blogs');
const teamRoute = require('./routes/teams');
const userRoute = require('./routes/users');
const storeRoute = require('./routes/stores');
const addressRoute = require('./routes/address');
const blogCommentsRoute = require('./routes/blogComments');
const itemsRoute = require('./routes/items');
const buyerSupplierRoute = require('./routes/buyerSupplier');
const documentSeriesRoute = require('./routes/documentSeries');
const accountDetailsRoute = require('./routes/accountDetails');
const documentsRoute = require('./routes/documents');
const notificationRoute = require('./routes/notifications');
// const botRoute = require('./routes/bot');
const uomRoute = require('./routes/uom');
const categoriesRoute = require('./routes/categories');
const paymentTermsRoutes = require('./routes/paymentTerms');
const logisticDetailsRoutes = require('./routes/logisticDetails');
const transporterDetailsRoutes = require('./routes/transporterDetails');
const termsConditionRoutes = require('./routes/termsCondition');
const mailRoutes = require('./routes/mailer');
const contactUSRoutes = require('./routes/customerQuery');
const demoQueryRoutes = require('./routes/demoQuery');
const newsLetterRoutes = require('./routes/newsLetter');
const customfieldRoutes = require('./routes/customfields');
const dashboardRoutes = require('./routes/dashboard');
const reportColumnRoutes = require('./routes/reportColumn');
const inventoryServicesRoutes = require('./routes/inventoryServices');
const batchItemsRoutes = require('./routes/batchItems');
const productionProcessRoutes = require('./routes/productionProcess');
const bomDetailsRoutes = require('./routes/bomDetails');
const bomProductionProcessRoutes = require('./routes/bomProductionProcess');
const bomFinishedGoodsRoutes = require('./routes/bomFinishedGoods');
const bomRawMaterialsRoutes = require('./routes/bomRawMaterials');
const bomScrapMaterialsRoutes = require('./routes/bomScrapmaterials');
const bomAdditionalChargesRoutes = require('./routes/bomAdditionalCharges');
const bomSeriesRoutes = require('./routes/bomSeries');
const prouctionRoutes = require('./routes/production');

const app = express();

// Apply body-parser middleware to handle JSON request bodies
app.use(bodyParser.json());

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

// Use authentication routes for `/authentication` path
app.use('/authentication', authenticationRoute);
app.use('/blogs', blogRoute);
app.use('/teams', teamRoute);
app.use('/users', userRoute);
app.use('/stores', storeRoute);
app.use('/address', addressRoute);
app.use('/blogComments', blogCommentsRoute);
app.use('/items', itemsRoute);
app.use('/buyerSupplier', buyerSupplierRoute);
app.use('/documentSeries', documentSeriesRoute);
app.use('/accountDetails', accountDetailsRoute);
app.use('/documents', documentsRoute);
app.use('/notification', notificationRoute);
// app.use('/bot', botRoute);
app.use('/uom', uomRoute);
app.use('/categories', categoriesRoute);
app.use('/paymentTerms', paymentTermsRoutes);
app.use('/logisticDetails', logisticDetailsRoutes);
app.use('/transporterDetails', transporterDetailsRoutes);
app.use('/termsCondition', termsConditionRoutes);
app.use('/mail', mailRoutes);
app.use('/contactUs', contactUSRoutes);
app.use('/demoQuery', demoQueryRoutes);
app.use('/newsLetter', newsLetterRoutes);
app.use('/customFields', customfieldRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/reportColumns', reportColumnRoutes);
app.use('/inventoryServices', inventoryServicesRoutes);
app.use('/batchItems', batchItemsRoutes);
app.use('/productionProcess', productionProcessRoutes);
app.use('/bomDetails', bomDetailsRoutes);
app.use('/bomProductionProcess', bomProductionProcessRoutes);
app.use('/bomFinishedGoods', bomFinishedGoodsRoutes);
app.use('/bomRawMaterials', bomRawMaterialsRoutes);
app.use('/bomScrapMaterials', bomScrapMaterialsRoutes);
app.use('/bomAdditionalCharges', bomAdditionalChargesRoutes);
app.use('/bomSeries', bomSeriesRoutes);
app.use('/production', prouctionRoutes);

module.exports = app;
