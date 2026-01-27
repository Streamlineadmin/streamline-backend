const db = require('./db');
const SEMANTIC = require('./semantic');
const { Sequelize, Op } = require('sequelize');

function parseRange(range) {
  if (!range) return 7;
  if (range === 'today') return 1;
  const match = range.match(/last_(\d+)_days/);
  if (match) return parseInt(match[1]);
  if (range === '7_days') return 7;
  if (range === '30_days') return 30;
  return 7;
}

function buildQuery(intent, schema) {
    let selectedSchema = null;
  
    // find best table match
    for (const table of Object.values(schema)) {
      const matchedFields = intent.filters.filter(f =>
        table.fieldMap[f.field?.toLowerCase()]
      );
      if (matchedFields.length) {
        selectedSchema = table;
        break;
      }
    }
  
    // fallback
    if (!selectedSchema) {
      selectedSchema = Object.values(schema)[0];
    }
  
    const { model, fieldMap, fields } = selectedSchema;
  
    // safe select
    const attributes = intent.select
      .map(f => fieldMap[f.toLowerCase()])
      .filter(Boolean);
  
    if (!attributes.length) attributes.push(...fields);
  
    // safe where
    const where = {};
    for (const f of intent.filters) {
      const dbField = fieldMap[f.field?.toLowerCase()];
      if (!dbField) continue; // 🔥 prevents crashes
      where[dbField] = f.value;
    }
  
    return {
      model,
      options: { attributes, where }
    };
  }
  
  module.exports = buildQuery;
