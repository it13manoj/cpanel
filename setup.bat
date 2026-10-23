@echo off
REM ========================================================
REM cPanel 1-Click Live Server Setup (Windows Server)
REM ========================================================

echo ========================================================
echo 🚀 Initializing cPanel Setup on Live Server...
echo ========================================================

WHERE node >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js (v18+) first.
    pause
    exit /b 1
)

IF NOT EXIST "node_modules" (
    echo 📦 Installing npm dependencies...
    call npm install
)

node setup.js %*
pause

