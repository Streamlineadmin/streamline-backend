function extractSchema(db) {
    return Object.values(db)
      .filter(m => m && m.rawAttributes)
      .map(model => ({
        table: model.name,
        columns: Object.entries(model.rawAttributes).map(([name, attr]) => ({
          name,
          type: attr.type.key
        })),
        relations: Object.values(model.associations || {}).map(a => ({
          type: a.associationType,
          as: a.as,
          target: a.target.name,
          foreignKey: a.foreignKey
        }))
      }));
  }
  
  module.exports = extractSchema;
  