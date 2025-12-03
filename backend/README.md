# DB GENERAL CONSTRUCTION - Backend API

Backend API for DB GENERAL CONSTRUCTION Progressive Web Application with admin dashboard.

## Technology Stack

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MySQL 8.0** - Relational database
- **Sequelize** - ORM for MySQL
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Multer** - File uploads

## Prerequisites

- Node.js (v16 or higher)
- MySQL 8.0 (MySQL Workbench recommended)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create MySQL database:
```sql
CREATE DATABASE db_construction;
```

3. Configure environment variables:
- Copy `.env.example` to `.env`
- Update database credentials in `.env`

4. Run migrations:
```bash
npm run migrate
```

5. Seed initial data:
```bash
npm run seed
```

## Default Admin Credentials

- **Username**: Dale Melaku
- **Password**: password@123

⚠️ **Important**: Change the default password in production!

## Running the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout
- `GET /api/auth/verify` - Verify JWT token

### Projects (Public)
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get single project

### Projects (Admin - Protected)
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Services
- `GET /api/services` - Get all services (public)
- `POST /api/services` - Create service (admin)
- `PUT /api/services/:id` - Update service (admin)
- `DELETE /api/services/:id` - Delete service (admin)

### Company Info
- `GET /api/company` - Get company info (public)
- `PUT /api/company` - Update company info (admin)

### Inquiries
- `POST /api/inquiries` - Submit inquiry (public)
- `GET /api/inquiries` - Get all inquiries (admin)
- `PUT /api/inquiries/:id/status` - Update inquiry status (admin)
- `DELETE /api/inquiries/:id` - Delete inquiry (admin)

### Media
- `GET /api/media` - Get all images (admin)
- `POST /api/media/upload` - Upload image (admin)
- `DELETE /api/media/:id` - Delete image (admin)

## Database Migrations

Create new migration:
```bash
npx sequelize-cli migration:generate --name migration-name
```

Run migrations:
```bash
npm run migrate
```

Undo last migration:
```bash
npm run migrate:undo
```

## Database Seeders

Create new seeder:
```bash
npx sequelize-cli seed:generate --name seeder-name
```

Run seeders:
```bash
npm run seed
```

Undo seeders:
```bash
npm run seed:undo
```

## Testing

Run tests:
```bash
npm test
```

## Project Structure

```
backend/
├── config/           # Configuration files
├── controllers/      # Request handlers
├── middleware/       # Custom middleware
├── models/          # Sequelize models
├── routes/          # API routes
├── migrations/      # Database migrations
├── seeders/         # Database seeders
├── uploads/         # Uploaded files
├── .env             # Environment variables
├── server.js        # Entry point
└── package.json     # Dependencies
```

## License

MIT
