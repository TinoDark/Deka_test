@echo off
REM 🚀 QUICK START — Deka Sync Excel Module (Windows)
REM Démarrage complet en 5 minutes

setlocal enabledelayedexpansion

echo.
echo ════════════════════════════════════════════════════════
echo 🚀 Deka Sync Excel Module - Quick Start (Windows)
echo ════════════════════════════════════════════════════════
echo.

REM ============================================
REM 1 SETUP BACKEND
REM ============================================

echo 1️⃣  Setup Backend...
echo.
cd backend

echo    📦 Installing dependencies...
call npm install >nul 2>&1
if errorlevel 1 (
    echo    Installing with output...
    call npm install
)

echo    🗄️  Generating Prisma client...
call npm run prisma:generate >nul 2>&1

echo    ⚠️  Note: Run "npm run prisma:migrate" manually to setup database
echo.

REM ============================================
REM 2 ENV CONFIGURATION
REM ============================================

echo 2️⃣  Configuration...
echo.

if not exist ".env" (
    echo    📝 Creating .env from template...
    if exist ".env.example" (
        copy .env.example .env >nul
        echo    ✓ Created .env
        echo    ⚠️  Edit backend\.env with your settings before running
    ) else (
        echo    ⚠️  .env.example not found
    )
) else (
    echo    ✓ .env already exists
)

echo.

REM ============================================
REM 3 FRONTEND SETUP
REM ============================================

echo 3️⃣  Setup Frontend...
echo.
cd ..\frontend-web

echo    📦 Installing dependencies...
call npm install >nul 2>&1
if errorlevel 1 (
    echo    Installing with output...
    call npm install
)

echo.

REM ============================================
REM 4 DISPLAY ENDPOINTS
REM ============================================

echo ════════════════════════════════════════════════════════
echo ✅ Setup Complete!
echo ════════════════════════════════════════════════════════
echo.

echo 📚 Available Endpoints:
echo.
echo    Backend:
echo      REST API:    http://localhost:3000/api
echo      WebSocket:   ws://localhost:3000/notifications
echo.
echo    Frontend:
echo      Supplier:    http://localhost:3001/suppliers/inventory/upload
echo      Admin:       http://localhost:3001/admin/syncs/dashboard
echo.

REM ============================================
REM 5 STARTUP COMMANDS
REM ============================================

echo 🚀 Startup Commands:
echo.
echo    Terminal 1 (Backend):
echo      cd backend
echo      npm run start:dev
echo.
echo    Terminal 2 (Frontend):
echo      cd frontend-web
echo      npm run dev
echo.
echo    Terminal 3 (Prisma Studio - optional):
echo      cd backend
echo      npx prisma studio
echo.

REM ============================================
REM 6 TESTING
REM ============================================

echo ✨ Quick Tests:
echo.
echo    1. Fournisseur:
echo       - Go to http://localhost:3001/suppliers/inventory/upload
echo       - Test Excel upload
echo.
echo    2. Admin:
echo       - Go to http://localhost:3001/admin/syncs/dashboard
echo       - View syncs list
echo.
echo    3. WebSocket:
echo       - Check browser console for WebSocket logs
echo.

echo 📖 Documentation:
echo.
echo    - backend\MIGRATIONS_GUIDE.md      ^(Database setup^)
echo    - backend\WEBSOCKET_GUIDE.md       ^(Real-time notifications^)
echo    - IMPLEMENTATION_SUMMARY.md        ^(Full overview^)
echo.

echo ════════════════════════════════════════════════════════
echo ✅ Ready to code! 🎉
echo ════════════════════════════════════════════════════════
echo.

pause
