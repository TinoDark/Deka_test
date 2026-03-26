@echo off
REM DEKA Platform - Quick Deploy Script for Windows
REM This script sets up everything for local testing or deployment

echo.
echo ========================================
echo      DEKA Platform - Setup Script
echo ========================================
echo.

REM Check Node.js
echo Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+
    pause
    exit /b 1
)
for /f "tokens=1" %%a in ('node --version') do (
    echo [OK] Node.js found: %%a
)

echo.
REM Check npm
echo Checking npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed
    pause
    exit /b 1
)
for /f "tokens=1" %%a in ('npm --version') do (
    echo [OK] npm found: %%a
)

echo.
echo Installing Backend Dependencies...
pushd backend
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install backend dependencies
    popd
    pause
    exit /b 1
)
echo [OK] Backend dependencies installed
popd

echo.
echo Installing Frontend Dependencies...
pushd frontend-web
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install frontend dependencies
    popd
    pause
    exit /b 1
)
echo [OK] Frontend dependencies installed
popd

echo.
echo Setting up Environment Variables...

REM Backend .env
pushd backend
if not exist .env (
    if exist .env.example (
        copy .env.example .env
        echo [OK] Created backend\.env from example
        echo [WARNING] Please update backend\.env with your credentials
    ) else (
        echo [WARNING] No .env.example found in backend\
    )
) else (
    echo [OK] backend\.env already exists
)
popd

REM Frontend .env.local
pushd frontend-web
if not exist .env.local (
    (
        echo NEXT_PUBLIC_API_URL=http://localhost:3000
    ) > .env.local
    echo [OK] Created frontend-web\.env.local
) else (
    echo [OK] frontend-web\.env.local already exists
)
popd

echo.
echo ========================================
echo          Setup Complete!
echo ========================================
echo.
echo Next steps:
echo.
echo 1. Backend Setup:
echo    cd backend
echo    # Edit .env with your database credentials
echo    npm run start:dev
echo.
echo 2. Frontend Setup (in another terminal):
echo    cd frontend-web
echo    npm run dev
echo.
echo 3. Visit: http://localhost:3000
echo.
echo 4. Login:
echo    - Click 'Sign Up'
echo    - Choose 'Reseller' or 'Supplier'
echo    - Create account
echo.
echo ========================================
echo.
pause
