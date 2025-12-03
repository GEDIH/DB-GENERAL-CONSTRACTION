/**
 * Media Controller
 * Handles operations for media/image uploads
 */

const { Media, ProjectImage } = require('../models');
const path = require('path');
const fs = require('fs');

/**
 * Get all images
 * @route GET /api/media
 * @access Protected (Admin only)
 */
const getAllImages = async (req, res) => {
  try {
    const images = await Media.findAll({
      order: [['uploadedAt', 'DESC']]
    });

    res.json({
      success: true,
      count: images.length,
      data: images
    });

  } catch (error) {
    console.error('Get all images error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to retrieve images',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};

/**
 * Get single image by ID
 * @route GET /api/media/:id
 * @access Protected (Admin only)
 */
const getImageById = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await Media.findByPk(id);

    if (!image) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Image not found'
      });
    }

    res.json({
      success: true,
      data: image
    });

  } catch (error) {
    console.error('Get image by ID error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to retrieve image',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};

/**
 * Upload image
 * @route POST /api/media/upload
 * @access Protected (Admin only)
 */
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'No file uploaded'
      });
    }

    const file = req.file;

    // Create URL for the uploaded file
    const fileUrl = `/uploads/${file.filename}`;

    // Save file info to database
    const media = await Media.create({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: fileUrl
    });

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: media
    });

  } catch (error) {
    console.error('Upload image error:', error);
    
    // If database save fails, delete the uploaded file
    if (req.file) {
      const filePath = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Handle validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid image data',
        errors: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }

    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to upload image',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};

/**
 * Delete image
 * @route DELETE /api/media/:id
 * @access Protected (Admin only)
 */
const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;

    // Find image
    const image = await Media.findByPk(id);

    if (!image) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Image not found'
      });
    }

    // Check if image is used in any projects
    const usageCount = await ProjectImage.count({
      where: { src: image.url }
    });

    if (usageCount > 0) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Cannot delete image. It is currently used in one or more projects.',
        usageCount
      });
    }

    // Delete physical file
    const filePath = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads', image.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete database record
    await image.destroy();

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to delete image',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};

module.exports = {
  getAllImages,
  getImageById,
  uploadImage,
  deleteImage
};
