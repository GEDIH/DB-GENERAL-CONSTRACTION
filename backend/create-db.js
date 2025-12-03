/**
 * Create Database Script
 * Creates the db_construction database
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mysql = require('mysql2/promise');

async function createDatabase() {
  console.log('Creating database...');
  
  try {
    // Connect without specifying database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 3306
    });
    
    console.log('✓ Connected to MySQL server');
    
    // Create database
    await connection.query(`
      CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}
      CHARACTER SET utf8mb4
      COLLATE utf8mb4_unicode_ci
    `);
    
    console.log(`✓ Database '${process.env.DB_NAME}' created successfully`);
    
    // Use the database
    await connection.query(`USE ${process.env.DB_NAME}`);
    
    // Show database info
    const [result] = await connection.query(`
      SELECT 
        DATABASE() AS CurrentDatabase,
        @@character_set_database AS CharacterSet,
        @@collation_database AS Collation
    `);
    
    console.log('✓ Database info:', result[0]);
    
    await connection.end();
    console.log('\n✓ Database setup complete!');
    console.log('Next steps:');
    console.log('  1. Run migrations: npm run migrate');
    console.log('  2. Seed data: npm run seed');
    console.log('  3. Start server: npm run dev');
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Error creating database:', error.message);
    process.exit(1);
  }
}

createDatabase();
