# AI Generation Stress Test Guide

## Current Status

**Pre-flight Check Results:**
- ✓ Backend server running
- ✓ Elite tier configured (admin mode enabled)
- ✗ API key needs to be added
- ✗ Aesthetic DNA endpoint needs testing

---

## Setup Steps (5 Minutes)

### Step 1: Add Your API Key

You need either Anthropic Claude OR OpenAI GPT-4 API key.

**Option A: Anthropic Claude (Recommended - Better Quality)**

1. Go to: https://console.anthropic.com/settings/keys
2. Sign up / Log in
3. Create new API key
4. Copy the key (starts with `sk-ant-api03-...`)

5. Add to `/home/sphinxy/starforge/backend/.env`:
```bash
ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
```

**Option B: OpenAI GPT-4 (Alternative)**

1. Go to: https://platform.openai.com/api-keys
2. Sign up / Log in
3. Create new API key
4. Copy the key (starts with `sk-...`)

5. Add to `/home/sphinxy/starforge/backend/.env`:
```bash
OPENAI_API_KEY=sk-your-actual-key-here
```

### Step 2: Restart Backend

After adding the API key:

```bash
# Stop current backend server (Ctrl+C if running in terminal)

# Then restart:
cd /home/sphinxy/starforge/backend
node src/server.js

# Backend should now be running with AI generation enabled
```

### Step 3: Verify Tracks are Analyzed

You already have 99 tracks analyzed, so this should be good. Verify at:
- http://localhost:3060 → Twin Genesis → Check if audio analysis shows data

---

## Running the Tests

### Test 1: Pre-Flight Check (Quick Validation)

```bash
cd /home/sphinxy/starforge/backend
node check_ai_ready.js
```

**This will:**
- Check API key is configured
- Check backend is running
- Check aesthetic DNA is available (99 tracks)
- Check subscription tier (should be Elite)
- Run ONE test generation to verify everything works

**Expected output:**
```
✓ All checks passed! Ready for stress test.
→ Generating artist bio...
✓ Generation successful!

Output (95 words):
----------------------------------------------------------------------
Operating at the intersection of Detroit's mechanical soul and UK
garage's shuffled rhythms, my sets sit in that contemplative 126 BPM
pocket where introspection meets the dancefloor. The aesthetic is rust
and amber—warm textures against urban geometry, intimate moments in
public spaces. [...]
----------------------------------------------------------------------

READY FOR STRESS TEST
Run stress test with: node stress_test_ai.js
```

### Test 2: Full Stress Test (13 Tests)

Once pre-flight passes, run the full stress test:

```bash
cd /home/sphinxy/starforge/backend
node stress_test_ai.js
```

**This will run 13 tests:**

**Artist Bios (6 tests):**
1. Sophisticated, Medium (200 words)
2. Sophisticated, Short (100 words)
3. Sophisticated, Long (300 words)
4. Casual, Medium
5. Minimal, Medium
6. Poetic, Medium

**Social Captions (4 tests):**
7. Minimal style - "New mix dropping Friday"
8. Poetic style - "Back in studio"
9. Technical style - "Exploring modular synthesis"
10. Hype style - "Playing warehouse tonight"

**Press Releases (3 tests):**
11. Festival headlining announcement
12. New EP release
13. Monthly residency announcement

**Test Duration:** ~3-5 minutes total (each generation takes 3-5 seconds)

**Expected Results:**
```
AI GENERATION STRESS TEST RESULTS
================================================================================

Total Tests: 13
Passed: 13 (100%)
Failed: 0 (0%)

Average Response Time: 3500ms
Average Quality Score: 8.2/10
Estimated Cost: $0.0234

QUALITY ANALYSIS
--------------------------------------------------------------------------------

Tests without generic phrases: 12/13
Tests with music references: 11/13
Tests with visual references: 9/13
Tests with appropriate tone: 13/13

BEST OUTPUT (Highest Quality Score)
--------------------------------------------------------------------------------

Test: Artist Bio - Sophisticated, Medium
Quality Score: 10/10
Word Count: 205

Output:
[Generated bio that references YOUR specific BPM, genres, energy level,
visual aesthetic, and sounds like YOUR voice, not generic AI]
```

