-- ============================================
-- DB GENERAL CONSTRUCTION - Database Setup
-- MySQL 8.0 CE
-- ============================================

-- Create database
CREATE DATABASE IF NOT EXISTS db_construction
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- Use the database
USE db_construction;

-- Create database user (optional - for production)
-- CREATE USER IF NOT EXISTS 'db_construction_user'@'localhost' IDENTIFIED BY 'your_secure_password';
-- GRANT ALL PRIVILEGES ON db_construction.* TO 'db_construction_user'@'localhost';
-- FLUSH PRIVILEGES;

-- Show database info
SELECT 
    'Database created successfully!' AS Status,
    DATABASE() AS CurrentDatabase,
    @@character_set_database AS CharacterSet,
    @@collation_database AS Collation;

-- Note: Tables will be created automatically by Sequelize migrations
-- Run: npm run migrate
