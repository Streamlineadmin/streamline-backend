const { Op, Sequelize } = require('sequelize');

async function executePlan(plan, models) {
  const model = models[plan.entity];
  if (!model) throw new Error(`Model not found: ${plan.entity}`);

  const include = [];
  const where = { ...plan.filters };

  // auto date filtering
  if (plan.range) {
    const days = parseInt(plan.range.match(/\d+/)[0]);
    const from = new Date(Date.now() - days * 24*60*60*1000);
    const dateField = Object.keys(model.rawAttributes).find(f => f.toLowerCase().includes('date')) || 'createdAt';
    where[dateField] = { [Op.gte]: from };
  }

  // auto joins if filter is on associated model
  const assocMatches = model.associations || {};
  for (const assocName in assocMatches) {
    const assoc = assocMatches[assocName];
    if (Object.keys(plan.filters).includes(assoc.foreignKey)) {
      include.push({ model: assoc.target });
    }
  }

  // aggregation
  let attributes = undefined, group = undefined;
  if (plan.action === 'sum') {
    const metric = Object.keys(model.rawAttributes).find(f => /amount|price|total/i.test(f));
    attributes = [[Sequelize.fn('SUM', Sequelize.col(metric)), metric]];
  }
  if (plan.action === 'count') {
    const metric = Object.keys(model.rawAttributes)[0];
    attributes = [[Sequelize.fn('COUNT', Sequelize.col(metric)), 'count']];
  }
  if (plan.action === 'chart') {
    const metric = Object.keys(model.rawAttributes).find(f => /amount|price|total/i.test(f));
    attributes = [[Sequelize.fn('SUM', Sequelize.col(metric)), metric], plan.groupBy];
    group = [plan.groupBy];
  }

  const rows = await model.findAll({ where, include, attributes, group, raw: true });
  return rows;
}

module.exports = executePlan;