---

## What the Tests Measure

### 1. Performance Metrics
- **Response Time:** How fast each generation completes (target: <5s)
- **Success Rate:** % of tests that complete successfully (target: 100%)
- **Cost:** Estimated API cost per generation (~$0.02)

### 2. Quality Metrics (Scored 0-10)

**Length Appropriate (2 points):**
- Short bio: 80-120 words ✓
- Medium bio: 150-250 words ✓
- Long bio: 250-350 words ✓
- Caption: 10-80 words ✓
- Press release: 130-220 words ✓

**No Generic Phrases (3 points):**
- ✗ "passion for music" (cliché)
- ✗ "unique sound" (everyone says this)
- ✗ "captivating audiences" (marketing speak)
- ✓ Specific references to YOUR taste

**Music References (2 points):**
- ✓ Mentions BPM (126)
- ✓ Mentions genres (techno, house, garage)
- ✓ Mentions influences (Detroit, UK)
- ✓ Mentions energy level

**Visual References (2 points):**
- ✓ Mentions color palette (rust, amber)
- ✓ Mentions visual themes (urban, intimate)
- ✓ Mentions aesthetic characteristics (warm-toned)

**Tone Matches (1 point):**
- Sophisticated → No clichés, cultural positioning
- Casual → Conversational, authentic
- Minimal → Under 70 words, sparse
- Poetic → Evocative language

### 3. Output Quality Examples

**❌ Generic AI (Low Quality Score: 3/10):**
```
I'm a passionate DJ and producer with a unique sound that captivates
audiences worldwide. My journey through music has led me to create
immersive sonic landscapes that blend various genres.
```
→ Could be anyone. No specifics. All clichés.

**✓ Personal AI Twin (High Quality Score: 10/10):**
```
Operating at the intersection of Detroit's mechanical soul and UK
garage's shuffled rhythms, my sets sit in that contemplative 126 BPM
pocket where introspection meets the dancefloor. The aesthetic is rust
and amber—warm textures against urban geometry, intimate moments in
public spaces.
```
→ Specific BPM. Actual influences. Visual aesthetic reference. Cultural positioning.

---

## Interpreting Results

### Success Criteria

**PASS (Ready to Launch):**
- ✓ 100% test success rate
- ✓ Average quality score ≥8/10
- ✓ ≤2 tests with generic phrases
- ✓ ≥10 tests with music/visual references
- ✓ Output sounds like YOU, not generic AI

**NEEDS WORK (Iterate):**
- ✗ <80% test success rate → API issues
- ✗ Average quality score <6/10 → Generic AI voice
- ✗ >5 tests with generic phrases → Need better prompting
- ✗ Output sounds like ChatGPT → Not using aesthetic DNA properly

### What Good Looks Like

**Example Bio (Sophisticated, Medium):**
```
The sound is Detroit techno's mechanical precision filtered through UK
garage's syncopated swing—126 BPM as the meeting point between floor
pressure and headspace. It's warm bass lines against metallic percussion,
intimate club energy scaled to warehouse dimensions. The visual aesthetic
mirrors this: rust-toned urban photography, contemplative moments in
motion, geometry softened by amber light.

This isn't revivalism. The influences are foundational—Derrick May's
elegance, Todd Edwards' cut-up precision—but the execution is now:
modular synthesis meeting laptop production, vinyl warmth layered with
digital clarity. The sets move like a narrative, 68% energy maintained
across two hours, enough drive to keep the floor engaged while leaving
space for introspection.

Based in [City], operating between intimate 200-capacity rooms and
festival main stages, the focus is consistency over hype—monthly
residencies, carefully curated releases, and a catalog that holds
coherence across 99 analyzed tracks.
```

**Why this is good:**
- ✓ Specific BPM (126)
- ✓ Specific influences (Detroit, UK garage, named artists)
- ✓ Specific energy level (68%)
- ✓ Visual aesthetic reference (rust, amber, urban)
- ✓ Track count reference (99 analyzed)
- ✓ No generic phrases
- ✓ Cultural positioning, not self-promotion
- ✓ Sounds like a curator wrote it, not an AI

