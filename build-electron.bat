@echo off
echo ================================
echo Apple Supply Chain Intelligence
echo Building Electron Desktop App
echo ================================
echo.
echo Step 1: Building Vite application...
call npm run build:vite
if errorlevel 1 (
    echo Error building Vite app!
    pause
    exit /b 1
)
echo.
echo Step 2: Building Electron executable...
call npm run build:electron
if errorlevel 1 (
    echo Error building Electron executable!
    pause
    exit /b 1
)
echo.
echo ================================
echo Build completed successfully!
echo ================================
echo.
echo Your executable can be found in the 'release' folder:
echo - NSIS Installer: release\Apple Supply Chain Intelligence-1.0.0-x64.exe
echo - Portable: release\Apple Supply Chain Intelligence-1.0.0-Portable.exe
echo.
pause
