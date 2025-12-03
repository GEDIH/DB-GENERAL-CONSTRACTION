/**
 * Full-Stack Integration Tests
 * Tests end-to-end flows between admin dashboard and public website
 * Requirements: 16.1, 16.2, 3.2, 13.1, 14.4, 14.7, 9.2, 9.4, 9.5
 */

const request = require('supertest');
const app = require('../server');
const db = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

describe('Full-Stack Integration Tests', () => {
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

  // Clean up test data before each test
  beforeEach(async () => {
    await db.ProjectImage.destroy({ where: {}, truncate: true });
    await db.Project.destroy({ where: {}, truncate: true });
    await db.Service.destroy({ where: {}, truncate: true });
    await db.Inquiry.destroy({ where: {}, truncate: true });
    await db.Media.destroy({ where: {}, truncate: true });
    
    // Reset company info to default
    const companyInfo = await db.CompanyInfo.findOne();
    if (companyInfo) {
      await companyInfo.update({
        companyName: 'DB GENERAL CONSTRUCTION',
        history: 'Default history',
        mission: 'Default mission',
        teamInfo: 'Default team info',
        address: 'Default address',
        phone: '555-0100',
        email: 'info@dbconstruction.com'
      });
    }
  });

  /**
   * Test 33.1: Admin to Public Website Flow
   * Requirements: 16.1, 16.2
   */
  describe('33.1 Admin to Public Website Flow', () => {
    test('should create project in admin and verify it appears on public site', async () => {
      // Step 1: Create project via admin API
      const projectData = {
        title: 'New Construction Project',
        description: 'A beautiful residential building',
        category: 'Residential',
        completionDate: '2024-03-15',
        location: 'Downtown District'
      };

      const createResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      const createdProjectId = createResponse.body.data.id;

      // Step 2: Verify project appears in public API
      const publicResponse = await request(app)
        .get('/api/projects');

      expect(publicResponse.status).toBe(200);
      expect(publicResponse.body.success).toBe(true);
      expect(publicResponse.body.data.length).toBe(1);
      
      const publicProject = publicResponse.body.data[0];
      expect(publicProject.id).toBe(createdProjectId);
      expect(publicProject.title).toBe(projectData.title);
      expect(publicProject.description).toBe(projectData.description);
      expect(publicProject.category).toBe(projectData.category);
      expect(publicProject.location).toBe(projectData.location);
    });

    test('should update service in admin and verify changes on public site', async () => {
      // Step 1: Create service via admin API
      const serviceData = {
        title: 'Residential Construction',
        description: 'Original description',
        icon: 'home-icon'
      };

      const createResponse = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${authToken}`)
        .send(serviceData);

      expect(createResponse.status).toBe(201);
      const serviceId = createResponse.body.data.id;

      // Step 2: Update service via admin API
      const updateData = {
        title: 'Premium Residential Construction',
        description: 'Updated description with more details',
        icon: 'premium-home-icon'
      };

      const updateResponse = await request(app)
        .put(`/api/services/${serviceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);

      // Step 3: Verify updated service appears on public site
      const publicResponse = await request(app)
        .get('/api/services');

      expect(publicResponse.status).toBe(200);
      expect(publicResponse.body.success).toBe(true);
      
      const publicService = publicResponse.body.data.find(s => s.id === serviceId);
      expect(publicService).toBeTruthy();
      expect(publicService.title).toBe(updateData.title);
      expect(publicService.description).toBe(updateData.description);
      expect(publicService.icon).toBe(updateData.icon);
    });

    test('should update company info in admin and verify changes on public site', async () => {
      // Step 1: Get current company info
      const initialResponse = await request(app)
        .get('/api/company');

      expect(initialResponse.status).toBe(200);
      const companyId = initialResponse.body.data.id;

      // Step 2: Update company info via admin API
      const updateData = {
        companyName: 'DB GENERAL CONSTRUCTION LLC',
        history: 'Updated company history with 20 years of experience',
        mission: 'Updated mission: Building excellence',
        teamInfo: 'Updated team: 50+ professionals',
        address: '123 Construction Ave, Building City, BC 12345',
        phone: '555-0199',
        email: 'contact@dbconstruction.com'
      };

      const updateResponse = await request(app)
        .put('/api/company')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);

      // Step 3: Verify updated company info appears on public site
      const publicResponse = await request(app)
        .get('/api/company');

      expect(publicResponse.status).toBe(200);
      expect(publicResponse.body.success).toBe(true);
      
      const publicCompanyInfo = publicResponse.body.data;
      expect(publicCompanyInfo.companyName).toBe(updateData.companyName);
      expect(publicCompanyInfo.history).toBe(updateData.history);
      expect(publicCompanyInfo.mission).toBe(updateData.mission);
      expect(publicCompanyInfo.teamInfo).toBe(updateData.teamInfo);
      expect(publicCompanyInfo.address).toBe(updateData.address);
      expect(publicCompanyInfo.phone).toBe(updateData.phone);
      expect(publicCompanyInfo.email).toBe(updateData.email);
    });
  });

  /**
   * Test 33.2: Contact Form Submission Flow
   * Requirements: 3.2, 13.1
   */
  describe('33.2 Contact Form Submission Flow', () => {
    test('should submit inquiry from public site and verify it appears in admin inquiries', async () => {
      // Step 1: Submit inquiry from public site (no auth required)
      const inquiryData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '555-1234',
        message: 'I am interested in your construction services for a residential project.'
      };

      const submitResponse = await request(app)
        .post('/api/inquiries')
        .send(inquiryData);

      expect(submitResponse.status).toBe(201);
      expect(submitResponse.body.success).toBe(true);
      const inquiryId = submitResponse.body.data.id;

      // Step 2: Verify inquiry appears in admin inquiries list
      const adminResponse = await request(app)
        .get('/api/inquiries')
        .set('Authorization', `Bearer ${authToken}`);

      expect(adminResponse.status).toBe(200);
      expect(adminResponse.body.success).toBe(true);
      expect(adminResponse.body.data.length).toBe(1);
      
      const adminInquiry = adminResponse.body.data[0];
      expect(adminInquiry.id).toBe(inquiryId);
      expect(adminInquiry.name).toBe(inquiryData.name);
      expect(adminInquiry.email).toBe(inquiryData.email);
      expect(adminInquiry.phone).toBe(inquiryData.phone);
      expect(adminInquiry.message).toBe(inquiryData.message);
      expect(adminInquiry.status).toBe('unread');
    });

    test('should update inquiry status in admin and verify changes persist', async () => {
      // Step 1: Submit inquiry from public site
      const inquiryData = {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '555-5678',
        message: 'Please contact me about commercial construction.'
      };

      const submitResponse = await request(app)
        .post('/api/inquiries')
        .send(inquiryData);

      const inquiryId = submitResponse.body.data.id;

      // Step 2: Update status to 'read' via admin API
      const readResponse = await request(app)
        .put(`/api/inquiries/${inquiryId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'read' });

      expect(readResponse.status).toBe(200);
      expect(readResponse.body.success).toBe(true);
      expect(readResponse.body.data.status).toBe('read');

      // Step 3: Verify status persists when fetching inquiry
      const getResponse = await request(app)
        .get(`/api/inquiries/${inquiryId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.data.status).toBe('read');

      // Step 4: Update status to 'resolved'
      const resolvedResponse = await request(app)
        .put(`/api/inquiries/${inquiryId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'resolved' });

      expect(resolvedResponse.status).toBe(200);
      expect(resolvedResponse.body.data.status).toBe('resolved');

      // Step 5: Verify final status
      const finalResponse = await request(app)
        .get(`/api/inquiries/${inquiryId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(finalResponse.status).toBe(200);
      expect(finalResponse.body.data.status).toBe('resolved');
    });

    test('should track unread count correctly as inquiries are submitted and updated', async () => {
      // Step 1: Check initial unread count
      const initialCount = await request(app)
        .get('/api/inquiries/unread/count')
        .set('Authorization', `Bearer ${authToken}`);

      expect(initialCount.status).toBe(200);
      expect(initialCount.body.count).toBe(0);

      // Step 2: Submit first inquiry
      await request(app)
        .post('/api/inquiries')
        .send({
          name: 'User 1',
          email: 'user1@example.com',
          message: 'Message 1'
        });

      const count1 = await request(app)
        .get('/api/inquiries/unread/count')
        .set('Authorization', `Bearer ${authToken}`);

      expect(count1.body.count).toBe(1);

      // Step 3: Submit second inquiry
      await request(app)
        .post('/api/inquiries')
        .send({
          name: 'User 2',
          email: 'user2@example.com',
          message: 'Message 2'
        });

      const count2 = await request(app)
        .get('/api/inquiries/unread/count')
        .set('Authorization', `Bearer ${authToken}`);

      expect(count2.body.count).toBe(2);

      // Step 4: Mark one as read
      const inquiries = await request(app)
        .get('/api/inquiries')
        .set('Authorization', `Bearer ${authToken}`);

      const firstInquiryId = inquiries.body.data[0].id;

      await request(app)
        .put(`/api/inquiries/${firstInquiryId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'read' });

      const count3 = await request(app)
        .get('/api/inquiries/unread/count')
        .set('Authorization', `Bearer ${authToken}`);

      expect(count3.body.count).toBe(1);
    });
  });

  /**
   * Test 33.3: Image Upload and Usage Flow
   * Requirements: 14.4, 14.7
   */
  describe('33.3 Image Upload and Usage Flow', () => {
    test('should upload image in media library and use it in project', async () => {
      // Step 1: Create a media record (simulating image upload)
      const mediaData = {
        filename: 'test-image.jpg',
        originalName: 'test-image.jpg',
        mimeType: 'image/jpeg',
        size: 1024000,
        url: '/uploads/test-image.jpg'
      };

      const media = await db.Media.create(mediaData);
      expect(media.id).toBeTruthy();

      // Step 2: Create project using the uploaded image
      const projectData = {
        title: 'Project with Image',
        description: 'Project description',
        category: 'Residential',
        completionDate: '2024-03-15',
        location: 'Test Location'
      };

      const projectResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData);

      expect(projectResponse.status).toBe(201);
      const projectId = projectResponse.body.data.id;

      // Step 3: Add image to project
      await db.ProjectImage.create({
        projectId: projectId,
        src: media.url,
        alt: 'Test project image'
      });

      // Step 4: Verify project has the image
      const getProjectResponse = await request(app)
        .get(`/api/projects/${projectId}`);

      expect(getProjectResponse.status).toBe(200);
      expect(getProjectResponse.body.data.images.length).toBe(1);
      expect(getProjectResponse.body.data.images[0].src).toBe(media.url);
    });

    test('should prevent deletion of image that is in use by a project', async () => {
      // Step 1: Create media record
      const media = await db.Media.create({
        filename: 'in-use-image.jpg',
        originalName: 'in-use-image.jpg',
        mimeType: 'image/jpeg',
        size: 1024000,
        url: '/uploads/in-use-image.jpg'
      });

      // Step 2: Create project
      const project = await db.Project.create({
        title: 'Project Using Image',
        description: 'Description',
        category: 'Commercial',
        completionDate: new Date('2024-03-15'),
        location: 'Location'
      });

      // Step 3: Link image to project
      await db.ProjectImage.create({
        projectId: project.id,
        src: media.url,
        alt: 'Project image'
      });

      // Step 4: Attempt to delete the image
      const deleteResponse = await request(app)
        .delete(`/api/media/${media.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Should fail because image is in use
      expect(deleteResponse.status).toBe(400);
      expect(deleteResponse.body.error).toContain('in use');

      // Step 5: Verify image still exists
      const mediaStillExists = await db.Media.findByPk(media.id);
      expect(mediaStillExists).toBeTruthy();
    });

    test('should allow deletion of image that is not in use', async () => {
      // Step 1: Create media record
      const media = await db.Media.create({
        filename: 'unused-image.jpg',
        originalName: 'unused-image.jpg',
        mimeType: 'image/jpeg',
        size: 1024000,
        url: '/uploads/unused-image.jpg'
      });

      // Step 2: Attempt to delete the image (not used in any project)
      const deleteResponse = await request(app)
        .delete(`/api/media/${media.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Should succeed
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);

      // Step 3: Verify image is deleted
      const mediaDeleted = await db.Media.findByPk(media.id);
      expect(mediaDeleted).toBeNull();
    });
  });

  /**
   * Test 33.4: Authentication and Session Management
   * Requirements: 9.2, 9.4, 9.5
   */
  describe('33.4 Authentication and Session Management', () => {
    test('should complete full login flow with valid credentials', async () => {
      // Step 1: Login with valid credentials
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'TestAdmin',
          password: 'testpass123'
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.token).toBeTruthy();
      expect(loginResponse.body.user).toBeTruthy();
      expect(loginResponse.body.user.username).toBe('TestAdmin');

      const token = loginResponse.body.token;

      // Step 2: Verify token works for protected route
      const protectedResponse = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${token}`);

      // Public route, but token should be valid
      expect(protectedResponse.status).toBe(200);

      // Step 3: Verify token for admin-only route
      const adminResponse = await request(app)
        .get('/api/inquiries')
        .set('Authorization', `Bearer ${token}`);

      expect(adminResponse.status).toBe(200);
    });

    test('should reject access with expired token', async () => {
      // Create an expired token (expired 1 hour ago)
      const expiredToken = jwt.sign(
        { 
          userId: adminUser.id, 
          username: adminUser.username 
        },
        process.env.JWT_SECRET || 'test-secret-key',
        { expiresIn: '-1h' }
      );

      // Attempt to access protected route with expired token
      const response = await request(app)
        .get('/api/inquiries')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBeTruthy();
    });

    test('should complete full logout flow', async () => {
      // Step 1: Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'TestAdmin',
          password: 'testpass123'
        });

      expect(loginResponse.status).toBe(200);
      const token = loginResponse.body.token;

      // Step 2: Verify token works
      const beforeLogout = await request(app)
        .get('/api/inquiries')
        .set('Authorization', `Bearer ${token}`);

      expect(beforeLogout.status).toBe(200);

      // Step 3: Logout
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.body.success).toBe(true);

      // Note: In a stateless JWT system, the token is still technically valid
      // until it expires. The logout is handled client-side by removing the token.
      // For a true server-side logout, you would need a token blacklist.
    });

    test('should reject protected route access without token', async () => {
      // Attempt to access admin route without token
      const response = await request(app)
        .get('/api/inquiries');

      expect(response.status).toBe(401);
      expect(response.body.error).toBeTruthy();
    });

    test('should reject protected route access with invalid token', async () => {
      // Attempt to access admin route with invalid token
      const response = await request(app)
        .get('/api/inquiries')
        .set('Authorization', 'Bearer invalid-token-12345');

      expect(response.status).toBe(401);
      expect(response.body.error).toBeTruthy();
    });

    test('should reject protected route access with malformed authorization header', async () => {
      // Missing "Bearer" prefix
      const response1 = await request(app)
        .get('/api/inquiries')
        .set('Authorization', authToken);

      expect(response1.status).toBe(401);

      // Empty authorization header
      const response2 = await request(app)
        .get('/api/inquiries')
        .set('Authorization', '');

      expect(response2.status).toBe(401);
    });
  });
});
