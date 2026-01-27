const loadSchema = require('./schemaLoader');
const aiPlanner = require('./aiPlanner');
const executePlan = require('./executor');
const formatResponse = require('./formatter');

function createEngine(models) {
  const schema = loadSchema(models);

  return async function run(query) {
    const plan = aiPlanner(schema, query);
    const rows = await executePlan(plan, models);
    const response = formatResponse(plan, rows);
    return { success: true, plan, data: rows, response };
  };
}

module.exports = createEngine;
