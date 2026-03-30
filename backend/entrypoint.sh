#!/bin/bash
set -e

echo "🔄 Syncing Prisma schema to database..."
npx prisma db push --skip-generate

echo "🚀 Starting Deka backend..."
node dist/main.js
