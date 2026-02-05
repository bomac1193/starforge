#!/bin/bash
# Start Starforge Servers with Correct Ports
# Backend: 5000 | Frontend: 3050

echo "════════════════════════════════════════════════════════"
echo "  Starting Starforge Servers"
echo "════════════════════════════════════════════════════════"
echo ""

# Check if in correct directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Run this from /home/sphinxy/starforge"
    exit 1
fi

# Check if tmux is available
if ! command -v tmux &> /dev/null; then
    echo "⚠  tmux not found. Starting servers in foreground."
    echo ""
    echo "Please start manually in separate terminals:"
    echo ""
    echo "Terminal 1 (Backend):"
    echo "  cd backend && PORT=5000 npm start"
    echo ""
    echo "Terminal 2 (Frontend):"
    echo "  cd frontend && npm start"
    echo ""
    exit 1
fi

# Kill any existing sessions
tmux kill-session -t starforge-backend 2>/dev/null
tmux kill-session -t starforge-frontend 2>/dev/null

# Kill any processes on the ports
echo "🧹 Cleaning up old processes..."
lsof -ti:5000 | xargs kill -9 2>/dev/null
lsof -ti:3050 | xargs kill -9 2>/dev/null
sleep 1

# Start backend in tmux
echo "🚀 Starting backend on port 5000..."
tmux new-session -d -s starforge-backend "cd backend && PORT=5000 npm start"
sleep 2

# Start frontend in tmux
echo "🚀 Starting frontend on port 3050..."
tmux new-session -d -s starforge-frontend "cd frontend && npm start"
sleep 3

# Check if servers started
echo ""
echo "════════════════════════════════════════════════════════"
echo "  Checking Server Status"
echo "════════════════════════════════════════════════════════"
echo ""

if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✅ Backend running on http://localhost:5000"
else
    echo "⚠️  Backend not responding yet (may still be starting...)"
    echo "   Check logs: tmux attach -t starforge-backend"
fi

echo ""
echo "Frontend should be starting on http://localhost:3050"
echo "(React takes 10-20 seconds to compile)"

echo ""
echo "════════════════════════════════════════════════════════"
echo "  Access URLs"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Frontend:  http://localhost:3050"
echo "Backend:   http://localhost:5000"
echo ""
echo "════════════════════════════════════════════════════════"
echo "  Useful Commands"
echo "════════════════════════════════════════════════════════"
echo ""
echo "View backend logs:"
echo "  tmux attach -t starforge-backend"
echo ""
echo "View frontend logs:"
echo "  tmux attach -t starforge-frontend"
echo ""
echo "Stop servers:"
echo "  tmux kill-session -t starforge-backend"
echo "  tmux kill-session -t starforge-frontend"
echo ""
echo "Test backend:"
echo "  curl http://localhost:5000/api/health"
echo ""
echo "Run automated tests:"
echo "  node debug_drag_drop.js"
echo ""
echo "════════════════════════════════════════════════════════"
echo ""
echo "Waiting for frontend to compile..."
echo "(This takes 10-20 seconds)"
echo ""

# Wait for frontend
for i in {1..20}; do
    if curl -s http://localhost:3050 > /dev/null 2>&1; then
        echo ""
        echo "✅ Frontend is ready!"
        echo ""
        echo "🌐 Open in browser: http://localhost:3050"
        echo ""
        break
    fi
    echo -n "."
    sleep 1
done

echo ""
echo "════════════════════════════════════════════════════════"
echo "  🎉 Servers Started!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Open http://localhost:3050 in your browser"
echo "2. Go to Twin Genesis Panel → Audio Analysis"
echo "3. Drag & drop audio files or Rekordbox XML"
echo "4. Run tests: node debug_drag_drop.js"
echo ""
