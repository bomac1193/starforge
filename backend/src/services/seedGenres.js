const genreTaxonomy = require('./genreTaxonomy');

/**
 * Seed Genre Taxonomy Database
 * Comprehensive music genre database with historical lineages
 * 
 * Structure: Root genres → Subgenres → Micro-genres
 * Includes BPM ranges, energy levels, and temporal data
 */

const genres = [
  // ROOT: ELECTRONIC
  {
    name: 'Electronic',
    slug: 'electronic',
    parentId: null,
    eraStart: 1970,
    eraEnd: null,
    decade: '1970s',
    bpmMin: 80,
    bpmMax: 180,
    energyMin: 0.3,
    energyMax: 0.95,
    description: 'Electronic music produced using electronic instruments',
    originLocation: 'Global',
    culturalContext: 'Technology-driven music revolution'
  },
  
  // ELECTRONIC → HOUSE
  {
    name: 'House',
    slug: 'house',
    parentSlug: 'electronic',
    eraStart: 1980,
    eraEnd: null,
    decade: '1980s',
    bpmMin: 115,
    bpmMax: 130,
    energyMin: 0.6,
    energyMax: 0.85,
    description: 'Four-on-the-floor electronic dance music',
    originLocation: 'Chicago, USA',
    culturalContext: 'Underground club scene, black and LGBTQ+ communities'
  },
  
  {
    name: 'Deep House',
    slug: 'deep-house',
    parentSlug: 'house',
    eraStart: 1985,
    eraEnd: null,
    decade: '1980s',
    bpmMin: 115,
    bpmMax: 125,
    energyMin: 0.5,
    energyMax: 0.7,
    description: 'Soulful, atmospheric house with jazz influences',
    originLocation: 'Chicago/New York',
    culturalContext: 'Sophisticated club culture'
  },
  
  {
    name: 'Tech House',
    slug: 'tech-house',
    parentSlug: 'house',
    eraStart: 1990,
    eraEnd: null,
    decade: '1990s',
    bpmMin: 120,
    bpmMax: 130,
    energyMin: 0.65,
    energyMax: 0.8,
    description: 'Minimal house with techno elements',
    originLocation: 'UK/Germany',
    culturalContext: 'Fusion of house groove and techno minimalism'
  },
  
  {
    name: 'Progressive House',
    slug: 'progressive-house',
    parentSlug: 'house',
    eraStart: 1992,
    eraEnd: null,
    decade: '1990s',
    bpmMin: 120,
    bpmMax: 130,
    energyMin: 0.6,
    energyMax: 0.85,
    description: 'Melodic house with gradual build-ups',
    originLocation: 'UK',
    culturalContext: 'Evolution of house into more complex structures'
  },
  
  {
    name: 'Future House',
    slug: 'future-house',
    parentSlug: 'deep-house',
    eraStart: 2013,
    eraEnd: null,
    decade: '2010s',
    bpmMin: 120,
    bpmMax: 128,
    energyMin: 0.7,
    energyMax: 0.9,
    description: 'Bouncy bass-driven house with modern production',
    originLocation: 'Netherlands',
    culturalContext: 'Festival-friendly evolution of deep house'
  },
  
  // ELECTRONIC → TECHNO
  {
    name: 'Techno',
    slug: 'techno',
    parentSlug: 'electronic',
    eraStart: 1985,
    eraEnd: null,
    decade: '1980s',
    bpmMin: 120,
    bpmMax: 150,
    energyMin: 0.7,
    energyMax: 0.95,
    description: 'Repetitive, hypnotic electronic music',
    originLocation: 'Detroit, USA',
    culturalContext: 'Post-industrial urban soundscape'
  },
  
  {
    name: 'Detroit Techno',
    slug: 'detroit-techno',
    parentSlug: 'techno',
    eraStart: 1985,
    eraEnd: 1995,
    decade: '1980s',
    bpmMin: 120,
    bpmMax: 135,
    energyMin: 0.7,
    energyMax: 0.85,
    description: 'Soulful, futuristic techno from Detroit pioneers',
    originLocation: 'Detroit, USA',
    culturalContext: 'Belleville Three and second wave'
  },
  
  {
    name: 'Minimal Techno',
    slug: 'minimal-techno',
    parentSlug: 'techno',
    eraStart: 1992,
    eraEnd: null,
    decade: '1990s',
    bpmMin: 125,
    bpmMax: 135,
    energyMin: 0.6,
    energyMax: 0.75,
    description: 'Stripped-down, repetitive techno',
    originLocation: 'Germany',
    culturalContext: 'Reduction to essential elements'
  },
  
  {
    name: 'Industrial Techno',
    slug: 'industrial-techno',
    parentSlug: 'techno',
    eraStart: 2010,
    eraEnd: null,
    decade: '2010s',
    bpmMin: 130,
    bpmMax: 150,
    energyMin: 0.85,
    energyMax: 0.95,
    description: 'Hard, aggressive techno with industrial sounds',
    originLocation: 'Berlin',
    culturalContext: 'Dark warehouse rave culture'
  },
  
  // ELECTRONIC → TRANCE
  {
    name: 'Trance',
    slug: 'trance',
    parentSlug: 'electronic',
    eraStart: 1990,
    eraEnd: null,
    decade: '1990s',
    bpmMin: 125,
    bpmMax: 150,
    energyMin: 0.7,
    energyMax: 0.9,
    description: 'Melodic electronic music with hypnotic elements',
    originLocation: 'Germany',
    culturalContext: 'Euphoric dance music'
  },
  
  {
    name: 'Progressive Trance',
    slug: 'progressive-trance',
    parentSlug: 'trance',
    eraStart: 1995,
    eraEnd: null,
    decade: '1990s',
    bpmMin: 128,
    bpmMax: 140,
    energyMin: 0.6,
    energyMax: 0.8,
    description: 'Deeper, more progressive trance',
    originLocation: 'UK',
    culturalContext: 'Evolution away from anthem trance'
  },
  
  {
    name: 'Psytrance',
    slug: 'psytrance',
    parentSlug: 'trance',
    eraStart: 1995,
    eraEnd: null,
    decade: '1990s',
    bpmMin: 135,
    bpmMax: 150,
    energyMin: 0.8,
    energyMax: 0.95,
    description: 'Psychedelic trance with rolling basslines',
    originLocation: 'Goa, India',
    culturalContext: 'Psychedelic festival culture'
  },
  
  // ELECTRONIC → DRUM AND BASS
  {
    name: 'Drum and Bass',
    slug: 'drum-and-bass',
    parentSlug: 'electronic',
    eraStart: 1992,
    eraEnd: null,
    decade: '1990s',
    bpmMin: 160,
    bpmMax: 180,
    energyMin: 0.75,
    energyMax: 0.95,
    description: 'Fast breakbeats with heavy bass',
    originLocation: 'UK',
    culturalContext: 'Evolution from jungle and rave'
  },
  
  {
    name: 'Liquid DnB',
    slug: 'liquid-dnb',
    parentSlug: 'drum-and-bass',
    eraStart: 2000,
    eraEnd: null,
    decade: '2000s',
    bpmMin: 170,
    bpmMax: 180,
    energyMin: 0.6,
    energyMax: 0.75,
    description: 'Melodic, soulful drum and bass',
    originLocation: 'UK',
    culturalContext: 'Smoother evolution of DnB'
  },
  
  {
    name: 'Neurofunk',
    slug: 'neurofunk',
    parentSlug: 'drum-and-bass',
    eraStart: 1997,
    eraEnd: null,
    decade: '1990s',
    bpmMin: 170,
    bpmMax: 180,
    energyMin: 0.85,
    energyMax: 0.95,
    description: 'Dark, technical drum and bass',
    originLocation: 'UK',
    culturalContext: 'Futuristic, aggressive sound design'
  },
  
  // ELECTRONIC → DUBSTEP
  {
    name: 'Dubstep',
    slug: 'dubstep',
    parentSlug: 'electronic',
    eraStart: 2002,
    eraEnd: null,
    decade: '2000s',
    bpmMin: 138,
    bpmMax: 142,
    energyMin: 0.7,
    energyMax: 0.9,
    description: 'Half-time rhythms with heavy sub-bass',
    originLocation: 'London, UK',
    culturalContext: 'Evolution from UK garage and 2-step'
  },
  
  {
    name: 'Brostep',
    slug: 'brostep',
    parentSlug: 'dubstep',
    eraStart: 2010,
    eraEnd: 2015,
    decade: '2010s',
    bpmMin: 140,
    bpmMax: 150,
    energyMin: 0.85,
    energyMax: 0.95,
    description: 'Aggressive, mid-range heavy dubstep',
    originLocation: 'USA',
    culturalContext: 'Mainstream dubstep evolution'
  },
  
  {
    name: 'Future Bass',
    slug: 'future-bass',
    parentSlug: 'dubstep',
    eraStart: 2013,
    eraEnd: null,
    decade: '2010s',
    bpmMin: 130,
    bpmMax: 160,
    energyMin: 0.65,
    energyMax: 0.85,
    description: 'Melodic bass music with lush synths',
    originLocation: 'Global (internet)',
    culturalContext: 'Melodic evolution of bass music'
  },
  
  // ROOT: HIP HOP
  {
    name: 'Hip Hop',
    slug: 'hip-hop',
    parentId: null,
    eraStart: 1973,
    eraEnd: null,
    decade: '1970s',
    bpmMin: 80,
    bpmMax: 110,
    energyMin: 0.5,
    energyMax: 0.85,
    description: 'Rap music with breakbeats',
    originLocation: 'Bronx, New York',
    culturalContext: 'African American urban culture'
  },
  
  {
    name: 'Trap',
    slug: 'trap',
    parentSlug: 'hip-hop',
    eraStart: 2000,
    eraEnd: null,
    decade: '2000s',
    bpmMin: 130,
    bpmMax: 170,
    energyMin: 0.7,
    energyMax: 0.9,
    description: 'Southern hip hop with 808 drums and hi-hats',
    originLocation: 'Atlanta, USA',
    culturalContext: 'Southern rap evolution'
  },
  
  {
    name: 'Drill',
    slug: 'drill',
    parentSlug: 'trap',
    eraStart: 2010,
    eraEnd: null,
    decade: '2010s',
    bpmMin: 130,
    bpmMax: 150,
    energyMin: 0.7,
    energyMax: 0.85,
    description: 'Dark, nihilistic trap music',
    originLocation: 'Chicago, USA / UK',
    culturalContext: 'Street culture and violence'
  },
  
  // ROOT: AMBIENT
  {
    name: 'Ambient',
    slug: 'ambient',
    parentId: null,
    eraStart: 1970,
    eraEnd: null,
    decade: '1970s',
    bpmMin: 0,
    bpmMax: 90,
    energyMin: 0.1,
    energyMax: 0.4,
    description: 'Atmospheric, textural soundscapes',
    originLocation: 'UK',
    culturalContext: 'Brian Eno and experimental music'
  },
  
  {
    name: 'Dark Ambient',
    slug: 'dark-ambient',
    parentSlug: 'ambient',
    eraStart: 1980,
    eraEnd: null,
    decade: '1980s',
    bpmMin: 0,
    bpmMax: 80,
    energyMin: 0.1,
    energyMax: 0.3,
    description: 'Ominous, industrial-influenced ambient',
    originLocation: 'Europe',
    culturalContext: 'Industrial and drone music influence'
  },
  
  // ROOT: ROCK
  {
    name: 'Rock',
    slug: 'rock',
    parentId: null,
    eraStart: 1950,
    eraEnd: null,
    decade: '1950s',
    bpmMin: 100,
    bpmMax: 180,
    energyMin: 0.6,
    energyMax: 0.95,
    description: 'Electric guitar-based popular music',
    originLocation: 'USA',
    culturalContext: 'Youth culture revolution'
  },
  
  {
    name: 'Alternative Rock',
    slug: 'alternative-rock',
    parentSlug: 'rock',
    eraStart: 1980,
    eraEnd: null,
    decade: '1980s',
    bpmMin: 110,
    bpmMax: 160,
    energyMin: 0.6,
    energyMax: 0.85,
    description: 'Non-mainstream rock music',
    originLocation: 'USA/UK',
    culturalContext: 'Independent label culture'
  },
  
  {
    name: 'Indie Rock',
    slug: 'indie-rock',
    parentSlug: 'alternative-rock',
    eraStart: 1990,
    eraEnd: null,
    decade: '1990s',
    bpmMin: 110,
    bpmMax: 150,
    energyMin: 0.5,
    energyMax: 0.75,
    description: 'Independent, DIY rock music',
    originLocation: 'Global',
    culturalContext: 'DIY ethos and independent labels'
  }
];

