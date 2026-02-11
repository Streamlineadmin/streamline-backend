const { Op, fn, col } = require("sequelize");

function applyDate(where, plan, model) {
  if (!plan.dateRange) return;

  const dateField = Object.keys(model.rawAttributes)
    .find(k => model.rawAttributes[k].type.key === "DATE");

  if (!dateField) return;

  if (plan.dateRange.type === "today") {
    where[dateField] = { [Op.gte]: new Date().setHours(0,0,0,0) };
  }

  if (plan.dateRange.type === "last_days") {
    where[dateField] = {
      [Op.gte]: new Date(Date.now() - plan.dateRange.value * 86400000)
    };
  }
}

async function executePlan(plan, db) {
  const model = db[plan.entity];
  const where = {};
  applyDate(where, plan, model);

  Object.assign(where, plan.filters || {});

  // LIST
  if (plan.action === "list") {
    return model.findAll({ where, raw: true });
  }

  // COUNT
  if (plan.action === "count") {
    const count = await model.count({ where });
    return [{ count }];
  }

  // SUM
  if (plan.action === "sum") {
    const res = await model.findAll({
      attributes: [[fn("SUM", col(plan.metric)), "value"]],
      where,
      raw: true
    });
    return res;
  }

  // CHART
  if (plan.action === "chart") {
    const res = await model.findAll({
      attributes: [
        [fn("SUM", col(plan.metric)), "value"],
        [col(plan.groupBy), "label"]
      ],
      where,
      group: [col(plan.groupBy)],
      limit: 10,
      raw: true
    });
    return res;
  }

  throw new Error("Unsupported action");
}

module.exports = executePlan;
