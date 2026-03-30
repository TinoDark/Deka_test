#!/bin/bash
set -e

echo "🔄 Applying database migrations..."
npx prisma migrate deploy

echo "🚀 Starting Deka backend..."
node dist/main.js
