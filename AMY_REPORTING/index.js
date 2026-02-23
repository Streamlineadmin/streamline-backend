const loadSchema = require("./schemaLoader");
const aiPlanner = require("./aiPlanner");
const validatePlan = require("./planValidator");
const executePlan = require("./executor");
const formatResponse = require("./formatter");

function createEngine(db) {
  const schema = loadSchema(db);

  return async function run(query) {
    const plan = await aiPlanner(schema, query);
    validatePlan(plan, schema);
    const rows = await executePlan(plan, db);
    return formatResponse(plan, rows);
  };
}

module.exports = createEngine;
