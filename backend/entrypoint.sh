#!/bin/bash
set -e

echo "================================"
echo "🔧 Deka Backend Startup"
echo "================================"

# Debug: Verify environment
echo "📍 Working directory: $(pwd)"
echo "📍 Node version: $(node --version)"
echo "📍 npm version: $(npm --version)"

# Debug: List directory contents
echo ""
echo "📂 Directory structure:"
ls -la dist/ 2>/dev/null || echo "⚠️  dist/ directory not found!"
echo "📂 Source files:"
ls -la src/main.ts 2>/dev/null || echo "⚠️  src/main.ts not found!"

# Check if .env exists
echo ""
if [ -f .env ]; then
  echo "✅ .env file found"
else
  echo "⚠️  .env file not found"
fi

# Apply migrations
echo ""
echo "🔄 Applying database migrations..."
if ! npx prisma migrate deploy; then
  echo "❌ Migration failed!"
  exit 1
fi

echo ""
echo "🚀 Starting Deka backend..."
echo "================================"

# Start with better error handling
if [ ! -f "dist/main.js" ]; then
  echo "❌ ERROR: dist/main.js not found!"
  echo "📂 Contents of dist/:"
  ls -la dist/ 2>/dev/null || echo "dist/ doesn't exist"
  exit 1
fi

# Run with output
exec node dist/main.js
