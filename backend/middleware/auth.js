/**
 * Authentication Middleware
 * Verifies JWT tokens and protects routes
 */

const jwt = require('jsonwebtoken');

/**
 * Verify JWT token from request headers
 * Adds decoded user data to req.user
 */
const verifyToken = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'Authentication Required',
        message: 'No authorization header provided'
      });
    }

    // Check if header starts with 'Bearer '
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication Required',
        message: 'Invalid authorization header format. Use: Bearer <token>'
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        error: 'Authentication Required',
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add user data to request
    req.user = decoded;

    // Continue to next middleware/route handler
    next();

  } catch (error) {
    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token Expired',
        message: 'Your session has expired. Please login again.'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid Token',
        message: 'The provided token is invalid'
      });
    }

    // Generic error
    console.error('Token verification error:', error);
    return res.status(401).json({
      error: 'Authentication Failed',
      message: 'Token verification failed',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};

/**
 * Require authentication middleware
 * Alias for verifyToken for clearer route protection
 */
const requireAuth = verifyToken;

/**
 * Optional authentication middleware
 * Verifies token if present but doesn't require it
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);

    if (!token) {
      req.user = null;
      return next();
    }

    // Try to verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();

  } catch (error) {
    // Token is invalid but that's okay for optional auth
    req.user = null;
    next();
  }
};

/**
 * Role-based authorization middleware
 * Requires authentication and checks user role
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // First verify token
    verifyToken(req, res, () => {
      // Check if user has required role
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          error: 'Access Denied',
          message: 'You do not have permission to access this resource'
        });
      }
      next();
    });
  };
};

module.exports = {
  verifyToken,
  requireAuth,
  optionalAuth,
  requireRole
};
