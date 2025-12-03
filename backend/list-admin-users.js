/**
 * List Admin Users
 * Display all admin users in the system
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { sequelize, AdminUser } = require('./models');

async function listAdmins() {
  console.log('=== Admin Users List ===\n');

  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('✓ Connected to database\n');

    // Get all admin users
    const admins = await AdminUser.findAll({
      attributes: ['id', 'username', 'email', 'name', 'role', 'createdAt', 'lastLogin'],
      order: [['createdAt', 'ASC']]
    });

    if (admins.length === 0) {
      console.log('No admin users found.');
      console.log('\nTo create an admin user, run:');
      console.log('  cd backend');
      console.log('  npm run seed');
    } else {
      console.log(`Found ${admins.length} admin user(s):\n`);
      
      admins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.name}`);
        console.log(`   Username: ${admin.username}`);
        console.log(`   Email: ${admin.email || 'Not set'}`);
        console.log(`   Role: ${admin.role}`);
        console.log(`   Created: ${admin.createdAt.toLocaleDateString()}`);
        console.log(`   Last Login: ${admin.lastLogin ? admin.lastLogin.toLocaleString() : 'Never'}`);
        console.log('');
      });

      console.log('To change a password, run:');
      console.log('  node change-admin-password.js');
    }

    await sequelize.close();
    process.exit(0);

  } catch (error) {
    console.error('✗ Error:', error.message);
    await sequelize.close();
    process.exit(1);
  }
}

listAdmins();
