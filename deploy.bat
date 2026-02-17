@echo off
REM LifeLine-X Hospital Management System - Deployment Script for Windows
REM This script helps you deploy to Render with proper configuration

echo ================================================================================
echo                    LifeLine-X Deployment Script
echo                    Hospital Management System
echo ================================================================================
echo.

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git is not installed. Please install Git first.
    pause
    exit /b 1
)

echo [OK] Git is installed
echo.

REM Check git status
echo [INFO] Checking git status...
git status --short
echo.

REM Ask for confirmation
set /p confirm="Do you want to commit and push these changes? (y/n): "
if /i not "%confirm%"=="y" (
    echo [CANCELLED] Deployment cancelled.
    pause
    exit /b 0
)

REM Add all changes
echo [INFO] Adding all changes...
git add .
echo [OK] Changes added
echo.

REM Commit with message
set /p commit_message="Enter commit message (or press Enter for default): "
if "%commit_message%"=="" (
    set commit_message=Final CORS fix: Enhanced configuration and health checks
)

echo [INFO] Committing with message: %commit_message%
git commit -m "%commit_message%"
echo [OK] Changes committed
echo.

REM Push to GitHub
echo [INFO] Pushing to GitHub...
git push origin main

if errorlevel 1 (
    echo [ERROR] Failed to push to GitHub
    echo Please check your git configuration and try again.
    pause
    exit /b 1
)

echo [OK] Successfully pushed to GitHub!
echo.
echo ================================================================================
echo                          NEXT STEPS
echo ================================================================================
echo.
echo 1. Go to Render Dashboard: https://dashboard.render.com
echo.
echo 2. Set Backend Environment Variables (lifeline-x-backend):
echo    MONGODB_URI=mongodb+srv://hospi:hospital2000@cluster0.jspojlo.mongodb.net/?appName=Cluster0
echo    JWT_SECRET=lifeline_x_secret_key_2024_secure
echo    NODE_ENV=production
echo    FRONTEND_URL=https://hospital-1-5hyf.onrender.com
echo    PORT=5000
echo.
echo 3. Set Frontend Environment Variables (hospital-1-5hyf):
echo    REACT_APP_API_URL=https://lifeline-x-backend.onrender.com/api
echo.
echo 4. Wait for auto-deployment (15-20 minutes)
echo.
echo 5. Test your app:
echo    Frontend: https://hospital-1-5hyf.onrender.com
echo    Backend Health: https://lifeline-x-backend.onrender.com/health
echo.
echo 6. Use test-cors.html to verify CORS is working
echo.
echo ================================================================================
echo                          DEPLOYMENT STARTED!
echo ================================================================================
echo.
pause
