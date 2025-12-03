/**
 * Migration: Create media table
 */

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('media', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      filename: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      original_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      mime_type: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      size: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      url: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      uploaded_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
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
    await queryInterface.addIndex('media', ['filename'], {
      name: 'idx_media_filename'
    });

    await queryInterface.addIndex('media', ['mime_type'], {
      name: 'idx_media_mime_type'
    });

    await queryInterface.addIndex('media', ['uploaded_at'], {
      name: 'idx_media_uploaded_at'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('media');
  }
};
