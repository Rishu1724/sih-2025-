@echo off
title SAI Sports Talent Assessment Development Server
echo SAI Sports Talent Assessment - Development Server Starter
echo ========================================================
echo.

echo Choose connection option:
echo 1. Tunnel (default) - Works from anywhere but can be unstable
echo 2. LAN - More stable but requires same network
echo 3. Web - Run in browser
echo 4. Clear cache and start with tunnel
echo 5. Exit
echo.

choice /c 12345 /m "Enter your choice"

if errorlevel 5 goto :exit
if errorlevel 4 goto :clear
if errorlevel 3 goto :web
if errorlevel 2 goto :lan
if errorlevel 1 goto :tunnel

:tunnel
echo Starting development server with tunnel...
npx expo start --tunnel
goto :end

:lan
echo Starting development server with LAN...
npx expo start --lan
goto :end

:web
echo Starting development server with web...
npx expo start --web
goto :end

:clear
echo Clearing cache and starting development server...
npx expo start --clear
goto :end

:exit
echo Goodbye!
exit /b

:end
pause