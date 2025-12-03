/**
 * Integration Tests for Media/File Upload API Endpoints
 * Tests image upload, validation, and deletion
 * Requirements: 14.2, 14.3, 14.4, 14.6
 */

const request = require('supertest');
const app = require('../server');
const db = require('../models');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

describe('Media API Integration Tests', () => {
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

    // Create test image file if it doesn't exist
    const testImagePath = path.join(__dirname, 'test-image.jpg');
    if (!fs.existsSync(testImagePath)) {
      // Create a minimal valid JPEG file (1x1 pixel)
      const jpegBuffer = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
        0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
        0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
        0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
        0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
        0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
        0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x03, 0xFF, 0xC4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00,
        0x7F, 0x80, 0xFF, 0xD9
      ]);
      fs.writeFileSync(testImagePath, jpegBuffer);
    }

    // Create test text file for invalid file type testing
    const testTextPath = path.join(__dirname, 'test-file.txt');
    if (!fs.existsSync(testTextPath)) {
      fs.writeFileSync(testTextPath, 'This is a text file, not an image');
    }
  });

  // Cleanup: Close database connection and remove test files
  afterAll(async () => {
    await db.AdminUser.destroy({ where: {}, truncate: true });
    await db.sequelize.close();

    // Clean up test files
    const testImagePath = path.join(__dirname, 'test-image.jpg');
    const testTextPath = path.join(__dirname, 'test-file.txt');
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
    if (fs.existsSync(testTextPath)) {
      fs.unlinkSync(testTextPath);
    }
  });

  // Clean up test media before each test
  beforeEach(async () => {
    await db.Media.destroy({ where: {}, truncate: true });
  });

  /**
   * Test GET all images
   * Requirement: 14.1
   */
  describe('GET /api/media - Get all images', () => {
    test('should return empty array when no images exist', async () => {
      const response = await request(app)
        .get('/api/media')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(0);
    });

    test('should return all uploaded images', async () => {
      // Create test media records
      await db.Media.create({
        filename: 'test1.jpg',
        originalName: 'original1.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        url: '/uploads/test1.jpg'
      });

      await db.Media.create({
        filename: 'test2.png',
        originalName: 'original2.png',
        mimeType: 'image/png',
        size: 2048,
        url: '/uploads/test2.png'
      });

      const response = await request(app)
        .get('/api/media')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('filename');
      expect(response.body.data[0]).toHaveProperty('originalName');
      expect(response.body.data[0]).toHaveProperty('url');
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/media');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  /**
   * Test GET single image
   * Requirement: 14.1
   */
  describe('GET /api/media/:id - Get single image', () => {
    test('should return single image details', async () => {
      const media = await db.Media.create({
        filename: 'test.jpg',
        originalName: 'original.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        url: '/uploads/test.jpg'
      });

      const response = await request(app)
        .get(`/api/media/${media.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', media.id);
      expect(response.body.data).toHaveProperty('filename', 'test.jpg');
      expect(response.body.data).toHaveProperty('originalName', 'original.jpg');
      expect(response.body.data).toHaveProperty('mimeType', 'image/jpeg');
      expect(response.body.data).toHaveProperty('size', 1024);
      expect(response.body.data).toHaveProperty('url', '/uploads/test.jpg');
    });

    test('should return 404 for non-existent image', async () => {
      const response = await request(app)
        .get('/api/media/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    test('should require authentication', async () => {
      const media = await db.Media.create({
        filename: 'test.jpg',
        originalName: 'original.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        url: '/uploads/test.jpg'
      });

      const response = await request(app)
        .get(`/api/media/${media.id}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  /**
   * Test POST upload valid image
   * Requirement: 14.4
   */
  describe('POST /api/media/upload - Upload image', () => {
    test('should upload valid image file', async () => {
      const testImagePath = path.join(__dirname, 'test-image.jpg');

      const response = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', testImagePath);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('filename');
      expect(response.body.data).toHaveProperty('originalName', 'test-image.jpg');
      expect(response.body.data).toHaveProperty('mimeType', 'image/jpeg');
      expect(response.body.data).toHaveProperty('size');
      expect(response.body.data).toHaveProperty('url');

      // Verify in database
      const mediaInDb = await db.Media.findByPk(response.body.data.id);
      expect(mediaInDb).toBeTruthy();
      expect(mediaInDb.originalName).toBe('test-image.jpg');
    });

    test('should require authentication', async () => {
      const testImagePath = path.join(__dirname, 'test-image.jpg');

      const response = await request(app)
        .post('/api/media/upload')
        .attach('image', testImagePath);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('should reject upload without file', async () => {
      const response = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  /**
   * Test invalid file rejection
   * Requirement: 14.2
   */
  describe('POST /api/media/upload - Invalid file rejection', () => {
    test('should reject non-image file types', async () => {
      const testTextPath = path.join(__dirname, 'test-file.txt');

      const response = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', testTextPath);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/file type|image/i);
    });
  });

  /**
   * Test file size limit
   * Requirement: 14.3
   */
  describe('POST /api/media/upload - File size limit', () => {
    test('should reject files larger than 5MB', async () => {
      // Create a large file (> 5MB)
      const largePath = path.join(__dirname, 'large-file.jpg');
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
      fs.writeFileSync(largePath, largeBuffer);

      const response = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', largePath);

      // Clean up large file
      fs.unlinkSync(largePath);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/size|large|5MB/i);
    });

    test('should accept files smaller than 5MB', async () => {
      const testImagePath = path.join(__dirname, 'test-image.jpg');
      const stats = fs.statSync(testImagePath);
      
      // Verify test file is under 5MB
      expect(stats.size).toBeLessThan(5 * 1024 * 1024);

      const response = await request(app)
        .post('/api/media/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', testImagePath);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  /**
   * Test DELETE image
   * Requirement: 14.6
   */
  describe('DELETE /api/media/:id - Delete image', () => {
    test('should delete image successfully when not in use', async () => {
      const media = await db.Media.create({
        filename: 'delete-test.jpg',
        originalName: 'original.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        url: '/uploads/delete-test.jpg'
      });

      const response = await request(app)
        .delete(`/api/media/${media.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');

      // Verify image is deleted from database
      const deletedMedia = await db.Media.findByPk(media.id);
      expect(deletedMedia).toBeNull();
    });

    test('should prevent deletion of image in use by project', async () => {
      // Create media
      const media = await db.Media.create({
        filename: 'in-use.jpg',
        originalName: 'original.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        url: '/uploads/in-use.jpg'
      });

      // Create project using this image
      const project = await db.Project.create({
        title: 'Test Project',
        description: 'Test Description',
        category: 'Residential',
        completionDate: new Date('2024-01-01'),
        location: 'Test Location'
      });

      await db.ProjectImage.create({
        projectId: project.id,
        src: media.url,
        alt: 'Test Image'
      });

      const response = await request(app)
        .delete(`/api/media/${media.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/in use|cannot delete/i);

      // Verify image still exists in database
      const mediaStillExists = await db.Media.findByPk(media.id);
      expect(mediaStillExists).toBeTruthy();
    });

    test('should require authentication', async () => {
      const media = await db.Media.create({
        filename: 'test.jpg',
        originalName: 'original.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        url: '/uploads/test.jpg'
      });

      const response = await request(app)
        .delete(`/api/media/${media.id}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');

      // Verify image still exists
      const mediaStillExists = await db.Media.findByPk(media.id);
      expect(mediaStillExists).toBeTruthy();
    });

    test('should return 404 when deleting non-existent image', async () => {
      const response = await request(app)
        .delete('/api/media/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
});