console.log('Seeding genre taxonomy database...');

// Track parent lookups
const genresBySlug = {};

// First pass: Add all genres without parent references
genres.forEach((genreData, index) => {
  try {
    const data = {
      ...genreData,
      parentId: null // Set parent later in second pass
    };
    
    const genreId = genreTaxonomy.addGenre(data);
    genresBySlug[genreData.slug] = genreId;
    
    console.log(`✓ Added: ${genreData.name} (${genreData.slug}) - ID: ${genreId}`);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      console.log(`⊘ Skipped: ${genreData.name} (already exists)`);
      const existing = genreTaxonomy.getGenre(genreData.slug);
      genresBySlug[genreData.slug] = existing.id;
    } else {
      console.error(`✗ Error adding ${genreData.name}:`, error.message);
    }
  }
});

// Second pass: Update parent references
console.log('\nUpdating parent relationships...');
genres.forEach(genreData => {
  if (genreData.parentSlug) {
    const parentId = genresBySlug[genreData.parentSlug];
    const childId = genresBySlug[genreData.slug];
    
    if (parentId && childId) {
      try {
        genreTaxonomy.db.prepare('UPDATE genres SET parent_id = ? WHERE id = ?')
          .run(parentId, childId);
        console.log(`✓ Linked: ${genreData.name} → ${genreData.parentSlug}`);
      } catch (error) {
        console.error(`✗ Error linking ${genreData.name}:`, error.message);
      }
    }
  }
});

// Print summary
const rootGenres = genreTaxonomy.getRootGenres();
const totalGenres = genreTaxonomy.db.prepare('SELECT COUNT(*) as count FROM genres').get();

console.log(`\n✓ Genre taxonomy seed complete!`);
console.log(`Total genres: ${totalGenres.count}`);
console.log(`Root genres: ${rootGenres.length}`);
console.log(`Lineages: ${totalGenres.count - rootGenres.length}`);

// Example lineage query
console.log('\nExample lineage (Future House):');
const futureHouse = genreTaxonomy.getGenre('future-house');
if (futureHouse) {
  const lineage = genreTaxonomy.getLineage(futureHouse.id);
  console.log(lineage.map(g => g.name).join(' → '));
}

genreTaxonomy.close();
