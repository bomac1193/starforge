#!/bin/bash
# Comprehensive Audio Upload & Rekordbox Import Stress Test

echo "=========================================="
echo "AUDIO DNA - Upload & Import Stress Test"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_BASE="http://localhost:5000/api"
BACKEND_DIR="/home/sphinxy/starforge/backend"

# Function to check if server is running
check_server() {
    echo -n "Checking if server is running... "
    if curl -s "${API_BASE}/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Server is running${NC}"
        return 0
    else
        echo -e "${RED}✗ Server is not running${NC}"
        echo ""
        echo "Please start the server first:"
        echo "  cd backend && npm start"
        echo ""
        return 1
    fi
}

# Function to test audio upload
test_audio_upload() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "TEST 1: Audio File Upload & Analysis"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Check if we have any test audio files
    TEST_AUDIO_DIR="${BACKEND_DIR}/test_audio"

    if [ ! -d "$TEST_AUDIO_DIR" ]; then
        echo -e "${YELLOW}⚠ No test_audio directory found${NC}"
        echo "Creating test directory: $TEST_AUDIO_DIR"
        mkdir -p "$TEST_AUDIO_DIR"
        echo ""
        echo "Please add some MP3/WAV/M4A files to:"
        echo "  $TEST_AUDIO_DIR"
        echo ""
        return 1
    fi

    # Find audio files
    AUDIO_FILES=$(find "$TEST_AUDIO_DIR" -type f \( -iname "*.mp3" -o -iname "*.wav" -o -iname "*.m4a" \) 2>/dev/null | head -3)

    if [ -z "$AUDIO_FILES" ]; then
        echo -e "${YELLOW}⚠ No audio files found in $TEST_AUDIO_DIR${NC}"
        echo ""
        echo "Supported formats: MP3, WAV, M4A, FLAC, OGG"
        echo ""
        return 1
    fi

    # Test each file
    COUNT=0
    SUCCESS=0
    FAILED=0

    for FILE in $AUDIO_FILES; do
        COUNT=$((COUNT + 1))
        FILENAME=$(basename "$FILE")

        echo "[$COUNT] Uploading: $FILENAME"
        echo -n "    Analyzing... "

        RESPONSE=$(curl -s -X POST "${API_BASE}/audio/upload-and-analyze" \
            -F "audio=@${FILE}" \
            -w "\n%{http_code}")

        HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
        BODY=$(echo "$RESPONSE" | head -n-1)

        if [ "$HTTP_CODE" = "200" ]; then
            # Parse response
            TRACK_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
            BPM=$(echo "$BODY" | grep -o '"bpm":[0-9.]*' | head -1 | cut -d':' -f2)
            KEY=$(echo "$BODY" | grep -o '"key":"[^"]*"' | head -1 | cut -d'"' -f4)
            QUALITY=$(echo "$BODY" | grep -o '"qualityScore":[0-9.]*' | head -1 | cut -d':' -f2)

            echo -e "${GREEN}✓${NC}"
            echo "    Track ID: $TRACK_ID"
            echo "    BPM: $BPM | Key: $KEY | Quality: $QUALITY"
            SUCCESS=$((SUCCESS + 1))
        else
            echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
            echo "    Error: $(echo "$BODY" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)"
            FAILED=$((FAILED + 1))
        fi
        echo ""
    done

    echo "Results: ${GREEN}$SUCCESS passed${NC}, ${RED}$FAILED failed${NC}"
}

# Function to test Rekordbox XML import
test_rekordbox_import() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "TEST 2: Rekordbox XML Import"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Check for XML file
    XML_FILE="${BACKEND_DIR}/test_rekordbox/collection.xml"

    if [ ! -f "$XML_FILE" ]; then
        echo -e "${YELLOW}⚠ No Rekordbox XML found${NC}"
        echo ""
        echo "To test Rekordbox import:"
        echo "1. Export your Rekordbox library as XML:"
        echo "   File → Export Collection in xml format"
        echo ""
        echo "2. Save to: $XML_FILE"
        echo ""
        return 1
    fi

    echo "Found XML: $(basename "$XML_FILE")"
    echo "File size: $(du -h "$XML_FILE" | cut -f1)"
    echo ""
    echo -n "Importing... "

    RESPONSE=$(curl -s -X POST "${API_BASE}/audio/rekordbox/import-xml" \
        -F "xml=@${XML_FILE}" \
        -w "\n%{http_code}")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ Import successful${NC}"
        echo ""

        # Parse results
        TOTAL=$(echo "$BODY" | grep -o '"totalTracks":[0-9]*' | cut -d':' -f2)
        IMPORTED=$(echo "$BODY" | grep -o '"imported":[0-9]*' | cut -d':' -f2)
        FAILED=$(echo "$BODY" | grep -o '"failed":[0-9]*' | cut -d':' -f2)

        echo "Import Statistics:"
        echo "  Total tracks: $TOTAL"
        echo "  ${GREEN}Successfully imported: $IMPORTED${NC}"
        [ "$FAILED" != "0" ] && echo "  ${RED}Failed: $FAILED${NC}"

        # Get top genres
        echo ""
        echo "Top Genres:"
        echo "$BODY" | grep -o '"genre":"[^"]*"' | cut -d'"' -f4 | head -5 | while read genre; do
            echo "  - $genre"
        done
    else
        echo -e "${RED}✗ Import failed (HTTP $HTTP_CODE)${NC}"
        echo "Error: $(echo "$BODY" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)"
    fi
}

