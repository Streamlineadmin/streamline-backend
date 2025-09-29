const { Op } = require("sequelize");
const models = require("../models");
const storeitems = require("../models/storeitems");

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
      raw: true
    });

    const storeItemMap = {}, storeItems = [];

    for (const element of storeItem) {
      element.quantity = Math.abs(element.quantity);
      if (!storeItemMap[element?.itemId]) {
        storeItems.push(element);
        storeItemMap[element.itemId] = element;
      } else {
        storeItemMap[element.itemId].quantity += element.qunatity;
      }
    }

    const itemIds = [...new Set(storeItems.map(store => store.itemId))];
    const storeIds = [...new Set(storeItems.flatMap(s => [s.fromStoreId, s.toStoreId]))];

    const [items, uoms, categories, stores, users] = await Promise.all([
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
      })
    ]);

    const itemsMap = Object.fromEntries(items.map(i => [i.id, i]));
    const uomMap = Object.fromEntries(uoms.map(u => [u.id, u.code]));
    const categoryMap = Object.fromEntries(categories.map(c => [c.id, c.name]));
    const storeMap = Object.fromEntries(stores.map(s => [s.id, s.name]));
    const userMap = Object.fromEntries(users.map(u => [u.id, u.username]));

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
    const { approvalId, approvedBy, isApproved, items } = req.body;

    const itemsMap = items.reduce((acc, curr) => {
      acc[Number(curr.itemId)] = curr.quantity || 0;
      return acc;
    }, {});

    const approval = await models.InventoryApproval.findByPk(approvalId);

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
      if (approval?.documentType == 'Delivery Challan' || approval?.documentType == 'Invoice') {
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
          let remainingQuantity = itemsMap[element.itemId];
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
              [Op.in]: stockTransfers.map(elem => elem.id)
            }
          }
        });
        return res.status(200).json({ message: 'Document Status Updated.' });
      }

      if (approval?.documentType == 'Stock Update') {
        const stockTransfers = await models.StockTransfer.findAll({
          where: {
            approvalId
          }
        });
        for (const element of storeItems) {
          const storeId = await models.Store.findOne({
            where: {
              id: element?.fromStoreId
            }
          });
        }
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
          approvalId
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