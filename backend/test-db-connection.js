/**
 * Test Database Connection
 * Quick script to verify MySQL credentials
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('Testing MySQL connection...');
  console.log('Host:', process.env.DB_HOST);
  console.log('User:', process.env.DB_USER);
  console.log('Database:', process.env.DB_NAME);
  console.log('Port:', process.env.DB_PORT);
  
  try {
    // First, try to connect without specifying a database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 3306
    });
    
    console.log('✓ Successfully connected to MySQL server!');
    
    // Check if database exists
    const [databases] = await connection.query('SHOW DATABASES');
    const dbExists = databases.some(db => db.Database === process.env.DB_NAME);
    
    if (dbExists) {
      console.log(`✓ Database '${process.env.DB_NAME}' exists`);
      
      // Try to use the database
      await connection.query(`USE ${process.env.DB_NAME}`);
      console.log(`✓ Successfully connected to database '${process.env.DB_NAME}'`);
      
      // Check tables
      const [tables] = await connection.query('SHOW TABLES');
      console.log(`✓ Found ${tables.length} tables in database`);
      if (tables.length > 0) {
        console.log('Tables:', tables.map(t => Object.values(t)[0]).join(', '));
      }
    } else {
      console.log(`✗ Database '${process.env.DB_NAME}' does not exist`);
      console.log('Available databases:', databases.map(db => db.Database).join(', '));
    }
    
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('✗ Connection failed:', error.message);
    console.error('Error code:', error.code);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\nPossible solutions:');
      console.error('1. Verify the password in .env file is correct');
      console.error('2. Check if the user has proper permissions');
      console.error('3. Try resetting the MySQL root password');
    }
    
    process.exit(1);
  }
}

testConnection();