---

## Troubleshooting

### "No API key found"
→ Add ANTHROPIC_API_KEY or OPENAI_API_KEY to backend/.env
→ Restart backend server

### "Missing visual or audio DNA"
→ Upload music tracks (you have 99, should be good)
→ Optional: Connect CLAROSA for visual references

### "Request failed with status code 403"
→ Check subscription tier: should be "elite"
→ Verify Elite tier has 'ai_generation' feature enabled

### "Request failed with status code 404"
→ AI generation routes not loaded
→ Restart backend server
→ Check server.js has: app.use('/api/ai', aiGenerationRoutes)

### "Generic output, sounds like ChatGPT"
→ Make sure you uploaded 50+ tracks (more data = better)
→ Connect CLAROSA for visual context
→ Try different tones (Sophisticated usually best)

### "API rate limit exceeded"
→ Add delays between tests (stress test already has 1s delays)
→ Or use smaller batch of tests

---

## Cost Breakdown

### Per Generation
- **Anthropic Claude:** ~$0.018 (~2¢)
- **OpenAI GPT-4:** ~$0.011 (~1¢)

### Stress Test (13 generations)
- **Anthropic:** ~$0.23 (23¢)
- **OpenAI:** ~$0.14 (14¢)

### Monthly Estimates (Production)

**Light User (50 generations/month):**
- Cost: $0.50-1.00
- Revenue: $50 (Pro tier)
- Margin: 98%

**Regular User (200 generations/month):**
- Cost: $2.00-4.00
- Revenue: $100 (Elite tier)
- Margin: 96%

**Heavy User (1000 generations/month):**
- Cost: $10.00-20.00
- Revenue: $100 (Elite tier, unlimited)
- Margin: 80-90%

---

## Next Steps After Stress Test

### If Tests Pass (Quality ≥8/10)

**Week 1: Polish & Launch Prep**
1. Add generation history view (show past 20 generations)
2. Add "Regenerate" button (try different outputs)
3. Add "Generate 3 variations" (pick best)
4. Add inline editing (tweak output before copying)
5. UI polish (better loading states, animations)

**Week 2: Beta Testing**
1. Launch to 10-20 beta users
2. Collect feedback on output quality
3. Measure: Do they sound like themselves?
4. Iterate on prompt engineering

**Week 3: Launch**
1. Announce unified product (Aesthetic DNA → Personal AI Twin)
2. Target: Burned-out artist-operators
3. Pitch: "AI trained on YOUR taste, not generic ChatGPT"
4. Pricing: $50/mo Pro, $100/mo Elite

### If Tests Fail (Quality <6/10)

**Iterate on Prompting:**
1. More specific instructions in prompts
2. Better aesthetic DNA context building
3. Few-shot examples (show LLM good vs bad outputs)
4. Fine-tuning on your past content

---

## Files Created

- `backend/check_ai_ready.js` - Pre-flight check script
- `backend/stress_test_ai.js` - Full stress test (13 tests)
- `STRESS_TEST_GUIDE.md` - This guide

## Quick Start Commands

```bash
# 1. Add API key to backend/.env
nano /home/sphinxy/starforge/backend/.env
# Add: ANTHROPIC_API_KEY=sk-ant-api03-your-key-here

# 2. Restart backend
cd /home/sphinxy/starforge/backend
node src/server.js

# 3. Run pre-flight check
node check_ai_ready.js

# 4. If passes, run stress test
node stress_test_ai.js

# 5. Check results
cat stress_test_results.json
```

---

## Success Metrics (Strategic)

**Technical Validation:**
- ✓ All tests pass (100% success rate)
- ✓ Quality score ≥8/10
- ✓ Response time <5s
- ✓ No generic AI phrases

**Strategic Validation:**
- ✓ Output sounds like YOU (not generic)
- ✓ References YOUR aesthetic DNA (BPM, genres, visual style)
- ✓ You would actually post/use this content
- ✓ Saves 2-3 hours/week of content creation

**If YES to all → Launch unified product**
**If NO → Iterate on prompt engineering**

Ready to test!
