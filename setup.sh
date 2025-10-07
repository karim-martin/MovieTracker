#!/bin/bash

# MovieTracker Setup Script
# This script installs dependencies and sets up the database

echo "Setting up MovieTracker..."

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install

# Run Prisma migrations
echo "Setting up database..."
npx prisma migrate dev --name init

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install

cd ..

echo ""
echo "Setup complete!"
echo ""
echo "You can now run ./start.sh to start the applications"
