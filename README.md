## 🎯 Project Overview

MovieTracker is a comprehensive movie management application developed with a focus on **modularity**, **scalability**, and **maintainability**. The application provides distinct user experiences based on authentication status and user roles:

- **Public Users**: Can browse movies and search by title, genre, or cast/crew
- **Authenticated Users**: Access personalized features including rating movies, tracking watched movies, and receiving AI-powered recommendations
- **Administrators**: Full control over user management, movie catalog management, and bulk import capabilities from external APIs

The application leverages modern web technologies, follows RESTful API design principles, and includes comprehensive test coverage to ensure reliability and maintainability.

---

## 🛠 Technology Stack

### Backend Packages & Plugins

express: Web application framework for Node.js
typescript: Static type checking and enhanced developer experience
dotenv: Environment variable management
cors: Cross-Origin Resource Sharing middleware
helmet: Security middleware for HTTP headers
cookie-parser: Parse Cookie header and populate req.cookies
jsonwebtoken: JWT token generation and verification
bcryptjs: Password hashing and verification
express-validator: Input validation and sanitization
prisma: Database toolkit and migration system 
@prisma/client: Auto-generated type-safe query builder
moviedb-promise: TMDB (The Movie Database) API client
winston: Flexible logging library
express-winston: Express middleware for Winston
swagger-jsdoc: Generate OpenAPI specification from JSDoc comments
swagger-ui-express: Serve auto-generated API documentation UI

