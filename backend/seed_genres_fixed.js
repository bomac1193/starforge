const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'starforge_genres.db');
const db = new Database(dbPath);

// Clear
db.exec('PRAGMA foreign_keys = OFF');
db.exec('DELETE FROM genres');

// Insert helper
const insert = (genre) => {
  let parentId = null;
  if (genre.parent_slug) {
    const parent = db.prepare('SELECT id FROM genres WHERE slug = ?').get(genre.parent_slug);
    if (parent) parentId = parent.id;
  }

  db.prepare(`
    INSERT INTO genres (
      name, slug, parent_id, era_start, decade,
      bpm_min, bpm_max, energy_min, energy_max,
      origin_location, cultural_context, description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    genre.name, genre.slug, parentId, genre.era_start, genre.decade,
    genre.bpm_min, genre.bpm_max, genre.energy_min, genre.energy_max,
    genre.origin_location, genre.cultural_context, genre.description
  );
};

// Roots first
insert({ name: 'Reggae', slug: 'reggae', era_start: 1968, decade: '1960s', bpm_min: 60, bpm_max: 90, energy_min: 0.3, energy_max: 0.7, origin_location: 'Jamaica', cultural_context: 'Jamaican sound system culture, roots of UK bass music', description: 'Foundation of Caribbean musical diaspora' });
insert({ name: 'Disco', slug: 'disco', era_start: 1970, decade: '1970s', bpm_min: 110, bpm_max: 130, energy_min: 0.6, energy_max: 0.9, origin_location: 'New York City', cultural_context: 'Black, Latino, LGBTQ+ club culture - Paradise Garage, Studio 54', description: 'Foundation of house and techno' });
insert({ name: 'Hip Hop', slug: 'hip-hop', era_start: 1973, decade: '1970s', bpm_min: 80, bpm_max: 110, energy_min: 0.5, energy_max: 0.9, origin_location: 'Bronx, New York', cultural_context: 'African American + Caribbean - DJ Kool Herc, breakbeats', description: 'Foundation of urban music' });
insert({ name: 'Afrobeat', slug: 'afrobeat', era_start: 1970, decade: '1970s', bpm_min: 100, bpm_max: 130, energy_min: 0.6, energy_max: 0.9, origin_location: 'Nigeria', cultural_context: 'Fela Kuti - West African rhythms + jazz + funk', description: 'Foundation of African electronic' });
insert({ name: 'Baile Funk', slug: 'baile-funk', era_start: 1989, decade: '1980s', bpm_min: 128, bpm_max: 145, energy_min: 0.8, energy_max: 1.0, origin_location: 'Rio, Brazil', cultural_context: 'Favela culture, African diaspora Brazil', description: 'Brazilian funk' });
insert({ name: 'Kuduro', slug: 'kuduro', era_start: 1990, decade: '1990s', bpm_min: 130, bpm_max: 145, energy_min: 0.8, energy_max: 1.0, origin_location: 'Angola', cultural_context: 'African diaspora, post-war youth culture', description: 'Angolan electronic' });
insert({ name: 'Ambient', slug: 'ambient', era_start: 1970, decade: '1970s', bpm_min: 0, bpm_max: 100, energy_min: 0.1, energy_max: 0.4, origin_location: 'UK', cultural_context: 'Brian Eno - Music for Airports', description: 'Atmospheric electronic' });

// Children
insert({ name: 'Dub', slug: 'dub', parent_slug: 'reggae', era_start: 1970, decade: '1970s', bpm_min: 60, bpm_max: 90, energy_min: 0.2, energy_max: 0.6, origin_location: 'Jamaica', cultural_context: 'King Tubby, Lee Perry - studio as instrument, influenced ALL bass music', description: 'Pioneered remix culture' });
insert({ name: 'Dancehall', slug: 'dancehall', parent_slug: 'reggae', era_start: 1979, decade: '1970s', bpm_min: 80, bpm_max: 110, energy_min: 0.6, energy_max: 0.9, origin_location: 'Jamaica', cultural_context: 'Digital reggae, MC culture, influenced UK garage/jungle/grime', description: 'Direct influence on UK bass' });

insert({ name: 'Chicago House', slug: 'chicago-house', parent_slug: 'disco', era_start: 1981, decade: '1980s', bpm_min: 115, bpm_max: 130, energy_min: 0.5, energy_max: 0.8, origin_location: 'Chicago', cultural_context: 'Frankie Knuckles (Warehouse), Ron Hardy (Music Box) - Black gay club culture', description: 'Birth of house music' });
insert({ name: 'Detroit Techno', slug: 'detroit-techno', parent_slug: 'disco', era_start: 1985, decade: '1980s', bpm_min: 120, bpm_max: 135, energy_min: 0.5, energy_max: 0.8, origin_location: 'Detroit', cultural_context: 'Belleville Three (Juan Atkins, Derrick May, Kevin Saunderson) - Black futurism', description: 'Birth of techno' });

insert({ name: 'Deep House', slug: 'deep-house', parent_slug: 'chicago-house', era_start: 1985, decade: '1980s', bpm_min: 115, bpm_max: 125, energy_min: 0.4, energy_max: 0.7, origin_location: 'Chicago/NYC', cultural_context: 'Larry Heard (Mr. Fingers), Marshall Jefferson - soulful, jazzy', description: 'Emotional house evolution' });
insert({ name: 'Acid House', slug: 'acid-house', parent_slug: 'chicago-house', era_start: 1987, decade: '1980s', bpm_min: 120, bpm_max: 130, energy_min: 0.6, energy_max: 0.9, origin_location: 'Chicago', cultural_context: 'Phuture, DJ Pierre - TB-303, UK rave catalyst', description: 'Iconic 303 squelch' });
insert({ name: 'UK Garage', slug: 'uk-garage', parent_slug: 'chicago-house', era_start: 1990, decade: '1990s', bpm_min: 130, bpm_max: 140, energy_min: 0.6, energy_max: 0.9, origin_location: 'London', cultural_context: 'UK Black British + Caribbean influence, 2-step, pirate radio', description: 'Foundation UK bass music' });
insert({ name: 'Baltimore Club', slug: 'baltimore-club', parent_slug: 'disco', era_start: 1988, decade: '1980s', bpm_min: 125, bpm_max: 135, energy_min: 0.7, energy_max: 0.9, origin_location: 'Baltimore', cultural_context: 'Black American club - DJ Technics, Rod Lee', description: 'Breakbeat house' });
insert({ name: 'Footwork', slug: 'footwork', parent_slug: 'chicago-house', era_start: 2000, decade: '2000s', bpm_min: 150, bpm_max: 170, energy_min: 0.7, energy_max: 1.0, origin_location: 'Chicago', cultural_context: 'South Side Chicago Black dance culture - DJ Rashad, RP Boo', description: 'Hyper-fast juke evolution' });
insert({ name: 'Jersey Club', slug: 'jersey-club', parent_slug: 'baltimore-club', era_start: 2004, decade: '2000s', bpm_min: 135, bpm_max: 145, energy_min: 0.7, energy_max: 1.0, origin_location: 'Newark/Jersey City', cultural_context: 'Black American club - Brick Bandits', description: 'Fast, choppy' });

insert({ name: 'Jungle', slug: 'jungle', parent_slug: 'dub', era_start: 1991, decade: '1990s', bpm_min: 160, bpm_max: 180, energy_min: 0.7, energy_max: 1.0, origin_location: 'London', cultural_context: 'Jamaican sound system + rave breakbeats - UK Caribbean diaspora, MC culture', description: 'Precursor to Drum & Bass' });
insert({ name: 'Drum and Bass', slug: 'drum-and-bass', parent_slug: 'jungle', era_start: 1994, decade: '1990s', bpm_min: 160, bpm_max: 180, energy_min: 0.6, energy_max: 1.0, origin_location: 'UK', cultural_context: 'Jungle refined, maintained Caribbean bass culture', description: 'Breakbeats + sub-bass' });
insert({ name: 'Grime', slug: 'grime', parent_slug: 'uk-garage', era_start: 2002, decade: '2000s', bpm_min: 135, bpm_max: 142, energy_min: 0.7, energy_max: 1.0, origin_location: 'East London', cultural_context: 'UK Black British - pirate radio (Rinse FM), MCs - Wiley, Dizzee Rascal, Skepta', description: 'Garage stripped, aggressive, MC-driven' });
insert({ name: 'Dubstep', slug: 'dubstep', parent_slug: 'uk-garage', era_start: 2002, decade: '2000s', bpm_min: 138, bpm_max: 142, energy_min: 0.5, energy_max: 0.9, origin_location: 'South London', cultural_context: 'UK garage + dub reggae - FWD>>, DMZ, Big Apple Records', description: 'Garage + dub = half-time bass' });

insert({ name: 'Trap', slug: 'trap', parent_slug: 'hip-hop', era_start: 2000, decade: '2000s', bpm_min: 130, bpm_max: 170, energy_min: 0.6, energy_max: 0.9, origin_location: 'Atlanta', cultural_context: 'Southern Black rap - T.I., Gucci Mane, Young Jeezy', description: 'Hard 808s, hi-hat rolls' });

insert({ name: 'Afrobeats', slug: 'afrobeats', parent_slug: 'afrobeat', era_start: 2000, decade: '2000s', bpm_min: 100, bpm_max: 130, energy_min: 0.6, energy_max: 0.9, origin_location: 'Nigeria/Ghana', cultural_context: 'Afrobeat + dancehall + hip hop, global African diaspora', description: 'Contemporary African pop' });
insert({ name: 'Amapiano', slug: 'amapiano', parent_slug: 'afrobeat', era_start: 2012, decade: '2010s', bpm_min: 108, bpm_max: 118, energy_min: 0.5, energy_max: 0.8, origin_location: 'South Africa', cultural_context: 'Johannesburg townships - house + jazz + kwaito', description: 'South African house, log drum' });

insert({ name: 'Techno', slug: 'techno', parent_slug: 'detroit-techno', era_start: 1988, decade: '1980s', bpm_min: 120, bpm_max: 150, energy_min: 0.6, energy_max: 1.0, origin_location: 'Europe', cultural_context: 'European interpretation of Detroit techno, rave culture', description: 'Detroit spread to Europe' });

db.exec('PRAGMA foreign_keys = ON');
console.log('✓ Seeded culturally accurate genre taxonomy');
db.close();
