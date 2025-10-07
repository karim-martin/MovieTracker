#!/bin/bash

# Start both frontend and backend applications for MovieTracker

echo "Starting MovieTracker applications..."

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "Stopping applications..."
    kill $(jobs -p) 2>/dev/null
    exit
}

# Register cleanup function to run on script exit
trap cleanup SIGINT SIGTERM

# Start backend
echo "Starting backend on port 5000..."
(cd backend && npm run dev) &
BACKEND_PID=$!

# Wait a moment for backend to initialize
sleep 2

# Start frontend
echo "Starting frontend on port 5001..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo ""
echo " Applications started!"
echo " Backend:  http://localhost:5000"
echo " Frontend: http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop both applications"

# Wait for both processes
wait
