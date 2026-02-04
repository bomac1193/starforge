#!/bin/bash

echo "🌌 Starting Starforge..."
echo ""

# Check if dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend && npm install
    cd ..
fi

if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend && npm install
    cd ..
fi

# Check if .env exists in backend
if [ ! -f "backend/.env" ]; then
    echo "Creating backend .env file..."
    cp backend/.env.example backend/.env
    echo "⚠️  Please configure backend/.env with your settings"
fi

echo ""
echo "✨ Starting servers..."
echo ""
echo "Frontend: http://localhost:3001"
echo "Backend:  http://localhost:5000"
echo ""

# Start both servers
cd backend && npm run dev &
cd frontend && npm start
