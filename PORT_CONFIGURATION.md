# Port Configuration

## Current Setup

Based on the running services:

- **Backend**: Port **5000** (configured in server.js)
- **Frontend**: Port **3001** (detected from webpack output)
- **Frontend Proxy**: Points to `http://localhost:5000` (configured in package.json)

## Important Notes

### Frontend Port is 3001 (Not 3000)

The frontend is running on **port 3001**, likely because:
- Port 3000 is already in use by another service
- React automatically chose the next available port

### Access URLs

**Frontend**: `http://localhost:3001`
**Backend API**: `http://localhost:5000`

## Testing Commands (Updated)

Use port 3001 for frontend:

```bash
# Open frontend
open http://localhost:3001

# Or in browser:
http://localhost:3001
```

Backend tests remain the same (port 5000):
```bash
curl http://localhost:5000/api/health
node debug_drag_drop.js
```

## If You Want Frontend on Port 3000

### Option 1: Kill Process Using Port 3000
```bash
# Find what's using port 3000
lsof -i:3000

# Kill it
kill -9 $(lsof -t -i:3000)

# Restart frontend
cd frontend && npm start
```

### Option 2: Force Specific Port
```bash
# Set PORT environment variable
cd frontend
PORT=3000 npm start
```

### Option 3: Use Port 3001 (Current)
Just use `http://localhost:3001` - everything works fine on this port.

## Proxy Configuration

The frontend proxy is correctly configured in `frontend/package.json`:
```json
"proxy": "http://localhost:5000"
```

This means all API requests from the frontend automatically proxy to the backend on port 5000, regardless of which port the frontend runs on.

## Summary

✅ **Backend**: `http://localhost:5000` (correct)
✅ **Frontend**: `http://localhost:3001` (works perfectly)
✅ **Proxy**: Configured correctly

**Just use port 3001 for the frontend** - everything is working as expected!
