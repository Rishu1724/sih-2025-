@echo off
title SAI Backend Server
echo SAI Sports Talent Assessment - Backend Server
echo ============================================
echo.

cd /d "C:\Users\rishu\OneDrive\Desktop\New folder\SAI-Sports-Talent-Assessment\backend"
echo Starting backend server on port 3001...
echo Server will be available at http://192.168.13.90:3001
echo.

node server.js
pause