/**
 * Database Creation Script
 * This script creates the db_construction database if it doesn't exist
 * Run with: node create-database.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function createDatabase() {
  let connection;
  
  try {
    console.log('🔌 Connecting to MySQL server...');
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   User: ${process.env.DB_USER || 'root'}`);
    console.log(`   Port: ${process.env.DB_PORT || 3306}`);
    
    // Connect to MySQL server (without specifying database)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD ||'Root@1234$#@!' ,
      port: process.env.DB_PORT || 3306
    });
    
    console.log('✓ Connected to MySQL server successfully\n');
    
    // Create database
    const dbName = process.env.DB_NAME || 'db_construction';
    console.log(`📦 Creating database: ${dbName}`);
    
    await connection.query(`
      CREATE DATABASE IF NOT EXISTS ${dbName}
      CHARACTER SET utf8mb4
      COLLATE utf8mb4_unicode_ci
    `);
    
    console.log(`✓ Database '${dbName}' created successfully\n`);
    
    // Verify database exists
    const [databases] = await connection.query(
      `SHOW DATABASES LIKE '${dbName}'`
    );
    
    if (databases.length > 0) {
      console.log('✓ Database verification successful');
      console.log(`   Database: ${databases[0][`Database (${dbName})`]}`);
      
      // Get database info
      await connection.query(`USE ${dbName}`);
      const [info] = await connection.query(`
        SELECT 
          DATABASE() AS CurrentDatabase,
          @@character_set_database AS CharacterSet,
          @@collation_database AS Collation
      `);
      
      console.log('\n📊 Database Information:');
      console.log(`   Name: ${info[0].CurrentDatabase}`);
      console.log(`   Character Set: ${info[0].CharacterSet}`);
      console.log(`   Collation: ${info[0].Collation}`);
      
      console.log('\n✅ Database setup complete!');
      console.log('\n📝 Next steps:');
      console.log('   1. Run migrations: npm run migrate');
      console.log('   2. Seed initial data: npm run seed');
      console.log('   3. Start server: npm run dev');
    } else {
      console.error('✗ Database verification failed');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Error creating database:');
    console.error(`   ${error.message}`);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Troubleshooting:');
      console.error('   - Check your MySQL password in the .env file');
      console.error('   - Verify MySQL user has CREATE DATABASE privileges');
      console.error('   - Ensure MySQL server is running');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Troubleshooting:');
      console.error('   - Ensure MySQL server is running');
      console.error('   - Check if MySQL is listening on the correct port');
      console.error('   - Verify firewall settings');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Connection closed');
    }
  }
}

// Run the script
createDatabase();
