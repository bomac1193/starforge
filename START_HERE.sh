#!/bin/bash
# Starforge Startup Script
# Quick start guide for Audio DNA testing

echo "╔════════════════════════════════════════════════════╗"
echo "║        Starforge Audio DNA - Quick Start          ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "backend" ]; then
    echo "❌ Error: Run this script from the starforge root directory"
    echo "   cd /home/sphinxy/starforge && ./START_HERE.sh"
    exit 1
fi

echo "🔍 Pre-flight checks..."
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi
echo "✓ Node.js: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm first."
    exit 1
fi
echo "✓ npm: $(npm --version)"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "⚠  Python3 not found. Audio analysis may not work."
else
    echo "✓ Python3: $(python3 --version)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Setup Instructions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "You need to start TWO terminals:"
echo ""
echo "TERMINAL 1 - Backend:"
echo "  cd /home/sphinxy/starforge/backend"
echo "  PORT=5000 npm start"
echo ""
echo "TERMINAL 2 - Frontend:"
echo "  cd /home/sphinxy/starforge/frontend"
echo "  npm start"
echo ""

# Check if backend dependencies are installed
if [ ! -d "backend/node_modules" ]; then
    echo "⚠  Backend dependencies not installed"
    echo ""
    read -p "Install backend dependencies now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Installing backend dependencies..."
        cd backend && npm install
        echo "✓ Backend dependencies installed"
        cd ..
    fi
    echo ""
fi

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo "⚠  Frontend dependencies not installed"
    echo ""
    read -p "Install frontend dependencies now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Installing frontend dependencies..."
        cd frontend && npm install
        echo "✓ Frontend dependencies installed"
        cd ..
    fi
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Testing & Debugging Tools"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "After starting servers, run these tests:"
echo ""
echo "1. Quick health check:"
echo "   curl http://localhost:5000/api/health"
echo ""
echo "2. Full backend test (tests uploads & imports):"
echo "   node debug_drag_drop.js"
echo ""
echo "3. Bash stress test (comprehensive):"
echo "   ./test_audio_upload.sh"
echo ""
echo "4. Verify implementation:"
echo "   ./test_audio_dna.sh"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Documentation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Read these guides:"
echo "  📖 AUDIO_DNA_IMPLEMENTATION.md  - Technical details"
echo "  📖 AUDIO_DNA_QUICKSTART.md      - Quick start guide"
echo "  📖 DRAG_DROP_FIX.md              - Troubleshooting drag & drop"
echo "  📖 IMPLEMENTATION_SUMMARY.txt    - Overview"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test Files Location"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create test directories if they don't exist
mkdir -p backend/test_audio backend/test_rekordbox

echo "Put your test files here:"
echo "  🎵 Audio files (MP3/WAV/M4A):"
echo "     backend/test_audio/"
echo ""
echo "  📄 Rekordbox XML:"
echo "     backend/test_rekordbox/collection.xml"
echo ""

# Check for test files
AUDIO_COUNT=$(find backend/test_audio -type f \( -iname "*.mp3" -o -iname "*.wav" -o -iname "*.m4a" \) 2>/dev/null | wc -l)
XML_EXISTS=0
[ -f "backend/test_rekordbox/collection.xml" ] && XML_EXISTS=1

if [ "$AUDIO_COUNT" -gt 0 ]; then
    echo "✓ Found $AUDIO_COUNT audio file(s) in test_audio/"
else
    echo "⚠  No audio files found in test_audio/"
    echo "   Add some MP3/WAV/M4A files to test upload functionality"
fi

if [ "$XML_EXISTS" -eq 1 ]; then
    echo "✓ Found collection.xml in test_rekordbox/"
else
    echo "⚠  No collection.xml found"
    echo "   Export from Rekordbox: File → Export Collection in xml format"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "How to Use"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "1. Start both servers (backend + frontend)"
echo "2. Open browser: http://localhost:3000"
echo "3. Navigate to 'Twin Genesis Panel'"
echo "4. Click 'Audio Analysis' section"
echo "5. Choose tab:"
echo "   • 'Upload Files' - Drag & drop MP3/WAV/M4A"
echo "   • 'Rekordbox' - Drag & drop collection.xml"
echo "6. Audio DNA panel will appear below with analysis"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Next Steps"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Do you want to start the servers now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Starting servers in tmux sessions..."
    echo "(Use 'tmux attach' to see backend logs)"
    echo ""

    # Check if tmux is available
    if command -v tmux &> /dev/null; then
        # Start backend in tmux
        tmux new-session -d -s starforge-backend "cd backend && PORT=5000 npm start"
        echo "✓ Backend started in tmux session 'starforge-backend'"

        # Start frontend in tmux
        tmux new-session -d -s starforge-frontend "cd frontend && npm start"
        echo "✓ Frontend started in tmux session 'starforge-frontend'"

        echo ""
        echo "Servers starting..."
        echo ""
        echo "To view logs:"
        echo "  tmux attach -t starforge-backend"
        echo "  tmux attach -t starforge-frontend"
        echo ""
        echo "To stop servers:"
        echo "  tmux kill-session -t starforge-backend"
        echo "  tmux kill-session -t starforge-frontend"
        echo ""

        sleep 3
        echo "Checking if servers are running..."
        sleep 2

        if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
            echo "✓ Backend is running on port 5000"
        else
            echo "⚠  Backend not responding yet (may still be starting...)"
        fi

        echo ""
        echo "Frontend should open automatically in your browser"
        echo "If not, go to: http://localhost:3000"
    else
        echo "tmux not found. Please start servers manually:"
        echo ""
        echo "Terminal 1:"
        echo "  cd backend && PORT=5000 npm start"
        echo ""
        echo "Terminal 2:"
        echo "  cd frontend && npm start"
    fi
else
    echo ""
    echo "Start servers manually:"
    echo ""
    echo "Terminal 1 (Backend):"
    echo "  cd backend && PORT=5000 npm start"
    echo ""
    echo "Terminal 2 (Frontend):"
    echo "  cd frontend && npm start"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Setup complete! 🚀"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
