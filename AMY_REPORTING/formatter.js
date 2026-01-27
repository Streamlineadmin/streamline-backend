function formatResponse(plan, rows) {
    if (plan.action === "list") {
      return rows;
    }
  
    if (plan.action === "count") {
      return `Total: ${rows[0].count}`;
    }
  
    if (plan.action === "sum") {
      return `Total: ₹${Number(rows[0].value || 0).toLocaleString()}`;
    }
  
    if (plan.action === "chart") {
      return {
        chartType: plan.chart,
        labels: rows.map(r => r.label),
        values: rows.map(r => Number(r.value))
      };
    }
  }
  
  module.exports = formatResponse;
  