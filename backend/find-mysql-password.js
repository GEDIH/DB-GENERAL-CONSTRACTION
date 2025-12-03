/**
 * MySQL Password Finder
 * Interactive script to test MySQL passwords
 */

const mysql = require('mysql2/promise');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function testPassword(password) {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: password,
      port: 3306
    });
    
    console.log('✓ SUCCESS! Password is correct!');
    
    // Check if database exists
    const [databases] = await connection.query('SHOW DATABASES');
    const dbExists = databases.some(db => db.Database === 'db_construction');
    
    if (dbExists) {
      console.log('✓ Database "db_construction" exists');
    } else {
      console.log('⚠ Database "db_construction" does not exist yet');
      console.log('  You will need to create it or run migrations');
    }
    
    await connection.end();
    return true;
  } catch (error) {
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('✗ Incorrect password');
      return false;
    } else {
      console.error('✗ Error:', error.message);
      return false;
    }
  }
}

async function promptForPassword() {
  return new Promise((resolve) => {
    rl.question('\nEnter MySQL root password to test (or "quit" to exit): ', (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log('=== MySQL Password Finder ===\n');
  console.log('This script will help you find the correct MySQL root password.\n');
  console.log('Common passwords to try:');
  console.log('  - (empty/blank)');
  console.log('  - root');
  console.log('  - password');
  console.log('  - Root@1234');
  console.log('  - The password you set during MySQL installation\n');
  
  // Try common passwords first
  const commonPasswords = ['', 'root', 'password', 'Root@1234', 'admin'];
  
  console.log('Testing common passwords...\n');
  for (const pwd of commonPasswords) {
    const display = pwd === '' ? '(empty)' : pwd;
    console.log(`Testing: ${display}`);
    const success = await testPassword(pwd);
    if (success) {
      console.log(`\n✓ Found working password: ${display}`);
      console.log('\nUpdate your backend/.env file with:');
      console.log(`DB_PASSWORD=${pwd}`);
      rl.close();
      process.exit(0);
    }
  }
  
  console.log('\nCommon passwords did not work. Please enter your password manually.\n');
  
  // Interactive mode
  while (true) {
    const password = await promptForPassword();
    
    if (password.toLowerCase() === 'quit') {
      console.log('Exiting...');
      rl.close();
      process.exit(0);
    }
    
    const success = await testPassword(password);
    if (success) {
      console.log(`\n✓ Found working password!`);
      console.log('\nUpdate your backend/.env file with:');
      console.log(`DB_PASSWORD=${password}`);
      rl.close();
      process.exit(0);
    }
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  rl.close();
  process.exit(1);
});
