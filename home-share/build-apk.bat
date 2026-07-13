@echo off
echo.
echo  Building Home Share APK...
echo  Requires: eas-cli + expo account (eas login)
echo.

cd /d "%~dp0mobile"
call npx eas-cli build --platform android --profile preview

echo.
pause
