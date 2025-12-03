/**
 * Services Controller
 * Handles CRUD operations for construction services
 */

const { Service } = require('../models');
const { validationResult } = require('express-validator');

/**
 * Get all services
 * @route GET /api/services
 * @access Public
 */
const getAllServices = async (req, res) => {
  try {
    const services = await Service.findAll({
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: services.length,
      data: services
    });

  } catch (error) {
    console.error('Get all services error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to retrieve services',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};

/**
 * Get single service by ID
 * @route GET /api/services/:id
 * @access Public
 */
const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findByPk(id);

    if (!service) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      data: service
    });

  } catch (error) {
    console.error('Get service by ID error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to retrieve service',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};

/**
 * Create new service
 * @route POST /api/services
 * @access Protected (Admin only)
 */
const createService = async (req, res) => {
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

    const { title, description, icon } = req.body;

    // Create service
    const service = await Service.create({
      title,
      description,
      icon
    });

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service
    });

  } catch (error) {
    console.error('Create service error:', error);
    
    // Handle validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid service data',
        errors: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }

    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to create service',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};

/**
 * Update service
 * @route PUT /api/services/:id
 * @access Protected (Admin only)
 */
const updateService = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        errors: errors.array()
      });
    }

    // Find service
    const service = await Service.findByPk(id);

    if (!service) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Service not found'
      });
    }

    const { title, description, icon } = req.body;

    // Update service
    await service.update({
      title: title || service.title,
      description: description || service.description,
      icon: icon || service.icon
    });

    res.json({
      success: true,
      message: 'Service updated successfully',
      data: service
    });

  } catch (error) {
    console.error('Update service error:', error);
    
    // Handle validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid service data',
        errors: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }

    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to update service',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};

/**
 * Delete service
 * @route DELETE /api/services/:id
 * @access Protected (Admin only)
 */
const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    // Find service
    const service = await Service.findByPk(id);

    if (!service) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Service not found'
      });
    }

    // Delete service
    await service.destroy();

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });

  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to delete service',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};

module.exports = {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService
};
