#!/bin/bash

echo "🚀 Starting Custom Chart Composer in Development Mode..."

# Start backend
echo "📦 Starting Backend..."
cd backend
npm install
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
echo "🎨 Starting Frontend..."
cd ../frontend
npm install
npm run dev &
FRONTEND_PID=$!

echo "✅ Development servers started!"
echo "Backend running on http://localhost:3003"
echo "Frontend running on http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait

