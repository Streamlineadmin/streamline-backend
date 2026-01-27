function formatResponse(plan, rows) {
    if (!rows || rows.length === 0) return 'No records found';
  
    if (plan.action === 'sum') {
      const metric = Object.keys(rows[0])[0];
      return `Total ${metric}: ₹${Number(rows[0][metric]||0)}`;
    }
  
    if (plan.action === 'count') {
      return `Total records: ${rows[0].count || rows.length}`;
    }
  
    if (plan.action === 'chart') {
      return { labels: rows.map(r=>r[plan.groupBy]), values: rows.map(r=>Object.values(r).find(v=>typeof v==='number')) };
    }
  
    return rows.map(r => JSON.stringify(r)).join('\n');
  }
  
  module.exports = formatResponse;
  