@echo off
echo --- AntiGravity Supply Chain Platform: Automatic Starter ---

echo [1/3] Cleaning up old processes on ports 8000 and 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do taskkill /f /pid %%a >nul 2>&1

echo [2/3] Starting FastAPI Backend in a new window...
start "AntiGravity Backend" cmd /k "python -m uvicorn backend.main:app --reload --port 8000"

echo [3/3] Starting Next.js Frontend in a new window...
cd frontend
start "AntiGravity Frontend" cmd /k "npx next dev --webpack"

echo.
echo ======================================================
echo 🚀 ALL SYSTEMS STARTING! 
echo.
echo 🌐 BACKEND: http://localhost:8000/health
echo 🌐 FRONTEND: http://localhost:3000
echo ======================================================
echo.
pause
