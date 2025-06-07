const express = require('express');
const { Model } = require('sequelize');
const bomScrapMaterialsController = require('../controller/bomScrapMaterials.controller');

const router = express.Router();

router.post('/addScrapMaterials', bomScrapMaterialsController.createBOMScrapMaterials);
router.post('/updateScrapMaterials', bomScrapMaterialsController.updateBOMScrapMaterial);
router.post('/deleteScrapMaterials', bomScrapMaterialsController.deleteBOMScrapMaterial);
router.post('/', bomScrapMaterialsController.getAllBOMScrapMaterials);

module.exports = router;
