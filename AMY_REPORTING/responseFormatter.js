function formatResponse(plan, rows) {
    if (plan.action === "sum") {
      return `Total ${plan.metric}: ₹${Number(rows[0][plan.metric] || 0).toLocaleString()}`;
    }
  
    if (plan.action === "count") {
      return `Total count: ${rows[0][plan.metric]}`;
    }
  
    if (plan.action === "list") {
      return rows;
    }
  
    if (plan.action === "chart") {
      return {
        labels: rows.map(r => r[plan.groupBy]),
        values: rows.map(r => r[plan.metric])
      };
    }
  }
  
  module.exports = formatResponse;
  