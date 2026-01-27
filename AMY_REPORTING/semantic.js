module.exports = {
    items: {
      model: 'Items',
      metricFields: ['price', 'currentStock'],
      textFields: ['itemName'],
      dateFields: ['createdAt'],
      joinFields: {
        company: { model: 'Company', display: 'name', foreignKey: 'companyId' }
      }
    },
  
    documentitems: {
      model: 'DocumentItems',
      metricFields: ['price', 'quantity'],
      textFields: ['itemName'],
      dateFields: ['createdAt'],
      joinFields: {
        itemDetails: { model: 'Items', display: 'itemName', foreignKey: 'itemId' },
        company: { model: 'Company', display: 'name', foreignKey: 'companyId' }
      }
    },
  
    documents: { // MUST be exactly 'documents'
      model: 'Documents',
      metricFields: ['amountPaid'],
      textFields: ['documentNumber', 'buyerName', 'supplierName'],
      dateFields: ['createdAt'],
      joinFields: {
        creator: { model: 'Users', display: 'name', foreignKey: 'createdBy' },
        logisticDetails: { model: 'LogisticDetails', display: 'transporterName', foreignKey: 'logisticDetailsId' },
        termsCondition: { model: 'CompanyTermsCondition', display: 'id', foreignKey: 'companyTermsConditionId' }
      }
    }
  };
  