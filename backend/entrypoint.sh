#!/bin/bash
set -e

# Print every command before executing it so we can trace exactly where things fail
set -x

echo "🔄 Applying database migrations..."
npx prisma migrate deploy

echo "✅ Migrations complete."

# Verify the compiled entry point exists before attempting to run it
if [ ! -f "dist/main.js" ]; then
  echo "❌ ERROR: dist/main.js not found. The TypeScript build may have failed or the file was not copied into the image." >&2
  echo "Contents of /app:" >&2
  ls -la /app >&2
  echo "Contents of /app/dist (if it exists):" >&2
  ls -la /app/dist 2>&1 >&2 || echo "  /app/dist directory does not exist" >&2
  exit 1
fi

echo "🚀 Starting Deka backend..."
node dist/main.js
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo "❌ ERROR: node dist/main.js exited with code $EXIT_CODE" >&2
  exit $EXIT_CODE
fi
