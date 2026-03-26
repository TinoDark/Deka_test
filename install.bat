@echo off
cd /d c:\Users\USER\Deka_test\backend
echo Installing npm dependencies...
call npm install
echo.
echo Generating Prisma client...
call npm run prisma:generate
echo.
echo Done!
pause
