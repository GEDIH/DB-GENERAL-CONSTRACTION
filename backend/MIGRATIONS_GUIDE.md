# Database Migrations Guide

## Overview

All database models and migrations have been created for Task 2. This guide explains how to run the migrations to create the database tables.

## ✅ What's Been Created

### Models Created (7 total)

1. **Project** (`models/Project.js`)
   - Portfolio construction projects
   - Fields: title, description, category, completionDate, location
   - Associations: hasMany ProjectImage

2. **ProjectImage** (`models/ProjectImage.js`)
   - Images for projects
   - Fields: projectId, src, alt, thumbnail
   - Associations: belongsTo Project

3. **Service** (`models/Service.js`)
   - Construction services offered
   - Fields: title, description, icon

4. **Inquiry** (`models/Inquiry.js`)
   - Contact form submissions
   - Fields: name, email, phone, message, status
   - Status enum: 'unread', 'read', 'resolved'

5. **CompanyInfo** (`models/CompanyInfo.js`)
   - Company information
   - Fields: companyName, history, mission, teamInfo, address, phone, email

6. **AdminUser** (`models/AdminUser.js`)
   - Admin users for dashboard
   - Fields: username, email, password, name, role, lastLogin
   - Password hashing with bcrypt (beforeCreate, beforeUpdate hooks)

7. **Media** (`models/Media.js`)
   - Uploaded media files
   - Fields: filename, originalName, mimeType, size, url, uploadedAt

### Migrations Created (7 total)

All migrations are in `backend/migrations/` directory:

1. `20240101000001-create-projects.js`
2. `20240101000002-create-project-images.js`
3. `20240101000003-create-services.js`
4. `20240101000004-create-inquiries.js`
5. `20240101000005-create-company-info.js`
6. `20240101000006-create-admin-users.js`
7. `20240101000007-create-media.js`

### Model Features

**Validation:**
- All models include comprehensive validation rules
- Email format validation
- Length constraints
- Required field validation
- Custom error messages

**Indexes:**
- Strategic indexes for common queries
- Foreign key indexes
- Unique constraints where needed

**Timestamps:**
- All models have createdAt and updatedAt
- Automatic timestamp management

**Associations:**
- Project ↔ ProjectImage (one-to-many)
- Cascade delete for project images

## 🎯 Prerequisites

Before running migrations:

1. **Database must exist**
   - Run: `node create-database.js`
   - Or create manually in MySQL Workbench
   - Database name: `db_construction`

2. **Dependencies must be installed**
   ```cmd
   cd backend
   npm install
   ```

3. **Environment variables configured**
   - Check `backend/.env` file
   - Verify DB_PASSWORD is correct

## 🚀 Running Migrations

### Step 1: Verify Database Connection

Test the connection first:
```cmd
cd backend
node create-database.js
```

You should see: "✓ Database 'db_construction' created successfully"

### Step 2: Run All Migrations

Execute all migrations to create tables:
```cmd
npm run migrate
```

Expected output:
```
Sequelize CLI [Node: x.x.x, CLI: x.x.x, ORM: x.x.x]

Loaded configuration file "config/database.js".
Using environment "development".
== 20240101000001-create-projects: migrating =======
== 20240101000001-create-projects: migrated (0.123s)

== 20240101000002-create-project-images: migrating =======
== 20240101000002-create-project-images: migrated (0.098s)

== 20240101000003-create-services: migrating =======
== 20240101000003-create-services: migrated (0.087s)

== 20240101000004-create-inquiries: migrating =======
== 20240101000004-create-inquiries: migrated (0.095s)

== 20240101000005-create-company-info: migrating =======
== 20240101000005-create-company-info: migrated (0.076s)

== 20240101000006-create-admin-users: migrating =======
== 20240101000006-create-admin-users: migrated (0.089s)

== 20240101000007-create-media: migrating =======
== 20240101000007-create-media: migrated (0.081s)
```

### Step 3: Verify Tables Created

**Option A: Using MySQL Workbench**
1. Open MySQL Workbench
2. Connect to your server
3. Expand the `db_construction` schema
4. You should see these tables:
   - `projects`
   - `project_images`
   - `services`
   - `inquiries`
   - `company_info`
   - `admin_users`
   - `media`
   - `SequelizeMeta` (tracks migrations)

**Option B: Using MySQL Command Line**
```cmd
mysql -u root -p -e "USE db_construction; SHOW TABLES;"
```

**Option C: Using SQL Query**
```sql
USE db_construction;
SHOW TABLES;
```

### Step 4: Verify Table Structure

Check a table structure:
```sql
DESCRIBE projects;
DESCRIBE admin_users;
```

Or in MySQL Workbench:
- Right-click on a table
- Select "Table Inspector"

## 📊 Database Schema Summary

### Tables Created

| Table | Rows (Initial) | Purpose |
|-------|----------------|---------|
| projects | 0 | Portfolio projects |
| project_images | 0 | Project images |
| services | 0 | Services offered |
| inquiries | 0 | Contact submissions |
| company_info | 0 | Company details |
| admin_users | 0 | Admin accounts |
| media | 0 | Uploaded files |
| SequelizeMeta | 7 | Migration tracking |

