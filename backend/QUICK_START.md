# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Create MySQL Database

**Open MySQL Workbench 8.0 CE** and run:
```sql
CREATE DATABASE db_construction
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

Or execute the provided script:
- Open `database-setup.sql` in MySQL Workbench
- Click the lightning bolt (⚡) to execute

### 3. Configure Environment

The `.env` file is already created. Update your MySQL password:
```env
DB_PASSWORD=your_mysql_root_password
```

### 4. Run Migrations

Create all database tables:
```bash
npm run migrate
```

### 5. Seed Initial Data

Create default admin user and company info:
```bash
npm run seed
```

### 6. Start the Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

### 7. Test the API

Open your browser or use curl:
```bash
curl http://localhost:5000/health
```

You should see:
```json
{
  "status": "OK",
  "message": "DB GENERAL CONSTRUCTION API is running"
}
```

## ✅ You're Ready!

**Default Admin Login:**
- Username: `Dale Melaku`
- Password: `password@123`

## Next Steps

Continue with the implementation tasks:
- Task 2: Implement database models
- Task 3: Implement authentication system
- Task 4-8: Implement API endpoints

## Troubleshooting

**Can't connect to MySQL?**
- Check if MySQL is running
- Verify password in `.env`
- Check port (default: 3306)

**Migration errors?**
- Make sure database exists
- Check database credentials
- Run: `npm run migrate:undo` then `npm run migrate` again

**Need help?**
- Check `MYSQL_SETUP.md` for detailed MySQL setup
- Check `README.md` for full documentation
