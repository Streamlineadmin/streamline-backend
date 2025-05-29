const models = require("../models");
const { Op } = require("sequelize");

function addService(req, res) {
  // Check if serviceId or serviceName already exists for the given company
  models.InventoryServices.findOne({
    where: {
      companyId: req.body.companyId,
      [models.Sequelize.Op.or]: [
        { serviceId: req.body.serviceId },
        { serviceName: req.body.serviceName },
      ],
    },
  })
    .then((serviceResult) => {
      if (serviceResult) {
        let message = "";
        if (
          serviceResult.serviceId === req.body.serviceId &&
          serviceResult.serviceName === req.body.serviceName
        ) {
          message = "Both Service ID and Service Name already exist!";
        } else if (serviceResult.serviceId === req.body.serviceId) {
          message = "Service ID already exists!";
        } else {
          message = "Service Name already exists!";
        }
        return res.status(409).json({ message });
      } else {
        // Validate mandatory fields except metricsUnit
        if (
          !req.body.serviceId ||
          !req.body.serviceName ||
          !req.body.companyId
        ) {
          return res.status(400).json({
            message:
              "Mandatory fields missing: serviceId, serviceName, and companyId are required.",
          });
        }

        const serviceData = {
          serviceId: req.body.serviceId,
          serviceName: req.body.serviceName,
          category: req.body.category,
          subCategory: req.body.subCategory,
          microCategory: req.body.microCategory,
          alternateUnit: req.body.alternateUnit,
          conversionFactor: req.body.conversionFactor,
          metricsUnit: req.body.metricsUnit,
          HSNCode: req.body.HSNCode,
          price: req.body.price,
          taxType: req.body.taxType,
          tax: req.body.tax || null,
          description: req.body.description,
          companyId: req.body.companyId,
          status: req.body.status || 1,
        };

        models.InventoryServices.create(serviceData)
          .then((result) => {
            res.status(201).json({
              message: "Service added successfully",
              service: result,
            });
          })
          .catch((error) => {
            res.status(500).json({
              message: "Something went wrong, please try again later!",
              error: error.message || error,
            });
          });
      }
    })
    .catch((error) => {
      res.status(500).json({
        message: "Something went wrong, please try again later!",
        error: error.message || error,
      });
    });
}

function getService(req, res) {
  const { id } = req.params; // assuming service primary key or you can use serviceId

  models.InventoryServices.findByPk(id)
    .then((service) => {
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(service);
    })
    .catch((error) => {
      res.status(500).json({
        message: "Something went wrong, please try again later!",
        error: error.message || error,
      });
    });
}

// Edit/update a service by ID
function editService(req, res) {
  const { id } = req.body;
  const updateData = req.body;

  models.InventoryServices.findByPk(id)
    .then((service) => {
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      // Optional: check if serviceId or serviceName in updateData conflicts with another service for the same company
      const { serviceId, serviceName, companyId } = updateData;

      if (serviceId || serviceName) {
        return models.InventoryServices.findOne({
          where: {
            companyId: companyId || service.companyId,
            [models.Sequelize.Op.or]: [
              serviceId ? { serviceId } : null,
              serviceName ? { serviceName } : null,
            ].filter(Boolean),
            id: { [models.Sequelize.Op.ne]: id }, // exclude current record
          },
        }).then((conflictService) => {
          if (conflictService) {
            let message = "";
            if (
              conflictService.serviceId === serviceId &&
              conflictService.serviceName === serviceName
            ) {
              message = "Both Service ID and Service Name already exist!";
            } else if (conflictService.serviceId === serviceId) {
              message = "Service ID already exists!";
            } else {
              message = "Service Name already exists!";
            }
            return res.status(409).json({ message });
          }
          // No conflict, proceed to update
          return service.update(updateData).then((updatedService) => {
            res.json({
              message: "Service updated successfully",
              service: updatedService,
            });
          });
        });
      } else {
        // No serviceId or serviceName update, just update directly
        return service.update(updateData).then((updatedService) => {
          res.json({
            message: "Service updated successfully",
            service: updatedService,
          });
        });
      }
    })
    .catch((error) => {
      res.status(500).json({
        message: "Something went wrong, please try again later!",
        error: error.message || error,
      });
    });
}

function deleteService(req, res) {
  const serviceId = req.body.id;

  if (!serviceId) {
    return res.status(400).json({
      message: "Service ID is required",
    });
  }

  models.InventoryServices.destroy({ where: { id: serviceId } })
    .then((result) => {
      if (result) {
        res.status(200).json({
          message: "Service deleted successfully",
        });
      } else {
        res.status(200).json({
          message: "Service not found",
        });
      }
    })
    .catch((error) => {
      res.status(500).json({
        message: "Something went wrong, please try again later!",
        error: error,
      });
    });
}

function getAllServices(req, res) {
  models.InventoryServices.findAll({
          where: {
              companyId: req.body.companyId
          }
      }).then(result => {
          if (!result || result.length === 0) {
              return res.status(200).json([]);
          }
          res.status(200).json(result);
      })
          .catch(error => {
              console.error("No service found", error);
              res.status(500).json({
                  message: "Something went wrong, please try again later!"
              });
          });

}

module.exports = {
  addService: addService,
  getService: getService,
  editService: editService,
  deleteService: deleteService,
  getAllServices: getAllServices,
};