### Foreign Keys

- `project_images.project_id` → `projects.id` (CASCADE DELETE)

### Indexes Created

**projects:**
- PRIMARY KEY (id)
- idx_projects_category
- idx_projects_completion_date

**project_images:**
- PRIMARY KEY (id)
- idx_project_images_project_id
- FOREIGN KEY (project_id)

**services:**
- PRIMARY KEY (id)
- idx_services_title

**inquiries:**
- PRIMARY KEY (id)
- idx_inquiries_status
- idx_inquiries_created_at
- idx_inquiries_email

**company_info:**
- PRIMARY KEY (id)

**admin_users:**
- PRIMARY KEY (id)
- idx_admin_users_username (UNIQUE)
- idx_admin_users_email

**media:**
- PRIMARY KEY (id)
- idx_media_filename
- idx_media_mime_type
- idx_media_uploaded_at

## 🔄 Migration Commands

### Run all pending migrations
```cmd
npm run migrate
```

### Undo last migration
```cmd
npm run migrate:undo
```

### Undo all migrations
```cmd
npm run migrate:undo:all
```

### Check migration status
```cmd
npx sequelize-cli db:migrate:status
```

## ⚠️ Troubleshooting

### Error: "sequelize-cli not found"
**Problem**: Dependencies not installed

**Solution**:
```cmd
cd backend
npm install
```

### Error: "Access denied for user 'root'@'localhost'"
**Problem**: Wrong MySQL password

**Solution**:
1. Open `backend/.env`
2. Update `DB_PASSWORD` with correct password
3. Try again

### Error: "Unknown database 'db_construction'"
**Problem**: Database doesn't exist

**Solution**:
```cmd
node create-database.js
```
Or create manually in MySQL Workbench

### Error: "Table 'projects' already exists"
**Problem**: Migrations already run

**Solution**: This is fine! Tables already exist. To start fresh:
```cmd
npm run migrate:undo:all
npm run migrate
```

### Error: "Cannot find module 'bcrypt'"
**Problem**: Missing dependency

**Solution**:
```cmd
npm install bcrypt
```

### Error: "ER_NOT_SUPPORTED_AUTH_MODE"
**Problem**: MySQL 8.0 authentication issue

**Solution**: Update MySQL user authentication:
```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

## 📋 Next Steps

After migrations are complete:

1. ✅ Verify all tables exist
2. ✅ Check table structures
3. ▶️ **Task 3**: Create seeders for initial data
   - Default admin user (Dale Melaku / password@123)
   - Default company info
4. ▶️ **Task 4+**: Implement API controllers and routes

## 🧪 Testing Migrations

### Test Model Loading

Create a test file `test-models.js`:
```javascript
const db = require('./models');

async function testModels() {
  try {
    await db.connectWithRetry();
    console.log('✓ Database connected');
    
    // Test each model
    const projectCount = await db.Project.count();
    console.log(`✓ Projects table: ${projectCount} rows`);
    
    const serviceCount = await db.Service.count();
    console.log(`✓ Services table: ${serviceCount} rows`);
    
    const inquiryCount = await db.Inquiry.count();
    console.log(`✓ Inquiries table: ${inquiryCount} rows`);
    
    const adminCount = await db.AdminUser.count();
    console.log(`✓ Admin users table: ${adminCount} rows`);
    
    const mediaCount = await db.Media.count();
    console.log(`✓ Media table: ${mediaCount} rows`);
    
    const companyCount = await db.CompanyInfo.count();
    console.log(`✓ Company info table: ${companyCount} rows`);
    
    console.log('\n✅ All models working correctly!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

testModels();
```

Run it:
```cmd
node test-models.js
```

## 📚 Model Usage Examples

### Create a Project
```javascript
const project = await db.Project.create({
  title: 'Modern Office Building',
  description: 'A state-of-the-art office complex',
  category: 'Commercial',
  completionDate: new Date('2024-01-15'),
  location: 'Downtown, City'
});
```

### Create an Admin User
```javascript
const admin = await db.AdminUser.create({
  username: 'Dale Melaku',
  email: 'admin@dbconstruction.com',
  password: 'password@123', // Will be hashed automatically
  name: 'Dale Melaku',
  role: 'admin'
});
```

### Create an Inquiry
```javascript
const inquiry = await db.Inquiry.create({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-1234',
  message: 'I need a quote for a renovation project',
  status: 'unread'
});
```

## ✅ Success Criteria

Task 2.8 is complete when:
- ✅ All 7 migrations executed successfully
- ✅ All 8 tables exist in database (7 + SequelizeMeta)
- ✅ All indexes created
- ✅ Foreign keys established
- ✅ Models can be loaded without errors
- ✅ Test queries work

## 🎉 Completion

Once migrations are complete, you're ready for:
- **Task 3**: Authentication system
- **Task 4-8**: API endpoints
- **Seeders**: Initial data

---

**Estimated Time**: 2-5 minutes
**Requirements Validated**: 16.1
