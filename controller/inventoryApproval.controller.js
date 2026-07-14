const { Op } = require("sequelize");
const models = require("../models");
const { generateTransferNumber } = require("../helpers/transfer-number");

async function getApprovals(req, res) {
  try {
    const { companyId, currentPage, pageSize, filters } = req.body;
    
    const whereCondition = {
      companyId: Number(companyId)
    };
    
    if (filters) {
      if (filters.approvalId && filters.approvalId[0]) {
        whereCondition.approvalId = {
          [Op.like]: `%${filters.approvalId[0].trim()}%`
        };
      }
      if (filters.documentType && filters.documentType[0]) {
        whereCondition.documentType = {
          [Op.like]: `%${filters.documentType[0].trim()}%`
        };
      }
      if (filters.approvalStatus && filters.approvalStatus[0]) {
        whereCondition.approvalStatus = {
          [Op.like]: `%${filters.approvalStatus[0].trim()}%`
        };
      }
      if (filters.documentNumber && filters.documentNumber[0]) {
        const val = filters.documentNumber[0].trim();
        whereCondition[Op.or] = [
          { documentNumber: { [Op.like]: `%${val}%` } },
          { productionId: { [Op.like]: `%${val}%` } },
          { bulkProductionNumber: { [Op.like]: `%${val}%` } }
        ];
      }
      if (filters.createdAt && filters.createdAt[0]) {
        const val = filters.createdAt[0].trim();
        whereCondition[Op.and] = [
          models.sequelize.where(
            models.sequelize.fn('DATE_FORMAT', models.sequelize.col('createdAt'), '%d/%m/%Y, %h:%i:%s %p'),
            { [Op.like]: `%${val}%` }
          )
        ];
      }
      if (filters.requestedBy && filters.requestedBy[0]) {
        const val = filters.requestedBy[0].trim();
        const matchedUsers = await models.Users.findAll({
          where: {
            [Op.or]: [
              { username: { [Op.like]: `%${val}%` } },
              { name: { [Op.like]: `%${val}%` } }
            ]
          },
          attributes: ['id'],
          raw: true
        });
        const matchedUserIds = matchedUsers.map(u => u.id);
        
        if ('admin'.includes(val.toLowerCase())) {
          whereCondition.requestedBy = {
            [Op.or]: [
              { [Op.in]: matchedUserIds },
              { [Op.is]: null }
            ]
          };
        } else {
          whereCondition.requestedBy = {
            [Op.in]: matchedUserIds
          };
        }
      }
    }

    if (currentPage && pageSize) {
      const offset = (Number(currentPage) - 1) * Number(pageSize);
      const limit = Number(pageSize);
      
      const { rows, count } = await models.InventoryApproval.findAndCountAll({
        where: whereCondition,
        order: [['createdAt', 'DESC']],
        offset,
        limit,
        raw: true
      });
      
      return res.status(200).json({
        data: rows,
        total: count
      });
    } else {
      const approvals = await models.InventoryApproval.findAll({
        where: whereCondition,
        order: [['createdAt', 'DESC']],
        raw: true
      });
      return res.status(200).json({
        data: approvals,
        total: approvals.length
      });
    }
  } catch (error) {
    console.error('Error in getApprovals:', error);
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

    let production = null;
    if (approval.bulkProductionId) {
      production = await models.Production.findAll({
        where: {
          bulkProductionId: approval.bulkProductionId
        }
      });
      if (production) {

        const finishedGoods = await models.ProductionFinishedGoods.findAll({
          where: {
            productionId: { [Op.in]: production.map(p => p.id) }
          },
          raw: true
        });
        production = {
          productionId: approval.documentNumber,
          finishedGood: {
            itemId: finishedGoods?.map(fg => fg.itemId).join(', '),
            itemName: finishedGoods?.map(fg => fg.itemName).join(', '),
          }
        }

      }
    } else if (["Finished Good", "Raw Material", "Scrap Material", "Raw Material Return"].includes(approval.documentType) || approval.documentType?.includes("Production Discarded")) {
      production = await models.Production.findByPk(approval.documentNumber, { raw: true });
      if (production) {
        const finishedGood = await models.ProductionFinishedGoods.findOne({
          where: {
            productionId: production.id
          },
          raw: true
        });
        production.finishedGood = finishedGood;
      }
    }

    const storeItem = await models.StockTransfer.findAll({
      where: { approvalId },
      raw: true,
      order: [['createdAt', 'ASC']]
    });

    const storeItemMap = {}, storeItems = [];
    let inventoryApprovalQuantity = false;
    if (approval.approvalStatus === "Pending") {
      if (["Goods Received Note",
        "Quality Report",
        "Purchase Invoice",
        "Purchase Return", "Sales Return",
        "Invoice", "Delivery Challan",
        "Service Challan",
        "Service Grn",
        "Service Qr",
        "Service Confirmation Challan",
        "Service Confirmation Grn",
        "Service Confirmation Qr"].includes(approval.documentType)) {
        inventoryApprovalQuantity = true;
      }
    }

    if (!approval.documentType?.includes('Production Discarded')) {
      storeItemMap[false] = {};
      storeItemMap[true] = {};
      for (const element of storeItem) {
        const isRejected = !!element.isRejected;
        element.quantity = Math.abs(element.quantity) || 0;
        element.quantityForApproval = Math.abs(element.quantityForApproval) || 0;
        if (!storeItemMap?.[isRejected]?.[element?.itemId]) {
          storeItems.push(element);
          if (approval.documentType != 'Finished Good' &&
            approval.documentType != 'Quality Report' &&
            approval.documentType != 'Service Qr' &&
            approval.documentType != 'Service Confirmation Qr'
          )
            storeItemMap[isRejected][element.itemId] = element;
          if (inventoryApprovalQuantity) {
            element.quantity = element.quantityForApproval;
          }
        } else {
          storeItemMap[isRejected][element.itemId].quantity += inventoryApprovalQuantity ? (element.quantityForApproval || 0) : (element.quantity || 0);
          if (inventoryApprovalQuantity) {
            storeItemMap[isRejected][element.itemId].quantityForApproval += Math.abs(element.quantityForApproval) || 0;
          }
        }
      }
    }

    else {
      for (const element of storeItem) {
        element.quantity = Math.abs(element.quantity) || 0;
        element.quantityForApproval = Math.abs(element.quantityForApproval) || 0;
        const storeId = element?.toStoreId || element?.fromStoreId;
        const isRejected = !!element.isRejected;
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

    const batchItems = await models.BatchItems.findAll({
      where: {
        documentNumber: approvalId
      }
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

    return res.status(200).json({
      data: {
        ...approval,
        requestedBy: userMap[approval?.requestedBy] || null,
        approvedBy: userMap[approval?.approvedBy] || null,
        productionData: production,
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
          quantity: data.quantity ?? data.quantityForApproval,
          batches: batchMap?.[data.itemId] || [],
        }))
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong", error });
  }
}

async function acceptRejectApproval(req, res) {
  const tAcceptReject = await models.sequelize.transaction();
  try {
    let { approvalId, approvedBy, isApproved, items, by, comment } = req.body;

    const approval = await models.InventoryApproval.findByPk(approvalId, {
      transaction: tAcceptReject
    });

    if (!items || !Array.isArray(items) || items.length === 0) {
      const stockTransfers = await models.StockTransfer.findAll({
        where: { approvalId },
        transaction: tAcceptReject
      });

      const storeItems = [];
      const storeItemMap = {};
      let inventoryApprovalQuantity = false;
      if (approval.approvalStatus === "Pending") {
        if (["Goods Received Note",
          "Quality Report",
          "Purchase Invoice",
          "Purchase Return", "Sales Return",
          "Invoice", "Delivery Challan",
          "Service Challan",
          "Service Grn",
          "Service Qr",
          "Service Confirmation Challan",
          "Service Confirmation Grn",
          "Service Confirmation Qr"].includes(approval.documentType)) {
          inventoryApprovalQuantity = true;
        }
      }

      if (!approval.documentType?.includes('Production Discarded')) {
        storeItemMap[false] = {};
        storeItemMap[true] = {};
        for (const element of stockTransfers) {
          const isRejected = !!element.isRejected;
          element.quantity = Math.abs(element.quantity) || 0;
          element.quantityForApproval = Math.abs(element.quantityForApproval) || 0;
          if (!storeItemMap?.[isRejected]?.[element?.itemId]) {
            storeItems.push(element);
            if (approval.documentType != 'Finished Good' &&
              approval.documentType != 'Quality Report' &&
              approval.documentType != 'Service Qr' &&
              approval.documentType != 'Service Confirmation Qr'
            )
              storeItemMap[isRejected][element.itemId] = element;
            if (inventoryApprovalQuantity) {
              element.quantity = element.quantityForApproval;
            }
          } else {
            storeItemMap[isRejected][element.itemId].quantity += inventoryApprovalQuantity ? (element.quantityForApproval || 0) : (element.quantity || 0);
            if (inventoryApprovalQuantity) {
              storeItemMap[isRejected][element.itemId].quantityForApproval += Math.abs(element.quantityForApproval) || 0;
            }
          }
        }
      }
      else {
        for (const element of stockTransfers) {
          element.quantity = Math.abs(element.quantity) || 0;
          element.quantityForApproval = Math.abs(element.quantityForApproval) || 0;
          const storeId = element?.toStoreId || element?.fromStoreId;
          const isRejected = !!element.isRejected;
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

      items = storeItems.map(data => ({
        itemId: data.itemId,
        quantity: Math.abs(data.quantityForApproval || data.quantity || 0),
        isRejected: !!data.isRejected
      }));
    }

    let itemsMap = items.reduce((acc, curr) => {
      acc[Number(curr.itemId)] = Number(curr.quantity || 0);
      return acc;
    }, {});

    const uoms = await models.UOM.findAll({
      where: {
        [Op.or]: [
          { companyId: approval.companyId, status: 1 },
          { companyId: null, status: 0 }
        ]
      },

      raw: true,
      transaction: tAcceptReject
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
        comment: comment || ''
      },
      {
        where: { id: approvalId },
        transaction: tAcceptReject
      }
    );
    if (isApproved) {
      if (approval?.documentType == 'Delivery Challan' || approval?.documentType == 'Invoice' || approval?.documentType == 'Purchase Return' ||
        approval?.documentType == 'Service Challan' || approval?.documentType == 'Service Confirmation Challan'
      ) {
        const stockTransfers = await models.StockTransfer.findAll({
          where: {
            approvalId
          },

          transaction: tAcceptReject
        });
        const storeId = await models.Store.findOne({
          where: {
            id: stockTransfers[0]?.fromStoreId
          },

          transaction: tAcceptReject
        });
        const alreadyReducedMap = {};
        const quantityForApprovalMap = stockTransfers.reduce((acc, curr) => {
          acc[curr.itemId] = (acc[curr.itemId] || 0) + (curr.quantityForApproval || 0);
          return acc;
        }, {});
        for (const element of stockTransfers) {
          if (!alreadyReducedMap[element.itemId]) {
            let remainingQuantity = itemsMap[element.itemId] || 0;
            const existingStock = await models.StoreItems.findAll({
              where: { storeId: storeId.id, itemId: element.itemId },
              order: [['createdAt', 'ASC']],
              transaction: tAcceptReject
            });
            for (const stock of existingStock) {
              if (remainingQuantity <= 0) break;
              if (stock.quantity <= 0) continue;
              const deductQty = Math.min(stock.quantity, remainingQuantity);
              remainingQuantity -= deductQty;

              await models.StoreItems.update(
                { quantity: (stock.quantity - deductQty) },
                {
                  where: { id: stock.id },
                  transaction: tAcceptReject
                }
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
                quantityForApproval: quantityForApprovalMap[element.itemId] || 0
              }, {
                transaction: tAcceptReject
              });
            }
            alreadyReducedMap[element.itemId] = true;
          }
        }
        await models.StockTransfer.destroy({
          where: {
            id: {
              [Op.in]: stockTransfers?.filter(elem => itemsMap[elem.itemId]).map(elem => elem.id)
            }
          },

          transaction: tAcceptReject
        });
        await tAcceptReject.commit();
        return res.status(200).json({ message: 'Document Status Updated.' });
      }

      if (approval?.documentType == 'Stock Transfer') {
        const stockTransfers = await models.StockTransfer.findAll({
          where: {
            approvalId: approval.id
          },

          transaction: tAcceptReject
        });
        for (const element of stockTransfers) {
          let remainingQuantity = itemsMap[element.itemId];
          const existingStock = await models.StoreItems.findAll({
            where: { storeId: element.fromStoreId, itemId: element.itemId, isRejected: element.isRejected || false },
            order: [['createdAt', 'ASC']],
            transaction: tAcceptReject
          });
          for (const stock of existingStock) {
            if (remainingQuantity <= 0) break;
            if (stock.quantity <= 0) continue;
            const deductQty = Math.min(stock.quantity, remainingQuantity);
            remainingQuantity -= deductQty;

            await models.StoreItems.update(
              { quantity: (stock.quantity - deductQty) },
              {
                where: { id: stock.id },
                transaction: tAcceptReject
              }
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
              }, {
                transaction: tAcceptReject
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
              }, {
                transaction: tAcceptReject
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
              }, {
                transaction: tAcceptReject
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
            }, {
              transaction: tAcceptReject
            });
          }
        }
        await models.StockTransfer.destroy({
          where: {
            id: {
              [Op.in]: stockTransfers?.filter(elem => itemsMap[elem.itemId]).map(elem => elem.id)
            }
          },

          transaction: tAcceptReject
        });
        await tAcceptReject.commit();
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
          },

          transaction: tAcceptReject
        });
        const alreadyMap = {};
        for (const element of storeItems) {
          const mapKey = `${element.itemId}_${!!element.isRejected}`;
          if (!alreadyMap[mapKey]) {
            await element.update(
              { quantity: element?.isRejected ? itemsMapReject[element.itemId] : itemsMap[element.itemId] },
              {
                transaction: tAcceptReject
              }
            );
            alreadyMap[mapKey] = true;
          }
        }
        const stockTransfer = await models.StockTransfer.findAll({
          where: {
            approvalId: approval.id
          },

          transaction: tAcceptReject
        });
        const alreadyMapTransfer = {};
        for (const element of stockTransfer) {
          const mapKey = `${element.itemId}_${!!element.isRejected}`;
          if (!alreadyMapTransfer[mapKey]) {
            await element.update(
              { quantity: element?.isRejected ? itemsMapReject[element.itemId] : itemsMap[element.itemId] },
              {
                transaction: tAcceptReject
              }
            );
            alreadyMapTransfer[mapKey] = element;
          } else {
            await alreadyMapTransfer[mapKey].update(
              { quantityForApproval: alreadyMapTransfer[mapKey].quantityForApproval + element.quantityForApproval },
              {
                transaction: tAcceptReject
              }
            );
            await element.destroy({
              transaction: tAcceptReject
            });
          }
        }
        await tAcceptReject.commit();
        return res.status(200).json({
          message: 'Document Approved.'
        });
      }

      if (approval?.documentType == 'Finished Good') {
        const finishedGood = await models.ProductionFinishedGoods.findOne({
          where: {
            productionId: approval.documentNumber
          },

          transaction: tAcceptReject
        });
        if (finishedGood) {
          await finishedGood.update({
            passedQuantity: (finishedGood?.passedQuantity || 0) + ((items[0]?.quantity || 0) / (finishedGood?.conversionFactor || 1)),
            rejectQuantity: (finishedGood?.rejectQuantity || 0) + ((items[1]?.quantity || 0) / (finishedGood?.conversionFactor || 1)),
          }, {
            transaction: tAcceptReject
          });
          if (finishedGood.quantity <= finishedGood.passedQuantity) {
            await models.Production.update({ status: 4 }, {
              where: {
                id: finishedGood.productionId
              },

              transaction: tAcceptReject
            });
          }
        }
        const storeItems = await models.StoreItems.findAll({
          where: {
            approvalId: approval.id
          },

          transaction: tAcceptReject
        });
        for (const element of storeItems) {
          if (element.isRejected) {
            await element.update({ quantity: Number(items[1]?.quantity || 0) }, {
              transaction: tAcceptReject
            });
          }
          else {
            await element.update({ quantity: Number(items[0]?.quantity || 0) }, {
              transaction: tAcceptReject
            });
          }
        }
        const stockTransfer = await models.StockTransfer.findAll({
          where: {
            approvalId: approval.id
          },

          transaction: tAcceptReject
        });
        for (const element of stockTransfer) {
          if (element.isRejected) {
            await element.update({ quantity: Number(items[1]?.quantity || 0) }, {
              transaction: tAcceptReject
            });
          }
          else {
            await element.update({ quantity: Number(items[0]?.quantity || 0) }, {
              transaction: tAcceptReject
            });
          }
        }
        await tAcceptReject.commit();
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

          raw: true,
          transaction: tAcceptReject
        });
        const saveItemsMap = saveitems.reduce((acc, curr) => {
          acc[curr.id] = curr;
          return acc;
        }, {});
        const production = await models.Production.findOne({
          where: {
            id: approval.documentNumber
          },

          transaction: tAcceptReject
        });
        const storeItems = await models.StoreItems.findAll({
          where: {
            approvalId: approval.id,
          },

          order: [['createdAt', 'ASC']],
          transaction: tAcceptReject
        });
        for (const element of items) {
          if (element.quantity) {
            const rawMaterial = await models.ProductionRawMaterials.findOne({
              where: {
                productionId: production.id,
                itemId: saveItemsMap[element.itemId]?.itemId
              },

              transaction: tAcceptReject
            });
            if (rawMaterial) {
              await rawMaterial.update(
                { issuedQuantity: rawMaterial.issuedQuantity - ((itemsMap[element.itemId] || 1) / (rawMaterial?.conversionFactor || 1)) },
                {
                  transaction: tAcceptReject
                }
              )
            }
          }
        }
        for (const element of storeItems) {
          if (itemsMap[element.itemId?.toString()] <= 0) break;
          await element.update(
            { quantity: Math.min(itemsMap[element.itemId?.toString()], element.quantityForApproval) },
            {
              transaction: tAcceptReject
            }
          );
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

          order: [['createdAt', 'ASC']],
          transaction: tAcceptReject
        });
        for (const element of stockTransfer) {
          if (itemsMap[element.itemId?.toString()] <= 0) break;
          await element.update(
            { quantity: Math.min(itemsMap[element.itemId?.toString()], element.quantityForApproval) },
            {
              transaction: tAcceptReject
            }
          );
          itemsMap[element.itemId?.toString()] = itemsMap[element.itemId?.toString()] - element.quantityForApproval;
        }
        await tAcceptReject.commit();
        return res.status(200).json({ message: 'Document Status Updated.' });
      }

      if (approval?.documentType == 'Raw Material') {
        const itemsWithId = await models.Items.findAll({
          where: {
            id: {
              [Op.in]: items.map(item => item.itemId)
            }
          },

          raw: true,
          transaction: tAcceptReject
        });
        const itemIdMap = itemsWithId?.reduce((acc, curr) => {
          acc[curr.id] = curr;
          return acc;
        }, {});
        const stockTransfers = await models.StockTransfer.findAll({
          where: {
            approvalId
          },

          transaction: tAcceptReject
        });
        for (const element of stockTransfers) {
          const storeId = await models.Store.findOne({
            where: {
              id: element?.fromStoreId
            },

            transaction: tAcceptReject
          });
          let remainingQuantity = itemsMap[element.itemId];
          let price = 0;
          const existingStock = await models.StoreItems.findAll({
            where: { storeId: storeId.id, itemId: element.itemId, isRejected: element.isRejected || false },
            order: [['createdAt', 'ASC']],
            transaction: tAcceptReject
          });
          for (const stock of existingStock) {
            if (remainingQuantity <= 0) break;
            if (stock.quantity <= 0) continue;
            const deductQty = Math.min(stock.quantity, remainingQuantity);
            remainingQuantity -= deductQty;

            await models.StoreItems.update(
              { quantity: (stock.quantity - deductQty) },
              {
                where: { id: stock.id },
                transaction: tAcceptReject
              }
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
              productionNavigationId: element.productionNavigationId,
              isRejected: element.isRejected,
              actualPrice: stock.price,
              approvalId: approval.id,
              quantityForApproval: element.quantityForApproval
            }, {
              transaction: tAcceptReject
            });
            price += stock.price * deductQty;
          }

          let productionIds = [];

          if (approval?.bulkProductionId) {
            productionIds = await models.Production.findAll({
              where: {
                bulkProductionId: approval.bulkProductionId
              },
            });
          }

          const rawMaterial = await models.ProductionRawMaterials.findOne({
            where: {
              productionId: productionIds.length > 0 ? productionIds.map(ids => ids.id) : approval.documentNumber,
              itemId: itemIdMap[element.itemId]?.itemId
            },

            transaction: tAcceptReject
          });
          await rawMaterial.update({
            issuedQuantity: Number((rawMaterial.issuedQuantity || 0)) + (Number(itemsMap[element.itemId] || 1) / (rawMaterial?.conversionFactor || 1)),
            currentAverage: (rawMaterial.currentAverage || 0) + price
          }, {
            transaction: tAcceptReject
          });
          await models.ProductionHistory.create({
            productionId: approval.documentNumber,
            actionType: 'Raw Material Issued.',
            summary: `${itemIdMap[element.itemId]?.itemName} - ${(itemsMap[element.itemId] / (rawMaterial?.conversionFactor || 1))} ${uomMap[rawMaterial?.uom]} issued by ${by}.`
          }, {
            transaction: tAcceptReject
          });
        }
        await models.StockTransfer.destroy({
          where: {
            id: {
              [Op.in]: stockTransfers.map(elem => elem.id)
            }
          },

          transaction: tAcceptReject
        });
        await tAcceptReject.commit();
        return res.status(200).json({ message: 'Document Status Updated.' });
      }

      if (approval?.documentType == 'Scrap Material') {
        let productionIds = [];

        if (approval?.bulkProductionId) {
          productionIds = await models.Production.findAll({
            where: {
              bulkProductionId: approval.bulkProductionId
            },
          });
        }
        const productionScrapMaterials = await models.ProductionScrapMaterials.findAll({
          where: {
            productionId: productionIds?.length > 0 ? productionIds.map(ids => ids.id) : approval.documentNumber
          },

          transaction: tAcceptReject
        });
        const itemsWithId = await models.Items.findAll({
          where: {
            id: {
              [Op.in]: items.map(item => item.itemId)
            }
          },

          raw: true,
          transaction: tAcceptReject
        });

        const itemIdMap = itemsWithId?.reduce((acc, curr) => {
          acc[curr.itemId] = curr;
          return acc;
        }, {});
        for (const element of productionScrapMaterials) {
          if (itemsMap[itemIdMap[element.itemId].id]) {
            await element.update(
              { producedQuantity: (element?.producedQuantity || 0) + ((Number(itemsMap[itemIdMap[element.itemId].id]) || 1) / (element?.conversionFactor || 1)) },
              {
                transaction: tAcceptReject
              }
            );
            await models.ProductionHistory.create({
              productionId: approval.documentNumber,
              actionType: 'Scrap Material Produced.',
              summary: `${itemIdMap[element.itemId]?.itemName} - ${((Number(itemsMap[itemIdMap[element.itemId].id]) || 1) / (element?.conversionFactor || 1))} ${uomMap[element.uom]} added by ${by}.`
            }, {
              transaction: tAcceptReject
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
          },

          transaction: tAcceptReject
        });
        for (const element of stockTransfers) {
          let remainingQuantity = itemsMap[element.itemId] || 0;
          const existingStock = await models.StoreItems.findAll({
            where: { storeId: element.fromStoreId, itemId: element.itemId, isRejected: element.isRejected || false },
            order: [['createdAt', 'ASC']],
            transaction: tAcceptReject
          });
          for (const stock of existingStock) {
            if (remainingQuantity <= 0) break;
            if (stock.quantity <= 0) continue;
            const deductQty = Math.min(stock.quantity, remainingQuantity);
            remainingQuantity -= deductQty;

            await models.StoreItems.update(
              { quantity: (stock.quantity - deductQty) },
              {
                where: { id: stock.id },
                transaction: tAcceptReject
              }
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
            }, {
              transaction: tAcceptReject
            });
          }
        }

        await models.StockTransfer.destroy({
          where: {
            id: {
              [Op.in]: stockTransfers?.filter(data => itemsMap[data.itemId]).map(data => data.id)
            }
          },

          transaction: tAcceptReject
        });
      }
      const storeItems = await models.StoreItems.findAll({
        where: {
          approvalId
        },

        transaction: tAcceptReject
      });

      const alreadyMap = {};
      for (const element of storeItems) {
        const mapKey = `${element.itemId}_${!!element.isRejected}`;
        if (!alreadyMap[mapKey]) {
          await element.update({ quantity: itemsMap[element.itemId] }, {
            transaction: tAcceptReject
          });
          alreadyMap[mapKey] = true;
        }
      }

      const stockTransfer = await models.StockTransfer.findAll({
        where: {
          approvalId,
          quantityForApproval: {
            [Op.gt]: 0
          }
        },

        transaction: tAcceptReject
      });

      const alreadyMapTransfer = {};
      for (const element of stockTransfer) {
        const mapKey = `${element.itemId}_${!!element.isRejected}`;
        if (!alreadyMapTransfer[mapKey]) {
          await element.update({ quantity: itemsMap[element.itemId] }, {
            transaction: tAcceptReject
          });
          alreadyMapTransfer[mapKey] = element;
        }
        else {
          await alreadyMapTransfer[mapKey].update(
            { quantityForApproval: alreadyMapTransfer[mapKey].quantityForApproval + element.quantityForApproval },
            {
              transaction: tAcceptReject
            }
          );
          await element.destroy({
            transaction: tAcceptReject
          });
        }
      }
    }

    await tAcceptReject.commit();
    res.status(200).json({ message: 'Document Status Updated.' });
  } catch (error) {
    await tAcceptReject.rollback();
    console.error(error);
    res.status(500).json({ message: 'Something went wrong', error });
  }
}

module.exports = {
  getApprovals,
  getApprovalById,
  acceptRejectApproval
};