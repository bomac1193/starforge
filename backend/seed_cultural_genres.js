const Database = require('better-sqlite3');
const path = require('path');

/**
 * Culturally Accurate Genre Taxonomy Seed
 * Properly represents Black music, African diasporic, and Caribbean lineages
 * Critical for influence genealogy accuracy
 */

const dbPath = path.join(__dirname, 'starforge_genres.db');
const db = new Database(dbPath);

// Clear existing data and disable foreign key constraints temporarily
db.exec('PRAGMA foreign_keys = OFF');
db.exec('DELETE FROM genres');
db.exec('PRAGMA foreign_keys = ON');

const genres = [
  // ============================================
  // CARIBBEAN ROOTS (Sound System Culture)
  // ============================================
  {
    name: 'Reggae',
    slug: 'reggae',
    parent_id: null,
    era_start: 1968,
    decade: '1960s',
    bpm_min: 60,
    bpm_max: 90,
    energy_min: 0.3,
    energy_max: 0.7,
    origin_location: 'Jamaica',
    cultural_context: 'Jamaican sound system culture, roots of UK bass music lineage',
    description: 'Foundation of Caribbean musical diaspora and UK underground electronic music'
  },
  {
    name: 'Dub',
    slug: 'dub',
    parent_slug: 'reggae', // Will be resolved to ID
    era_start: 1970,
    decade: '1970s',
    bpm_min: 60,
    bpm_max: 90,
    energy_min: 0.2,
    energy_max: 0.6,
    origin_location: 'Jamaica',
    cultural_context: 'King Tubby, Lee Perry - studio as instrument, bass emphasis, sound system culture',
    description: 'Pioneered remix culture, influenced ALL electronic bass music globally'
  },
  {
    name: 'Dancehall',
    slug: 'dancehall',
    parent_id: 1, // Reggae
    era_start: 1979,
    decade: '1970s',
    bpm_min: 80,
    bpm_max: 110,
    energy_min: 0.6,
    energy_max: 0.9,
    origin_location: 'Jamaica',
    cultural_context: 'Digital reggae, MC culture, sound clashes',
    description: 'Direct influence on UK garage, jungle, grime'
  },

  // ============================================
  // BLACK AMERICAN CLUB MUSIC (House & Techno)
  // ============================================
  {
    name: 'Disco',
    slug: 'disco',
    parent_id: null,
    era_start: 1970,
    decade: '1970s',
    bpm_min: 110,
    bpm_max: 130,
    energy_min: 0.6,
    energy_max: 0.9,
    origin_location: 'New York City',
    cultural_context: 'Black, Latino, LGBTQ+ club culture - Paradise Garage, Studio 54',
    description: 'Foundation of house and techno, 4/4 beat, DJ culture'
  },
  {
    name: 'Chicago House',
    slug: 'chicago-house',
    parent_id: 4, // Disco
    era_start: 1981,
    decade: '1980s',
    bpm_min: 115,
    bpm_max: 130,
    energy_min: 0.5,
    energy_max: 0.8,
    origin_location: 'Chicago, USA',
    cultural_context: 'Frankie Knuckles (The Warehouse), Ron Hardy (Music Box) - Black gay club culture, birth of house music',
    description: 'First genre called "house" - named after The Warehouse club'
  },
  {
    name: 'Deep House',
    slug: 'deep-house',
    parent_id: 5, // Chicago House
    era_start: 1985,
    decade: '1980s',
    bpm_min: 115,
    bpm_max: 125,
    energy_min: 0.4,
    energy_max: 0.7,
    origin_location: 'Chicago/New York',
    cultural_context: 'Larry Heard (Mr. Fingers), Marshall Jefferson - soulful, jazzy, introspective',
    description: 'Emotional, atmospheric evolution of house'
  },
  {
    name: 'Detroit Techno',
    slug: 'detroit-techno',
    parent_id: 4, // Disco
    era_start: 1985,
    decade: '1980s',
    bpm_min: 120,
    bpm_max: 135,
    energy_min: 0.5,
    energy_max: 0.8,
    origin_location: 'Detroit, USA',
    cultural_context: 'Belleville Three (Juan Atkins, Derrick May, Kevin Saunderson) - Black futurism, post-industrial Detroit',
    description: 'Afrofuturism meets Kraftwerk, birth of techno'
  },
  {
    name: 'Acid House',
    slug: 'acid-house',
    parent_id: 5, // Chicago House
    era_start: 1987,
    decade: '1980s',
    bpm_min: 120,
    bpm_max: 130,
    energy_min: 0.6,
    energy_max: 0.9,
    origin_location: 'Chicago',
    cultural_context: 'Phuture, DJ Pierre - TB-303 sound, psychedelic',
    description: 'Iconic 303 squelch, UK rave culture catalyst'
  },

  // ============================================
  // UK BASS LINEAGE (Caribbean Diaspora)
  // ============================================
  {
    name: 'UK Garage',
    slug: 'uk-garage',
    parent_id: 5, // Chicago House
    era_start: 1990,
    decade: '1990s',
    bpm_min: 130,
    bpm_max: 140,
    energy_min: 0.6,
    energy_max: 0.9,
    origin_location: 'London, UK',
    cultural_context: 'UK Black British + Caribbean influence, speed garage, 2-step, pirate radio',
    description: 'Sped-up house with Caribbean swing, foundation of UK bass music'
  },
  {
    name: 'Jungle',
    slug: 'jungle',
    parent_id: 2, // Dub (Jamaican roots)
    era_start: 1991,
    decade: '1990s',
    bpm_min: 160,
    bpm_max: 180,
    energy_min: 0.7,
    energy_max: 1.0,
    origin_location: 'London, UK',
    cultural_context: 'Jamaican sound system culture + rave breakbeats - UK Caribbean diaspora, MC culture, dub basslines',
    description: 'Precursor to Drum & Bass, heavy Caribbean influence, breakbeat + reggae bass'
  },
  {
    name: 'Drum and Bass',
    slug: 'drum-and-bass',
    parent_id: 10, // Jungle
    era_start: 1994,
    decade: '1990s',
    bpm_min: 160,
    bpm_max: 180,
    energy_min: 0.6,
    energy_max: 1.0,
    origin_location: 'UK',
    cultural_context: 'Evolution of jungle - more refined, less ragga vocals, maintained Caribbean bass culture',
    description: 'Jungle refined - breakbeats + sub-bass'
  },
  {
    name: 'Grime',
    slug: 'grime',
    parent_id: 9, // UK Garage
    era_start: 2002,
    decade: '2000s',
    bpm_min: 135,
    bpm_max: 142,
    energy_min: 0.7,
    energy_max: 1.0,
    origin_location: 'East London, UK',
    cultural_context: 'UK Black British youth culture - pirate radio (Rinse FM, Deja Vu), MCs, grime instrumentals',
    description: 'Wiley, Dizzee Rascal, Skepta - garage stripped down, aggressive, MC-driven'
  },
  {
    name: 'Dubstep',
    slug: 'dubstep',
    parent_id: 9, // UK Garage
    era_start: 2002,
    decade: '2000s',
    bpm_min: 138,
    bpm_max: 142,
    energy_min: 0.5,
    energy_max: 0.9,
    origin_location: 'South London, UK',
    cultural_context: 'UK garage slowed down + dub reggae influence - FWD>>, DMZ, Big Apple Records',
    description: 'Garage + dub reggae = half-time bass music'
  },

  // ============================================
  // AFRICAN DIASPORIC (Contemporary)
  // ============================================
  {
    name: 'Afrobeat',
    slug: 'afrobeat',
    parent_id: null,
    era_start: 1970,
    decade: '1970s',
    bpm_min: 100,
    bpm_max: 130,
    energy_min: 0.6,
    energy_max: 0.9,
    origin_location: 'Nigeria',
    cultural_context: 'Fela Kuti - West African rhythms + jazz + funk, political',
    description: 'Foundation of African electronic music influence'
  },
  {
    name: 'Afrobeats',
    slug: 'afrobeats',
    parent_id: 14, // Afrobeat
    era_start: 2000,
    decade: '2000s',
    bpm_min: 100,
    bpm_max: 130,
    energy_min: 0.6,
    energy_max: 0.9,
    origin_location: 'Nigeria/Ghana',
    cultural_context: 'Modern fusion - afrobeat + dancehall + hip hop, global African diaspora',
    description: 'Contemporary African pop, massive global influence'
  },
  {
    name: 'Amapiano',
    slug: 'amapiano',
    parent_id: 14, // Afrobeat lineage
    era_start: 2012,
    decade: '2010s',
    bpm_min: 108,
    bpm_max: 118,
    energy_min: 0.5,
    energy_max: 0.8,
    origin_location: 'South Africa',
    cultural_context: 'Townships of Johannesburg - house + jazz + kwaito',
    description: 'South African house variant, log drum, jazzy chords'
  },
  {
    name: 'Baile Funk',
    slug: 'baile-funk',
    parent_id: null,
    era_start: 1989,
    decade: '1980s',
    bpm_min: 128,
    bpm_max: 145,
    energy_min: 0.8,
    energy_max: 1.0,
    origin_location: 'Rio de Janeiro, Brazil',
    cultural_context: 'Favela culture - Miami bass + Brazilian rhythms, African diaspora in Brazil',
    description: 'Brazilian funk, high energy, favela parties'
  },
  {
    name: 'Kuduro',
    slug: 'kuduro',
    parent_id: null,
    era_start: 1990,
    decade: '1990s',
    bpm_min: 130,
    bpm_max: 145,
    energy_min: 0.8,
    energy_max: 1.0,
    origin_location: 'Angola',
    cultural_context: 'African diaspora - electronic + traditional Angolan music, post-war youth culture',
    description: 'Fast-paced Angolan electronic dance music'
  },

  // ============================================
  // BLACK AMERICAN CONTEMPORARY
  // ============================================
  {
    name: 'Footwork',
    slug: 'footwork',
    parent_id: 5, // Chicago House lineage
    era_start: 2000,
    decade: '2000s',
    bpm_min: 150,
    bpm_max: 170,
    energy_min: 0.7,
    energy_max: 1.0,
    origin_location: 'Chicago, USA',
    cultural_context: 'South Side Chicago - Black dance culture, battle dancing, DJ Rashad, RP Boo',
    description: 'Hyper-fast Chicago dance music, juke evolution'
  },
  {
    name: 'Jersey Club',
    slug: 'jersey-club',
    parent_id: 4, // Disco/House lineage
    era_start: 2004,
    decade: '2000s',
    bpm_min: 135,
    bpm_max: 145,
    energy_min: 0.7,
    energy_max: 1.0,
    origin_location: 'Newark/Jersey City, USA',
    cultural_context: 'Black American club culture - Baltimore club influence, Brick Bandits',
    description: 'Fast, choppy, bed-squeak samples'
  },
  {
    name: 'Baltimore Club',
    slug: 'baltimore-club',
    parent_id: 4, // Disco/House lineage
    era_start: 1988,
    decade: '1980s',
    bpm_min: 125,
    bpm_max: 135,
    energy_min: 0.7,
    energy_max: 0.9,
    origin_location: 'Baltimore, USA',
    cultural_context: 'Black American club culture - house + hip hop breaks, DJ Technics, Rod Lee',
    description: 'Breakbeat house, influenced Jersey Club'
  },
  {
    name: 'Hip Hop',
    slug: 'hip-hop',
    parent_id: null,
    era_start: 1973,
    decade: '1970s',
    bpm_min: 80,
    bpm_max: 110,
    energy_min: 0.5,
    energy_max: 0.9,
    origin_location: 'Bronx, New York',
    cultural_context: 'African American + Caribbean youth culture - DJ Kool Herc, breakbeats, MCing, b-boying',
    description: 'Foundation of modern urban music culture'
  },
  {
    name: 'Trap',
    slug: 'trap',
    parent_id: 22, // Hip Hop
    era_start: 2000,
    decade: '2000s',
    bpm_min: 130,
    bpm_max: 170,
    energy_min: 0.6,
    energy_max: 0.9,
    origin_location: 'Atlanta, USA',
    cultural_context: 'Southern Black American rap culture - T.I., Gucci Mane, Young Jeezy',
    description: 'Hard-hitting 808s, hi-hat rolls, Southern rap'
  },

  // ============================================
  // ELECTRONIC (Non-Black but influenced)
  // ============================================
  {
    name: 'Techno',
    slug: 'techno',
    parent_id: 7, // Detroit Techno is the root
    era_start: 1988,
    decade: '1980s',
    bpm_min: 120,
    bpm_max: 150,
    energy_min: 0.6,
    energy_max: 1.0,
    origin_location: 'Europe',
    cultural_context: 'European interpretation of Detroit techno, rave culture',
    description: 'Detroit techno spread to Europe, harder/faster evolution'
  },
  {
    name: 'Ambient',
    slug: 'ambient',
    parent_id: null,
    era_start: 1970,
    decade: '1970s',
    bpm_min: 0,
    bpm_max: 100,
    energy_min: 0.1,
    energy_max: 0.4,
    origin_location: 'UK',
    cultural_context: 'Brian Eno - Music for Airports, experimental, atmospheric',
    description: 'Non-rhythmic, atmospheric electronic music'
  },
  {
    name: 'Trance',
    slug: 'trance',
    parent_id: 24, // Techno
    era_start: 1990,
    decade: '1990s',
    bpm_min: 125,
    bpm_max: 145,
    energy_min: 0.6,
    energy_max: 0.9,
    origin_location: 'Germany',
    cultural_context: 'European rave culture - euphoric, melodic',
    description: 'Melodic, uplifting dance music'
  }
];

// Insert genres
const insertStmt = db.prepare(`
  INSERT INTO genres (
    name, slug, parent_id, era_start, decade,
    bpm_min, bpm_max, energy_min, energy_max,
    origin_location, cultural_context, description
  ) VALUES (
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?,
    ?, ?, ?
  )
`);

genres.forEach(genre => {
  insertStmt.run(
    genre.name,
    genre.slug,
    genre.parent_id,
    genre.era_start,
    genre.decade,
    genre.bpm_min,
    genre.bpm_max,
    genre.energy_min,
    genre.energy_max,
    genre.origin_location,
    genre.cultural_context,
    genre.description
  );
});

console.log(`✓ Seeded ${genres.length} culturally accurate genres`);
console.log('\nKey lineages:');
console.log('- Caribbean → Jungle → Drum & Bass, UK Garage → Grime, Dubstep');
console.log('- Chicago House (Black gay clubs) → Deep House, Acid House');
console.log('- Detroit Techno (Belleville Three, Black futurism)');
console.log('- African Diaspora → Afrobeat, Amapiano, Baile Funk, Kuduro');
console.log('- Chicago Footwork, Jersey Club, Baltimore Club');

db.close();
