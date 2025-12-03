/**
 * Integration Tests for Projects API Endpoints
 * Tests CRUD operations and image relationships
 * Requirements: 10.1, 10.3, 10.5, 10.6
 */

const request = require('supertest');
const app = require('../server');
const db = require('../models');
const bcrypt = require('bcrypt');

describe('Projects API Integration Tests', () => {
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

  // Clean up test projects before each test
  beforeEach(async () => {
    await db.ProjectImage.destroy({ where: {}, truncate: true });
    await db.Project.destroy({ where: {}, truncate: true });
  });

  /**
   * Test GET all projects (with image relationships)
   * Requirement: 10.1
   */
  describe('GET /api/projects - Get all projects', () => {
    test('should return empty array when no projects exist', async () => {
      const response = await request(app)
        .get('/api/projects');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(0);
    });

    test('should return all projects with their images', async () => {
      // Create test projects with images
      const project1 = await db.Project.create({
        title: 'Project 1',
        description: 'Description 1',
        category: 'Residential',
        completionDate: new Date('2024-01-01'),
        location: 'Location 1'
      });

      await db.ProjectImage.create({
        projectId: project1.id,
        src: '/uploads/image1.jpg',
        alt: 'Image 1'
      });

      await db.ProjectImage.create({
        projectId: project1.id,
        src: '/uploads/image2.jpg',
        alt: 'Image 2'
      });

      const project2 = await db.Project.create({
        title: 'Project 2',
        description: 'Description 2',
        category: 'Commercial',
        completionDate: new Date('2024-02-01'),
        location: 'Location 2'
      });

      await db.ProjectImage.create({
        projectId: project2.id,
        src: '/uploads/image3.jpg',
        alt: 'Image 3'
      });

      const response = await request(app)
        .get('/api/projects');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      
      // Check first project
      const returnedProject1 = response.body.data.find(p => p.id === project1.id);
      expect(returnedProject1).toBeTruthy();
      expect(returnedProject1.title).toBe('Project 1');
      expect(returnedProject1.images).toBeTruthy();
      expect(Array.isArray(returnedProject1.images)).toBe(true);
      expect(returnedProject1.images.length).toBe(2);
      
      // Check second project
      const returnedProject2 = response.body.data.find(p => p.id === project2.id);
      expect(returnedProject2).toBeTruthy();
      expect(returnedProject2.title).toBe('Project 2');
      expect(returnedProject2.images).toBeTruthy();
      expect(returnedProject2.images.length).toBe(1);
    });

    test('should return projects without images if none exist', async () => {
      await db.Project.create({
        title: 'Project Without Images',
        description: 'Description',
        category: 'Residential',
        completionDate: new Date('2024-01-01'),
        location: 'Location'
      });

      const response = await request(app)
        .get('/api/projects');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].images).toBeTruthy();
      expect(response.body.data[0].images.length).toBe(0);
    });
  });

  /**
   * Test GET single project (with images)
   * Requirement: 10.1
   */
  describe('GET /api/projects/:id - Get single project', () => {
    test('should return single project with images', async () => {
      const project = await db.Project.create({
        title: 'Test Project',
        description: 'Test Description',
        category: 'Residential',
        completionDate: new Date('2024-01-01'),
        location: 'Test Location'
      });

      await db.ProjectImage.create({
        projectId: project.id,
        src: '/uploads/test1.jpg',
        alt: 'Test Image 1'
      });

      await db.ProjectImage.create({
        projectId: project.id,
        src: '/uploads/test2.jpg',
        alt: 'Test Image 2'
      });

      const response = await request(app)
        .get(`/api/projects/${project.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', project.id);
      expect(response.body.data).toHaveProperty('title', 'Test Project');
      expect(response.body.data).toHaveProperty('description', 'Test Description');
      expect(response.body.data).toHaveProperty('category', 'Residential');
      expect(response.body.data).toHaveProperty('location', 'Test Location');
      expect(response.body.data).toHaveProperty('images');
      expect(response.body.data.images.length).toBe(2);
    });

    test('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .get('/api/projects/99999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  /**
   * Test POST create project
   * Requirement: 10.3
   */
  describe('POST /api/projects - Create project', () => {
    test('should create new project with valid data', async () => {
      const projectData = {
        title: 'New Project',
        description: 'New Description',
        category: 'Commercial',
        completionDate: '2024-03-01',
        location: 'New Location'
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe(projectData.title);
      expect(response.body.data.description).toBe(projectData.description);
      expect(response.body.data.category).toBe(projectData.category);
      expect(response.body.data.location).toBe(projectData.location);

      // Verify in database
      const projectInDb = await db.Project.findByPk(response.body.data.id);
      expect(projectInDb).toBeTruthy();
      expect(projectInDb.title).toBe(projectData.title);
    });

    test('should reject project creation without authentication', async () => {
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

    test('should reject project with missing required fields', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Project'
          // Missing other required fields
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should reject project with empty title', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '',
          description: 'Test Description',
          category: 'Residential',
          completionDate: '2024-01-01',
          location: 'Test Location'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  /**
   * Test PUT update project
   * Requirement: 10.5
   */
  describe('PUT /api/projects/:id - Update project', () => {
    test('should update existing project with valid data', async () => {
      const project = await db.Project.create({
        title: 'Original Title',
        description: 'Original Description',
        category: 'Residential',
        completionDate: new Date('2024-01-01'),
        location: 'Original Location'
      });

      const updateData = {
        title: 'Updated Title',
        description: 'Updated Description',
        category: 'Commercial',
        completionDate: '2024-06-01',
        location: 'Updated Location'
      };

      const response = await request(app)
        .put(`/api/projects/${project.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(project.id);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.category).toBe(updateData.category);
      expect(response.body.data.location).toBe(updateData.location);

      // Verify in database
      await project.reload();
      expect(project.title).toBe(updateData.title);
      expect(project.description).toBe(updateData.description);
    });

    test('should reject update without authentication', async () => {
      const project = await db.Project.create({
        title: 'Test Project',
        description: 'Test Description',
        category: 'Residential',
        completionDate: new Date('2024-01-01'),
        location: 'Test Location'
      });

      const response = await request(app)
        .put(`/api/projects/${project.id}`)
        .send({
          title: 'Updated Title'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('should return 404 when updating non-existent project', async () => {
      const response = await request(app)
        .put('/api/projects/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title',
          description: 'Updated Description',
          category: 'Commercial',
          completionDate: '2024-01-01',
          location: 'Updated Location'
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    test('should reject update with invalid data', async () => {
      const project = await db.Project.create({
        title: 'Test Project',
        description: 'Test Description',
        category: 'Residential',
        completionDate: new Date('2024-01-01'),
        location: 'Test Location'
      });

      const response = await request(app)
        .put(`/api/projects/${project.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '' // Empty title
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  /**
   * Test DELETE project (cascade delete images)
   * Requirement: 10.6
   */
  describe('DELETE /api/projects/:id - Delete project', () => {
    test('should delete project successfully', async () => {
      const project = await db.Project.create({
        title: 'Project to Delete',
        description: 'Description',
        category: 'Residential',
        completionDate: new Date('2024-01-01'),
        location: 'Location'
      });

      const response = await request(app)
        .delete(`/api/projects/${project.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');

      // Verify project is deleted from database
      const deletedProject = await db.Project.findByPk(project.id);
      expect(deletedProject).toBeNull();
    });

    test('should cascade delete project images when project is deleted', async () => {
      const project = await db.Project.create({
        title: 'Project with Images',
        description: 'Description',
        category: 'Residential',
        completionDate: new Date('2024-01-01'),
        location: 'Location'
      });

      // Create images for the project
      const image1 = await db.ProjectImage.create({
        projectId: project.id,
        src: '/uploads/test1.jpg',
        alt: 'Test Image 1'
      });

      const image2 = await db.ProjectImage.create({
        projectId: project.id,
        src: '/uploads/test2.jpg',
        alt: 'Test Image 2'
      });

      // Verify images exist
      const imagesBefore = await db.ProjectImage.findAll({ 
        where: { projectId: project.id } 
      });
      expect(imagesBefore.length).toBe(2);

      // Delete project
      const response = await request(app)
        .delete(`/api/projects/${project.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      // Verify images were cascade deleted
      const imagesAfter = await db.ProjectImage.findAll({ 
        where: { projectId: project.id } 
      });
      expect(imagesAfter.length).toBe(0);

      // Verify images don't exist by ID
      const deletedImage1 = await db.ProjectImage.findByPk(image1.id);
      const deletedImage2 = await db.ProjectImage.findByPk(image2.id);
      expect(deletedImage1).toBeNull();
      expect(deletedImage2).toBeNull();
    });

    test('should reject delete without authentication', async () => {
      const project = await db.Project.create({
        title: 'Test Project',
        description: 'Test Description',
        category: 'Residential',
        completionDate: new Date('2024-01-01'),
        location: 'Test Location'
      });

      const response = await request(app)
        .delete(`/api/projects/${project.id}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');

      // Verify project still exists
      const projectStillExists = await db.Project.findByPk(project.id);
      expect(projectStillExists).toBeTruthy();
    });

    test('should return 404 when deleting non-existent project', async () => {
      const response = await request(app)
        .delete('/api/projects/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
});
