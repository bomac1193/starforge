# Port Configuration - Starforge

## Current Configuration

**Backend**: Port **5000**
**Frontend**: Port **3050**

## Why Port 3050?

Port 3050 is unlikely to conflict with common services:
- 3000 - Default React (often in use)
- 3001 - Common alternative
- 5000 - Backend uses this
- 8080 - Common web servers
- 8000 - Python servers

Port 3050 is uncommon and unlikely to be used by other services.

## Access URLs

**Frontend**: http://localhost:3050
**Backend API**: http://localhost:5000/api

## Starting the Servers

### Backend (Terminal 1)
```bash
cd backend
PORT=5000 npm start
```

Should show:
```
🌌 Starforge API running on port 5000
```

### Frontend (Terminal 2)
```bash
cd frontend
npm start
```

Should show:
```
Compiled successfully!
Local: http://localhost:3050
```

The `.env` file in `frontend/.env` ensures it always uses port 3050.

## Testing

After both servers start:

```bash
# Test backend
curl http://localhost:5000/api/health

# Test frontend (in browser)
open http://localhost:3050

# Run automated tests
node debug_drag_drop.js
```

## Proxy Configuration

Frontend proxies API requests to backend:
- Frontend requests to `/api/*` → `http://localhost:5000/api/*`
- Configured in `frontend/package.json`: `"proxy": "http://localhost:5000"`

## Quick Reference

| Service  | URL                      | Purpose              |
|----------|--------------------------|----------------------|
| Frontend | http://localhost:3050    | Web UI               |
| Backend  | http://localhost:5000    | API Server           |
| Health   | http://localhost:5000/api/health | Health check |

## Troubleshooting

### Port Already in Use

**Backend (5000)**:
```bash
lsof -ti:5000 | xargs kill -9
cd backend && PORT=5000 npm start
```

**Frontend (3050)**:
```bash
lsof -ti:3050 | xargs kill -9
cd frontend && npm start
```

### Change Frontend Port

Edit `frontend/.env`:
```
PORT=3050
BROWSER=none
```

Then restart frontend.

## All Set! 🚀

Start both servers and access at:
**http://localhost:3050**
