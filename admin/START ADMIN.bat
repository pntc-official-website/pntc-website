@echo off
title PNTC Admin Console
color 0B
echo.
echo  ========================================
echo    PNTC Admin Console - Starting Up...
echo  ========================================
echo.

cd /d "%~dp0"

:: Install dependencies if not present
if not exist "node_modules" (
  echo  Installing required packages... please wait.
  echo.
  npm install
  echo.
)

echo  Starting admin server...
echo.
echo  ==============================================
echo    Open your browser and go to:
echo    http://localhost:3000
echo  ==============================================
echo.
echo  Keep this window open while using the admin.
echo  Press Ctrl+C to stop.
echo.

node server.js

pause
