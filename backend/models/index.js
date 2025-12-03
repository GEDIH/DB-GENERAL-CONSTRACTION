const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Initialize Sequelize with retry logic
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    define: dbConfig.define,
    retry: {
      max: 3,
      timeout: 3000
    }
  }
);

// Test database connection with retry
const connectWithRetry = async (retries = 5, delay = 3000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await sequelize.authenticate();
      console.log('✓ MySQL database connection established successfully');
      return true;
    } catch (error) {
      console.error(`✗ Database connection attempt ${i + 1} failed:`, error.message);
      
      if (i < retries - 1) {
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('✗ Failed to connect to database after multiple attempts');
        throw error;
      }
    }
  }
};

// Database object
const db = {
  sequelize,
  Sequelize,
  connectWithRetry
};

// Import models
db.Project = require('./Project')(sequelize, Sequelize);
db.ProjectImage = require('./ProjectImage')(sequelize, Sequelize);
db.Service = require('./Service')(sequelize, Sequelize);
db.Inquiry = require('./Inquiry')(sequelize, Sequelize);
db.CompanyInfo = require('./CompanyInfo')(sequelize, Sequelize);
db.AdminUser = require('./AdminUser')(sequelize, Sequelize);
db.Media = require('./Media')(sequelize, Sequelize);

// Define associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;
