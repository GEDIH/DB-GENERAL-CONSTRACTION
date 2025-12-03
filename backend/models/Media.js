/**
 * Media Model
 * Represents uploaded images and media files
 */

module.exports = (sequelize, DataTypes) => {
  const Media = sequelize.define('Media', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    filename: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Filename is required'
        },
        len: {
          args: [1, 255],
          msg: 'Filename must be between 1 and 255 characters'
        }
      }
    },
    originalName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'original_name',
      validate: {
        notEmpty: {
          msg: 'Original filename is required'
        },
        len: {
          args: [1, 255],
          msg: 'Original filename must be between 1 and 255 characters'
        }
      }
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'mime_type',
      validate: {
        notEmpty: {
          msg: 'MIME type is required'
        },
        len: {
          args: [1, 100],
          msg: 'MIME type must be between 1 and 100 characters'
        }
      }
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'File size is required'
        },
        min: {
          args: [0],
          msg: 'File size must be positive'
        },
        max: {
          args: [5242880], // 5MB in bytes
          msg: 'File size must not exceed 5MB'
        }
      }
    },
    url: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'URL is required'
        },
        len: {
          args: [1, 500],
          msg: 'URL must be between 1 and 500 characters'
        }
      }
    },
    uploadedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'uploaded_at'
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
    tableName: 'media',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_media_filename',
        fields: ['filename']
      },
      {
        name: 'idx_media_mime_type',
        fields: ['mime_type']
      },
      {
        name: 'idx_media_uploaded_at',
        fields: ['uploaded_at']
      }
    ]
  });

  return Media;
};
