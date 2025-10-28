@echo off
echo Starting Custom Chart Composer in Development Mode...

echo Starting Backend...
start cmd /k "cd backend && npm install && npm run dev"

timeout /t 3 /nobreak > nul

echo Starting Frontend...
start cmd /k "cd frontend && npm install && npm run dev"

echo Development servers started!
echo Backend running on http://localhost:3003 (and accessible via your PC's LAN IP)
echo Frontend running on http://localhost:5173
echo Note: Vite will also show a Network URL you can open from other devices.

