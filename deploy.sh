#!/bin/bash

# MovieTracker Vercel Deployment Script
# Tests, builds, and deploys both frontend and backend to Vercel

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SKIP_TESTS=${SKIP_TESTS:-false}
SKIP_DEPLOY=${SKIP_DEPLOY:-false}
PRODUCTION=${PRODUCTION:-false}

# Print with color
print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_info() { echo -e "${YELLOW}ℹ${NC} $1"; }
print_step() { echo -e "${BLUE}==>${NC} $1"; }

echo "================================================"
echo "  MovieTracker Vercel Deployment"
echo "================================================"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_error "Vercel CLI is not installed!"
    print_info "Install it with: npm install -g vercel"
    exit 1
fi

print_success "Vercel CLI found"

# ==========================================
# BACKEND - TEST & BUILD
# ==========================================
echo ""
print_step "BACKEND: Testing & Building"
echo ""

cd backend

# Install dependencies
print_info "Installing backend dependencies..."
npm ci --quiet

# Generate Prisma client
print_info "Generating Prisma client..."
npx prisma generate > /dev/null 2>&1

# Run tests
if [ "$SKIP_TESTS" != "true" ]; then
    print_info "Running backend tests..."
    if ! npm test -- --passWithNoTests --silent 2>&1 | tail -n 20; then
        print_error "Backend tests failed!"
        exit 1
    fi
    print_success "Backend tests passed"
else
    print_info "Skipping backend tests (SKIP_TESTS=true)"
fi

# Build backend
print_info "Building backend..."
if ! npm run build > /dev/null 2>&1; then
    print_error "Backend build failed!"
    exit 1
fi
print_success "Backend build complete"

# Verify build output
if [ ! -d "dist" ]; then
    print_error "Backend dist/ directory not found after build!"
    exit 1
fi

cd ..

# ==========================================
# FRONTEND - TEST & BUILD
# ==========================================
echo ""
print_step "FRONTEND: Testing & Building"
echo ""

cd frontend

# Get current API URL (if .env exists)
CURRENT_API_URL=$(grep VITE_API_URL .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
print_info "Current VITE_API_URL: $CURRENT_API_URL"

# Install dependencies
print_info "Installing frontend dependencies..."
npm ci --quiet

# Run tests
if [ "$SKIP_TESTS" != "true" ]; then
    print_info "Running frontend tests..."
    if ! npm test -- --run --silent 2>&1 | tail -n 20; then
        print_error "Frontend tests failed!"
        exit 1
    fi
    print_success "Frontend tests passed"
else
    print_info "Skipping frontend tests (SKIP_TESTS=true)"
fi

# Build frontend
print_info "Building frontend..."
if ! npm run build 2>&1 | tail -n 10; then
    print_error "Frontend build failed!"
    exit 1
fi
print_success "Frontend build complete"

# Verify build output
if [ ! -d "dist" ]; then
    print_error "Frontend dist/ directory not found after build!"
    exit 1
fi

cd ..

# ==========================================
# LOCAL BUILD SUCCESS
# ==========================================
echo ""
echo "================================================"
print_success "Local tests and builds completed successfully!"
echo "================================================"
echo ""

# Exit if skip deploy
if [ "$SKIP_DEPLOY" = "true" ]; then
    print_info "Skipping deployment (SKIP_DEPLOY=true)"
    print_info "Both frontend and backend are built and ready in their dist/ folders"
    exit 0
fi

# ==========================================
# VERCEL DEPLOYMENT
# ==========================================
echo ""
print_step "DEPLOYING TO VERCEL"
echo ""

# Determine deployment flags
DEPLOY_FLAGS=""
if [ "$PRODUCTION" = "true" ]; then
    DEPLOY_FLAGS="--prod"
    print_info "Deploying to PRODUCTION"
else
    print_info "Deploying to PREVIEW (use PRODUCTION=true for production deployment)"
fi

# Deploy Backend
echo ""
print_info "Deploying backend to Vercel..."
cd backend

BACKEND_URL=$(vercel $DEPLOY_FLAGS --yes 2>&1 | tee /dev/tty | grep -oP 'https://[^\s]+' | tail -1)

if [ -z "$BACKEND_URL" ]; then
    print_error "Failed to get backend deployment URL"
    cd ..
    exit 1
fi

print_success "Backend deployed: $BACKEND_URL"

# Save backend URL for frontend
echo "$BACKEND_URL" > /tmp/backend_url.txt

cd ..

# Deploy Frontend
echo ""
print_info "Deploying frontend to Vercel..."

# Check if we need to update VITE_API_URL
if [ "$CURRENT_API_URL" = "/api" ]; then
    print_info "Updating VITE_API_URL to point to deployed backend..."
    cd frontend

    # Temporarily update .env for deployment
    echo "VITE_API_URL=$BACKEND_URL" > .env.deploy

    # Rebuild with new API URL
    print_info "Rebuilding frontend with production API URL..."
    VITE_API_URL=$BACKEND_URL npm run build > /dev/null 2>&1

    print_success "Frontend rebuilt with backend URL: $BACKEND_URL"
else
    cd frontend
fi

FRONTEND_URL=$(vercel $DEPLOY_FLAGS --yes 2>&1 | tee /dev/tty | grep -oP 'https://[^\s]+' | tail -1)

if [ -z "$FRONTEND_URL" ]; then
    print_error "Failed to get frontend deployment URL"
    cd ..
    exit 1
fi

print_success "Frontend deployed: $FRONTEND_URL"

# Cleanup temporary env file
rm -f .env.deploy

cd ..

# ==========================================
# DEPLOYMENT SUMMARY
# ==========================================
echo ""
echo "================================================"
print_success "Deployment completed successfully!"
echo "================================================"
echo ""
echo "🚀 Deployment URLs:"
echo ""
echo "   Frontend: $FRONTEND_URL"
echo "   Backend:  $BACKEND_URL"
echo ""
print_info "Next steps:"
echo "   1. Configure environment variables in Vercel dashboard:"
echo "      - Backend: DATABASE_URL, JWT_SECRET, TMDB_API_KEY, etc."
echo "      - Frontend: VITE_API_URL (if not using deployed backend)"
echo ""
echo "   2. Set up your database and run migrations:"
echo "      vercel env pull backend/.env.vercel"
echo "      cd backend && npx prisma migrate deploy"
echo ""
echo "   3. Test your deployed application:"
echo "      Frontend: $FRONTEND_URL"
echo ""

if [ "$PRODUCTION" = "true" ]; then
    print_success "🎉 Production deployment complete!"
else
    print_info "This is a preview deployment. Use PRODUCTION=true for production."
fi

echo ""
