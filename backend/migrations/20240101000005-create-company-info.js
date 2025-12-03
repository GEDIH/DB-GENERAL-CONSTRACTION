/**
 * Migration: Create company_info table
 */

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('company_info', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      company_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      history: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      mission: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      team_info: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      address: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      email: {
        type: Sequelize.STRING(255),
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('company_info');
  }
};
