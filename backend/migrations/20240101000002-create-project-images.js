/**
 * Migration: Create project_images table
 */

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('project_images', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'projects',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      src: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      alt: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      thumbnail: {
        type: Sequelize.STRING(500),
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

    // Add index on project_id for faster lookups
    await queryInterface.addIndex('project_images', ['project_id'], {
      name: 'idx_project_images_project_id'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('project_images');
  }
};
