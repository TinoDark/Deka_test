#!/bin/bash
# Setup script for Deka Platform

set -e

echo "🚀 Starting Deka Platform Setup..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker prerequisites OK"

# Copy environment file
if [ ! -f .env ]; then
    echo "📋 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env created (review and update with your settings)"
fi

# Start services
echo "🐳 Starting Docker services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Initialize database
echo "🗄️  Initializing database..."
docker-compose exec -T backend npx prisma migrate deploy || true
docker-compose exec -T backend npx prisma generate

# Seed database
echo "🌱 Seeding database..."
docker-compose exec -T backend npx prisma db seed || true

echo ""
echo "================================================"
echo "✨ Deka Platform is ready!"
echo "================================================"
echo ""
echo "🌐 Access points:"
echo "  • Backend API: http://localhost:3000"
echo "  • Client Shop: http://localhost:3001"
echo "  • Reseller Dashboard: http://localhost:3002"
echo "  • Supplier Dashboard: http://localhost:3003"
echo "  • Admin Panel: http://localhost:3004"
echo "  • Redis: localhost:6379"
echo "  • PostgreSQL: localhost:5432"
echo "  • MinIO: http://localhost:9001"
echo ""
echo "📚 Documentation:"
echo "  • Architecture: CLAUDE.md"
echo "  • README: README.md"
echo "  • Quick Start: QUICKSTART.md"
echo "  • API Docs: backend/README.md"
echo ""
echo "🔑 Test credentials:"
echo "  • Admin: admin@deka.com / admin123"
echo "  • Supplier: supplier1@deka.com / supplier123"
echo "  • Reseller: reseller1@deka.com / reseller123"
echo ""
echo "💡 Next steps:"
echo "  1. Review .env for sensitive settings"
echo "  2. Check docker-compose logs: docker-compose logs -f"
echo "  3. Start developing!"
echo ""
