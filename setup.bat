@echo off
REM Setup script for Deka Platform (Windows)

echo 🚀 Starting Deka Platform Setup...

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    exit /b 1
)

echo ✅ Docker is installed

REM Copy environment file
if not exist .env (
    echo 📋 Creating .env file from template...
    copy .env.example .env
    echo ✅ .env created (review and update with your settings)
)

REM Start services
echo 🐳 Starting Docker services...
docker-compose up -d

REM Wait for services
echo ⏳ Waiting for services to be healthy...
timeout /t 10

REM Initialize database
echo 🗄️  Initializing database...
docker-compose exec -T backend npx prisma migrate deploy 2>nul || echo (First run, skipping)
docker-compose exec -T backend npx prisma generate

REM Seed database
echo 🌱 Seeding database...
docker-compose exec -T backend npx prisma db seed 2>nul || echo (Already seeded)

echo.
echo ================================================
echo ✨ Deka Platform is ready!
echo ================================================
echo.
echo 🌐 Access points:
echo   • Backend API: http://localhost:3000
echo   • Client Shop: http://localhost:3001
echo   • Reseller Dashboard: http://localhost:3002
echo   • Supplier Dashboard: http://localhost:3003
echo   • Admin Panel: http://localhost:3004
echo.
echo 🔑 Test credentials:
echo   • Admin: admin@deka.com / admin123
echo   • Supplier: supplier1@deka.com / supplier123
echo   • Reseller: reseller1@deka.com / reseller123
echo.
pause
