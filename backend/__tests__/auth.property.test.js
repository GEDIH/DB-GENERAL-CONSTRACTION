/**
 * Property-Based Tests for Authentication
 * Uses fast-check for property-based testing
 */

const fc = require('fast-check');
const request = require('supertest');
const app = require('../server');
const db = require('../models');
const bcrypt = require('bcrypt');

// Test configuration
const NUM_RUNS = 100; // Minimum 100 iterations as per design spec

describe('Authentication Property-Based Tests', () => {
  // Setup: Create test database connection
  beforeAll(async () => {
    await db.connectWithRetry();
  });

  // Cleanup: Close database connection
  afterAll(async () => {
    await db.sequelize.close();
  });

  // Clean up test users before each test
  beforeEach(async () => {
    await db.AdminUser.destroy({ where: {}, truncate: true });
  });

  /**
   * Feature: db-construction-pwa, Property 10: Authentication with valid credentials succeeds
   * Validates: Requirements 9.2
   * 
   * For any valid admin credentials (correct username and password),
   * the authentication function should return a JWT token and grant access to the dashboard.
   */
  describe('Property 10: Authentication with valid credentials succeeds', () => {
    test('should return JWT token for any valid credentials', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random valid usernames (alphanumeric with spaces, 1-100 chars)
          fc.string({ minLength: 1, maxLength: 100 }),
          // Generate random valid passwords (at least 6 chars)
          fc.string({ minLength: 6, maxLength: 50 }),
          // Generate random names
          fc.string({ minLength: 1, maxLength: 255 }),
          async (username, password, name) => {
            // Skip empty or whitespace-only strings
            if (!username.trim() || !password.trim() || !name.trim()) {
              return true;
            }

            // Create a test user with the generated credentials
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await db.AdminUser.create({
              username: username.trim(),
              email: `test${Date.now()}@example.com`,
              password: hashedPassword,
              name: name.trim(),
              role: 'admin'
            });

            // Attempt to login with the same credentials
            const response = await request(app)
              .post('/api/auth/login')
              .send({
                username: username.trim(),
                password: password
              });

            // Verify response
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('token');
            expect(response.body.token).toBeTruthy();
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.username).toBe(username.trim());

            // Verify token can be used for authentication
            const verifyResponse = await request(app)
              .get('/api/auth/verify')
              .set('Authorization', `Bearer ${response.body.token}`);

            expect(verifyResponse.status).toBe(200);
            expect(verifyResponse.body.valid).toBe(true);

            // Cleanup
            await user.destroy();
          }
        ),
        { numRuns: NUM_RUNS }
      );
    }, 60000); // 60 second timeout for property test
  });

  /**
   * Feature: db-construction-pwa, Property 11: Authentication with invalid credentials fails
   * Validates: Requirements 9.3
   * 
   * For any invalid admin credentials (incorrect username or password),
   * the authentication function should return an error and prevent access.
   */
  describe('Property 11: Authentication with invalid credentials fails', () => {
    test('should reject any invalid credentials', async () => {
      // First, create a valid user to test against
      const validUsername = 'TestAdmin';
      const validPassword = 'ValidPassword123';
      const hashedPassword = await bcrypt.hash(validPassword, 10);
      
      await db.AdminUser.create({
        username: validUsername,
        email: 'testadmin@example.com',
        password: hashedPassword,
        name: 'Test Admin',
        role: 'admin'
      });

      await fc.assert(
        fc.asyncProperty(
          // Generate random usernames and passwords
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (username, password) => {
            // Skip if credentials match the valid ones
            if (username === validUsername && password === validPassword) {
              return true;
            }

            // Attempt to login with invalid credentials
            const response = await request(app)
              .post('/api/auth/login')
              .send({
                username: username,
                password: password
              });

            // Should fail with 401 Unauthorized
            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error');
            expect(response.body).not.toHaveProperty('token');
          }
        ),
        { numRuns: NUM_RUNS }
      );
    }, 60000); // 60 second timeout for property test

    test('should reject empty credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: '',
          password: ''
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should reject missing username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'somepassword'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should reject missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'someuser'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});
