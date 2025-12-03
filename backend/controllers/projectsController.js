/**
 * Projects Controller
 * Handles CRUD operations for portfolio projects
 */

const { Project, ProjectImage } = require('../models');
const { validationResult } = require('express-validator');

/**
 * Get all projects
 * @route GET /api/projects
 * @access Public
 */
const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.findAll({
      include: [{
        model: ProjectImage,
        as: 'images',
        attributes: ['id', 'src', 'alt', 'thumbnail']
      }],
      order: [['completionDate', 'DESC']]
    });

    res.json({
      success: true,
      count: projects.length,
      data: projects
    });

  } catch (error) {
    console.error('Get all projects error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to retrieve projects',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};

/**
 * Get single project by ID
 * @route GET /api/projects/:id
 * @access Public
 */
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id, {
      include: [{
        model: ProjectImage,
        as: 'images',
        attributes: ['id', 'src', 'alt', 'thumbnail']
      }]
    });

    if (!project) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: project
    });

  } catch (error) {
    console.error('Get project by ID error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to retrieve project',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};

/**
 * Create new project
 * @route POST /api/projects
 * @access Protected (Admin only)
 */
const createProject = async (req, res) => {
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

    const { title, description, category, completionDate, location, images } = req.body;

    // Create project
    const project = await Project.create({
      title,
      description,
      category,
      completionDate,
      location
    });

    // Create associated images if provided
    if (images && Array.isArray(images) && images.length > 0) {
      const imagePromises = images.map(img => 
        ProjectImage.create({
          projectId: project.id,
          src: img.src,
          alt: img.alt || title,
          thumbnail: img.thumbnail || img.src
        })
      );
      await Promise.all(imagePromises);
    }

    // Fetch complete project with images
    const completeProject = await Project.findByPk(project.id, {
      include: [{
        model: ProjectImage,
        as: 'images',
        attributes: ['id', 'src', 'alt', 'thumbnail']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: completeProject
    });

  } catch (error) {
    console.error('Create project error:', error);
    
    // Handle validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid project data',
        errors: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }

    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to create project',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};

/**
 * Update project
 * @route PUT /api/projects/:id
 * @access Protected (Admin only)
 */
const updateProject = async (req, res) => {
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

    // Find project
    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Project not found'
      });
    }

    const { title, description, category, completionDate, location, images } = req.body;

    // Update project fields
    await project.update({
      title: title || project.title,
      description: description || project.description,
      category: category || project.category,
      completionDate: completionDate || project.completionDate,
      location: location || project.location
    });

    // Update images if provided
    if (images && Array.isArray(images)) {
      // Delete existing images
      await ProjectImage.destroy({ where: { projectId: id } });
      
      // Create new images
      if (images.length > 0) {
        const imagePromises = images.map(img => 
          ProjectImage.create({
            projectId: project.id,
            src: img.src,
            alt: img.alt || title || project.title,
            thumbnail: img.thumbnail || img.src
          })
        );
        await Promise.all(imagePromises);
      }
    }

    // Fetch updated project with images
    const updatedProject = await Project.findByPk(id, {
      include: [{
        model: ProjectImage,
        as: 'images',
        attributes: ['id', 'src', 'alt', 'thumbnail']
      }]
    });

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: updatedProject
    });

  } catch (error) {
    console.error('Update project error:', error);
    
    // Handle validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid project data',
        errors: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }

    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to update project',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};

/**
 * Delete project
 * @route DELETE /api/projects/:id
 * @access Protected (Admin only)
 */
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    // Find project
    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Project not found'
      });
    }

    // Delete project (cascade will delete associated images)
    await project.destroy();

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to delete project',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
};
