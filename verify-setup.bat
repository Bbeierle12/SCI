@echo off
echo ================================
echo Electron Setup Verification
echo ================================
echo.

echo Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found! Please install Node.js.
    pause
    exit /b 1
) else (
    echo [OK] Node.js:
    node --version
)

echo.
echo Checking npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm not found!
    pause
    exit /b 1
) else (
    echo [OK] npm:
    npm --version
)

echo.
echo Checking node_modules...
if exist "node_modules\" (
    echo [OK] Dependencies installed
) else (
    echo [WARNING] Dependencies not installed. Run: npm install
)

echo.
echo Checking Electron files...
if exist "electron\main.js" (
    echo [OK] electron\main.js found
) else (
    echo [ERROR] electron\main.js missing!
)

if exist "electron\preload.js" (
    echo [OK] electron\preload.js found
) else (
    echo [ERROR] electron\preload.js missing!
)

echo.
echo Checking configuration files...
if exist "vite.config.ts" (
    echo [OK] vite.config.ts found
) else (
    echo [ERROR] vite.config.ts missing!
)

if exist "package.json" (
    echo [OK] package.json found
) else (
    echo [ERROR] package.json missing!
)

if exist "electron-builder.json" (
    echo [OK] electron-builder.json found
) else (
    echo [ERROR] electron-builder.json missing!
)

echo.
echo Checking environment file...
if exist ".env" (
    echo [OK] .env file exists
) else (
    echo [WARNING] .env file not found
    echo [INFO] Copy .env.example to .env and add your API key
)

echo.
echo Checking build directory...
if exist "build\" (
    echo [OK] build directory exists
    if exist "build\icon.ico" (
        echo [OK] icon.ico found
    ) else (
        echo [WARNING] build\icon.ico not found (will use default icon)
    )
) else (
    echo [WARNING] build directory missing
)

echo.
echo ================================
echo Verification Complete
echo ================================
echo.
echo To start development mode:
echo   npm run dev
echo.
echo To build the executable:
echo   npm run build
echo.
pause
