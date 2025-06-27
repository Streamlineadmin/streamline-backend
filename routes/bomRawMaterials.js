const express = require('express');
const { Model } = require('sequelize');
const bomRawMaterialsController = require('../controller/bomRawMaterials.controller');

const router = express.Router();

router.post('/addBOMRawMaterials', bomRawMaterialsController.createBOMRawMaterials);
router.post('/updateBOMRawMaterials', bomRawMaterialsController.updateBOMRawMaterial);
router.post('/deleteBOMRawMaterials', bomRawMaterialsController.deleteBOMRawMaterial);
router.post('/', bomRawMaterialsController.getAllBOMRawMaterials);
router.post('/linkBom', bomRawMaterialsController.linkBOM);
router.post('/unlinkBom', bomRawMaterialsController.unlinkBOM);

module.exports = router;
