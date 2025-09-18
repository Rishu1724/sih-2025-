@echo off
cls
echo ========================================
echo SAI Sports Talent Assessment
echo Performance Optimization Restart Script
echo ========================================
echo.

echo Stopping any running Node.js processes...
taskkill /f /im node.exe >nul 2>&1
echo.

echo Deleting cache folders...
rmdir /s /q ".expo" >nul 2>&1
rmdir /s /q "node_modules\.cache" >nul 2>&1
echo.

echo Navigating to project directory...
cd /d "c:\Users\rishu\OneDrive\Desktop\New folder\SAI-Sports-Talent-Assessment"
echo.

echo Installing dependencies...
npm install
echo.

echo Starting Expo with cache cleared...
npx expo start --clear

pause