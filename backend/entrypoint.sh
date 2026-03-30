#!/bin/bash
set -e

echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy

echo "🚀 Starting Deka backend..."
node dist/main.js
