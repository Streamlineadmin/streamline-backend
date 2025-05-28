const express = require('express');
const { Model } = require('sequelize');
const inventoryServicesController  = require('../controller/inventoryServices.controller');

const router = express.Router();
router.post('/addInventoryServices', inventoryServicesController.addService);
router.post('/editInventoryServices', inventoryServicesController.editService);
router.post('/deleteInventoryServices', inventoryServicesController.deleteService); 
router.post('/', inventoryServicesController.getAllServices);

module.exports = router;