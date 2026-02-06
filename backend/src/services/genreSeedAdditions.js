const genreTaxonomy = require('./genreTaxonomy');

/**
 * COMPREHENSIVE GENRE SEED ADDITIONS
 * Adding missing foundational Black, Caribbean, and African genres
 * Fixing cultural lineages to show accurate influence genealogy
 */

const additionalGenres = [
  // ==========================================
  // ROOT: FUNK & SOUL (Black American foundation)
  // ==========================================
  {
    name: 'Funk',
    slug: 'funk',
    parentId: null,
    eraStart: 1960,
    eraEnd: null,
    decade: '1960s',
    bpmMin: 90,
    bpmMax: 120,
    energyMin: 0.6,
    energyMax: 0.85,
    description: 'Rhythmic groove-based music with syncopated bass',
    originLocation: 'USA',
    culturalContext: 'Black American - James Brown, Parliament-Funkadelic, foundation of groove music'
  },

  {
    name: 'Soul',
    slug: 'soul',
    parentId: null,
    eraStart: 1950,
    eraEnd: null,
    decade: '1950s',
    bpmMin: 70,
    bpmMax: 110,
    energyMin: 0.4,
    energyMax: 0.75,
    description: 'Emotional vocal music blending gospel and R&B',
    originLocation: 'USA',
    culturalContext: 'Black American - Motown, Stax Records, gospel roots'
  },

  // ==========================================
  // FUNK/SOUL → DISCO (Black, Latino, LGBTQ+ foundation)
  // ==========================================
  {
    name: 'Disco',
    slug: 'disco',
    parentSlug: 'funk',
    eraStart: 1970,
    eraEnd: 1985,
    decade: '1970s',
    bpmMin: 110,
    bpmMax: 130,
    energyMin: 0.65,
    energyMax: 0.85,
    description: 'Four-on-the-floor dance music with string sections',
    originLocation: 'New York City, USA',
    culturalContext: 'Black, Latino, LGBTQ+ club culture - Paradise Garage, Studio 54 - foundation of all house music'
  },

  // ==========================================
  // DISCO → CHICAGO HOUSE (Black gay club culture)
  // ==========================================
  {
    name: 'Chicago House',
    slug: 'chicago-house',
    parentSlug: 'disco',
    eraStart: 1980,
    eraEnd: null,
    decade: '1980s',
    bpmMin: 115,
    bpmMax: 130,
    energyMin: 0.7,
    energyMax: 0.85,
    description: 'Four-on-the-floor electronic dance music',
    originLocation: 'Chicago, USA',
    culturalContext: 'Black American gay club culture - Frankie Knuckles (Warehouse), Ron Hardy (Music Box) - birth of house music in USA, DISTINCT from Afro House (African origins)'
  },

  {
    name: 'Ballroom',
    slug: 'ballroom',
    parentSlug: 'disco',
    eraStart: 1977,
    eraEnd: null,
    decade: '1970s',
    bpmMin: 115,
    bpmMax: 135,
    energyMin: 0.7,
    energyMax: 0.9,
    description: 'High-energy house for voguing competitions',
    originLocation: 'New York City, USA',
    culturalContext: 'Black and Latino LGBTQ+ culture - voguing, house balls, runway categories - Paris Is Burning documentary'
  },

  {
    name: 'Acid House',
    slug: 'acid-house',
    parentSlug: 'chicago-house',
    eraStart: 1987,
    eraEnd: null,
    decade: '1980s',
    bpmMin: 120,
    bpmMax: 130,
    energyMin: 0.75,
    energyMax: 0.9,
    description: 'House music with TB-303 basslines',
    originLocation: 'Chicago, USA',
    culturalContext: 'Phuture, DJ Pierre - TB-303 acid sound, catalyst for UK rave culture'
  },

  {
    name: 'Detroit Techno',
    slug: 'detroit-techno',
    parentSlug: 'chicago-house',
    eraStart: 1985,
    eraEnd: null,
    decade: '1980s',
    bpmMin: 120,
    bpmMax: 135,
    energyMin: 0.7,
    energyMax: 0.9,
    description: 'Futuristic techno with soul',
    originLocation: 'Detroit, USA',
    culturalContext: 'Black futurism - Belleville Three (Juan Atkins, Derrick May, Kevin Saunderson), second wave'
  },

  // ==========================================
  // ROOT: REGGAE & DUB (Jamaican foundation)
  // ==========================================
  {
    name: 'Reggae',
    slug: 'reggae',
    parentId: null,
    eraStart: 1968,
    eraEnd: null,
    decade: '1960s',
    bpmMin: 70,
    bpmMax: 110,
    energyMin: 0.4,
    energyMax: 0.7,
    description: 'Offbeat rhythm with bass emphasis',
    originLocation: 'Jamaica',
    culturalContext: 'Jamaican - Bob Marley, Peter Tosh, roots of sound system culture'
  },

  {
    name: 'Dub',
    slug: 'dub',
    parentSlug: 'reggae',
    eraStart: 1970,
    eraEnd: null,
    decade: '1970s',
    bpmMin: 70,
    bpmMax: 100,
    energyMin: 0.3,
    energyMax: 0.6,
    description: 'Instrumental reggae with echo and reverb',
    originLocation: 'Jamaica',
    culturalContext: 'King Tubby, Lee "Scratch" Perry - studio as instrument, influenced ALL bass music globally'
  },

  {
    name: 'Dancehall',
    slug: 'dancehall',
    parentSlug: 'reggae',
    eraStart: 1979,
    eraEnd: null,
    decade: '1970s',
    bpmMin: 85,
    bpmMax: 110,
    energyMin: 0.6,
    energyMax: 0.85,
    description: 'Digital reggae with MC culture',
    originLocation: 'Jamaica',
    culturalContext: 'Jamaican - digital production, MC toasting, influenced UK garage/jungle/grime'
  },

  // ==========================================
  // CARIBBEAN: SOCA & ZOUK (distinct from club music)
  // ==========================================
  {
    name: 'Soca',
    slug: 'soca',
    parentId: null,
    eraStart: 1970,
    eraEnd: null,
    decade: '1970s',
    bpmMin: 110,
    bpmMax: 140,
    energyMin: 0.7,
    energyMax: 0.9,
    description: 'High-energy carnival music',
    originLocation: 'Trinidad and Tobago',
    culturalContext: 'Caribbean carnival culture - fusion of soul and calypso, NOT related to Jersey/Baltimore club'
  },

  {
    name: 'Zouk',
    slug: 'zouk',
    parentId: null,
    eraStart: 1980,
    eraEnd: null,
    decade: '1980s',
    bpmMin: 90,
    bpmMax: 120,
    energyMin: 0.5,
    energyMax: 0.75,
    description: 'French Caribbean dance music',
    originLocation: 'Guadeloupe and Martinique',
    culturalContext: 'French Caribbean - Kassav, distinct from American club music traditions'
  },

  // ==========================================
  // AFRICAN: AFROBEAT & DERIVATIVES
  // ==========================================
  {
    name: 'Afrobeat',
    slug: 'afrobeat',
    parentId: null,
    eraStart: 1970,
    eraEnd: null,
    decade: '1970s',
    bpmMin: 90,
    bpmMax: 120,
    energyMin: 0.6,
    energyMax: 0.8,
    description: 'Jazz-funk fusion with African rhythms',
    originLocation: 'Nigeria',
    culturalContext: 'Fela Kuti - political consciousness, polyrhythmic grooves'
  },

  {
    name: 'Afro House',
    slug: 'afro-house',
    parentSlug: 'afrobeat',
    eraStart: 2000,
    eraEnd: null,
    decade: '2000s',
    bpmMin: 115,
    bpmMax: 125,
    energyMin: 0.6,
    energyMax: 0.8,
    description: 'House music with African percussion and rhythms',
    originLocation: 'South Africa / West Africa',
    culturalContext: 'African - NOT from Chicago house, evolved independently from Afrobeat with electronic production, tribal drums, African vocal samples'
  },

  {
    name: 'Amapiano',
    slug: 'amapiano',
    parentSlug: 'afro-house',
    eraStart: 2012,
    eraEnd: null,
    decade: '2010s',
    bpmMin: 108,
    bpmMax: 118,
    energyMin: 0.6,
    energyMax: 0.8,
    description: 'South African house with jazz and kwaito elements',
    originLocation: 'Johannesburg, South Africa',
    culturalContext: 'Township culture - fusion of Afro house, jazz, kwaito, log drum signature, slower tempo than typical house'
  },

  // ==========================================
  // DUB → UK SOUND SYSTEM CULTURE
  // ==========================================
  {
    name: 'Jungle',
    slug: 'jungle',
    parentSlug: 'dub',
    eraStart: 1992,
    eraEnd: null,
    decade: '1990s',
    bpmMin: 160,
    bpmMax: 180,
    energyMin: 0.8,
    energyMax: 0.95,
    description: 'Fast breakbeats with reggae basslines',
    originLocation: 'UK',
    culturalContext: 'UK Caribbean diaspora - Jamaican sound system + rave breakbeats, MC culture, ragga influence'
  },

  {
    name: 'UK Garage',
    slug: 'uk-garage',
    parentSlug: 'dub',
    eraStart: 1993,
    eraEnd: null,
    decade: '1990s',
    bpmMin: 128,
    bpmMax: 138,
    energyMin: 0.65,
    energyMax: 0.85,
    description: 'Syncopated garage house with UK flavor',
    originLocation: 'UK',
    culturalContext: 'UK Black music - breakbeat + house + jungle + reggae influences'
  },

  {
    name: 'Grime',
    slug: 'grime',
    parentSlug: 'uk-garage',
    eraStart: 2002,
    eraEnd: null,
    decade: '2000s',
    bpmMin: 138,
    bpmMax: 142,
    energyMin: 0.75,
    energyMax: 0.9,
    description: 'Electronic UK rap with aggressive sound',
    originLocation: 'East London, UK',
    culturalContext: 'UK Black British - pirate radio (Rinse FM), MC culture, council estates - Wiley, Dizzee Rascal, Skepta'
  },

  // ==========================================
  // BLACK AMERICAN CLUB MUSIC (distinct lineages)
  // ==========================================
  {
    name: 'Baltimore Club',
    slug: 'baltimore-club',
    parentSlug: 'chicago-house',
    eraStart: 1988,
    eraEnd: null,
    decade: '1980s',
    bpmMin: 120,
    bpmMax: 140,
    energyMin: 0.8,
    energyMax: 0.95,
    description: 'High-energy breakbeat house',
    originLocation: 'Baltimore, USA',
    culturalContext: 'Black American club culture - DJ Technics, Rod Lee, Miss Tony - breakbeat chops, club anthems'
  },

  {
    name: 'Jersey Club',
    slug: 'jersey-club',
    parentSlug: 'baltimore-club',
    eraStart: 2005,
    eraEnd: null,
    decade: '2000s',
    bpmMin: 135,
    bpmMax: 145,
    energyMin: 0.8,
    energyMax: 0.95,
    description: 'Bed-squeak samples and rapid-fire production',
    originLocation: 'Newark, New Jersey, USA',
    culturalContext: 'Black American club culture - Brick Bandits, DJ Sliink - distinct from Baltimore and NOT related to Soca/Zouk'
  },

  {
    name: 'Footwork',
    slug: 'footwork',
    parentSlug: 'chicago-house',
    eraStart: 2000,
    eraEnd: null,
    decade: '2000s',
    bpmMin: 155,
    bpmMax: 165,
    energyMin: 0.85,
    energyMax: 0.95,
    description: 'Ultra-fast juke with intricate samples',
    originLocation: 'South Side Chicago, USA',
    culturalContext: 'South Side Chicago Black dance culture - DJ Rashad, RP Boo, Traxman - battle dance origins'
  },

  // ==========================================
  // TRAP (Southern Black rap culture)
  // ==========================================
  {
    name: 'Trap',
    slug: 'trap',
    parentSlug: 'funk', // Evolved from Southern funk/rap traditions
    eraStart: 2000,
    eraEnd: null,
    decade: '2000s',
    bpmMin: 130,
    bpmMax: 170,
    energyMin: 0.7,
    energyMax: 0.9,
    description: 'Southern hip hop with 808 drums and rolling hi-hats',
    originLocation: 'Atlanta, USA',
    culturalContext: 'Southern Black rap culture - T.I., Gucci Mane, Young Jeezy - trap house origins'
  }
];

