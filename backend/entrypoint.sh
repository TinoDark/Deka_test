#!/bin/bash
set -e

# Print every command before executing it so we can trace exactly where things fail
set -x

echo "================================"
echo "🔧 Deka Backend Startup"
echo "================================"

# Configure DATABASE_URL for Railway SSL
# Railway provides DB via proxy with self-signed certs, so we need sslmode=require
if [ -n "$DATABASE_URL" ]; then
  # Check if DATABASE_URL already has SSL parameters
  if [[ ! "$DATABASE_URL" =~ "sslmode" ]]; then
    # Add sslmode=require and sslaccept=strict for Railway
    export DATABASE_URL="${DATABASE_URL}?sslmode=require"
    echo "✅ Added SSL parameters to DATABASE_URL"
  fi
  echo "DATABASE_URL configured (first 50 chars): ${DATABASE_URL:0:50}..."
else
  echo "⚠️  WARNING: DATABASE_URL is not set!"
fi

echo ""
echo "🔄 Applying database migrations..."
npx prisma migrate deploy --skip-generate 2>&1 || {
  MIGRATE_EXIT=$?
  echo "❌ Migrations failed with exit code $MIGRATE_EXIT" >&2
  exit $MIGRATE_EXIT
}

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
echo "Node: $(node --version)"
echo "dist/main.js exists: $(test -f dist/main.js && echo 'YES' || echo 'NO')"
echo ""
echo "------- NODE OUTPUT STARTS -------"

# Run Node and capture ALL output (both stdout and stderr)
node dist/main.js 2>&1
EXIT_CODE=$?
echo "------- NODE OUTPUT ENDS -------"
echo ""

if [ $EXIT_CODE -ne 0 ]; then
  echo "❌ ERROR: node dist/main.js exited with code $EXIT_CODE" >&2
  exit $EXIT_CODE
fi
