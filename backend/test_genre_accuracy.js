const Database = require('better-sqlite3');
const influenceGenealogy = require('./src/services/influenceGenealogy');
const catalogAnalysisService = require('./src/services/catalogAnalysisService');

async function runTests() {
console.log('═══════════════════════════════════════════════════');
console.log('🧪 GENRE ANALYSIS ACCURACY STRESS TEST');
console.log('═══════════════════════════════════════════════════\n');

const audioDb = new Database('./starforge_audio.db');
const genreDb = new Database('./starforge_genres.db');

// Test counters
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, expected, actual) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✓ ${testName}`);
  } else {
    failedTests++;
    console.log(`✗ ${testName}`);
    console.log(`  Expected: ${expected}`);
    console.log(`  Actual: ${actual}`);
  }
}

console.log('TEST 1: BPM Range Matching Accuracy');
console.log('─────────────────────────────────────\n');

// Test Case 1.1: Track at 138 BPM should match Grime (138-145) over Trap (130-170)
const testTrack138 = { bpm: 138, energy: null, genre: null };
const genres = genreDb.prepare('SELECT * FROM genres').all();
const matches138 = genres.map(g => ({
  name: g.name,
  score: influenceGenealogy.calculateTrackGenreMatch(testTrack138, g)
})).filter(m => m.score > 30).sort((a, b) => b.score - a.score);

const topMatch138 = matches138[0].name;
const grimeScore = matches138.find(m => m.name === 'Grime')?.score || 0;
const trapScore = matches138.find(m => m.name === 'Trap')?.score || 0;

console.log(`138 BPM track scores: Grime=${grimeScore.toFixed(1)}, Trap=${trapScore.toFixed(1)}`);
assert(
  grimeScore > trapScore,
  'Grime scores higher than Trap for 138 BPM',
  'Grime > Trap',
  `${grimeScore.toFixed(1)} vs ${trapScore.toFixed(1)}`
);

// Test Case 1.2: Track at 110 BPM should match Amapiano (108-118)
const testTrack110 = { bpm: 110, energy: null, genre: null };
const matches110 = genres.map(g => ({
  name: g.name,
  score: influenceGenealogy.calculateTrackGenreMatch(testTrack110, g)
})).filter(m => m.score > 30).sort((a, b) => b.score - a.score);

const amapianoScore = matches110.find(m => m.name === 'Amapiano')?.score || 0;
console.log(`110 BPM track: Amapiano score = ${amapianoScore.toFixed(1)}`);
assert(
  amapianoScore > 50,
  'Amapiano scores high for 110 BPM (within 108-118 range)',
  '> 50',
  amapianoScore.toFixed(1)
);

// Test Case 1.3: Track at 95 BPM should match Dancehall (80-110)
const testTrack95 = { bpm: 95, energy: null, genre: null };
const matches95 = genres.map(g => ({
  name: g.name,
  score: influenceGenealogy.calculateTrackGenreMatch(testTrack95, g)
})).filter(m => m.score > 30).sort((a, b) => b.score - a.score);

const dancehallScore = matches95.find(m => m.name === 'Dancehall')?.score || 0;
console.log(`95 BPM track: Dancehall score = ${dancehallScore.toFixed(1)}\n`);
assert(
  dancehallScore > 35,
  'Dancehall scores high for 95 BPM (within 80-110 range)',
  '> 35',
  dancehallScore.toFixed(1)
);

console.log('\nTEST 2: Genre Tag Bonus Matching');
console.log('─────────────────────────────────────\n');

// Test Case 2.1: Track with "Grime" tag should get bonus
const testTrackWithTag = { bpm: 140, energy: null, genre: 'Grime' };
const matchesWithTag = genres.map(g => ({
  name: g.name,
  score: influenceGenealogy.calculateTrackGenreMatch(testTrackWithTag, g)
})).filter(m => m.score > 30).sort((a, b) => b.score - a.sort);

const grimeWithTag = influenceGenealogy.calculateTrackGenreMatch(testTrackWithTag, genres.find(g => g.name === 'Grime'));
const grimeNoTag = influenceGenealogy.calculateTrackGenreMatch({ bpm: 140, energy: null, genre: null }, genres.find(g => g.name === 'Grime'));

console.log(`Grime with tag bonus: ${grimeWithTag.toFixed(1)}`);
console.log(`Grime without tag: ${grimeNoTag.toFixed(1)}`);
assert(
  grimeWithTag > grimeNoTag + 35,
  'Genre tag provides significant bonus (+40 expected)',
  '> +35',
  `+${(grimeWithTag - grimeNoTag).toFixed(1)}`
);

console.log('\nTEST 3: Real Catalog Analysis');
console.log('─────────────────────────────────────\n');

// Test Case 3.1: Detailed view should show at least 10 genres
const detailedAnalysis = await catalogAnalysisService.computeCatalogAnalysis('default_user', 'hybrid', 'detailed');
const detailedGenreCount = detailedAnalysis.genreDistribution?.length || 0;

console.log(`Detailed view genres: ${detailedGenreCount}`);
assert(
  detailedGenreCount >= 10,
  'Detailed view shows 10+ genres',
  '>= 10',
  detailedGenreCount
);

// Test Case 3.2: Simplified view should have fewer genres than detailed
const simplifiedAnalysis = await catalogAnalysisService.computeCatalogAnalysis('default_user', 'hybrid', 'simplified');
const simplifiedGenreCount = simplifiedAnalysis.genreDistribution?.length || 0;

console.log(`Simplified view genres: ${simplifiedGenreCount}`);
assert(
  simplifiedGenreCount < detailedGenreCount,
  'Simplified view has fewer genres than detailed',
  `< ${detailedGenreCount}`,
  simplifiedGenreCount
);

// Test Case 3.3: User-requested genres should appear in detailed view
const detailedGenres = detailedAnalysis.genreDistribution.map(g => g.genre);
const hasGrime = detailedGenres.includes('Grime');
const hasUKG = detailedGenres.includes('UK Garage');
const hasTrap = detailedGenres.includes('Trap');

console.log(`\nUser-requested genres present:`);
console.log(`  Grime: ${hasGrime ? '✓' : '✗'}`);
console.log(`  UK Garage: ${hasUKG ? '✓' : '✗'}`);
console.log(`  Trap: ${hasTrap ? '✓' : '✗'}`);

assert(hasGrime, 'Grime appears in detailed view', 'true', hasGrime);
assert(hasUKG, 'UK Garage appears in detailed view', 'true', hasUKG);
assert(hasTrap, 'Trap appears in detailed view', 'true', hasTrap);

console.log('\nTEST 4: Parent-Child Grouping in Simplified View');
console.log('─────────────────────────────────────\n');

// Test Case 4.1: Hip Hop should include Grime and/or Trap in simplified view
const hipHopGroup = simplifiedAnalysis.genreDistribution.find(g => g.genre === 'Hip Hop');
const hasSubgenres = hipHopGroup && hipHopGroup.subgenres && hipHopGroup.subgenres.length > 0;

console.log(`Hip Hop in simplified view:`);
if (hipHopGroup) {
  console.log(`  Percentage: ${hipHopGroup.percentage}%`);
  console.log(`  Subgenres: ${hipHopGroup.subgenres?.join(', ') || 'none'}`);
}

assert(
  hasSubgenres,
  'Hip Hop shows subgenres in simplified view',
  'has subgenres',
  hipHopGroup?.subgenres?.join(', ') || 'none'
);

console.log('\nTEST 5: BPM Distribution Statistics');
console.log('─────────────────────────────────────\n');

// Test Case 5.1: Check actual track distribution in Grime range
const grimeBpmTracks = audioDb.prepare(`
  SELECT COUNT(*) as count
  FROM audio_tracks
  WHERE bpm >= 138 AND bpm <= 145 AND user_id = 'default_user'
