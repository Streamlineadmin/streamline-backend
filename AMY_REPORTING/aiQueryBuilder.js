const db = require('./db');
const SEMANTIC = require('./semantic');
const { Op, Sequelize } = require('sequelize');

/**
 * Converts a human-friendly query into a Sequelize query
 */
async function buildQuery(intent) {
  const { table, action, filters, metric, groupBy, range } = intent;

  // Map table to model
  const modelName = table;
  const model = db[modelName];
  if (!model) throw new Error(`Unsupported table: ${table}`);

  // Determine columns dynamically
  const columnMap = SEMANTIC[modelName];

  // Date filter
  const where = {};
  if (range) {
    const days = parseRange(range);
    const fromDate = new Date(Date.now() - days * 24*60*60*1000);
    const dateField = columnMap.createdAt || 'createdAt';
    where[dateField] = { [Op.gte]: fromDate };
  }

  // Filters
  const include = [];
  if (filters) {
    for (const key in filters) {
      const val = filters[key];
      const fk = Object.keys(columnMap).find(c => c.toLowerCase() === key.toLowerCase());
      if (fk) {
        where[columnMap[fk]] = val;
      } else {
        // attempt join table
        if (model.associations[key]) {
          include.push({
            model: model.associations[key].target,
            as: key,
            where: { [columnMap[model.associations[key].target.name].name]: val },
            required: true
          });
        }
      }
    }
  }

  // Action: list, sum, count
  let attributes;
  if (action === 'list') {
    attributes = [metric ? columnMap[metric] : columnMap.name];
    const rows = await model.findAll({ attributes, where, raw: true });
    return { rows, metric: attributes[0] };
  }

  if (action === 'sum' || action === 'count') {
    const col = metric ? columnMap[metric] : 'id';
    attributes = [
      [action === 'sum' ? Sequelize.fn('SUM', Sequelize.col(col)) : Sequelize.fn('COUNT', Sequelize.col(col)), col]
    ];
    const rows = await model.findAll({ attributes, where, include, raw: true });
    return { rows, metric: col };
  }

  if (action === 'chart') {
    const col = metric ? columnMap[metric] : 'id';
    attributes = [
      [Sequelize.fn('SUM', Sequelize.col(col)), col],
      [Sequelize.col(groupBy), groupBy]
    ];
    const rows = await model.findAll({ attributes, where, include, group: [Sequelize.col(groupBy)], raw: true });
    return { rows, metric: col };
  }

  throw new Error('Unsupported action');
}

function parseRange(range) {
  if (!range) return null;
  if (range === 'today') return 1;
  const match = range.match(/last (\d+) days/i);
  if (match) return parseInt(match[1]);
  if (range === '7_days') return 7;
  if (range === '30_days') return 30;
  return null;
}

module.exports = buildQuery;
