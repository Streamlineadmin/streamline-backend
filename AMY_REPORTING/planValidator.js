function validatePlan(plan, schema) {
    const tables = schema.map(t => t.table);
  
    plan.tables.forEach(t => {
      if (!tables.includes(t)) {
        throw new Error(`Invalid table: ${t}`);
      }
    });
  
    return true;
  }
  
  module.exports = validatePlan;
  