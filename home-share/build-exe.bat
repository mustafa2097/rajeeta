@echo off
echo.
echo  Building Home Share EXE...
echo.

cd /d "%~dp0"
call npm run build:web
if errorlevel 1 exit /b 1
call npm run build:server
if errorlevel 1 exit /b 1
cd desktop
set CSC_IDENTITY_AUTO_DISCOVERY=false
call npm run build:win
if errorlevel 1 exit /b 1

echo.
echo  Done! Files in desktop\out\
echo  - HomeShare-Portable.exe
echo  - win-unpacked\Home Share.exe
echo.
pause
