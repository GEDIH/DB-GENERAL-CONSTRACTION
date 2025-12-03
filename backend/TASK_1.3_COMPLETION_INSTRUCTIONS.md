# Task 1.3 Completion Instructions

## Task: Create MySQL Database "db_construction"

### Status: Ready for Manual Execution

The database creation setup is complete. You now need to create the database using one of the methods below.

## ✅ What's Already Done

1. ✓ Database configuration files created (`config/database.js`)
2. ✓ Connection retry logic implemented (`models/index.js`)
3. ✓ SQL setup script created (`database-setup.sql`)
4. ✓ Node.js creation script created (`create-database.js`)
5. ✓ Comprehensive documentation created

## 🎯 What You Need to Do

### Prerequisites Check

1. **MySQL 8.0 is installed** ✓
   - Location: `C:\Program Files\MySQL\MySQL Server 8.0\`
   - Verified with: `mysql --version`

2. **MySQL Workbench 8.0 CE** (Recommended)
   - Should be installed with MySQL

3. **Know your MySQL root password**
   - Update in `backend/.env` if needed

### Method 1: Using MySQL Workbench (Recommended - 2 minutes)

1. **Launch MySQL Workbench 8.0 CE**

2. **Connect to Local MySQL Server**
   - Click on "Local instance MySQL80" (or similar)
   - Enter your root password

3. **Create Database**
   - In the Query tab, paste:
   ```sql
   CREATE DATABASE IF NOT EXISTS db_construction
   CHARACTER SET utf8mb4
   COLLATE utf8mb4_unicode_ci;
   ```
   - Click the lightning bolt icon (⚡) or press Ctrl+Enter

4. **Verify Success**
   - You should see: "1 row(s) affected"
   - Check the Schemas panel - `db_construction` should appear

5. **Done!** ✅

### Method 2: Using the SQL Script File (2 minutes)

1. **Open MySQL Workbench**

2. **Connect to your server**

3. **Open SQL Script**
   - File → Open SQL Script
   - Navigate to: `backend/database-setup.sql`
   - Click Open

4. **Execute Script**
   - Click the lightning bolt icon (⚡)

5. **Verify** - Check Schemas panel for `db_construction`

### Method 3: Using Node.js Script (3 minutes)

1. **Install Dependencies First**
   ```cmd
   cd backend
   npm install
   ```

2. **Update .env with correct MySQL password**
   ```env
   DB_PASSWORD=your_actual_mysql_password
   ```

3. **Run the creation script**
   ```cmd
   node create-database.js
   ```

4. **Verify** - Script will show success message

### Method 4: Using Command Line (1 minute)

**Windows Command Prompt:**
```cmd
cd backend
mysql -u root -p < database-setup.sql
```
(Enter password when prompted)

**PowerShell:**
```powershell
cd backend
Get-Content database-setup.sql | mysql -u root -p
```
(Enter password when prompted)

## 🔍 Verification

After creating the database, verify it exists:

### In MySQL Workbench:
- Look in the "Schemas" panel
- `db_construction` should be listed

### Using Command Line:
```cmd
mysql -u root -p -e "SHOW DATABASES LIKE 'db_construction';"
```

### Using Node.js:
```cmd
node -e "require('./models').connectWithRetry().then(() => console.log('✓ Connected')).catch(e => console.error('✗ Failed:', e.message))"
```

## ⚠️ Troubleshooting

### "Access denied for user 'root'@'localhost'"
**Problem**: Wrong password in `.env` file

**Solution**: 
1. Open `backend/.env`
2. Update `DB_PASSWORD=your_correct_password`
3. Try again

### "Can't create database; database exists"
**Problem**: Database already exists

**Solution**: This is fine! The database is already created. Proceed to next task.

### "MySQL server is not running"
**Problem**: MySQL service is stopped

**Solution**:
1. Open Services (Win+R, type `services.msc`)
2. Find "MySQL80" service
3. Right-click → Start

### "Unknown error"
**Problem**: Various issues

**Solution**:
1. Check MySQL is running
2. Verify credentials in `.env`
3. Check firewall settings
4. Review MySQL error logs

## 📋 Next Steps After Database Creation

Once the database is created:

1. ✅ Mark Task 1.3 as complete

2. **Install Dependencies** (if not done):
   ```cmd
   cd backend
   npm install
   ```

3. **Run Migrations** (Task 2.8):
   ```cmd
   npm run migrate
   ```
   This creates all the tables (projects, services, inquiries, etc.)

4. **Seed Initial Data** (Task 3.6, 6.5):
   ```cmd
   npm run seed
   ```
   This creates the default admin user and company info

5. **Start the Server**:
   ```cmd
   npm run dev
   ```

6. **Test the API**:
   Open browser: `http://localhost:5000/health`

## 📊 Database Configuration Summary

**Database Name**: `db_construction`
**Character Set**: `utf8mb4`
**Collation**: `utf8mb4_unicode_ci`
**Host**: `localhost`
**Port**: `3306`
**User**: `root` (or as configured in .env)

**Connection Pool Settings**:
- Max connections: 5
- Min connections: 0
- Acquire timeout: 30 seconds
- Idle timeout: 10 seconds

**Retry Logic**:
- Max retries: 5
- Delay between retries: 3 seconds

## 🎉 Success Criteria

Task 1.3 is complete when:
- ✅ Database `db_construction` exists in MySQL
- ✅ Database uses utf8mb4 character set
- ✅ Database uses utf8mb4_unicode_ci collation
- ✅ Backend can connect to the database (test with `node create-database.js`)

## 📚 Additional Resources

- `MYSQL_SETUP.md` - Detailed MySQL setup guide
- `DATABASE_CREATION_GUIDE.md` - Comprehensive creation guide
- `QUICK_START.md` - Quick start guide
- `README.md` - Full project documentation

## 🆘 Need Help?

If you're stuck:
1. Check the troubleshooting section above
2. Review the MySQL error logs
3. Verify all prerequisites are met
4. Check the additional documentation files

---

**Estimated Time**: 2-5 minutes depending on method chosen

**Recommended Method**: MySQL Workbench (Method 1) - Most reliable and visual
