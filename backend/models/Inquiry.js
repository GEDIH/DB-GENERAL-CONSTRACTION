/**
 * Inquiry Model
 * Represents contact form submissions from website visitors
 */

module.exports = (sequelize, DataTypes) => {
  const Inquiry = sequelize.define('Inquiry', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Name is required'
        },
        len: {
          args: [1, 255],
          msg: 'Name must be between 1 and 255 characters'
        }
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Email is required'
        },
        isEmail: {
          msg: 'Must be a valid email address'
        },
        len: {
          args: [1, 255],
          msg: 'Email must be between 1 and 255 characters'
        }
      }
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: {
          args: [0, 50],
          msg: 'Phone number must not exceed 50 characters'
        }
      }
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Message is required'
        }
      }
    },
    status: {
      type: DataTypes.ENUM('unread', 'read', 'resolved'),
      allowNull: false,
      defaultValue: 'unread',
      validate: {
        isIn: {
          args: [['unread', 'read', 'resolved']],
          msg: 'Status must be unread, read, or resolved'
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
    tableName: 'inquiries',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_inquiries_status',
        fields: ['status']
      },
      {
        name: 'idx_inquiries_created_at',
        fields: ['created_at']
      },
      {
        name: 'idx_inquiries_email',
        fields: ['email']
      }
    ]
  });

  return Inquiry;
};
