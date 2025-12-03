/**
 * CompanyInfo Model
 * Represents company information displayed on the website
 */

module.exports = (sequelize, DataTypes) => {
  const CompanyInfo = sequelize.define('CompanyInfo', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    companyName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'company_name',
      validate: {
        notEmpty: {
          msg: 'Company name is required'
        },
        len: {
          args: [1, 255],
          msg: 'Company name must be between 1 and 255 characters'
        }
      }
    },
    history: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Company history is required'
        }
      }
    },
    mission: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Company mission is required'
        }
      }
    },
    teamInfo: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'team_info'
    },
    address: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        len: {
          args: [0, 500],
          msg: 'Address must not exceed 500 characters'
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
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: {
          msg: 'Must be a valid email address'
        },
        len: {
          args: [0, 255],
          msg: 'Email must not exceed 255 characters'
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
    tableName: 'company_info',
    timestamps: true,
    underscored: true
  });

  return CompanyInfo;
};
