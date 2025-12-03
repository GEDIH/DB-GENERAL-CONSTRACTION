/**
 * Integration Tests for Authentication Flow
 * Tests login, token verification, and protected route access
 * Requirements: 9.2, 9.3, 9.4
 */

const request = require('supertest');
const app = require('../server');
const db = require('../models');
const bcrypt = require('bcrypt');

describe('Authentication Flow Integration Tests', () => {
  let testUser;

  // Setup: Create test database connection
  beforeAll(async () => {
    await db.connectWithRetry();
  });

  // Cleanup: Close database connection
  afterAll(async () => {
    await db.sequelize.close();
  });

  // Clean up and create test user before each test
  beforeEach(async () => {
    await db.AdminUser.destroy({ where: {}, truncate: true });
    
    // Create test admin user
    const hashedPassword = await bcrypt.hash('password@123', 10);
    testUser = await db.AdminUser.create({
      username: 'Dale Melaku',
      email: 'dale@dbconstruction.com',
      password: hashedPassword,
      name: 'Dale Melaku',
      role: 'admin'
    });
  });

  /**
   * Test login with valid credentials
   * Requirement: 9.2
   */
  describe('Login with valid credentials', () => {
    test('should authenticate user and return JWT token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'Dale Melaku',
          password: 'password@123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('token');
      expect(response.body.token).toBeTruthy();
      expect(typeof response.body.token).toBe('string');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('username', 'Dale Melaku');
      expect(response.body.user).toHaveProperty('email', 'dale@dbconstruction.com');
      expect(response.body.user).toHaveProperty('name', 'Dale Melaku');
      expect(response.body.user).not.toHaveProperty('password');
    });

    test('should update lastLogin timestamp on successful login', async () => {
      const beforeLogin = testUser.lastLogin;
      
      await request(app)
        .post('/api/auth/login')
        .send({
          username: 'Dale Melaku',
          password: 'password@123'
        });

      // Refresh user from database
      await testUser.reload();
      
      expect(testUser.lastLogin).toBeTruthy();
      expect(testUser.lastLogin).not.toEqual(beforeLogin);
    });
  });

  /**
   * Test login with invalid credentials
   * Requirement: 9.3
   */
  describe('Login with invalid credentials', () => {
    test('should reject login with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'Dale Melaku',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid');
      expect(response.body).not.toHaveProperty('token');
    });

    test('should reject login with non-existent username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'NonExistentUser',
          password: 'password@123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body).not.toHaveProperty('token');
    });

    test('should reject login with empty username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: '',
          password: 'password@123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body).not.toHaveProperty('token');
    });

    test('should reject login with empty password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'Dale Melaku',
          password: ''
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body).not.toHaveProperty('token');
    });

    test('should reject login with missing username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password@123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body).not.toHaveProperty('token');
    });

    test('should reject login with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'Dale Melaku'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body).not.toHaveProperty('token');
    });
  });

  /**
   * Test token verification
   * Requirement: 9.2, 9.4
   */
  describe('Token verification', () => {
    let validToken;

    beforeEach(async () => {
      // Get a valid token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'Dale Melaku',
          password: 'password@123'
        });
      
      validToken = loginResponse.body.token;
    });

    test('should verify valid JWT token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('valid', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('userId');
      expect(response.body.user).toHaveProperty('email', 'dale@dbconstruction.com');
    });

    test('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalid_token_string');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('should reject request with missing token', async () => {
      const response = await request(app)
        .get('/api/auth/verify');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('should reject request with malformed Authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', validToken); // Missing "Bearer " prefix

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  /**
   * Test protected route access
   * Requirement: 9.4
   */
  describe('Protected route access', () => {
    let validToken;

    beforeEach(async () => {
      // Get a valid token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'Dale Melaku',
          password: 'password@123'
        });
      
      validToken = loginResponse.body.token;
    });

    test('should allow access to protected route with valid token', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          title: 'Test Project',
          description: 'Test Description',
          category: 'Residential',
          completionDate: '2024-01-01',
          location: 'Test Location'
        });

      // Should not be 401 Unauthorized
      expect(response.status).not.toBe(401);
      // Should be 201 Created (successful project creation)
      expect(response.status).toBe(201);
    });

    test('should deny access to protected route without token', async () => {
      const response = await request(app)
        .post('/api/projects')
        .send({
          title: 'Test Project',
          description: 'Test Description',
          category: 'Residential',
          completionDate: '2024-01-01',
          location: 'Test Location'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('should deny access to protected route with invalid token', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', 'Bearer invalid_token')
        .send({
          title: 'Test Project',
          description: 'Test Description',
          category: 'Residential',
          completionDate: '2024-01-01',
          location: 'Test Location'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('should allow access to multiple protected routes with same token', async () => {
      // Test projects endpoint
      const projectsResponse = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${validToken}`);
      
      expect(projectsResponse.status).not.toBe(401);

      // Test services endpoint
      const servicesResponse = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          title: 'Test Service',
          description: 'Test Description',
          icon: 'test-icon'
        });
      
      expect(servicesResponse.status).not.toBe(401);

      // Test company endpoint
      const companyResponse = await request(app)
        .put('/api/company')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          companyName: 'DB GENERAL CONSTRUCTION'
        });
      
      expect(companyResponse.status).not.toBe(401);
    });
  });

  /**
   * Test logout functionality
   * Requirement: 9.5
   */
  describe('Logout functionality', () => {
    test('should successfully logout (return success message)', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
    });
  });
});
