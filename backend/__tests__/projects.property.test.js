/**
 * Property-Based Tests for Projects API
 * Uses fast-check for property-based testing
 */

const fc = require('fast-check');
const request = require('supertest');
const app = require('../server');
const db = require('../models');
const bcrypt = require('bcrypt');

// Test configuration
const NUM_RUNS = 100; // Minimum 100 iterations as per design spec

describe('Projects API Property-Based Tests', () => {
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
   * Feature: db-construction-pwa, Property 12: Project creation persists data
   * Validates: Requirements 10.3
   * 
   * For any valid project data, creating a project should save it to the database
   * and return the created project with an ID.
   */
  describe('Property 12: Project creation persists data', () => {
    test('should persist any valid project data to database', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random project data
          fc.string({ minLength: 1, maxLength: 255 }), // title
          fc.string({ minLength: 1, maxLength: 1000 }), // description
          fc.string({ minLength: 1, maxLength: 100 }), // category
          fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }), // completionDate
          fc.string({ minLength: 1, maxLength: 255 }), // location
          async (title, description, category, completionDate, location) => {
            // Skip empty or whitespace-only strings
            if (!title.trim() || !description.trim() || !category.trim() || !location.trim()) {
              return true;
            }

            // Create project via API
            const response = await request(app)
              .post('/api/projects')
              .set('Authorization', `Bearer ${authToken}`)
              .send({
                title: title.trim(),
                description: description.trim(),
                category: category.trim(),
                completionDate: completionDate.toISOString(),
                location: location.trim()
              });

            // Verify response
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.title).toBe(title.trim());
            expect(response.body.data.description).toBe(description.trim());
            expect(response.body.data.category).toBe(category.trim());
            expect(response.body.data.location).toBe(location.trim());

            // Verify data persisted in database
            const projectInDb = await db.Project.findByPk(response.body.data.id);
            expect(projectInDb).toBeTruthy();
            expect(projectInDb.title).toBe(title.trim());
            expect(projectInDb.description).toBe(description.trim());
            expect(projectInDb.category).toBe(category.trim());
            expect(projectInDb.location).toBe(location.trim());

            // Cleanup
            await projectInDb.destroy();
          }
        ),
        { numRuns: NUM_RUNS }
      );
    }, 120000); // 120 second timeout for property test
  });

  /**
   * Feature: db-construction-pwa, Property 13: Project update modifies existing data
   * Validates: Requirements 10.5
   * 
   * For any existing project and valid update data, updating the project should
   * modify the database record and return the updated project.
   */
  describe('Property 13: Project update modifies existing data', () => {
    test('should update any existing project with valid data', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random update data
          fc.string({ minLength: 1, maxLength: 255 }), // new title
          fc.string({ minLength: 1, maxLength: 1000 }), // new description
          fc.string({ minLength: 1, maxLength: 100 }), // new category
          async (newTitle, newDescription, newCategory) => {
            // Skip empty or whitespace-only strings
            if (!newTitle.trim() || !newDescription.trim() || !newCategory.trim()) {
              return true;
            }

            // Create initial project
            const initialProject = await db.Project.create({
              title: 'Initial Title',
              description: 'Initial Description',
              category: 'Initial Category',
              completionDate: new Date('2024-01-01'),
              location: 'Initial Location'
            });

            // Update project via API
            const response = await request(app)
              .put(`/api/projects/${initialProject.id}`)
              .set('Authorization', `Bearer ${authToken}`)
              .send({
                title: newTitle.trim(),
                description: newDescription.trim(),
                category: newCategory.trim(),
                completionDate: new Date('2024-06-01').toISOString(),
                location: 'Updated Location'
              });

            // Verify response
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(initialProject.id);
            expect(response.body.data.title).toBe(newTitle.trim());
            expect(response.body.data.description).toBe(newDescription.trim());
            expect(response.body.data.category).toBe(newCategory.trim());

            // Verify data updated in database
            const updatedProject = await db.Project.findByPk(initialProject.id);
            expect(updatedProject.title).toBe(newTitle.trim());
            expect(updatedProject.description).toBe(newDescription.trim());
            expect(updatedProject.category).toBe(newCategory.trim());

            // Cleanup
            await updatedProject.destroy();
          }
        ),
        { numRuns: NUM_RUNS }
      );
    }, 120000); // 120 second timeout for property test
  });

  /**
   * Feature: db-construction-pwa, Property 14: Project deletion removes data
   * Validates: Requirements 10.6
   * 
   * For any existing project, deleting it should remove it from the database
   * and return success confirmation.
   */
  describe('Property 14: Project deletion removes data', () => {
    test('should delete any existing project from database', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random project data for creation
          fc.string({ minLength: 1, maxLength: 255 }), // title
          fc.string({ minLength: 1, maxLength: 1000 }), // description
          async (title, description) => {
            // Skip empty or whitespace-only strings
            if (!title.trim() || !description.trim()) {
              return true;
            }

            // Create project
            const project = await db.Project.create({
              title: title.trim(),
              description: description.trim(),
              category: 'Test Category',
              completionDate: new Date('2024-01-01'),
              location: 'Test Location'
            });

            const projectId = project.id;

            // Verify project exists
            const projectBeforeDelete = await db.Project.findByPk(projectId);
            expect(projectBeforeDelete).toBeTruthy();

            // Delete project via API
            const response = await request(app)
              .delete(`/api/projects/${projectId}`)
              .set('Authorization', `Bearer ${authToken}`);

            // Verify response
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('deleted');

            // Verify project removed from database
            const projectAfterDelete = await db.Project.findByPk(projectId);
            expect(projectAfterDelete).toBeNull();
          }
        ),
        { numRuns: NUM_RUNS }
      );
    }, 120000); // 120 second timeout for property test

    test('should return 404 when deleting non-existent project', async () => {
      const response = await request(app)
        .delete('/api/projects/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not Found');
    });
  });

  /**
   * Additional tests for cascade delete behavior
   */
  describe('Project deletion cascade behavior', () => {
    test('should cascade delete project images when project is deleted', async () => {
      // Create project with images
      const project = await db.Project.create({
        title: 'Test Project',
        description: 'Test Description',
        category: 'Test',
        completionDate: new Date('2024-01-01'),
        location: 'Test Location'
      });

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
      const imagesBefore = await db.ProjectImage.findAll({ where: { projectId: project.id } });
      expect(imagesBefore.length).toBe(2);

      // Delete project
      await request(app)
        .delete(`/api/projects/${project.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Verify images were cascade deleted
      const imagesAfter = await db.ProjectImage.findAll({ where: { projectId: project.id } });
      expect(imagesAfter.length).toBe(0);
    });
  });
});
