/**
 * Integration Tests for Inquiries API Endpoints
 * Tests inquiry operations, status updates, and unread count
 * Requirements: 13.1, 13.3, 13.4, 13.6
 */

const request = require('supertest');
const app = require('../server');
const db = require('../models');
const bcrypt = require('bcrypt');

describe('Inquiries API Integration Tests', () => {
  let authToken;
  let adminUser;

  // Setup: Create test database connection and admin user
  beforeAll(async () => {
    await db.connectWithRetry();
    
    // Create admin user for authentication
    const hashedPassword = await bcrypt.hash('testpass123', 10);
    adminUser = await db.AdminUser.create({
      username: 'TestAdmin',
      email: 'testadmin@test.com',
      password: hashedPassword,
      name: 'Test Admin',
      role: 'admin'
    });

    // Get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'TestAdmin',
        password: 'testpass123'
      });
    
    authToken = loginResponse.body.token;
  });

  // Cleanup: Close database connection
  afterAll(async () => {
    await db.AdminUser.destroy({ where: {}, truncate: true });
    await db.sequelize.close();
  });

  // Clean up test inquiries before each test
  beforeEach(async () => {
    await db.Inquiry.destroy({ where: {}, truncate: true });
  });

  /**
   * Test GET all inquiries with filtering
   * Requirement: 13.1
   */
  describe('GET /api/inquiries - Get all inquiries', () => {
    test('should return empty array when no inquiries exist', async () => {
      const response = await request(app)
        .get('/api/inquiries')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(0);
    });

    test('should return all inquiries', async () => {
      // Create test inquiries
      await db.Inquiry.create({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        message: 'Test message 1',
        status: 'unread'
      });

      await db.Inquiry.create({
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '098-765-4321',
        message: 'Test message 2',
        status: 'read'
      });

      await db.Inquiry.create({
        name: 'Bob Johnson',
        email: 'bob@example.com',
        message: 'Test message 3',
        status: 'resolved'
      });

      const response = await request(app)
        .get('/api/inquiries')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(3);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('email');
      expect(response.body.data[0]).toHaveProperty('message');
      expect(response.body.data[0]).toHaveProperty('status');
    });

    test('should filter inquiries by status', async () => {
      await db.Inquiry.create({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Unread message',
        status: 'unread'
      });

      await db.Inquiry.create({
        name: 'Jane Smith',
        email: 'jane@example.com',
        message: 'Read message',
        status: 'read'
      });

      await db.Inquiry.create({
        name: 'Bob Johnson',
        email: 'bob@example.com',
        message: 'Resolved message',
        status: 'resolved'
      });

      // Filter by unread
      const unreadResponse = await request(app)
        .get('/api/inquiries?status=unread')
        .set('Authorization', `Bearer ${authToken}`);

      expect(unreadResponse.status).toBe(200);
      expect(unreadResponse.body.data.length).toBe(1);
      expect(unreadResponse.body.data[0].status).toBe('unread');

      // Filter by read
      const readResponse = await request(app)
        .get('/api/inquiries?status=read')
        .set('Authorization', `Bearer ${authToken}`);

      expect(readResponse.status).toBe(200);
      expect(readResponse.body.data.length).toBe(1);
      expect(readResponse.body.data[0].status).toBe('read');

      // Filter by resolved
      const resolvedResponse = await request(app)
        .get('/api/inquiries?status=resolved')
        .set('Authorization', `Bearer ${authToken}`);

      expect(resolvedResponse.status).toBe(200);
      expect(resolvedResponse.body.data.length).toBe(1);
      expect(resolvedResponse.body.data[0].status).toBe('resolved');
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/inquiries');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  /**
   * Test GET single inquiry
   * Requirement: 13.1
   */
  describe('GET /api/inquiries/:id - Get single inquiry', () => {
    test('should return single inquiry by ID', async () => {
      const inquiry = await db.Inquiry.create({
        name: 'Test User',
        email: 'test@example.com',
        phone: '555-1234',
        message: 'Test inquiry message',
        status: 'unread'
      });

      const response = await request(app)
        .get(`/api/inquiries/${inquiry.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', inquiry.id);
      expect(response.body.data).toHaveProperty('name', 'Test User');
      expect(response.body.data).toHaveProperty('email', 'test@example.com');
      expect(response.body.data).toHaveProperty('phone', '555-1234');
      expect(response.body.data).toHaveProperty('message', 'Test inquiry message');
      expect(response.body.data).toHaveProperty('status', 'unread');
    });

    test('should return 404 for non-existent inquiry', async () => {
      const response = await request(app)
        .get('/api/inquiries/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    test('should require authentication', async () => {
      const inquiry = await db.Inquiry.create({
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message',
        status: 'unread'
      });

      const response = await request(app)
        .get(`/api/inquiries/${inquiry.id}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  /**
   * Test POST create inquiry (public endpoint)
   * Requirement: 13.1
   */
  describe('POST /api/inquiries - Create inquiry', () => {
    test('should create new inquiry with valid data', async () => {
      const inquiryData = {
        name: 'New User',
        email: 'newuser@example.com',
        phone: '555-9999',
        message: 'I would like to inquire about your services'
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(inquiryData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe(inquiryData.name);
      expect(response.body.data.email).toBe(inquiryData.email);
      expect(response.body.data.phone).toBe(inquiryData.phone);
      expect(response.body.data.message).toBe(inquiryData.message);
      expect(response.body.data.status).toBe('unread');

      // Verify in database
      const inquiryInDb = await db.Inquiry.findByPk(response.body.data.id);
      expect(inquiryInDb).toBeTruthy();
      expect(inquiryInDb.name).toBe(inquiryData.name);
      expect(inquiryInDb.status).toBe('unread');
    });

    test('should create inquiry without phone (optional field)', async () => {
      const inquiryData = {
        name: 'User Without Phone',
        email: 'nophone@example.com',
        message: 'Test message without phone'
      };

      const response = await request(app)
        .post('/api/inquiries')
        .send(inquiryData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.phone).toBeNull();
    });

    test('should be accessible without authentication (public endpoint)', async () => {
      const response = await request(app)
        .post('/api/inquiries')
        .send({
          name: 'Public User',
          email: 'public@example.com',
          message: 'Public inquiry'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    test('should reject inquiry with missing name', async () => {
      const response = await request(app)
        .post('/api/inquiries')
        .send({
          email: 'test@example.com',
          message: 'Test message'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should reject inquiry with missing email', async () => {
      const response = await request(app)
        .post('/api/inquiries')
        .send({
          name: 'Test User',
          message: 'Test message'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should reject inquiry with invalid email format', async () => {
      const response = await request(app)
        .post('/api/inquiries')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          message: 'Test message'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should reject inquiry with missing message', async () => {
      const response = await request(app)
        .post('/api/inquiries')
        .send({
          name: 'Test User',
          email: 'test@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  /**
   * Test PUT update inquiry status
   * Requirement: 13.3, 13.4
   */
  describe('PUT /api/inquiries/:id/status - Update inquiry status', () => {
    test('should update inquiry status to read', async () => {
      const inquiry = await db.Inquiry.create({
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message',
        status: 'unread'
      });

      const response = await request(app)
        .put(`/api/inquiries/${inquiry.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'read' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('read');

      // Verify in database
      await inquiry.reload();
      expect(inquiry.status).toBe('read');
    });

    test('should update inquiry status to resolved', async () => {
      const inquiry = await db.Inquiry.create({
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message',
        status: 'read'
      });

      const response = await request(app)
        .put(`/api/inquiries/${inquiry.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'resolved' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('resolved');

      // Verify in database
      await inquiry.reload();
      expect(inquiry.status).toBe('resolved');
    });

    test('should reject invalid status value', async () => {
      const inquiry = await db.Inquiry.create({
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message',
        status: 'unread'
      });

      const response = await request(app)
        .put(`/api/inquiries/${inquiry.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'invalid_status' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should require authentication', async () => {
      const inquiry = await db.Inquiry.create({
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message',
        status: 'unread'
      });

      const response = await request(app)
        .put(`/api/inquiries/${inquiry.id}/status`)
        .send({ status: 'read' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('should return 404 for non-existent inquiry', async () => {
      const response = await request(app)
        .put('/api/inquiries/99999/status')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'read' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  /**
   * Test DELETE inquiry
   * Requirement: 13.5
   */
  describe('DELETE /api/inquiries/:id - Delete inquiry', () => {
    test('should delete inquiry successfully', async () => {
      const inquiry = await db.Inquiry.create({
        name: 'User to Delete',
        email: 'delete@example.com',
        message: 'Message to delete',
        status: 'resolved'
      });

      const response = await request(app)
        .delete(`/api/inquiries/${inquiry.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');

      // Verify inquiry is deleted from database
      const deletedInquiry = await db.Inquiry.findByPk(inquiry.id);
      expect(deletedInquiry).toBeNull();
    });

    test('should require authentication', async () => {
      const inquiry = await db.Inquiry.create({
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message',
        status: 'unread'
      });

      const response = await request(app)
        .delete(`/api/inquiries/${inquiry.id}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');

      // Verify inquiry still exists
      const inquiryStillExists = await db.Inquiry.findByPk(inquiry.id);
      expect(inquiryStillExists).toBeTruthy();
    });

    test('should return 404 when deleting non-existent inquiry', async () => {
      const response = await request(app)
        .delete('/api/inquiries/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  /**
   * Test GET unread count
   * Requirement: 13.6
   */
  describe('GET /api/inquiries/unread/count - Get unread count', () => {
    test('should return zero when no inquiries exist', async () => {
      const response = await request(app)
        .get('/api/inquiries/unread/count')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('count', 0);
    });

    test('should return correct count of unread inquiries', async () => {
      // Create inquiries with different statuses
      await db.Inquiry.create({
        name: 'User 1',
        email: 'user1@example.com',
        message: 'Unread message 1',
        status: 'unread'
      });

      await db.Inquiry.create({
        name: 'User 2',
        email: 'user2@example.com',
        message: 'Unread message 2',
        status: 'unread'
      });

      await db.Inquiry.create({
        name: 'User 3',
        email: 'user3@example.com',
        message: 'Unread message 3',
        status: 'unread'
      });

      await db.Inquiry.create({
        name: 'User 4',
        email: 'user4@example.com',
        message: 'Read message',
        status: 'read'
      });

      await db.Inquiry.create({
        name: 'User 5',
        email: 'user5@example.com',
        message: 'Resolved message',
        status: 'resolved'
      });

      const response = await request(app)
        .get('/api/inquiries/unread/count')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(3);
    });

    test('should update count when inquiry status changes', async () => {
      // Create unread inquiries
      const inquiry1 = await db.Inquiry.create({
        name: 'User 1',
        email: 'user1@example.com',
        message: 'Message 1',
        status: 'unread'
      });

      await db.Inquiry.create({
        name: 'User 2',
        email: 'user2@example.com',
        message: 'Message 2',
        status: 'unread'
      });

      // Check initial count
      let response = await request(app)
        .get('/api/inquiries/unread/count')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.body.count).toBe(2);

      // Mark one as read
      await request(app)
        .put(`/api/inquiries/${inquiry1.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'read' });

      // Check updated count
      response = await request(app)
        .get('/api/inquiries/unread/count')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.body.count).toBe(1);
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/inquiries/unread/count');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });
});
