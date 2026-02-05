/**
 * AI Generation Stress Test
 * Tests all AI generation endpoints with various parameters
 * Evaluates quality, performance, and error handling
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:5000/api';
const USER_ID = 'default_user';

// Test results storage
const results = {
  startTime: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    avgResponseTime: 0,
    totalCost: 0
  }
};

/**
 * Test configuration
 */
const tests = [
  // Artist Bio Tests
  {
    name: 'Artist Bio - Sophisticated, Medium',
    endpoint: '/ai/generate-bio',
    method: 'POST',
    data: { userId: USER_ID, tone: 'sophisticated', length: 'medium' },
    expectedLength: [150, 250] // words
  },
  {
    name: 'Artist Bio - Sophisticated, Short',
    endpoint: '/ai/generate-bio',
    method: 'POST',
    data: { userId: USER_ID, tone: 'sophisticated', length: 'short' },
    expectedLength: [80, 120]
  },
  {
    name: 'Artist Bio - Sophisticated, Long',
    endpoint: '/ai/generate-bio',
    method: 'POST',
    data: { userId: USER_ID, tone: 'sophisticated', length: 'long' },
    expectedLength: [250, 350]
  },
  {
    name: 'Artist Bio - Casual, Medium',
    endpoint: '/ai/generate-bio',
    method: 'POST',
    data: { userId: USER_ID, tone: 'casual', length: 'medium' },
    expectedLength: [150, 250]
  },
  {
    name: 'Artist Bio - Minimal, Medium',
    endpoint: '/ai/generate-bio',
    method: 'POST',
    data: { userId: USER_ID, tone: 'minimal', length: 'medium' },
    expectedLength: [150, 250]
  },
  {
    name: 'Artist Bio - Poetic, Medium',
    endpoint: '/ai/generate-bio',
    method: 'POST',
    data: { userId: USER_ID, tone: 'poetic', length: 'medium' },
    expectedLength: [150, 250]
  },

  // Caption Tests
  {
    name: 'Caption - Minimal Style (New Mix)',
    endpoint: '/ai/generate-caption',
    method: 'POST',
    data: {
      userId: USER_ID,
      context: 'New mix dropping this Friday at midnight',
      style: 'minimal'
    },
    expectedLength: [10, 60]
  },
  {
    name: 'Caption - Poetic Style (Studio Session)',
    endpoint: '/ai/generate-caption',
    method: 'POST',
    data: {
      userId: USER_ID,
      context: 'Back in the studio working on new material',
      style: 'poetic'
    },
    expectedLength: [20, 80]
  },
  {
    name: 'Caption - Technical Style (Production)',
    endpoint: '/ai/generate-caption',
    method: 'POST',
    data: {
      userId: USER_ID,
      context: 'Exploring modular synthesis for new EP',
      style: 'technical'
    },
    expectedLength: [20, 80]
  },
  {
    name: 'Caption - Hype Style (Event)',
    endpoint: '/ai/generate-caption',
    method: 'POST',
    data: {
      userId: USER_ID,
      context: 'Playing warehouse party tonight with amazing lineup',
      style: 'hype'
    },
    expectedLength: [20, 80]
  },

  // Press Release Tests
  {
    name: 'Press Release - Festival Headlining',
    endpoint: '/ai/generate-press-release',
    method: 'POST',
    data: {
      userId: USER_ID,
      eventContext: 'Headlining Detroit Electronic Music Festival in May, first artist from UK garage scene to close main stage'
    },
    expectedLength: [130, 220]
  },
  {
    name: 'Press Release - New EP Release',
    endpoint: '/ai/generate-press-release',
    method: 'POST',
    data: {
      userId: USER_ID,
      eventContext: 'Releasing debut EP "Rust & Amber" on respected underground label, exploring intersection of techno and garage'
    },
    expectedLength: [130, 220]
  },
  {
    name: 'Press Release - Residency',
    endpoint: '/ai/generate-press-release',
    method: 'POST',
    data: {
      userId: USER_ID,
      eventContext: 'Starting monthly residency at intimate 200-capacity venue, focusing on deep cuts and B-sides'
    },
    expectedLength: [130, 220]
  }
];

/**
 * Run a single test
 */
