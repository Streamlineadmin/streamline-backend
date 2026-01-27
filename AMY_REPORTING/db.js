const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes, Model } = require('sequelize');

const env = process.env.NODE_ENV || 'development';
const configPath = path.join(__dirname, '..', 'config', 'config.json');
const configFile = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const config = configFile[env];

// Make sure dialect exists
if (!config.dialect) {
  throw new Error('Dialect not specified in config.json');
}

// Initialize Sequelize
const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  logging: config.logging || false,
});

const db = { Sequelize, sequelize };

// Load all models dynamically, excluding index.js
const modelsPath = path.join(__dirname, '..', 'models');

fs.readdirSync(modelsPath)
  .filter(file => file.endsWith('.js') && file !== 'index.js') // exclude index.js
  .forEach(file => {
    const modelDef = require(path.join(modelsPath, file));

    let model;
    if (typeof modelDef === 'function') {
      // Function export (classic Sequelize style)
      model = modelDef(sequelize, DataTypes);
    } else if (modelDef.prototype instanceof Model) {
      // Class export (class-style Sequelize)
      model = modelDef;
      // Initialize if not already initialized
      if (!model.sequelize) {
        model.init(model.rawAttributes, { sequelize, modelName: model.name });
      }
    } else {
      throw new Error(`Unsupported model export in ${file}`);
    }

    db[model.name] = model;
  });

// Apply associations if defined
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;