# Function to test Audio DNA endpoints
test_audio_dna() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "TEST 3: Audio DNA Endpoints"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Test sonic palette
    echo "[1] Testing Sonic Palette..."
    RESPONSE=$(curl -s "${API_BASE}/deep/audio/sonic-palette")

    if echo "$RESPONSE" | grep -q '"success":true'; then
        echo -e "    ${GREEN}✓ Sonic palette extracted${NC}"

        # Parse palette
        TONAL=$(echo "$RESPONSE" | grep -o '"tonalCharacteristics":"[^"]*"' | cut -d'"' -f4)
        echo "    Tonal: $TONAL"
    else
        ERROR=$(echo "$RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
        echo -e "    ${YELLOW}⚠ $ERROR${NC}"
    fi
    echo ""

    # Test taste coherence
    echo "[2] Testing Taste Coherence..."
    RESPONSE=$(curl -s "${API_BASE}/deep/audio/taste-coherence")

    if echo "$RESPONSE" | grep -q '"success":true'; then
        echo -e "    ${GREEN}✓ Taste coherence calculated${NC}"

        # Parse coherence
        OVERALL=$(echo "$RESPONSE" | grep -o '"overall":[0-9.]*' | head -1 | cut -d':' -f2)
        BPM_COH=$(echo "$RESPONSE" | grep -o '"bpmConsistency":[0-9.]*' | cut -d':' -f2)
        GENRE_COH=$(echo "$RESPONSE" | grep -o '"genreCoherence":[0-9.]*' | cut -d':' -f2)

        echo "    Overall: ${OVERALL} | BPM: ${BPM_COH} | Genre: ${GENRE_COH}"
    else
        ERROR=$(echo "$RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
        echo -e "    ${YELLOW}⚠ $ERROR${NC}"
    fi
    echo ""

    # Test cross-modal (if CLAROSA connected)
    echo "[3] Testing Cross-Modal Analysis..."
    RESPONSE=$(curl -s -X POST "${API_BASE}/deep/cross-modal/analyze" \
        -H "Content-Type: application/json" \
        -d '{"userId":1}')

    if echo "$RESPONSE" | grep -q '"success":true'; then
        echo -e "    ${GREEN}✓ Cross-modal coherence analyzed${NC}"

        # Parse coherence
        OVERALL=$(echo "$RESPONSE" | grep -o '"overall":[0-9.]*' | head -1 | cut -d':' -f2)
        AV_MATCH=$(echo "$RESPONSE" | grep -o '"audioVisualMatch":[0-9.]*' | cut -d':' -f2)

        echo "    Overall: ${OVERALL} | Audio-Visual Match: ${AV_MATCH}"
    else
        ERROR=$(echo "$RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
        echo -e "    ${YELLOW}⚠ $ERROR${NC}"
    fi
}

# Function to check database
check_database() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Database Status"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    DB_PATH="${BACKEND_DIR}/starforge_audio.db"

    if [ ! -f "$DB_PATH" ]; then
        echo -e "${YELLOW}⚠ Database not found${NC}"
        echo "Database will be created on first upload"
        return
    fi

    echo "Database: $(basename "$DB_PATH")"
    echo "Size: $(du -h "$DB_PATH" | cut -f1)"
    echo ""

    # Count tracks
    TRACK_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM audio_tracks;" 2>/dev/null || echo "0")
    UPLOAD_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM audio_tracks WHERE source='upload';" 2>/dev/null || echo "0")
    RB_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM audio_tracks WHERE source='rekordbox';" 2>/dev/null || echo "0")

    echo "Total tracks: $TRACK_COUNT"
    echo "  - Uploaded: $UPLOAD_COUNT"
    echo "  - Rekordbox: $RB_COUNT"

    # Check sonic palette cache
    CACHE_PATH="${BACKEND_DIR}/starforge_sonic_palette.db"
    if [ -f "$CACHE_PATH" ]; then
        echo ""
        echo "Sonic Palette Cache: $(du -h "$CACHE_PATH" | cut -f1)"
        CACHED=$(sqlite3 "$CACHE_PATH" "SELECT COUNT(*) FROM sonic_palette_cache;" 2>/dev/null || echo "0")
        echo "  Cached users: $CACHED"
    fi
}

# Main execution
main() {
    if ! check_server; then
        exit 1
    fi

    check_database
    test_audio_upload
    test_rekordbox_import
    test_audio_dna

    echo ""
    echo "=========================================="
    echo "Stress Test Complete"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo "1. Check the frontend at http://localhost:3000"
    echo "2. Go to Twin Genesis Panel → Audio Analysis"
    echo "3. Try drag & drop for files or XML"
    echo ""
}

main
