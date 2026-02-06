const CAPABILITIES = require('./capabilities');
const db = require('./db');
const { Op } = require('sequelize');

function parseRange(range) {
  if (range === 'today') return 1;
  if (range === '7_days') return 7;
  if (range === '30_days') return 30;
  return null;
}

async function runQuery(intent) {
  const capability = CAPABILITIES[intent.capability];
  if (!capability) throw new Error('Unsupported capability');

  const Model = db[capability.baseModel];
  if (!Model) throw new Error('Model not found');

  const where = {};
  if (intent.range && capability.dateField) {
    const days = parseRange(intent.range);
    if (days) {
      where[capability.dateField] = {
        [Op.gte]: new Date(Date.now() - days * 86400000)
      };
    }
  }

  switch (intent.action) {
    case 'count':
      return Model.count({ where });

    case 'list':
      return Model.findAll({
        attributes: [capability.listField],
        distinct: true,
        raw: true
      });

    case 'details':
      return Model.findAll({ limit: 50 });

    default:
      throw new Error('Unsupported action');
  }
}

module.exports = { runQuery };
