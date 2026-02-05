# Drag & Drop Fix Guide

## Issue Identified

The frontend is configured to proxy requests to `http://localhost:5000`, but there may be port mismatches or server connection issues.

## Quick Fix Steps

### 1. Verify Backend Port

Check which port your backend is running on:

```bash
# Check backend/src/server.js line 17
grep "PORT" backend/src/server.js

# Result should be:
# const PORT = process.env.PORT || 5000;
```

### 2. Start Backend (Port 5000)

```bash
cd backend
PORT=5000 npm start

# Or if you have a .env file:
echo "PORT=5000" > .env
npm start
```

You should see:
```
🌌 Starforge API running on port 5000
```

### 3. Start Frontend (Port 3000)

```bash
# In a new terminal
cd frontend
npm start
```

Frontend should open at `http://localhost:3000`

### 4. Test Drag & Drop

#### For Audio Files:
1. Go to `http://localhost:3000`
2. Navigate to "Twin Genesis Panel"
3. Click "Audio Analysis" section
4. Switch to "Upload Files" tab
5. Drag & drop MP3/WAV/M4A files
6. Click "Analyze Audio"

#### For Rekordbox XML:
1. Switch to "Rekordbox" tab
2. Drag & drop `collection.xml`
3. Import should start automatically

---

## Common Issues & Fixes

### Issue 1: "Network Error" or "Connection Refused"

**Problem**: Backend not running or wrong port

**Fix**:
```bash
# Kill any existing processes on port 5000
lsof -ti:5000 | xargs kill -9

# Start backend on correct port
cd backend && PORT=5000 npm start
```

### Issue 2: "No file uploaded" Error

**Problem**: Dropzone configuration or file type mismatch

**Fix**: Check file types are supported

**Supported Audio Formats**:
- MP3 (`.mp3`)
- WAV (`.wav`)
- M4A (`.m4a`)
- FLAC (`.flac`)
- OGG (`.ogg`)

**Supported XML**:
- Rekordbox Collection XML (`.xml`)
- Must be exported from Rekordbox: File → Export Collection in xml format

### Issue 3: "Invalid file type" Error

**Problem**: File extension not recognized

**Fix**: Ensure file has correct extension and MIME type

For audio files, check:
```bash
file /path/to/your/audio.mp3
# Should show: Audio file with ID3
```

For XML files:
```bash
file /path/to/collection.xml
# Should show: XML document
```

### Issue 4: Drag & Drop Not Responding

**Problem**: React Dropzone not properly initialized or disabled state

**Fix**:

1. Open browser console (F12)
2. Look for JavaScript errors
3. Check if dropzone is disabled:
   - Audio dropzone disabled when `analyzing` is true
   - XML dropzone disabled when `importing` is true

Try refreshing the page and re-test.

### Issue 5: CORS Errors

**Problem**: Cross-Origin Request Blocked

**Fix**: Backend should have CORS enabled (it does in server.js line 20)

If still seeing CORS errors:
```bash
# Check backend logs for CORS issues
# Restart backend with explicit CORS:
cd backend && npm start
```

---

## Testing Tools

### Test 1: Backend Direct Test (No Frontend)

```bash
# Run the debug script
cd /home/sphinxy/starforge
node debug_drag_drop.js
```

This will:
- Check if backend is running
- Test audio upload endpoint directly
- Test Rekordbox XML import endpoint directly
- Create test files if needed

### Test 2: Bash Stress Test

```bash
# Run comprehensive stress test
cd /home/sphinxy/starforge
./test_audio_upload.sh
```

This will:
- Verify server is running
- Test audio uploads
- Test Rekordbox imports
- Check database
- Test Audio DNA endpoints

### Test 3: Manual cURL Test

**Test Audio Upload**:
```bash
# Upload an MP3 file
curl -X POST http://localhost:5000/api/audio/upload-and-analyze \
  -F "audio=@/path/to/your/file.mp3" \
  -H "Accept: application/json"
```

**Test Rekordbox Import**:
```bash
# Import Rekordbox XML
curl -X POST http://localhost:5000/api/audio/rekordbox/import-xml \
  -F "xml=@/path/to/collection.xml" \
  -H "Accept: application/json"
```

---

## Debug Checklist

When drag & drop isn't working, check:

- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Frontend proxy configured to `http://localhost:5000`
- [ ] Browser console shows no errors (F12)
- [ ] Network tab shows requests being sent (F12 → Network)
- [ ] File types are supported (MP3/WAV/M4A for audio, XML for Rekordbox)
- [ ] File sizes under limits (100MB for audio, no limit for XML)
- [ ] No firewall blocking localhost connections
- [ ] No antivirus blocking file operations