/**
 * Seed additional genres
 */
async function seedAdditionalGenres() {
  console.log('Seeding additional foundational genres...');

  let addedCount = 0;
  let skippedCount = 0;

  for (const genreData of additionalGenres) {
    try {
      // Check if genre already exists
      const existing = genreTaxonomy.db.prepare(
        'SELECT id FROM genres WHERE slug = ?'
      ).get(genreData.slug);

      if (existing) {
        console.log(`  ⏭️  Skipping ${genreData.name} (already exists)`);
        skippedCount++;
        continue;
      }

      // Find parent ID if parentSlug is specified
      let parentId = genreData.parentId || null;
      if (genreData.parentSlug) {
        const parent = genreTaxonomy.db.prepare(
          'SELECT id FROM genres WHERE slug = ?'
        ).get(genreData.parentSlug);

        if (parent) {
          parentId = parent.id;
        } else {
          console.log(`  ⚠️  Warning: Parent genre '${genreData.parentSlug}' not found for ${genreData.name}`);
        }
      }

      // Insert genre
      genreTaxonomy.db.prepare(`
        INSERT INTO genres (
          name, slug, parent_id, era_start, era_end, decade,
          bpm_min, bpm_max, energy_min, energy_max,
          description, origin_location, cultural_context
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        genreData.name,
        genreData.slug,
        parentId,
        genreData.eraStart,
        genreData.eraEnd,
        genreData.decade,
        genreData.bpmMin,
        genreData.bpmMax,
        genreData.energyMin,
        genreData.energyMax,
        genreData.description,
        genreData.originLocation,
        genreData.culturalContext
      );

      console.log(`  ✅ Added ${genreData.name}`);
      addedCount++;

    } catch (error) {
      console.error(`  ❌ Error adding ${genreData.name}:`, error.message);
    }
  }

  console.log(`\nGenre seeding complete: ${addedCount} added, ${skippedCount} skipped`);
}

module.exports = { seedAdditionalGenres, additionalGenres };
