function loadSchema(db) {
    const schema = {};
  
    for (const [name, model] of Object.entries(db)) {
      if (!model.rawAttributes) continue;
  
      schema[name] = {
        table: model.getTableName(),
        attributes: {},
        associations: {}
      };
  
      for (const [attr, def] of Object.entries(model.rawAttributes)) {
        schema[name].attributes[attr] = {
          type: def.type.key,
          allowNull: def.allowNull
        };
      }
  
      for (const [assocName, assoc] of Object.entries(model.associations || {})) {
        schema[name].associations[assocName] = {
          target: assoc.target.name,
          foreignKey: assoc.foreignKey
        };
      }
    }
  
    return schema;
  }
  
  module.exports = loadSchema;
  