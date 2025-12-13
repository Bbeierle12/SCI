@echo off
echo Starting SCI Development Environment...
echo.
echo Starting backend server on port 3000...
start "SCI Backend" cmd /k "cd server && npm run dev"

echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo Starting frontend on port 5173...
start "SCI Frontend" cmd /k "npm run dev"

echo.
echo Development servers starting...
echo - Backend: http://localhost:3000
echo - Frontend: http://localhost:5173
echo.
echo Press any key to open the app in browser...
pause > nul
start http://localhost:5173