`).get().count;

console.log(`Tracks in Grime BPM range (138-145): ${grimeBpmTracks}`);
assert(
  grimeBpmTracks > 0,
  'Library has tracks in Grime BPM range',
  '> 0',
  grimeBpmTracks
);

// Test Case 5.2: Check track distribution in Amapiano range
const amapianoBpmTracks = audioDb.prepare(`
  SELECT COUNT(*) as count
  FROM audio_tracks
  WHERE bpm >= 108 AND bpm <= 118 AND user_id = 'default_user'
`).get().count;

console.log(`Tracks in Amapiano BPM range (108-118): ${amapianoBpmTracks}`);
assert(
  amapianoBpmTracks > 0,
  'Library has tracks in Amapiano BPM range',
  '> 0',
  amapianoBpmTracks
);

console.log('\nTEST 6: Range Specificity Preference');
console.log('─────────────────────────────────────\n');

// Test Case 6.1: Narrow range should score higher than wide range for same track
const testTrack140 = { bpm: 140, energy: null, genre: null };
const grimeGenre = genres.find(g => g.name === 'Grime'); // 138-145 (7 BPM)
const trapGenre = genres.find(g => g.name === 'Trap'); // 130-170 (40 BPM)

const grime140Score = influenceGenealogy.calculateTrackGenreMatch(testTrack140, grimeGenre);
const trap140Score = influenceGenealogy.calculateTrackGenreMatch(testTrack140, trapGenre);

console.log(`140 BPM track:`);
console.log(`  Grime (7 BPM range): ${grime140Score.toFixed(1)}`);
console.log(`  Trap (40 BPM range): ${trap140Score.toFixed(1)}`);

assert(
  grime140Score > trap140Score,
  'Narrow range (Grime) scores higher than wide range (Trap)',
  'Grime > Trap',
  `${grime140Score.toFixed(1)} vs ${trap140Score.toFixed(1)}`
);

console.log('\nTEST 7: Cache Functionality');
console.log('─────────────────────────────────────\n');

// Test Case 7.1: Cache should store separate entries for different granularities
const cacheDb = new Database('./starforge_audio.db');
const cacheEntries = cacheDb.prepare(`
  SELECT mode, granularity, COUNT(*) as count
  FROM catalog_cache
  WHERE user_id = 'default_user'
  GROUP BY mode, granularity
`).all();

console.log('Cache entries:');
cacheEntries.forEach(entry => {
  console.log(`  ${entry.mode} + ${entry.granularity}: ${entry.count} entries`);
});

assert(
  cacheEntries.length >= 2,
  'Cache stores multiple mode+granularity combinations',
  '>= 2',
  cacheEntries.length
);

console.log('\n═══════════════════════════════════════════════════');
console.log('📊 TEST RESULTS SUMMARY');
console.log('═══════════════════════════════════════════════════\n');

console.log(`Total Tests: ${totalTests}`);
console.log(`✓ Passed: ${passedTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);
console.log(`✗ Failed: ${failedTests} (${((failedTests/totalTests)*100).toFixed(1)}%)`);

if (failedTests === 0) {
  console.log('\n🎉 ALL TESTS PASSED! Genre analysis is accurate and production-ready.\n');
} else {
  console.log(`\n⚠️  ${failedTests} test(s) failed. Review above for details.\n`);
  process.exit(1);
}

audioDb.close();
genreDb.close();
cacheDb.close();
}

// Run the tests
runTests().catch(error => {
  console.error('\n❌ Test execution failed:', error);
  process.exit(1);
});
