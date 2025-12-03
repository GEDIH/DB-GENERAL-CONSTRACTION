/**
 * Migration: Create admin_users table
 */

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('admin_users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      username: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      role: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'admin'
      },
      last_login: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Add unique index on username
    await queryInterface.addIndex('admin_users', ['username'], {
      name: 'idx_admin_users_username',
      unique: true
    });

    // Add index on email for faster lookups
    await queryInterface.addIndex('admin_users', ['email'], {
      name: 'idx_admin_users_email'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('admin_users');
  }
};