async function runTest(test, index) {
  console.log(`\n[${index + 1}/${tests.length}] Running: ${test.name}`);

  const result = {
    name: test.name,
    status: 'pending',
    startTime: Date.now(),
    endTime: null,
    responseTime: null,
    output: null,
    error: null,
    quality: {}
  };

  try {
    const response = await axios({
      method: test.method,
      url: `${API_BASE}${test.endpoint}`,
      data: test.data,
      timeout: 30000 // 30 second timeout
    });

    result.endTime = Date.now();
    result.responseTime = result.endTime - result.startTime;

    if (response.data.success) {
      result.status = 'passed';

      // Extract output based on endpoint
      if (test.endpoint.includes('bio')) {
        result.output = response.data.bio;
      } else if (test.endpoint.includes('caption')) {
        result.output = response.data.caption;
      } else if (test.endpoint.includes('press-release')) {
        result.output = response.data.pressRelease;
      }

      // Quality checks
      result.quality = analyzeQuality(result.output, test);

      console.log(`✓ PASSED (${result.responseTime}ms)`);
      console.log(`  Word count: ${result.quality.wordCount}`);
      console.log(`  Quality score: ${result.quality.overallScore}/10`);

      results.summary.passed++;
    } else {
      result.status = 'failed';
      result.error = response.data.error || 'Unknown error';
      console.log(`✗ FAILED: ${result.error}`);
      results.summary.failed++;
    }
  } catch (error) {
    result.status = 'failed';
    result.endTime = Date.now();
    result.responseTime = result.endTime - result.startTime;
    result.error = error.response?.data?.error || error.message;

    console.log(`✗ FAILED: ${result.error}`);
    results.summary.failed++;
  }

  results.tests.push(result);
  results.summary.total++;
}

/**
 * Analyze output quality
 */
function analyzeQuality(output, test) {
  const wordCount = output.split(/\s+/).length;

  const quality = {
    wordCount,
    lengthAppropriate: false,
    hasGenericPhrases: false,
    hasMusicReferences: false,
    hasVisualReferences: false,
    toneMatches: false,
    overallScore: 0
  };

  // Check length
  if (test.expectedLength) {
    quality.lengthAppropriate = wordCount >= test.expectedLength[0] &&
                                 wordCount <= test.expectedLength[1];
  }

  // Check for generic AI phrases (bad)
  const genericPhrases = [
    'passion for music',
    'unique sound',
    'captivating audiences',
    'journey through sound',
    'sonic landscape',
    'immersive experience',
    'dedication to craft'
  ];
  quality.hasGenericPhrases = genericPhrases.some(phrase =>
    output.toLowerCase().includes(phrase)
  );

  // Check for music references (good)
  const musicTerms = ['bpm', 'tempo', 'techno', 'house', 'garage', 'detroit', 'uk', 'energy'];
  quality.hasMusicReferences = musicTerms.some(term =>
    output.toLowerCase().includes(term)
  );

  // Check for visual references (good if CLAROSA connected)
  const visualTerms = ['warm', 'rust', 'amber', 'urban', 'intimate', 'contemplative'];
  quality.hasVisualReferences = visualTerms.some(term =>
    output.toLowerCase().includes(term)
  );

  // Check tone matching
  if (test.data.tone === 'minimal' || test.data.style === 'minimal') {
    quality.toneMatches = wordCount < 70;
  } else if (test.data.tone === 'sophisticated') {
    quality.toneMatches = !quality.hasGenericPhrases &&
                          (quality.hasMusicReferences || quality.hasVisualReferences);
  } else {
    quality.toneMatches = true; // Assume match for other tones
  }

  // Calculate overall score (0-10)
  let score = 0;
  if (quality.lengthAppropriate) score += 2;
  if (!quality.hasGenericPhrases) score += 3;
  if (quality.hasMusicReferences) score += 2;
  if (quality.hasVisualReferences) score += 2;
  if (quality.toneMatches) score += 1;

  quality.overallScore = score;

  return quality;
}

/**
 * Calculate cost estimates
 */
function calculateCosts() {
  const avgTokensInput = 500;
  const avgTokensOutput = 300;

  // Anthropic pricing (per 1M tokens)
  const anthropicInputCost = 3.00 / 1000000;
  const anthropicOutputCost = 15.00 / 1000000;

  const costPerGeneration =
    (avgTokensInput * anthropicInputCost) +
    (avgTokensOutput * anthropicOutputCost);

  results.summary.totalCost = costPerGeneration * results.summary.total;
}

/**
 * Generate report
 */
