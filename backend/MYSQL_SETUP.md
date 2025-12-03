# MySQL 8.0 Database Setup Guide

## Using MySQL Workbench 8.0 CE

### Step 1: Open MySQL Workbench
1. Launch MySQL Workbench 8.0 CE
2. Connect to your local MySQL server (usually `localhost:3306`)
3. Enter your root password when prompted

### Step 2: Create Database

**Option A: Using SQL Script**
1. Open the `database-setup.sql` file in MySQL Workbench
2. Click the lightning bolt icon (⚡) to execute the script
3. Verify the database was created successfully

**Option B: Using GUI**
1. Right-click in the "Schemas" panel
2. Select "Create Schema..."
3. Enter schema name: `db_construction`
4. Set Character Set: `utf8mb4`
5. Set Collation: `utf8mb4_unicode_ci`
6. Click "Apply"

**Option C: Using Query**
```sql
CREATE DATABASE db_construction
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

### Step 3: Verify Database Creation
```sql
SHOW DATABASES LIKE 'db_construction';
USE db_construction;
SELECT DATABASE();
```

### Step 4: Configure Connection in Backend

Update the `.env` file with your MySQL credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=db_construction
DB_PORT=3306
```

### Step 5: Install Node.js Dependencies

```bash
cd backend
npm install
```

### Step 6: Run Database Migrations

This will create all the tables:

```bash
npm run migrate
```

### Step 7: Seed Initial Data

This will create the default admin user and company info:

```bash
npm run seed
```

### Step 8: Verify Tables Created

In MySQL Workbench, refresh the schemas and expand `db_construction`:

Expected tables:
- `admin_users`
- `projects`
- `project_images`
- `services`
- `inquiries`
- `company_info`
- `media`
- `SequelizeMeta` (migration tracking)

### Troubleshooting

**Connection Error:**
```
Error: Access denied for user 'root'@'localhost'
```
Solution: Check your MySQL password in `.env` file

**Database Already Exists:**
```
Error: Can't create database 'db_construction'; database exists
```
Solution: This is fine, the database already exists. Proceed to migrations.

**Port Already in Use:**
```
Error: Port 3306 is already in use
```
Solution: Check if MySQL is running on a different port or if another service is using port 3306.

### MySQL Workbench Tips

**View Table Structure:**
```sql
DESCRIBE table_name;
```

**View All Tables:**
```sql
SHOW TABLES;
```

**View Table Data:**
```sql
SELECT * FROM admin_users;
SELECT * FROM projects;
```

**Check Foreign Keys:**
```sql
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'db_construction'
AND REFERENCED_TABLE_NAME IS NOT NULL;
```

### Default Admin Credentials

After running seeders, you can login with:
- **Username**: Dale Melaku
- **Password**: password@123

⚠️ **Security Note**: Change this password in production!

### Backup Database

```bash
mysqldump -u root -p db_construction > backup.sql
```

### Restore Database

```bash
mysql -u root -p db_construction < backup.sql
```

## Next Steps

1. ✅ Database created
2. ✅ Tables created (via migrations)
3. ✅ Initial data seeded
4. ▶️ Start the backend server: `npm run dev`
5. ▶️ Test API endpoints

The backend API will be available at `http://localhost:5000`
