/**
 * Service Model
 * Represents construction services offered by the company
 */

module.exports = (sequelize, DataTypes) => {
  const Service = sequelize.define('Service', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Service title is required'
        },
        len: {
          args: [1, 255],
          msg: 'Service title must be between 1 and 255 characters'
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Service description is required'
        }
      }
    },
    icon: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Service icon is required'
        },
        len: {
          args: [1, 255],
          msg: 'Icon must be between 1 and 255 characters'
        }
      }
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  }, {
    tableName: 'services',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_services_title',
        fields: ['title']
      }
    ]
  });

  return Service;
};