function generateReport() {
  // Calculate average response time
  const responseTimes = results.tests
    .filter(t => t.responseTime)
    .map(t => t.responseTime);

  results.summary.avgResponseTime = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    : 0;

  // Calculate average quality score
  const qualityScores = results.tests
    .filter(t => t.quality && t.quality.overallScore)
    .map(t => t.quality.overallScore);

  results.summary.avgQualityScore = qualityScores.length > 0
    ? (qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length).toFixed(1)
    : 0;

  // Calculate costs
  calculateCosts();

  console.log('\n' + '='.repeat(80));
  console.log('AI GENERATION STRESS TEST RESULTS');
  console.log('='.repeat(80));
  console.log(`\nTotal Tests: ${results.summary.total}`);
  console.log(`Passed: ${results.summary.passed} (${((results.summary.passed / results.summary.total) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${results.summary.failed} (${((results.summary.failed / results.summary.total) * 100).toFixed(1)}%)`);
  console.log(`\nAverage Response Time: ${results.summary.avgResponseTime}ms`);
  console.log(`Average Quality Score: ${results.summary.avgQualityScore}/10`);
  console.log(`Estimated Cost: $${results.summary.totalCost.toFixed(4)}`);

  // Quality breakdown
  console.log('\n' + '-'.repeat(80));
  console.log('QUALITY ANALYSIS');
  console.log('-'.repeat(80));

  const passedTests = results.tests.filter(t => t.status === 'passed');

  console.log(`\nTests without generic phrases: ${passedTests.filter(t => !t.quality.hasGenericPhrases).length}/${passedTests.length}`);
  console.log(`Tests with music references: ${passedTests.filter(t => t.quality.hasMusicReferences).length}/${passedTests.length}`);
  console.log(`Tests with visual references: ${passedTests.filter(t => t.quality.hasVisualReferences).length}/${passedTests.length}`);
  console.log(`Tests with appropriate tone: ${passedTests.filter(t => t.quality.toneMatches).length}/${passedTests.length}`);

  // Best and worst outputs
  const sortedByQuality = passedTests.sort((a, b) =>
    (b.quality.overallScore || 0) - (a.quality.overallScore || 0)
  );

  if (sortedByQuality.length > 0) {
    console.log('\n' + '-'.repeat(80));
    console.log('BEST OUTPUT (Highest Quality Score)');
    console.log('-'.repeat(80));
    const best = sortedByQuality[0];
    console.log(`\nTest: ${best.name}`);
    console.log(`Quality Score: ${best.quality.overallScore}/10`);
    console.log(`Word Count: ${best.quality.wordCount}`);
    console.log(`\nOutput:\n${best.output}`);

    if (sortedByQuality.length > 1) {
      console.log('\n' + '-'.repeat(80));
      console.log('WORST OUTPUT (Lowest Quality Score)');
      console.log('-'.repeat(80));
      const worst = sortedByQuality[sortedByQuality.length - 1];
      console.log(`\nTest: ${worst.name}`);
      console.log(`Quality Score: ${worst.quality.overallScore}/10`);
      console.log(`Word Count: ${worst.quality.wordCount}`);
      console.log(`\nOutput:\n${worst.output}`);
    }
  }

  // Failed tests details
  const failedTests = results.tests.filter(t => t.status === 'failed');
  if (failedTests.length > 0) {
    console.log('\n' + '-'.repeat(80));
    console.log('FAILED TESTS DETAILS');
    console.log('-'.repeat(80));
    failedTests.forEach(test => {
      console.log(`\n✗ ${test.name}`);
      console.log(`  Error: ${test.error}`);
    });
  }

  // Save detailed results to file
  const resultsFile = path.join(__dirname, 'stress_test_results.json');
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`\n\nDetailed results saved to: ${resultsFile}`);

  console.log('\n' + '='.repeat(80));
}

/**
 * Main execution
 */
async function main() {
  console.log('AI GENERATION STRESS TEST');
  console.log('='.repeat(80));
  console.log(`Starting: ${results.startTime}`);
  console.log(`Total tests: ${tests.length}`);
  console.log(`API Base: ${API_BASE}`);
  console.log(`User ID: ${USER_ID}`);

  // Check if API key is configured
  if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
    console.log('\n⚠️  WARNING: No API key found in environment variables');
    console.log('Add ANTHROPIC_API_KEY or OPENAI_API_KEY to backend/.env');
    console.log('Proceeding with tests (may fail if API key not configured)...\n');
  }

  // Run all tests sequentially
  for (let i = 0; i < tests.length; i++) {
    await runTest(tests[i], i);

    // Small delay between tests to avoid rate limiting
    if (i < tests.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Generate report
  generateReport();

  // Exit
  process.exit(results.summary.failed > 0 ? 1 : 0);
}

// Run tests
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
