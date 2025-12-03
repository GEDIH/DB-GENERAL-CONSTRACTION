/**
 * Integration Tests for Services API Endpoints
 * Tests all CRUD operations for services
 * Requirements: 11.1, 11.3, 11.5, 11.6
 */

const request = require('supertest');
const app = require('../server');
const db = require('../models');
const bcrypt = require('bcrypt');

describe('Services API Integration Tests', () => {
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

  // Clean up test services before each test
  beforeEach(async () => {
    await db.Service.destroy({ where: {}, truncate: true });
  });

  /**
   * Test GET all services
   * Requirement: 11.1
   */
  describe('GET /api/services - Get all services', () => {
    test('should return empty array when no services exist', async () => {
      const response = await request(app)
        .get('/api/services');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(0);
    });

    test('should return all services', async () => {
      // Create test services
      await db.Service.create({
        title: 'Service 1',
        description: 'Description 1',
        icon: 'icon-1'
      });

      await db.Service.create({
        title: 'Service 2',
        description: 'Description 2',
        icon: 'icon-2'
      });

      await db.Service.create({
        title: 'Service 3',
        description: 'Description 3',
        icon: 'icon-3'
      });

      const response = await request(app)
        .get('/api/services');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(3);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('title');
      expect(response.body.data[0]).toHaveProperty('description');
      expect(response.body.data[0]).toHaveProperty('icon');
    });

    test('should be accessible without authentication', async () => {
      await db.Service.create({
        title: 'Public Service',
        description: 'Public Description',
        icon: 'public-icon'
      });

      const response = await request(app)
        .get('/api/services');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  /**
   * Test GET single service
   * Requirement: 11.1
   */
  describe('GET /api/services/:id - Get single service', () => {
    test('should return single service by ID', async () => {
      const service = await db.Service.create({
        title: 'Test Service',
        description: 'Test Description',
        icon: 'test-icon'
      });

      const response = await request(app)
        .get(`/api/services/${service.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', service.id);
      expect(response.body.data).toHaveProperty('title', 'Test Service');
      expect(response.body.data).toHaveProperty('description', 'Test Description');
      expect(response.body.data).toHaveProperty('icon', 'test-icon');
    });

    test('should return 404 for non-existent service', async () => {
      const response = await request(app)
        .get('/api/services/99999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    test('should be accessible without authentication', async () => {
      const service = await db.Service.create({
        title: 'Public Service',
        description: 'Public Description',
        icon: 'public-icon'
      });

      const response = await request(app)
        .get(`/api/services/${service.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  /**
   * Test POST create service
   * Requirement: 11.3
   */
  describe('POST /api/services - Create service', () => {
    test('should create new service with valid data', async () => {
      const serviceData = {
        title: 'New Service',
        description: 'New Description',
        icon: 'new-icon'
      };

      const response = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${authToken}`)
        .send(serviceData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe(serviceData.title);
      expect(response.body.data.description).toBe(serviceData.description);
      expect(response.body.data.icon).toBe(serviceData.icon);

      // Verify in database
      const serviceInDb = await db.Service.findByPk(response.body.data.id);
      expect(serviceInDb).toBeTruthy();
      expect(serviceInDb.title).toBe(serviceData.title);
    });

    test('should reject service creation without authentication', async () => {
      const response = await request(app)
        .post('/api/services')
        .send({
          title: 'Test Service',
          description: 'Test Description',
          icon: 'test-icon'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('should reject service with missing title', async () => {
      const response = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Test Description',
          icon: 'test-icon'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should reject service with empty title', async () => {
      const response = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '',
          description: 'Test Description',
          icon: 'test-icon'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should reject service with missing description', async () => {
      const response = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Service',
          icon: 'test-icon'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should reject service with missing icon', async () => {
      const response = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Service',
          description: 'Test Description'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  /**
   * Test PUT update service
   * Requirement: 11.5
   */
  describe('PUT /api/services/:id - Update service', () => {
    test('should update existing service with valid data', async () => {
      const service = await db.Service.create({
        title: 'Original Title',
        description: 'Original Description',
        icon: 'original-icon'
      });

      const updateData = {
        title: 'Updated Title',
        description: 'Updated Description',
        icon: 'updated-icon'
      };

      const response = await request(app)
        .put(`/api/services/${service.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(service.id);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.icon).toBe(updateData.icon);

      // Verify in database
      await service.reload();
      expect(service.title).toBe(updateData.title);
      expect(service.description).toBe(updateData.description);
      expect(service.icon).toBe(updateData.icon);
    });

    test('should reject update without authentication', async () => {
      const service = await db.Service.create({
        title: 'Test Service',
        description: 'Test Description',
        icon: 'test-icon'
      });

      const response = await request(app)
        .put(`/api/services/${service.id}`)
        .send({
          title: 'Updated Title'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('should return 404 when updating non-existent service', async () => {
      const response = await request(app)
        .put('/api/services/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title',
          description: 'Updated Description',
          icon: 'updated-icon'
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    test('should reject update with invalid data', async () => {
      const service = await db.Service.create({
        title: 'Test Service',
        description: 'Test Description',
        icon: 'test-icon'
      });

      const response = await request(app)
        .put(`/api/services/${service.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '', // Empty title
          description: 'Updated Description',
          icon: 'updated-icon'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should allow partial updates', async () => {
      const service = await db.Service.create({
        title: 'Original Title',
        description: 'Original Description',
        icon: 'original-icon'
      });

      const response = await request(app)
        .put(`/api/services/${service.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title Only',
          description: 'Original Description',
          icon: 'original-icon'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Updated Title Only');
      expect(response.body.data.description).toBe('Original Description');
    });
  });

  /**
   * Test DELETE service
   * Requirement: 11.6
   */
  describe('DELETE /api/services/:id - Delete service', () => {
    test('should delete service successfully', async () => {
      const service = await db.Service.create({
        title: 'Service to Delete',
        description: 'Description',
        icon: 'icon'
      });

      const response = await request(app)
        .delete(`/api/services/${service.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');

      // Verify service is deleted from database
      const deletedService = await db.Service.findByPk(service.id);
      expect(deletedService).toBeNull();
    });

    test('should reject delete without authentication', async () => {
      const service = await db.Service.create({
        title: 'Test Service',
        description: 'Test Description',
        icon: 'test-icon'
      });

      const response = await request(app)
        .delete(`/api/services/${service.id}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');

      // Verify service still exists
      const serviceStillExists = await db.Service.findByPk(service.id);
      expect(serviceStillExists).toBeTruthy();
    });

    test('should return 404 when deleting non-existent service', async () => {
      const response = await request(app)
        .delete('/api/services/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  /**
   * Test complete CRUD flow
   * Requirement: 11.1, 11.3, 11.5, 11.6
   */
  describe('Complete CRUD flow', () => {
    test('should perform full CRUD lifecycle on a service', async () => {
      // CREATE
      const createResponse = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'CRUD Test Service',
          description: 'CRUD Test Description',
          icon: 'crud-icon'
        });

      expect(createResponse.status).toBe(201);
      const serviceId = createResponse.body.data.id;

      // READ (single)
      const readResponse = await request(app)
        .get(`/api/services/${serviceId}`);

      expect(readResponse.status).toBe(200);
      expect(readResponse.body.data.title).toBe('CRUD Test Service');

      // UPDATE
      const updateResponse = await request(app)
        .put(`/api/services/${serviceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated CRUD Service',
          description: 'Updated Description',
          icon: 'updated-icon'
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.title).toBe('Updated CRUD Service');

      // READ (verify update)
      const verifyResponse = await request(app)
        .get(`/api/services/${serviceId}`);

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.data.title).toBe('Updated CRUD Service');

      // DELETE
      const deleteResponse = await request(app)
        .delete(`/api/services/${serviceId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(200);

      // READ (verify deletion)
      const deletedResponse = await request(app)
        .get(`/api/services/${serviceId}`);

      expect(deletedResponse.status).toBe(404);
    });
  });
});
