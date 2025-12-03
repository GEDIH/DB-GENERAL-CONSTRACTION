# Database Creation Guide for Task 1.3

## Overview
This guide provides step-by-step instructions to complete Task 1.3: Create MySQL database "db_construction"

## Prerequisites
- MySQL 8.0 installed (✓ Confirmed at: C:\Program Files\MySQL\MySQL Server 8.0\)
- MySQL Workbench 8.0 CE installed
- MySQL root password

## Option 1: Using MySQL Workbench 8.0 CE (Recommended)

### Step 1: Launch MySQL Workbench
1. Open MySQL Workbench 8.0 CE
2. Click on your local MySQL connection (usually "Local instance MySQL80")
3. Enter your MySQL root password when prompted

### Step 2: Create Database
1. In the Query tab, paste the following SQL:
```sql
CREATE DATABASE IF NOT EXISTS db_construction
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

2. Click the lightning bolt icon (⚡) or press Ctrl+Enter to execute

3. Verify success - you should see:
```
1 row(s) affected
```

### Step 3: Verify Database Creation
Run this query to confirm:
```sql
SHOW DATABASES LIKE 'db_construction';
USE db_construction;
SELECT DATABASE();
```

You should see `db_construction` as the current database.

### Step 4: Update .env File
Make sure your `backend/.env` file has the correct MySQL password:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_actual_mysql_password
DB_NAME=db_construction
DB_PORT=3306
```

## Option 2: Using MySQL Command Line

### Windows Command Prompt:
```cmd
cd backend
mysql -u root -p < database-setup.sql
```

When prompted, enter your MySQL root password.

### PowerShell:
```powershell
cd backend
Get-Content database-setup.sql | mysql -u root -p
```

When prompted, enter your MySQL root password.

## Option 3: Using SQL Script File in MySQL Workbench

1. Open MySQL Workbench
2. Connect to your local MySQL server
3. Go to File → Open SQL Script
4. Navigate to `backend/database-setup.sql`
5. Click the lightning bolt icon to execute
6. Verify the database was created

## Verification Steps

After creating the database, verify it exists:

### In MySQL Workbench:
1. Look in the "Schemas" panel on the left
2. You should see `db_construction` listed
3. Right-click and select "Set as Default Schema"

### Using Command Line:
```cmd
mysql -u root -p -e "SHOW DATABASES LIKE 'db_construction';"
```

## Troubleshooting

### Error: Access denied for user 'root'@'localhost'
**Solution**: The password in `.env` file is incorrect. Update it with your actual MySQL root password.

### Error: Can't create database 'db_construction'; database exists
**Solution**: The database already exists! This is fine - proceed to the next task (migrations).

### Error: Unknown database 'db_construction'
**Solution**: The database wasn't created. Follow the steps above again.

## Next Steps

Once the database is created:

1. ✅ Mark task 1.3 as complete
2. ▶️ Install Node.js dependencies: `npm install` (in backend folder)
3. ▶️ Run migrations to create tables: `npm run migrate`
4. ▶️ Seed initial data: `npm run seed`
5. ▶️ Start the server: `npm run dev`

## Database Configuration Summary

The database configuration is already set up in:
- `backend/config/database.js` - Sequelize configuration
- `backend/models/index.js` - Connection with retry logic
- `backend/.env` - Environment variables

**Character Set**: utf8mb4
**Collation**: utf8mb4_unicode_ci
**Connection Pool**: 
- Max: 5 connections
- Min: 0 connections
- Acquire timeout: 30 seconds
- Idle timeout: 10 seconds

**Retry Logic**: 5 attempts with 3-second delays between retries

## Security Notes

⚠️ **Important**: 
- Never commit the `.env` file with real passwords to version control
- Change the default admin password after first login
- Use strong passwords in production
- Consider creating a dedicated MySQL user instead of using root

## Support

If you encounter issues:
1. Verify MySQL service is running
2. Check MySQL error logs
3. Verify network connectivity to localhost:3306
4. Ensure no firewall is blocking port 3306
