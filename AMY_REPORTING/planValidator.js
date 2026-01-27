function validatePlan(plan, schema) {
    if (!schema[plan.entity]) {
      throw new Error(`Unknown entity: ${plan.entity}`);
    }
  
    const attrs = schema[plan.entity].attributes;
  
    if (plan.metric && !attrs[plan.metric]) {
      throw new Error(`Invalid metric: ${plan.metric}`);
    }
  
    if (plan.groupBy && !attrs[plan.groupBy]) {
      throw new Error(`Invalid groupBy: ${plan.groupBy}`);
    }
  
    return true;
  }
  
  module.exports = validatePlan;
  