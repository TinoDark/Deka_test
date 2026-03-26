#!/bin/bash
# DEKA Platform - Quick Deploy Script
# This script sets up everything for local testing or deployment

set -e

echo "🚀 DEKA Platform - Setup Script"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print success
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print error
error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Function to print warning
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check Node.js
if ! command -v node &> /dev/null; then
    error "Node.js is not installed. Please install Node.js 18+"
fi
success "Node.js found: $(node --version)"

if ! command -v npm &> /dev/null; then
    error "npm is not installed"
fi
success "npm found: $(npm --version)"

echo ""
echo "📦 Installing Backend Dependencies..."
cd backend
if npm install; then
    success "Backend dependencies installed"
else
    error "Failed to install backend dependencies"
fi

echo ""
echo "📦 Installing Frontend Dependencies..."
cd ../frontend-web
if npm install; then
    success "Frontend dependencies installed"
else
    error "Failed to install frontend dependencies"
fi

echo ""
echo "🔧 Setting up Environment Variables..."

# Backend .env
cd ../backend
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        success "Created backend/.env from example"
        warning "⚠️  Please update backend/.env with your credentials"
    else
        warning "No .env.example found in backend/"
    fi
else
    success "backend/.env already exists"
fi

# Frontend .env.local
cd ../frontend-web
if [ ! -f .env.local ]; then
    echo "NEXT_PUBLIC_API_URL=http://localhost:3000" > .env.local
    success "Created frontend-web/.env.local"
else
    success "frontend-web/.env.local already exists"
fi

echo ""
echo "================================"
echo "✨ Setup Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo ""
echo "1️⃣  Backend Setup:"
echo "   cd backend"
echo "   # Edit .env with your database credentials"
echo "   npm run start:dev"
echo ""
echo "2️⃣  Frontend Setup (in another terminal):"
echo "   cd frontend-web"
echo "   npm run dev"
echo ""
echo "3️⃣  Visit: http://localhost:3000"
echo ""
echo "4️⃣  Login:"
echo "   - Click 'Sign Up'"
echo "   - Choose 'Reseller' or 'Supplier'"
echo "   - Create account"
echo ""
echo "================================"