---

## Browser Console Debugging

### Open Developer Tools (F12)

1. **Console Tab**: Look for errors
   - Red errors = something broke
   - Yellow warnings = potential issues

2. **Network Tab**: Watch requests
   - Filter by "XHR" to see API calls
   - Look for failed requests (red)
   - Click on request to see details

3. **Check specific errors**:
   ```javascript
   // In console, you might see:
   "POST http://localhost:5000/api/audio/upload-and-analyze 404 (Not Found)"
   // → Backend not running or wrong endpoint

   "Access to XMLHttpRequest blocked by CORS policy"
   // → CORS issue (shouldn't happen with our setup)

   "Network Error"
   // → Backend not reachable
   ```

---

## Alternative Upload Methods

### Method 1: Click to Browse (Instead of Drag & Drop)

1. Click directly on the dropzone area
2. File picker will open
3. Select file(s)
4. Click "Analyze Audio" or import will start automatically

### Method 2: Direct API Call (Advanced)

```javascript
// In browser console, test upload directly:
const formData = new FormData();
const fileInput = document.querySelector('input[type="file"]');
formData.append('audio', fileInput.files[0]);

fetch('/api/audio/upload-and-analyze', {
  method: 'POST',
  body: formData
})
.then(res => res.json())
.then(data => console.log('Success:', data))
.catch(err => console.error('Error:', err));
```

---

## Rekordbox XML Export Guide

If you need to export from Rekordbox:

1. Open Rekordbox 6
2. Go to: **File** → **Export Collection in xml format**
3. Choose save location
4. Save as `collection.xml`
5. Drag & drop this file into Starforge

**Note**: The XML contains metadata only, not actual audio files. It includes:
- Track titles, artists, albums
- BPM, key, genre
- Star ratings, play counts
- File paths (may not be accessible if files are on different machine)

---

## What Should Happen

### Successful Audio Upload:

1. Drag & drop MP3 file
2. File appears in list
3. Click "Analyze Audio"
4. See "Analyzing..." message
5. Analysis completes (might take 10-30 seconds per track)
6. Results displayed:
   - Track ID
   - BPM, Key, Energy, Quality
   - Track added to database

### Successful Rekordbox Import:

1. Drag & drop collection.xml
2. See "Importing..." message
3. Import processes (can take 1-2 minutes for large libraries)
4. Results displayed:
   - Total tracks imported
   - Top genres
   - BPM range
   - Taste profile

### Audio DNA Panel Appears:

After upload/import, you should see:
1. **Sonic Palette** section (frequency bars)
2. **Taste Coherence** section (metrics grid)
3. **Cross-Modal Alignment** (if CLAROSA connected)
4. **Coming Soon** features (placeholders)

---

## Still Not Working?

### Last Resort Debugging:

1. **Check backend logs**:
   ```bash
   # Backend terminal should show requests:
   POST /api/audio/upload-and-analyze 200 1234ms
   ```

2. **Check database**:
   ```bash
   sqlite3 backend/starforge_audio.db "SELECT COUNT(*) FROM audio_tracks;"
   # Should show number > 0 after upload
   ```

3. **Try direct endpoint test**:
   ```bash
   node debug_drag_drop.js
   ```

4. **Check file permissions**:
   ```bash
   ls -la backend/uploads/audio/
   # Should be writable
   ```

5. **Restart everything**:
   ```bash
   # Kill all Node processes
   pkill -f node

   # Start fresh
   cd backend && PORT=5000 npm start
   # In new terminal:
   cd frontend && npm start
   ```

---

## Need Help?

If still stuck, gather this info:

1. Backend console output (copy last 50 lines)
2. Frontend console errors (F12 → Console, copy errors)
3. Network tab failed requests (F12 → Network, filter "XHR", screenshot failed requests)
4. Operating system and browser version
5. File you're trying to upload (filename, size, type)

---

## Summary

**Quick Checklist**:
```bash
✓ Backend: PORT=5000 npm start (in backend/)
✓ Frontend: npm start (in frontend/)
✓ Browser: http://localhost:3000
✓ File types: MP3, WAV, M4A for audio | XML for Rekordbox
✓ Test: node debug_drag_drop.js
```

**Expected Results**:
- Drag & drop → File appears → Analyze → Results displayed
- Audio DNA panel appears with sonic palette, coherence metrics
- Database populated (check with: `sqlite3 backend/starforge_audio.db "SELECT * FROM audio_tracks LIMIT 1;"`)
