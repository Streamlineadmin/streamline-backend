function formatResponse(plan, rows) {
  if (plan.action === "list") {
    return {
      messageType: "table",
      data: rows
    };
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
      data: rows.map(r => ({
        label: r.label,
        value: Number(r.value)
      }))
    };
  }

}

module.exports = formatResponse;
