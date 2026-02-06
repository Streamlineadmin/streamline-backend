function parseIntent(query) {
    if (!query || typeof query !== 'string') {
      throw new Error('Query must be a string');
    }
  
    query = query.toLowerCase();
  
    const intent = {
      table: null,
      action: 'list',
      select: [],
      filters: [],
      chart: false
    };
  
    // action
    if (query.includes('count')) intent.action = 'count';
    if (query.includes('sum') || query.includes('total')) intent.action = 'sum';
    if (query.includes('chart') || query.includes('graph')) intent.chart = true;
  
    // select fields (very loose NLP)
    if (query.includes('name')) intent.select.push('name');
    if (query.includes('amount')) intent.select.push('amount');
  
    // loose filters: "hsn code is 7878"
    const filterRegex = /(\w+)\s+(is|=)\s+([\w\-]+)/g;
    let match;
    while ((match = filterRegex.exec(query))) {
      intent.filters.push({
        field: match[1],
        operator: '=',
        value: match[3]
      });
    }
  
    return intent;
  }
  
  module.exports = parseIntent;
  