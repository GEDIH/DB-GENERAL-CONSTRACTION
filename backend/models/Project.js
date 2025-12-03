/**
 * Project Model
 * Represents a construction project in the portfolio
 */

module.exports = (sequelize, DataTypes) => {
  const Project = sequelize.define('Project', {
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
          msg: 'Project title is required'
        },
        len: {
          args: [1, 255],
          msg: 'Project title must be between 1 and 255 characters'
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Project description is required'
        }
      }
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Project category is required'
        },
        len: {
          args: [1, 100],
          msg: 'Category must be between 1 and 100 characters'
        }
      }
    },
    completionDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'completion_date',
      validate: {
        isDate: {
          msg: 'Completion date must be a valid date'
        },
        notNull: {
          msg: 'Completion date is required'
        }
      }
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Project location is required'
        },
        len: {
          args: [1, 255],
          msg: 'Location must be between 1 and 255 characters'
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
    tableName: 'projects',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_projects_category',
        fields: ['category']
      },
      {
        name: 'idx_projects_completion_date',
        fields: ['completion_date']
      }
    ]
  });

  // Define associations
  Project.associate = (models) => {
    // A project has many images
    Project.hasMany(models.ProjectImage, {
      foreignKey: 'projectId',
      as: 'images',
      onDelete: 'CASCADE'
    });
  };

  return Project;
};
