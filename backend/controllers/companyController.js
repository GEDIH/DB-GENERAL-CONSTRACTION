/**
 * Company Info Controller
 * Handles operations for company information
 */

const { CompanyInfo } = require('../models');
const { validationResult } = require('express-validator');

/**
 * Get company information
 * @route GET /api/company
 * @access Public
 */
const getCompanyInfo = async (req, res) => {
  try {
    // Get the first (and should be only) company info record
    const companyInfo = await CompanyInfo.findOne();

    if (!companyInfo) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Company information not found'
      });
    }

    res.json({
      success: true,
      data: companyInfo
    });

  } catch (error) {
    console.error('Get company info error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to retrieve company information',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};

/**
 * Update company information
 * @route PUT /api/company
 * @access Protected (Admin only)
 */
const updateCompanyInfo = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        errors: errors.array()
      });
    }

    const { companyName, history, mission, teamInfo, address, phone, email } = req.body;

    // Find existing company info or create new one
    let companyInfo = await CompanyInfo.findOne();

    if (companyInfo) {
      // Update existing record
      await companyInfo.update({
        companyName: companyName || companyInfo.companyName,
        history: history || companyInfo.history,
        mission: mission || companyInfo.mission,
        teamInfo: teamInfo !== undefined ? teamInfo : companyInfo.teamInfo,
        address: address !== undefined ? address : companyInfo.address,
        phone: phone !== undefined ? phone : companyInfo.phone,
        email: email !== undefined ? email : companyInfo.email
      });
    } else {
      // Create new record
      companyInfo = await CompanyInfo.create({
        companyName,
        history,
        mission,
        teamInfo,
        address,
        phone,
        email
      });
    }

    res.json({
      success: true,
      message: 'Company information updated successfully',
      data: companyInfo
    });

  } catch (error) {
    console.error('Update company info error:', error);
    
    // Handle validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid company information data',
        errors: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }

    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to update company information',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};

module.exports = {
  getCompanyInfo,
  updateCompanyInfo
};
