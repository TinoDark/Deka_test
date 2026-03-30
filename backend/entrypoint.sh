#!/bin/bash
set -e

# Print every command before executing it so we can trace exactly where things fail
set -x

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
exec node dist/main.js
