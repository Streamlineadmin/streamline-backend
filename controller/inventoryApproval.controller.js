const { Op } = require("sequelize");
const models = require("../models");
const { generateTransferNumber } = require("../helpers/transfer-number");

async function getApprovals(req, res) {
  try {
    const { companyId } = req.body;
    const approvals = await models.InventoryApproval.findAll({
      where: {
        companyId: Number(companyId)
      },
      order: [['createdAt', 'DESC']],
      raw: true
    });
    return res.status(200).json({
      data: approvals,
    })
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error });
  }
}

async function getApprovalById(req, res) {
  try {
    const { approvalId, companyId } = req.body;

    const approval = await models.InventoryApproval.findByPk(approvalId, { raw: true });
    if (!approval) {
      return res.status(404).json({ message: "Approval not found" });
    }

    const storeItem = await models.StockTransfer.findAll({
      where: { approvalId },
      raw: true,
      order: [['createdAt', 'ASC']]
    });

    const storeItemMap = {}, storeItems = [];

    if (!approval.documentType?.includes('Production Discarded')) {
      for (const element of storeItem) {
        element.quantity = Math.abs(element.quantity) || 0;
        element.quantityForApproval = Math.abs(element.quantityForApproval) || 0;
        if (!storeItemMap[element?.itemId]) {
          storeItems.push(element);
          if (approval.documentType != 'Finished Good' &&
            approval.documentType != 'Quality Report' &&
            approval.documentType != 'Service Qr' &&
            approval.documentType != 'Service Confirmation Qr'
          )
            storeItemMap[element.itemId] = element;
        } else {
          storeItemMap[element.itemId].quantity += (element.quantity || 0);
          // storeItemMap[element.itemId].quantityForApproval += Math.abs(element.quantityForApproval) || 0;
        }
      }
    }

    else {
      for (const element of storeItem) {
        element.quantity = Math.abs(element.quantity) || 0;
        element.quantityForApproval = Math.abs(element.quantityForApproval) || 0;
        const storeId = element?.toStoreId || element?.fromStoreId;
        const isRejected = element.isRejected || false;
        if (!storeItemMap?.[storeId]) {
          storeItemMap[storeId] = {};
        }
        if (!storeItemMap?.[storeId]?.[element.itemId]) {
          storeItemMap[storeId][element.itemId] = {};
        }
        if (!storeItemMap?.[storeId]?.[element.itemId]?.[isRejected]) {
          storeItemMap[storeId][element.itemId][isRejected] = element;
          storeItems.push(element);
        }
        else {
          storeItemMap[storeId][element.itemId][isRejected].quantity += (element.quantity || 0);
        }
      }
      storeItems.forEach(item => {
        item.quantityForApproval = item.quantity;
      });
    }


    const itemIds = [...new Set(storeItems.map(store => store.itemId))];
    const storeIds = [...new Set(storeItems.flatMap(s => [s.fromStoreId, s.toStoreId]))];

    const [items, uoms, categories, stores, users, alternateUnits] = await Promise.all([
      models.Items.findAll({
        where: { id: { [Op.in]: itemIds } },
        raw: true
      }),
      models.UOM.findAll({
        where: {
          [Op.or]: [
            { companyId, status: 1 },
            { companyId: null, status: 0 }
          ]
        },
        raw: true
      }),
      models.Categories.findAll({
        where: { companyId },
        raw: true
      }),
      models.Store.findAll({
        where: { id: { [Op.in]: storeIds } },
        raw: true
      }),
      models.Users.findAll({
        where: { id: { [Op.in]: [approval.requestedBy, approval.approvedBy] } },
        raw: true
      }),
      models.AlternateUnits.findAll({
        where: {
          itemId: {
            [Op.in]: itemIds
          }
        },
        raw: true
      })
    ]);

    const altenateUnitMap = alternateUnits.reduce((acc, curr) => {
      if (!acc[curr.itemId]) acc[curr.itemId] = [];
      acc[curr.itemId].push(curr);
      return acc;
    }, {});

    const itemsMap = Object.fromEntries(items.map(i => [i.id, i]));
    const uomMap = Object.fromEntries(uoms.map(u => [u.id, u.code]));
    const categoryMap = Object.fromEntries(categories.map(c => [c.id, c.name]));
    const storeMap = Object.fromEntries(stores.map(s => [s.id, s.name]));
    const userMap = Object.fromEntries(users.map(u => [u.id, u.name]));

    return res.status(200).json({
      data: {
        ...approval,
        requestedBy: userMap[approval?.requestedBy] || null,
        approvedBy: userMap[approval?.approvedBy] || null,
        items: storeItems.map((data) => ({
          ...data,
          item: {
            ...itemsMap?.[data.itemId],
            category: categoryMap[itemsMap?.[data.itemId]?.category] || null,
            subCategory: categoryMap[itemsMap?.[data.itemId]?.subCategory] || null,
            microCategory: categoryMap[itemsMap?.[data.itemId]?.microCategory] || null,
            metricsUnit: uomMap[itemsMap?.[data.itemId]?.metricsUnit] || null,
            alternateUnits: (altenateUnitMap?.[data.itemId] || []).map(unit => ({ ...unit, alternateUnit: uomMap?.[unit.alternateUnits] }))
          },
          fromStore: storeMap?.[data?.fromStoreId] || null,
          toStore: storeMap?.[data?.toStoreId] || null,
          quantity: data.quantity ?? data.quantityForApproval
        }))
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong", error });
  }
}

async function acceptRejectApproval(req, res) {
  try {
    const { approvalId, approvedBy, isApproved, items, by } = req.body;

    let itemsMap = items.reduce((acc, curr) => {
      acc[Number(curr.itemId)] = Number(curr.quantity || 0);
      return acc;
    }, {});

    const approval = await models.InventoryApproval.findByPk(approvalId);

    const uoms = await models.UOM.findAll({
      where: {
        [Op.or]: [
          { companyId: approval.companyId, status: 1 },
          { companyId: null, status: 0 }
        ]
      },
      raw: true
    });
    const uomMap = uoms.reduce((acc, curr) => {
      acc[curr.id] = curr.code;
      return acc;
    }, {});

    await models.InventoryApproval.update(
      {
        approvalStatus: isApproved ? 'Accepted' : 'Rejected',
        approvedBy,
        approvalDate: new Date(),
      },
      {
        where: { id: approvalId },
      }
    );
    if (isApproved) {
      if (approval?.documentType == 'Delivery Challan' || approval?.documentType == 'Invoice' || approval?.documentType == 'Purchase Return' ||
        approval?.documentType == 'Service Challan' || approval?.documentType == 'Service Confirmation Challan'
      ) {
        const stockTransfers = await models.StockTransfer.findAll({
          where: {
            approvalId
          }
        });
        const storeId = await models.Store.findOne({
          where: {
            id: stockTransfers[0]?.fromStoreId
          }
        });
        for (const element of stockTransfers) {
          let remainingQuantity = itemsMap[element.itemId] || 0;
          const existingStock = await models.StoreItems.findAll({
            where: { storeId: storeId.id, itemId: element.itemId },
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
              itemId: element.itemId,
              quantity: deductQty * -1,
              toStoreId: null,
              transferDate: new Date().toISOString(),
              transferredBy: element.transferredBy,
              comment: '',
              companyId: element.companyId,
              price: element.price,
              documentNumber: element.documentNumber,
              documentType: element.documentType,
              actualPrice: stock.price,
              approvalId: approval.id,
              quantityForApproval: element.quantityForApproval
            });
          }
        }
        await models.StockTransfer.destroy({
          where: {
            id: {
              [Op.in]: stockTransfers?.filter(elem => itemsMap[elem.itemId]).map(elem => elem.id)
            }
          }
        });
        return res.status(200).json({ message: 'Document Status Updated.' });
      }

      if (approval?.documentType == 'Stock Transfer') {
        const stockTransfers = await models.StockTransfer.findAll({
          where: {
            approvalId: approval.id
          }
        });
        for (const element of stockTransfers) {
          let remainingQuantity = itemsMap[element.itemId];
          const existingStock = await models.StoreItems.findAll({
            where: { storeId: element.fromStoreId, itemId: element.itemId, isRejected: element.isRejected || false },
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
            if (element?.toStoreId == element?.fromStoreId) {
              await models.StockTransfer.create({
                transferNumber: element.transferNumber,
                fromStoreId: element?.fromStoreId,
                itemId: element.itemId,
                quantity: deductQty,
                toStoreId: element.toStoreId,
                transferDate: element.transferDate,
                transferredBy: element.transferredBy,
                comment: element.comment,
                companyId: element.companyId,
                price: stock.price,
                isRejected: element?.toReject || false,
                approvalId: approval.id,
                quantityForApproval: element.quantityForApproval
              });
              await models.StockTransfer.create({
                transferNumber: element.transferNumber,
                fromStoreId: element?.fromStoreId,
                itemId: element.itemId,
                quantity: deductQty * -1,
                toStoreId: element.toStoreId,
                transferDate: element.transferDate,
                transferredBy: element.transferredBy,
                comment: element.comment,
                companyId: element.companyId,
                price: stock.price,
                isRejected: element?.isRejected || false,
                approvalId: approval.id,
                quantityForApproval: element.quantityForApproval
              });

            }
            else {
              await models.StockTransfer.create({
                transferNumber: element.transferNumber,
                fromStoreId: element?.fromStoreId,
                itemId: element.itemId,
                quantity: deductQty,
                toStoreId: element.toStoreId,
                transferDate: element.transferDate,
                transferredBy: element.transferredBy,
                comment: element.comment,
                companyId: element.companyId,
                price: stock.price,
                isRejected: element?.toReject || false,
                approvalId: approval.id,
                quantityForApproval: element.quantityForApproval
              });
            }
            await models.StoreItems.create({
              storeId: element.toStoreId,
              itemId: element.itemId,
              quantity: deductQty,
              status: 1,
              addedBy: element.transferredBy,
              price: stock.price,
              isRejected: element?.toReject || false,
              approvalId: approval.id,
              quantityForApproval: deductQty
            });
          }
        }
        await models.StockTransfer.destroy({
          where: {
            id: {
              [Op.in]: stockTransfers?.filter(elem => itemsMap[elem.itemId]).map(elem => elem.id)
            }
          }
        });
        return res.status(200).json({ message: 'Document Status Updated.' });
      }

      if (approval?.documentType == "Quality Report" ||
        approval?.documentType == "Service Qr" ||
        approval?.documentType == "Service Confirmation Qr"
      ) {
        let itemsMap = items?.filter(item => !item.isRejected).reduce((acc, curr) => {
          acc[Number(curr.itemId)] = Number(curr.quantity || 0);
          return acc;
        }, {});
        let itemsMapReject = items?.filter(item => item.isRejected).reduce((acc, curr) => {
          acc[Number(curr.itemId)] = Number(curr.quantity || 0);
          return acc;
        }, {});
        const storeItems = await models.StoreItems.findAll({
          where: {
            approvalId: approval.id
          }
        });
        for (const element of storeItems) {
          await element.update({ quantity: element?.isRejected ? itemsMapReject[element.itemId] : itemsMap[element.itemId] });
        }
        const stockTransfer = await models.StockTransfer.findAll({
          where: {
            approvalId: approval.id
          }
        });
        for (const element of stockTransfer) {
          await element.update({ quantity: element?.isRejected ? itemsMapReject[element.itemId] : itemsMap[element.itemId] });
        }
        return res.status(200).json({
          message: 'Document Approved.'
        });
      }

      if (approval?.documentType == 'Finished Good') {

        const finishedGood = await models.ProductionFinishedGoods.findOne({
          where: {
            productionId: approval.documentNumber
          }
        });
        if (finishedGood) {
          await finishedGood.update({
            passedQuantity: (finishedGood?.passedQuantity || 0) + ((items[0]?.quantity || 0) / (finishedGood?.conversionFactor || 1)),
            rejectQuantity: (finishedGood?.rejectQuantity || 0) + ((items[1]?.quantity || 0) / (finishedGood?.conversionFactor || 1)),
          });
          if (finishedGood.quantity <= finishedGood.passedQuantity) {
            await models.Production.update({ status: 4 }, {
              where: {
                id: finishedGood.productionId
              }
            });
          }
        }
        const storeItems = await models.StoreItems.findAll({
          where: {
            approvalId: approval.id
          }
        });
        for (const element of storeItems) {
          if (element.isRejected) {
            await element.update({ quantity: Number(items[1]?.quantity || 0) });
          }
          else {
            await element.update({ quantity: Number(items[0]?.quantity || 0) });
          }
        }
        const stockTransfer = await models.StockTransfer.findAll({
          where: {
            approvalId: approval.id
          }
        });
        for (const element of stockTransfer) {
          if (element.isRejected) {
            await element.update({ quantity: Number(items[1]?.quantity || 0) });
          }
          else {
            await element.update({ quantity: Number(items[0]?.quantity || 0) });
          }
        }
        return res.status(200).json({ message: 'Document Status Updated.' });
      }

      if (approval?.documentType == 'Raw Material Return') {
        const saveitems = await models.Items.findAll({
          where: {
            companyId: approval.companyId,
            id: {
              [Op.in]: items.map(item => item.itemId)
            }
          },
          raw: true
        });
        const saveItemsMap = saveitems.reduce((acc, curr) => {
          acc[curr.id] = curr;
          return acc;
        }, {});
        const production = await models.Production.findOne({
          where: {
            id: approval.documentNumber
          }
        });
        const storeItems = await models.StoreItems.findAll({
          where: {
            approvalId: approval.id,
          },
          order: [['createdAt', 'ASC']]
        });
        for (const element of items) {
          if (element.quantity) {
            const rawMaterial = await models.ProductionRawMaterials.findOne({
              where: {
                productionId: production.id,
                itemId: saveItemsMap[element.itemId]?.itemId
              }
            });
            if (rawMaterial) {
              await rawMaterial.update({ issuedQuantity: rawMaterial.issuedQuantity - itemsMap[element.itemId] })
            }
          }
        }
        for (const element of storeItems) {
          if (itemsMap[element.itemId?.toString()] <= 0) break;
          await element.update({ quantity: Math.min(itemsMap[element.itemId?.toString()], element.quantityForApproval) });
          itemsMap[element.itemId?.toString()] = itemsMap[element.itemId?.toString()] - element.quantityForApproval;
        }
        itemsMap = items.reduce((acc, curr) => {
          acc[(curr.itemId)] = curr.quantity || 0;
          return acc;
        }, {});
        const stockTransfer = await models.StockTransfer.findAll({
          where: {
            approvalId: approval.id,
          },
          order: [['createdAt', 'ASC']]
        });
        for (const element of stockTransfer) {
          if (itemsMap[element.itemId?.toString()] <= 0) break;
          await element.update({ quantity: Math.min(itemsMap[element.itemId?.toString()], element.quantityForApproval) });
          itemsMap[element.itemId?.toString()] = itemsMap[element.itemId?.toString()] - element.quantityForApproval;
        }
        return res.status(200).json({ message: 'Document Status Updated.' });
      }

      if (approval?.documentType == 'Raw Material') {
        const itemsWithId = await models.Items.findAll({
          where: {
            id: {
              [Op.in]: items.map(item => item.itemId)
            }
          },
          raw: true
        });
        const itemIdMap = itemsWithId?.reduce((acc, curr) => {
          acc[curr.id] = curr;
          return acc;
        }, {});
        const stockTransfers = await models.StockTransfer.findAll({
          where: {
            approvalId
          }
        });
        for (const element of stockTransfers) {
          const storeId = await models.Store.findOne({
            where: {
              id: element?.fromStoreId
            }
          });
          let remainingQuantity = itemsMap[element.itemId];
          let price = 0;
          const existingStock = await models.StoreItems.findAll({
            where: { storeId: storeId.id, itemId: element.itemId, isRejected: element.isRejected || false },
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
              itemId: element.itemId,
              quantity: deductQty * -1,
              toStoreId: null,
              transferDate: new Date().toISOString(),
              transferredBy: element.transferredBy,
              comment: '',
              companyId: element.companyId,
              price: stock.price,
              productionId: element.productionId,
              productionNavigationId: element.id,
              isRejected: element.isRejected,
              actualPrice: stock.price,
              approvalId: approval.id,
              quantityForApproval: element.quantityForApproval
            });
            price += stock.price * deductQty;
          }

          const rawMaterial = await models.ProductionRawMaterials.findOne({
            where: {
              productionId: approval.documentNumber,
              itemId: itemIdMap[element.itemId]?.itemId
            }
          });
          await rawMaterial.update(
            {
              issuedQuantity: Number((rawMaterial.issuedQuantity || 0)) + Number(itemsMap[element.itemId] || 0),
              currentAverage: (rawMaterial.currentAverage || 0) + price
            }
          );
          await models.ProductionHistory.create({
            productionId: approval.documentNumber,
            actionType: 'Raw Material Issued.',
            summary: `${itemIdMap[element.itemId]?.itemName} - ${itemsMap[element.itemId]} ${uomMap[itemIdMap[element.itemId]?.metricsUnit]} issued by ${by}.`
          });
        }
        await models.StockTransfer.destroy({
          where: {
            id: {
              [Op.in]: stockTransfers.map(elem => elem.id)
            }
          }
        });
        return res.status(200).json({ message: 'Document Status Updated.' });
      }

      if (approval?.documentType == 'Scrap Material') {
        const productionScrapMaterials = await models.ProductionScrapMaterials.findAll({
          where: {
            productionId: approval.documentNumber
          }
        });
        const itemsWithId = await models.Items.findAll({
          where: {
            id: {
              [Op.in]: items.map(item => item.itemId)
            }
          },
          raw: true
        });

        const itemIdMap = itemsWithId?.reduce((acc, curr) => {
          acc[curr.itemId] = curr;
          return acc;
        }, {});
        for (const element of productionScrapMaterials) {
          if (itemsMap[itemIdMap[element.itemId].id]) {
            await element.update({ producedQuantity: (element?.producedQuantity || 0) + (Number(itemsMap[itemIdMap[element.itemId].id]) || 0) });
            await models.ProductionHistory.create({
              productionId: approval.documentNumber,
              actionType: 'Scrap Material Produced.',
              summary: `${itemIdMap[element.itemId]?.itemName} - ${uomMap[itemIdMap[element.itemId].metricsUnit]} ${uomMap[element.uom]} added by ${by}.`
            });
          }
        }
      }

      if (approval?.documentType == 'Stock Update' || approval?.documentType == 'Physical Stock Reconcilation') {
        const stockTransfers = await models.StockTransfer.findAll({
          where: {
            approvalId,
            quantityForApproval: {
              [Op.lt]: 0
            }
          }
        });
        for (const element of stockTransfers) {
          let remainingQuantity = itemsMap[element.itemId] || 0;
          const existingStock = await models.StoreItems.findAll({
            where: { storeId: element.fromStoreId, itemId: element.itemId, isRejected: element.isRejected || false },
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
              fromStoreId: element.fromStoreId || null,
              itemId: element.itemId,
              quantity: deductQty * -1,
              toStoreId: null,
              transferDate: new Date().toISOString(),
              transferredBy: element.transferredBy,
              comment: '',
              companyId: element.companyId,
              price: stock.price,
              isRejected: element.isRejected,
              actualPrice: stock.price,
              approvalId: approval.id,
              quantityForApproval: element.quantityForApproval
            });
          }
        }

        await models.StockTransfer.destroy({
          where: {
            id: {
              [Op.in]: stockTransfers?.filter(data => itemsMap[data.itemId]).map(data => data.id)
            }
          }
        });
      }
      const storeItems = await models.StoreItems.findAll({
        where: {
          approvalId
        }
      });

      for (const element of storeItems) {
        await element.update({ quantity: itemsMap[element.itemId] });
      }

      const stockTransfer = await models.StockTransfer.findAll({
        where: {
          approvalId,
          quantityForApproval: {
            [Op.gt]: 0
          }
        }
      });

      for (const element of stockTransfer) {
        await element.update({ quantity: itemsMap[element.itemId] });
      }
    }

    res.status(200).json({ message: 'Document Status Updated.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong', error });
  }
}


module.exports = {
  getApprovals,
  getApprovalById,
  acceptRejectApproval
};