/**
 * Inquiries Controller
 * Handles operations for contact form inquiries
 */

const { Inquiry } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

/**
 * Get all inquiries with optional filtering
 * @route GET /api/inquiries
 * @access Protected (Admin only)
 */
const getAllInquiries = async (req, res) => {
  try {
    const { status } = req.query;
    
    // Build where clause
    const where = {};
    if (status && ['unread', 'read', 'resolved'].includes(status)) {
      where.status = status;
    }

    const inquiries = await Inquiry.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: inquiries.length,
      data: inquiries
    });

  } catch (error) {
    console.error('Get all inquiries error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to retrieve inquiries',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};

/**
 * Get single inquiry by ID
 * @route GET /api/inquiries/:id
 * @access Protected (Admin only)
 */
const getInquiryById = async (req, res) => {
  try {
    const { id } = req.params;

    const inquiry = await Inquiry.findByPk(id);

    if (!inquiry) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Inquiry not found'
      });
    }

    res.json({
      success: true,
      data: inquiry
    });

  } catch (error) {
    console.error('Get inquiry by ID error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to retrieve inquiry',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};

/**
 * Create new inquiry (public endpoint)
 * @route POST /api/inquiries
 * @access Public
 */
const createInquiry = async (req, res) => {
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

    const { name, email, phone, message } = req.body;

    // Create inquiry
    const inquiry = await Inquiry.create({
      name,
      email,
      phone,
      message,
      status: 'unread'
    });

    res.status(201).json({
      success: true,
      message: 'Inquiry submitted successfully. We will contact you soon!',
      data: inquiry
    });

  } catch (error) {
    console.error('Create inquiry error:', error);
    
    // Handle validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid inquiry data',
        errors: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }

    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to submit inquiry',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};

/**
 * Update inquiry status
 * @route PUT /api/inquiries/:id/status
 * @access Protected (Admin only)
 */
const updateInquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!status || !['unread', 'read', 'resolved'].includes(status)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Status must be one of: unread, read, resolved'
      });
    }

    // Find inquiry
    const inquiry = await Inquiry.findByPk(id);

    if (!inquiry) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Inquiry not found'
      });
    }

    // Update status
    await inquiry.update({ status });

    res.json({
      success: true,
      message: 'Inquiry status updated successfully',
      data: inquiry
    });

  } catch (error) {
    console.error('Update inquiry status error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to update inquiry status',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};

/**
 * Delete inquiry
 * @route DELETE /api/inquiries/:id
 * @access Protected (Admin only)
 */
const deleteInquiry = async (req, res) => {
  try {
    const { id } = req.params;

    // Find inquiry
    const inquiry = await Inquiry.findByPk(id);

    if (!inquiry) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Inquiry not found'
      });
    }

    // Delete inquiry
    await inquiry.destroy();

    res.json({
      success: true,
      message: 'Inquiry deleted successfully'
    });

  } catch (error) {
    console.error('Delete inquiry error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to delete inquiry',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};

/**
 * Get unread inquiries count
 * @route GET /api/inquiries/unread/count
 * @access Protected (Admin only)
 */
const getUnreadCount = async (req, res) => {
  try {
    const count = await Inquiry.count({
      where: { status: 'unread' }
    });

    res.json({
      success: true,
      count
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to get unread count',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};

module.exports = {
  getAllInquiries,
  getInquiryById,
  createInquiry,
  updateInquiryStatus,
  deleteInquiry,
  getUnreadCount
};