#### Development Dependencies
ts-node-dev: Fast TypeScript execution with auto-reload
jest: JavaScript testing framework
ts-jest: TypeScript preprocessor for Jest
supertest: HTTP assertion library for API testing
@types/*: TypeScript type definitions


### Frontend Packages & Plugins
react: library for building component-based interfaces |
react-dom: React rendering for web browsers |
react-router-dom: Client-side routing and navigation |
typescript: Static type checking |
vite: Fast build tool and development server |
react-bootstrap: Bootstrap components built for React |
bootstrap: CSS framework for responsive design |
react-icons: Icon library with multiple icon sets |
axios: Promise-based HTTP client with interceptors |
jwt-decode: Decode JWT tokens for client-side validation |
vitest: Vite-native unit testing framework |
@vitest/ui: UI for Vitest test runner |
@testing-library/react: React component testing utilities |
@testing-library/jest-dom: Custom Jest matchers for DOM assertions |
@testing-library/user-event: Simulate user interactions |
jsdom: JavaScript implementation of web standards |
eslint: Linting and code quality enforcement |
@vitejs/plugin-react: Vite plugin for React support |

---

## ✨ Features

### For All Users (Public)
- Browse movie catalog
- Search movies by title, genre, or cast/director/producer
- View movie details including plot, cast, crew, and external ratings (IMDb, Rotten Tomatoes)
- Responsive design for mobile, tablet, and desktop

### For Authenticated Users
- ⭐ **Rate Movies**: Rate movies on a scale of 1-10 (limited to one rating per movie)
- 📝 **Personal Collection**: Track watched movies with watch dates
- 🤖 **AI-Powered Recommendations**: Receive personalized movie recommendations based on viewing history and genre preferences
- 🔐 **Secure Authentication**: JWT-based authentication with token expiration
- 👤 **Profile Management**: View and manage your movie ratings

### For Administrators
- 👥 **User Management**: View, block, unblock, and delete users
- 🎬 **Movie Management**: Create, update, and delete movies
- 📥 **Bulk Import**: Import movies from TMDB (The Movie Database)
- 🔍 **Advanced Search**: Discover and import movies from TMDB with advanced filters
- 🎭 **People Management**: Add and manage actors, directors, and producers
- 🏷️ **Genre Management**: Create and manage movie genres
- 📊 **Admin Dashboard**: Centralized control panel for all administrative functions

---

## ⚙️ Environment Setup

### Prerequisites

Before starting, ensure you have the following installed:
- **Node.js**: v18.x or higher ([Download](https://nodejs.org/))
- **npm**: v9.x or higher (comes with Node.js)
- **PostgreSQL**: v14.x or higher ([Download](https://www.postgresql.org/download/))
- **Git**: For cloning the repository

### Installation Steps

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd MovieTracker
```

#### 2. Backend Setup

```bash
cd backend
npm install
```

#### 3. Configure Environment Variables

Edit `backend/.env` with your configuration:

```env
# Database Connection (PostgreSQL)
DATABASE_URL="postgresql://username:password@localhost:5432/movietracker"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Server Configuration
PORT=5000
NODE_ENV="development"

# Default Admin Credentials (created on first run)
ADMIN_EMAIL="admin@movietracker.com"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="Admin@123"

# TMDB API Configuration (Get free API key from https://www.themoviedb.org/settings/api)
TMDB_API_KEY="your-tmdb-api-key"
TMDB_ACCESS_TOKEN="your-tmdb-access-token"

# Logging Configuration
LOG_LEVEL="info"
LOG_FILE_PATH="logs/app.log"
LOG_ERROR_FILE_PATH="logs/error.log"
LOG_ENABLE_FILE="true"
LOG_ENABLE_CONSOLE="true"
```

#### 4. Database Migration

Run Prisma migrations to set up the database schema:

```bash
npx prisma generate
npx prisma migrate dev --name init

# (Optional) Seed database with sample data
npm run seed
```

#### 5. Frontend Setup

```bash
cd ../frontend
npm install

# Create environment file (if needed)
echo "VITE_API_URL=http://localhost:5000/api" > .env
```

#### 6. Quick Setup (Alternative)

You can also use the automated setup script:

```bash
# From the project root directory
chmod +x setup.sh
./setup.sh
```

This script will:
- Install backend dependencies
- Run database migrations
- Generate Prisma client
- Install frontend dependencies

---

## 🚀 Running the Application

### Option 1: Start Both Applications Together (Recommended)

```bash
# From the project root directory
chmod +x start.sh
./start.sh
```

This will start:
- **Backend API**: http://localhost:5000
- **Frontend**: http://localhost:5001
- **API Documentation**: http://localhost:5000/api-docs

Press `Ctrl+C` to stop both applications.

### Option 2: Start Applications Separately

#### Start Backend Server

```bash
# From backend directory
cd backend

# Development mode (with auto-reload)
npm run dev

# Production mode
npm run build
npm start
```

The backend API will be available at `http://localhost:5000`

#### Start Frontend Application

```bash
# From frontend directory
cd frontend

# Development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The frontend will be available at `http://localhost:5001` (or the port shown in terminal)

---

## 🧪 Running Tests

### Backend Tests

```bash
# From backend directory
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test -- --coverage
```

**Backend Test Coverage:**
- `auth.test.ts` (340 lines) - Authentication endpoints and validation
- `authService.test.ts` (334 lines) - Authentication service logic
- `database.test.ts` (744 lines) - Database integrity and query tests
- `middleware.test.ts` (452 lines) - Authentication and validation middleware
- `movies.test.ts` (345 lines) - Movie endpoints and operations
- `recommendationService.test.ts` (464 lines) - AI recommendation algorithm
- `validation.test.ts` (457 lines) - Input validation edge cases

**Total Backend Test Lines:** 3,136 lines

### Frontend Tests

```bash
# From frontend directory
cd frontend

# Run all tests
npm test

# Run tests in watch mode (interactive)
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

**Frontend Test Coverage:**
- `Login.test.tsx` (142 lines) - Login component and validation
- `Register.test.tsx` (202 lines) - Registration component and validation
- `Home.test.tsx` (361 lines) - Home page with search and recommendations
- `MyMovies.test.tsx` (242 lines) - User's watched movies page
- `AdminDashboard.test.tsx` (384 lines) - Admin panel functionality
- `MovieDetailsModal.test.tsx` (370 lines) - Movie details display
- `ProtectedRoute.test.tsx` (174 lines) - Route protection logic
- `AdminRoute.test.tsx` (215 lines) - Admin-only route protection
- `ErrorBoundary.test.tsx` (149 lines) - Error handling component

**Total Frontend Test Lines:** 2,239 lines

**Combined Test Coverage:** 5,375+ lines of test code

---

## 🗄️ Database Migration

### Understanding Prisma Migrations

Prisma uses a declarative migration system. The schema is defined in `backend/prisma/schema.prisma`, and Prisma generates SQL migrations automatically.

### Migration Commands

#### Create a New Migration

When you modify `schema.prisma`:

```bash
cd backend
npx prisma migrate dev --name description_of_changes
```

Example:
```bash
npx prisma migrate dev --name add_user_preferences
```

#### Apply Migrations to Production

```bash
npx prisma migrate deploy
```

#### Reset Database (⚠️ WARNING: Deletes all data)

```bash
npx prisma migrate reset
```

#### View Migration Status

```bash
npx prisma migrate status
```

#### Generate Prisma Client After Schema Changes

```bash
npx prisma generate
```

### Database Schema Overview

The application uses 9 main database models:

1. **User** - User accounts with role-based access (USER, ADMIN)
2. **Movie** - Movie catalog with metadata
3. **Genre** - Movie genres (Action, Drama, etc.)
4. **Person** - Actors, directors, and producers
5. **MovieGenre** - Many-to-many relationship between movies and genres
6. **MovieCredit** - Cast and crew assignments to movies
7. **ExternalRating** - Ratings from IMDb and Rotten Tomatoes
8. **UserRating** - User's personal movie ratings (one per movie)
9. **WatchStatus** - Tracks which movies users have watched

### Viewing the Database

```bash
# Open Prisma Studio (Database GUI)
cd backend
npx prisma studio
```

This opens a web interface at `http://localhost:5555` where you can view and edit database records.

---

## 📚 API Documentation

### Accessing Swagger Documentation

Once the backend is running, access interactive API documentation at:

```
http://localhost:5000/api-docs
```

### Swagger Features

- **Interactive Testing**: Try API endpoints directly from the browser
- **Request/Response Schemas**: View expected data formats
- **Authentication**: Test protected endpoints with bearer tokens
- **Model Definitions**: See database model structures
- **Error Responses**: Understand possible error codes

### Key API Endpoints

#### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Authenticate user
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout user

#### Movies
- `GET /api/movies` - List movies (with search/filter)
- `GET /api/movies/:id` - Get movie details
- `GET /api/movies/recommendations` - Get AI recommendations (auth required)
- `POST /api/movies` - Create movie (admin only)
- `PUT /api/movies/:id` - Update movie (admin only)
- `DELETE /api/movies/:id` - Delete movie (admin only)

#### Ratings
- `POST /api/ratings` - Rate a movie (auth required)
- `GET /api/ratings/my` - Get user's ratings (auth required)
- `PUT /api/ratings/:id` - Update rating (auth required)
- `DELETE /api/ratings/:id` - Delete rating (auth required)

#### Admin
- `GET /api/users` - List all users (admin only)
- `PATCH /api/users/:id/block` - Block user (admin only)
- `PATCH /api/users/:id/unblock` - Unblock user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

#### TMDB Integration
- `GET /api/tmdb/search` - Search TMDB for movies (admin only)
- `GET /api/tmdb/popular` - Get popular movies from TMDB (admin only)
- `POST /api/tmdb/import` - Import movie from TMDB (admin only)

---

## 📁 Project Structure
```
MovieTracker/
├── backend/                      # Backend API application
│   ├── prisma/                   # Prisma ORM configuration
│   │   ├── migrations/           # Database migration files
│   │   └── schema.prisma         # Database schema definition
│   ├── src/                      # Source code
│   │   ├── config/               # Configuration files
│   │   │   ├── logger.ts         # Winston logger setup
│   │   │   └── swagger.ts        # Swagger/OpenAPI configuration
│   │   ├── controllers/          # Route controllers
│   │   │   ├── authController.ts
│   │   │   ├── movieController.ts
│   │   │   ├── ratingController.ts
│   │   │   ├── userController.ts
│   │   │   └── ...
│   │   ├── middlewares/          # Express middlewares
│   │   │   ├── auth.ts           # JWT authentication
│   │   │   ├── checkBlocked.ts   # Check if user is blocked
│   │   │   ├── errorHandler.ts   # Global error handling
│   │   │   └── validator.ts      # Input validation
│   │   ├── routes/               # API routes
│   │   │   ├── authRoutes.ts
│   │   │   ├── movieRoutes.ts
│   │   │   ├── ratingRoutes.ts
│   │   │   └── ...
│   │   ├── services/             # Business logic
│   │   │   ├── authService.ts
│   │   │   ├── recommendationService.ts
│   │   │   ├── tmdbService.ts
│   │   │   └── seedService.ts
│   │   ├── utils/                # Utility functions
│   │   │   └── jwt.ts            # JWT helpers
│   │   ├── app.ts                # Express app setup
│   │   └── server.ts             # Server entry point
│   ├── tests/                    # Backend tests (3,136 lines)
│   │   ├── auth.test.ts
│   │   ├── authService.test.ts
│   │   ├── database.test.ts
│   │   ├── middleware.test.ts
│   │   ├── movies.test.ts
│   │   ├── recommendationService.test.ts
│   │   └── validation.test.ts
│   ├── logs/                     # Application logs (generated)
│   ├── .env                      # Environment variables
│   ├── package.json              # Dependencies
│   ├── tsconfig.json             # TypeScript configuration
│   └── jest.config.js            # Jest test configuration
│
├── frontend/                     # Frontend React application
│   ├── public/                   # Static assets
│   ├── src/                      # Source code
│   │   ├── components/           # Reusable components
│   │   │   ├── AdminRoute.tsx    # Admin route protection
│   │   │   ├── ProtectedRoute.tsx # Auth route protection
│   │   │   ├── Navigation.tsx    # Navigation bar
│   │   │   ├── Footer.tsx        # Footer component
│   │   │   ├── MovieCard.tsx     # Movie card display
│   │   │   ├── MovieDetailsModal.tsx # Movie details popup
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── MessageModal.tsx
│   │   │   ├── ConfirmModal.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── pages/                # Page components
│   │   │   ├── Login.tsx         # Login page
│   │   │   ├── Register.tsx      # Registration page
│   │   │   ├── Home.tsx          # Home/browse page
│   │   │   ├── MyMovies.tsx      # User's watched movies
│   │   │   └── AdminDashboard.tsx # Admin panel
│   │   ├── services/             # API and services
│   │   │   ├── api.ts            # Axios API client
│   │   │   └── AuthContext.tsx   # Authentication context
│   │   ├── hooks/                # Custom React hooks
│   │   │   └── index.ts          # Exported hooks
│   │   ├── types/                # TypeScript types
│   │   │   └── index.ts          # Type definitions
│   │   ├── App.tsx               # Root component
│   │   ├── main.tsx              # Application entry point
│   │   └── index.css             # Global styles
│   ├── tests/                    # Frontend tests (2,239 lines)
│   │   ├── Login.test.tsx
│   │   ├── Register.test.tsx
│   │   ├── Home.test.tsx
│   │   ├── MyMovies.test.tsx
│   │   ├── AdminDashboard.test.tsx
│   │   ├── MovieDetailsModal.test.tsx
│   │   ├── ProtectedRoute.test.tsx
│   │   ├── AdminRoute.test.tsx
│   │   └── ErrorBoundary.test.tsx
│   ├── .env                      # Environment variables
│   ├── package.json              # Dependencies
│   ├── tsconfig.json             # TypeScript configuration
│   ├── vite.config.ts            # Vite configuration
│   └── vitest.config.ts          # Vitest test configuration
│
├── setup.sh                      # Automated setup script
├── start.sh                      # Start both applications
└── README.md                     # This file
```

---

## 👥 Default Admin Account

After running the database migrations, a default admin account is created:

- **Email**: `admin@movietracker.com`
- **Password**: `Admin@123`
- **Role**: ADMIN

**⚠️ Important**: Change these credentials in production environments!

---

## 🎉 Acknowledgments

- **TMDB (The Movie Database)** for providing comprehensive movie data API
- **Prisma** for the excellent ORM and developer experience
- **React** and **Bootstrap** communities for robust frontend tools
- All open-source contributors whose packages made this project possible

---

**Built with ❤️ using modern web technologies**

**Last Updated:** October 2025
