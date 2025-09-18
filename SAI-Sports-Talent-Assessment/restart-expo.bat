@echo off
echo Stopping any running Expo processes...
taskkill /f /im node.exe 2>nul
echo.
echo Clearing React Native cache...
cd /d "c:\Users\rishu\OneDrive\Desktop\New folder\SAI-Sports-Talent-Assessment"
npx expo start --clear