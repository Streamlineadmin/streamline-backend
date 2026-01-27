module.exports = {
    inventory: {
      baseModel: 'Items',
      allowedActions: ['count', 'list', 'details'],
      listField: 'itemName',
      dateField: 'createdAt'
    },
  
    documents: {
      baseModel: 'Documents',
      allowedActions: ['count', 'list'],
      dateField: 'createdAt'
    },
  
    sales: {
      baseModel: 'DocumentItems',
      joins: {
        item: { model: 'Items', as: 'item', display: 'itemName' },
        document: { model: 'Documents', as: 'document' }
      },
      allowedActions: ['count', 'sum'],
      metricField: 'quantity',
      dateField: 'createdAt'
    }
  };
  