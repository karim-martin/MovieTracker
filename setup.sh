#!/bin/bash

# Movie Tracker Setup Script
# This script helps you set up the Movie Tracker application

echo "🎬 Movie Tracker - Setup Script"
echo "================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL CLI not found. Make sure PostgreSQL is installed and running."
else
    echo "✅ PostgreSQL is available"
fi

echo ""
echo "Step 1: Installing Backend Dependencies"
echo "========================================="
cd backend
npm install
echo "✅ Backend dependencies installed"
echo ""

echo "Step 2: Setting up Backend Environment"
echo "======================================"
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file"
    echo "⚠️  Please edit backend/.env with your PostgreSQL connection string"
    echo "   Example: DATABASE_URL=\"postgresql://user:password@localhost:5432/movietracker\""
else
    echo "ℹ️  .env file already exists"
fi
echo ""

echo "Step 3: Generating Prisma Client"
echo "================================="
npx prisma generate
echo "✅ Prisma client generated"
echo ""

echo "Step 4: Database Migration"
echo "=========================="
echo "ℹ️  This will create the database tables"
read -p "Do you want to run migrations now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx prisma migrate dev --name initial
    echo "✅ Database migrated"
else
    echo "⚠️  Skipped migrations. Run 'npx prisma migrate dev' later"
fi
echo ""

cd ..

echo "Step 5: Installing Frontend Dependencies"
echo "========================================="
cd frontend
npm install
echo "✅ Frontend dependencies installed"
echo ""

cd ..

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Edit backend/.env with your PostgreSQL connection (if not done already)"
echo "2. Start the backend: cd backend && npm run dev"
echo "3. In a new terminal, start the frontend: cd frontend && npm run dev"
echo "4. Visit http://localhost:3000"
echo "5. Login with admin credentials:"
echo "   Email: admin@movietracker.com"
echo "   Password: Admin@123"
echo ""
echo "📖 For more details, see README.md and QUICKSTART.md"
echo ""
