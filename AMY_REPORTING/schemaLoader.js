function loadSchema(models) {
    if (!models) throw new Error("Sequelize models required");
  
    const schema = {};
    for (const [name, model] of Object.entries(models)) {
      schema[name] = {
        fields: Object.keys(model.rawAttributes),
        associations: Object.entries(model.associations || {}).map(([key, val]) => ({
          name: key,
          target: val.target.name,
          foreignKey: val.foreignKey
        }))
      };
    }
  
    return schema;
  }
  
  module.exports = loadSchema;
  