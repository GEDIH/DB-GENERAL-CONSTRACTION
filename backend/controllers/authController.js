/**
 * Authentication Controller
 * Handles user authentication, login, logout, and token verification
 */

const jwt = require('jsonwebtoken');
const { AdminUser } = require('../models');

/**
 * Login function - Authenticate user and return JWT token
 * @route POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Username and password are required'
      });
    }

    // Find user by username
    const user = await AdminUser.findOne({
      where: { username }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid username or password'
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid username or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      }
    );

    // Update last login
    await user.update({
      lastLogin: new Date()
    });

    // Return success response
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'An error occurred during login',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};

/**
 * Logout function - Clear session (client-side token removal)
 * @route POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    // In a JWT-based system, logout is primarily handled client-side
    // by removing the token from storage
    // This endpoint can be used for logging or additional cleanup

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'An error occurred during logout',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};

/**
 * Verify token function - Check if JWT token is valid
 * @route GET /api/auth/verify
 */
const verifyToken = async (req, res) => {
  try {
    // Token is already verified by auth middleware
    // req.user contains the decoded token payload

    const user = await AdminUser.findByPk(req.user.userId, {
      attributes: ['id', 'username', 'email', 'name', 'role', 'lastLogin']
    });

    if (!user) {
      return res.status(404).json({
        error: 'User Not Found',
        message: 'User associated with this token no longer exists'
      });
    }

    res.json({
      success: true,
      valid: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'An error occurred during token verification',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};

module.exports = {
  login,
  logout,
  verifyToken
};
