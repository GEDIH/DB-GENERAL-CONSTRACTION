/**
 * Change Admin Password Utility
 * Securely update admin user password
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const bcrypt = require('bcrypt');
const readline = require('readline');
const { sequelize, AdminUser } = require('./models');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function changePassword() {
  console.log('=== Change Admin Password ===\n');

  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('✓ Connected to database\n');

    // Get username
    const username = await question('Enter admin username (default: Dale Melaku): ');
    const adminUsername = username.trim() || 'Dale Melaku';

    // Find admin user
    const admin = await AdminUser.findOne({ where: { username: adminUsername } });

    if (!admin) {
      console.error(`✗ Admin user "${adminUsername}" not found`);
      console.log('\nAvailable admin users:');
      const allAdmins = await AdminUser.findAll({ attributes: ['username', 'email', 'name'] });
      allAdmins.forEach(a => {
        console.log(`  - ${a.username} (${a.name}) - ${a.email || 'No email'}`);
      });
      rl.close();
      process.exit(1);
    }

    console.log(`\nFound admin: ${admin.name} (${admin.email || 'No email'})`);

    // Get new password
    const newPassword = await question('\nEnter new password (min 8 characters): ');

    if (newPassword.length < 8) {
      console.error('✗ Password must be at least 8 characters long');
      rl.close();
      process.exit(1);
    }

    // Confirm password
    const confirmPassword = await question('Confirm new password: ');

    if (newPassword !== confirmPassword) {
      console.error('✗ Passwords do not match');
      rl.close();
      process.exit(1);
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await admin.update({ password: hashedPassword });

    console.log('\n✓ Password updated successfully!');
    console.log('\nYou can now login with:');
    console.log(`  Username: ${admin.username}`);
    console.log(`  Password: ${newPassword}`);
    console.log('\n⚠️  Remember to keep your password secure!');

    rl.close();
    await sequelize.close();
    process.exit(0);

  } catch (error) {
    console.error('✗ Error:', error.message);
    rl.close();
    await sequelize.close();
    process.exit(1);
  }
}

changePassword();
