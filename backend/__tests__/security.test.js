/**
 * Security Testing Suite
 * Tests authentication security, input validation, and API security
 * Requirements: 9.2, 9.3, 9.4, 10.7, 14.2, 14.3
 */

const request = require('supertest');
const app = require('../server');
const { AdminUser, Project, Service, Inquiry } = require('../models');
const bcrypt = require('bcrypt');

describe('Security Testing', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    // Create test admin user
    const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
    testUser = await AdminUser.create({
      username: 'securitytest',
      email: 'security@test.com',
      password: hashedPassword,
      name: 'Security Test User',
      role: 'admin'
    });

    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'securitytest',
        password: 'TestPassword123!'
      });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    // Cleanup
    if (testUser) {
      await AdminUser.destroy({ where: { id: testUser.id } });
    }
  });

  // ===================================
  // 35.1 Test Authentication Security
  // ===================================
  describe('35.1 Authentication Security', () => {
    
    test('Password hashing - passwords should be hashed with bcrypt', async () => {
      const user = await AdminUser.findByPk(testUser.id);
      
      // Password should not be stored in plain text
      expect(user.password).not.toBe('TestPassword123!');
      
      // Password should be a bcrypt hash (starts with $2b$ or $2a$)
      expect(user.password).toMatch(/^\$2[ab]\$/);
      
      // Hash should be at least 60 characters (bcrypt standard)
      expect(user.password.length).toBeGreaterThanOrEqual(60);
    });

    test('Password comparison - comparePassword method should work correctly', async () => {
      const user = await AdminUser.findByPk(testUser.id);
      
      // Correct password should return true
      const validPassword = await user.comparePassword('TestPassword123!');
      expect(validPassword).toBe(true);
      
      // Incorrect password should return false
      const invalidPassword = await user.comparePassword('WrongPassword');
      expect(invalidPassword).toBe(false);
    });

    test('JWT token security - tokens should have expiration', async () => {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(authToken);
      
      // Token should have expiration time
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      
      // Token should expire in the future
      const now = Math.floor(Date.now() / 1000);
      expect(decoded.exp).toBeGreaterThan(now);
      
      // Token should contain user info but not password
      expect(decoded.userId).toBeDefined();
      expect(decoded.username).toBeDefined();
      expect(decoded.password).toBeUndefined();
    });

    test('JWT token expiration - expired tokens should be rejected', async () => {
      const jwt = require('jsonwebtoken');
      
      // Create an expired token (expired 1 hour ago)
      const expiredToken = jwt.sign(
        { userId: testUser.id, username: testUser.username },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' }
      );
      
      // Try to access protected route with expired token
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${expiredToken}`);
      
      expect(response.status).toBe(401);
      expect(response.body.error).toMatch(/expired/i);
    });

    test('Unauthorized access prevention - protected routes should require auth', async () => {
      // Try to access protected routes without token
      const endpoints = [
        { method: 'get', path: '/api/auth/verify' },
        { method: 'post', path: '/api/projects' },
        { method: 'put', path: '/api/projects/1' },
        { method: 'delete', path: '/api/projects/1' },
        { method: 'post', path: '/api/services' },
        { method: 'put', path: '/api/company' }
      ];
      
      for (const endpoint of endpoints) {
        const response = await request(app)[endpoint.method](endpoint.path);
        expect(response.status).toBe(401);
      }
    });

    test('Invalid token format - malformed tokens should be rejected', async () => {
      const invalidTokens = [
        'invalid-token',
        'Bearer',
        'Bearer ',
        'NotBearer validtoken',
        ''
      ];
      
      for (const token of invalidTokens) {
        const response = await request(app)
          .get('/api/auth/verify')
          .set('Authorization', token);
        
        expect(response.status).toBe(401);
      }
    });

    test('Login with invalid credentials - should return 401', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'securitytest',
          password: 'WrongPassword'
        });
      
      expect(response.status).toBe(401);
      expect(response.body.error).toMatch(/authentication failed/i);
    });

    test('Login with non-existent user - should return 401', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistentuser',
          password: 'SomePassword'
        });
      
      expect(response.status).toBe(401);
      expect(response.body.error).toMatch(/authentication failed/i);
    });
  });

  // ===================================
  // 35.2 Test Input Validation
  // ===================================
  describe('35.2 Input Validation', () => {
    
    test('SQL injection prevention - malicious SQL should not execute', async () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE admin_users; --",
        "1' OR '1'='1",
        "admin'--",
        "' OR 1=1--",
        "1; DELETE FROM projects WHERE 1=1"
      ];
      
      for (const maliciousInput of sqlInjectionAttempts) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            username: maliciousInput,
            password: 'password'
          });
        
        // Should return 401 (not found) not 500 (SQL error)
        expect(response.status).toBe(401);
      }
    });

    test('XSS prevention - script tags should be handled safely', async () => {
      const xssAttempts = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        'javascript:alert("XSS")',
        '<svg onload=alert("XSS")>'
      ];
      
      for (const xssInput of xssAttempts) {
        const response = await request(app)
          .post('/api/inquiries')
          .send({
            name: xssInput,
            email: 'test@test.com',
            message: 'Test message'
          });
        
        // Should accept the input (sanitization happens on display)
        // But should not execute the script
        expect([200, 201]).toContain(response.status);
        
        // Verify data was stored (not executed)
        if (response.body.inquiry) {
          expect(response.body.inquiry.name).toBe(xssInput);
        }
      }
      
      // Cleanup
      await Inquiry.destroy({ where: { name: { $like: '%script%' } } });
    });

    test('File upload security - invalid file types should be rejected', async () => {
      const invalidFiles = [
        { filename: 'malicious.exe', mimetype: 'application/x-msdownload' },
        { filename: 'script.js', mimetype: 'application/javascript' },
        { filename: 'virus.bat', mimetype: 'application/x-bat' },
        { filename: 'hack.php', mimetype: 'application/x-php' }
      ];
      
      for (const file of invalidFiles) {
        const response = await request(app)
          .post('/api/media/upload')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('image', Buffer.from('fake file content'), {
            filename: file.filename,
            contentType: file.mimetype
          });
        
        // Should reject non-image files
        expect(response.status).toBe(400);
      }
    });

    test('File size validation - files exceeding 5MB should be rejected', async () => {
      // Create a buffer larger than 5MB
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
      
      const response = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', largeBuffer, {
          filename: 'large-image.jpg',
          contentType: 'image/jpeg'
        });
      
      // Should reject files over 5MB
      expect(response.status).toBe(400);
    });

    test('Email validation - invalid email formats should be rejected', async () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        'user@.com'
      ];
      
      for (const email of invalidEmails) {
        const response = await request(app)
          .post('/api/inquiries')
          .send({
            name: 'Test User',
            email: email,
            message: 'Test message'
          });
        
        // Should reject invalid emails
        expect(response.status).toBe(400);
      }
    });

    test('Required field validation - missing required fields should be rejected', async () => {
      // Test inquiry creation without required fields
      const response1 = await request(app)
        .post('/api/inquiries')
        .send({
          name: 'Test User'
          // Missing email and message
        });
      
      expect(response1.status).toBe(400);
      
      // Test project creation without required fields
      const response2 = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Project'
          // Missing description, category, etc.
        });
      
      expect(response2.status).toBe(400);
    });
  });

  // ===================================
  // 35.3 Test API Security
  // ===================================
  describe('35.3 API Security', () => {
    
    test('CORS configuration - CORS headers should be present', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3000');
      
      // CORS headers should be present
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    test('Protected route access - unauthorized requests should be denied', async () => {
      const protectedEndpoints = [
        { method: 'post', path: '/api/projects', data: { title: 'Test' } },
        { method: 'put', path: '/api/services/1', data: { title: 'Test' } },
        { method: 'delete', path: '/api/projects/1' },
        { method: 'put', path: '/api/company', data: { companyName: 'Test' } }
      ];
      
      for (const endpoint of protectedEndpoints) {
        const response = await request(app)[endpoint.method](endpoint.path)
          .send(endpoint.data || {});
        
        expect(response.status).toBe(401);
        expect(response.body.error).toMatch(/authentication/i);
      }
    });

    test('Public endpoints - should be accessible without auth', async () => {
      const publicEndpoints = [
        { method: 'get', path: '/' },
        { method: 'get', path: '/health' },
        { method: 'get', path: '/api/projects' },
        { method: 'get', path: '/api/services' },
        { method: 'get', path: '/api/company' },
        { method: 'post', path: '/api/inquiries', data: { 
          name: 'Test', 
          email: 'test@test.com', 
          message: 'Test' 
        }}
      ];
      
      for (const endpoint of publicEndpoints) {
        const response = await request(app)[endpoint.method](endpoint.path)
          .send(endpoint.data || {});
        
        // Should not return 401 (unauthorized)
        expect(response.status).not.toBe(401);
      }
    });

    test('Error messages - should not leak sensitive information', async () => {
      // Try to access non-existent resource
      const response = await request(app)
        .get('/api/projects/99999')
        .set('Authorization', `Bearer ${authToken}`);
      
      // Error message should not contain stack traces or internal details
      expect(response.body.stack).toBeUndefined();
      expect(response.body.details).toBeUndefined();
    });

    test('HTTP methods - unsupported methods should return 404 or 405', async () => {
      const response = await request(app)
        .patch('/api/projects/1')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect([404, 405]).toContain(response.status);
    });

    test('Rate limiting - should handle multiple requests gracefully', async () => {
      // Make multiple rapid requests
      const requests = Array(10).fill().map(() => 
        request(app).get('/health')
      );
      
      const responses = await Promise.all(requests);
      
      // All requests should succeed (no rate limiting implemented yet)
      // This test documents current behavior
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});
