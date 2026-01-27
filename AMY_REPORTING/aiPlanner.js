const stringSimilarity = require('string-similarity');

function aiPlanner(schema, query) {
  query = query.toLowerCase();

  const plan = {
    entity: null,
    action: 'list',
    filters: {},
    range: null,
    chart: false,
    groupBy: null
  };

  // 1️⃣ detect entity (table)
  const tableNames = Object.keys(schema);
  const bestMatch = stringSimilarity.findBestMatch(query, tableNames);
  plan.entity = bestMatch.bestMatch.rating > 0.2 ? bestMatch.bestMatch.target : tableNames[0];

  // 2️⃣ detect action
  if (/list|show|all/.test(query)) plan.action = 'list';
  else if (/total|sum|amount/.test(query)) plan.action = 'sum';
  else if (/count/.test(query)) plan.action = 'count';
  else if (/chart|graph/.test(query)) { plan.action = 'chart'; plan.chart = true; }

  // 3️⃣ detect column filters dynamically
  const fields = schema[plan.entity].fields;
  for (const field of fields) {
    if (query.includes(field.toLowerCase())) {
      const regex = new RegExp(`${field.toLowerCase()}\\s*(is|=)\\s*([\\w\\-]+)`);
      const match = query.match(regex);
      if (match) plan.filters[field] = match[2];
    }
  }

  // 4️⃣ detect date ranges
  const lastDays = query.match(/last (\d+) (day|days|month|months)/);
  if (lastDays) {
    const n = parseInt(lastDays[1]);
    plan.range = lastDays[2].startsWith('month') ? `last_${n*30}_days` : `last_${n}_days`;
  }

  // 5️⃣ detect groupBy for charts
  if (plan.chart) {
    const assocNames = schema[plan.entity].associations.map(a => a.name.toLowerCase());
    for (const assoc of assocNames) {
      if (query.includes(assoc)) plan.groupBy = assoc;
    }
  }

  return plan;
}

module.exports = aiPlanner;
