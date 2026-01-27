const { Op, Sequelize } = require("sequelize");

async function executePlan(plan, db) {
  const mainModel = db[plan.tables[0]];
  const where = {};
  const include = [];

  // Date filter
  if (plan.dateFilter) {
    where[plan.dateFilter.field] = {
      [Op.gte]: new Date(Date.now() - plan.dateFilter.lastDays * 86400000)
    };
  }

  // Filters
  for (const f of plan.filters || []) {
    if (f.field.includes(".")) {
      const [relation, column] = f.field.split(".");
      include.push({
        association: relation,
        where: { [column]: f.value }
      });
    } else {
      where[f.field] = f.value;
    }
  }

  // Aggregations
  if (plan.action === "sum" || plan.action === "count") {
    const fn = plan.action === "sum" ? "SUM" : "COUNT";
    const rows = await mainModel.findAll({
      attributes: [[Sequelize.fn(fn, Sequelize.col(plan.metric)), plan.metric]],
      where,
      include,
      raw: true
    });
    return rows;
  }

  // List
  return await mainModel.findAll({
    attributes: plan.select,
    where,
    include,
    raw: true
  });
}

module.exports = executePlan;
