/**
 * AI Generation Pre-flight Check
 * Verifies everything is ready before running stress tests
 */

const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const API_BASE = 'http://localhost:5000/api';
const USER_ID = 'default_user';

async function checkAPIKey() {
  console.log('\n1. Checking API Key Configuration...');

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!anthropicKey && !openaiKey) {
    console.log('   ✗ No API key found');
    console.log('   → Add ANTHROPIC_API_KEY or OPENAI_API_KEY to backend/.env');
    console.log('   → Get Anthropic key: https://console.anthropic.com/settings/keys');
    console.log('   → Get OpenAI key: https://platform.openai.com/api-keys');
    return false;
  }

  if (anthropicKey && anthropicKey !== 'your_anthropic_api_key_here') {
    console.log('   ✓ Anthropic API key configured');
    return true;
  }

  if (openaiKey && openaiKey !== 'your_openai_api_key_here') {
    console.log('   ✓ OpenAI API key configured');
    return true;
  }

  console.log('   ✗ API key is placeholder value');
  console.log('   → Replace placeholder with actual API key in backend/.env');
  return false;
}

async function checkBackendServer() {
  console.log('\n2. Checking Backend Server...');

  try {
    const response = await axios.get(`${API_BASE}/health`, { timeout: 5000 });
    if (response.data.status === 'ok') {
      console.log('   ✓ Backend server is running');
      return true;
    }
  } catch (error) {
    console.log('   ✗ Backend server not responding');
    console.log('   → Start backend: cd backend && node src/server.js');
    return false;
  }
}

async function checkAestheticDNA() {
  console.log('\n3. Checking Aesthetic DNA...');

  try {
    const response = await axios.get(`${API_BASE}/ai/aesthetic-dna`, {
      params: { user_id: USER_ID },
      timeout: 10000
    });

    if (response.data.success && response.data.aestheticDNA.available) {
      const dna = response.data.aestheticDNA;

      console.log('   ✓ Aesthetic DNA available');
      console.log(`     - Audio tracks: ${dna.audio?.trackCount || 0}`);
      console.log(`     - BPM preference: ${dna.audio?.avgBpm?.toFixed(0) || 'N/A'}`);
      console.log(`     - Energy level: ${((dna.audio?.avgEnergy || 0) * 100).toFixed(0)}%`);
      console.log(`     - Genres: ${dna.audio?.genres?.join(', ') || 'N/A'}`);

      if (dna.visual) {
        console.log(`     - Visual DNA: Connected (${dna.visual.colorPalette?.length || 0} colors)`);
      } else {
        console.log(`     - Visual DNA: Not connected (optional)`);
      }

      return true;
    } else {
      console.log('   ✗ Aesthetic DNA not available');
      console.log('   → Upload music tracks via "Analyze Audio" section');
      console.log('   → Optional: Connect CLAROSA for visual DNA');
      return false;
    }
  } catch (error) {
    console.log('   ✗ Failed to fetch aesthetic DNA');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function checkSubscription() {
  console.log('\n4. Checking Subscription Status...');

  try {
    const response = await axios.get(`${API_BASE}/subscription/status`, {
      params: { user_id: USER_ID },
      timeout: 5000
    });

    if (response.data.success) {
      const tier = response.data.tier;
      console.log(`   ✓ Subscription tier: ${tier}`);

      if (tier === 'personal') {
        console.log('   ⚠️  Personal tier detected');
        console.log('   → AI generation requires Pro or Elite tier');
        console.log('   → Admin mode should have set you to Elite tier');
        return false;
      }

      return true;
    }
  } catch (error) {
    console.log('   ⚠️  Could not check subscription status');
    console.log('   → Proceeding anyway (may fail if tier check required)');
    return true;
  }
}

async function testSingleGeneration() {
  console.log('\n5. Testing Single Generation...');

  try {
    console.log('   → Generating artist bio (this may take 5-10 seconds)...');

    const response = await axios.post(
      `${API_BASE}/ai/generate-bio`,
      {
        userId: USER_ID,
        tone: 'sophisticated',
        length: 'short'
      },
      { timeout: 30000 }
    );

    if (response.data.success && response.data.bio) {
      console.log('   ✓ Generation successful!');
      console.log(`\n   Output (${response.data.bio.split(/\s+/).length} words):`);
      console.log('   ' + '-'.repeat(70));
      console.log('   ' + response.data.bio.split('\n').join('\n   '));
      console.log('   ' + '-'.repeat(70));
      return true;
    } else {
      console.log('   ✗ Generation failed');
      console.log(`   Error: ${response.data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log('   ✗ Generation failed');
    console.log(`   Error: ${error.response?.data?.error || error.message}`);

    if (error.response?.status === 403) {
      console.log('   → This feature requires Pro or Elite tier');
    }

    return false;
  }
}

async function main() {
  console.log('='.repeat(80));
  console.log('AI GENERATION PRE-FLIGHT CHECK');
  console.log('='.repeat(80));

  const checks = [];

  checks.push(await checkAPIKey());
  checks.push(await checkBackendServer());
  checks.push(await checkAestheticDNA());
  checks.push(await checkSubscription());

  console.log('\n' + '='.repeat(80));
  console.log('PRE-FLIGHT SUMMARY');
  console.log('='.repeat(80));

  const allPassed = checks.every(check => check);

  if (allPassed) {
    console.log('\n✓ All checks passed! Ready for stress test.');

    // Run a single test generation
    const testPassed = await testSingleGeneration();

    if (testPassed) {
      console.log('\n' + '='.repeat(80));
      console.log('READY FOR STRESS TEST');
      console.log('='.repeat(80));
      console.log('\nRun stress test with:');
      console.log('  node stress_test_ai.js');
      console.log('\n');
      process.exit(0);
    } else {
      console.log('\n✗ Test generation failed. Fix errors above before running stress test.');
      process.exit(1);
    }
  } else {
    console.log('\n✗ Some checks failed. Fix errors above before running stress test.');
    console.log('\nQuick fixes:');
    console.log('  1. Add API key to backend/.env');
    console.log('  2. Start backend server: node src/server.js');
    console.log('  3. Upload music tracks (99 tracks recommended)');
    console.log('  4. Verify Elite tier access (admin mode)');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('\nFatal error:', error);
  process.exit(1);
});
