/**
 * ProjectImage Model
 * Represents images associated with construction projects
 */

module.exports = (sequelize, DataTypes) => {
  const ProjectImage = sequelize.define('ProjectImage', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'project_id',
      references: {
        model: 'projects',
        key: 'id'
      },
      onDelete: 'CASCADE',
      validate: {
        notNull: {
          msg: 'Project ID is required'
        }
      }
    },
    src: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Image source URL is required'
        },
        len: {
          args: [1, 500],
          msg: 'Image source must be between 1 and 500 characters'
        }
      }
    },
    alt: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        len: {
          args: [0, 255],
          msg: 'Alt text must not exceed 255 characters'
        }
      }
    },
    thumbnail: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        len: {
          args: [0, 500],
          msg: 'Thumbnail URL must not exceed 500 characters'
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
    tableName: 'project_images',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_project_images_project_id',
        fields: ['project_id']
      }
    ]
  });

  // Define associations
  ProjectImage.associate = (models) => {
    // An image belongs to a project
    ProjectImage.belongsTo(models.Project, {
      foreignKey: 'projectId',
      as: 'project'
    });
  };

  return ProjectImage;
};
