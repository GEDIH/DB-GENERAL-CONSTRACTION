/**
 * Migration: Create inquiries table
 */

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('inquiries', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      phone: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('unread', 'read', 'resolved'),
        allowNull: false,
        defaultValue: 'unread'
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

    // Add indexes for common queries
    await queryInterface.addIndex('inquiries', ['status'], {
      name: 'idx_inquiries_status'
    });

    await queryInterface.addIndex('inquiries', ['created_at'], {
      name: 'idx_inquiries_created_at'
    });

    await queryInterface.addIndex('inquiries', ['email'], {
      name: 'idx_inquiries_email'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('inquiries');
  }
};
