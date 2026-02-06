#!/usr/bin/env node

/**
 * Script to seed missing foundational genres
 * Adds Black, Caribbean, and African genres with proper cultural lineages
 */

const { seedAdditionalGenres } = require('../services/genreSeedAdditions');

console.log('🌍 Seeding Missing Foundational Genres');
console.log('=====================================\n');

seedAdditionalGenres()
  .then(() => {
    console.log('\n✅ Genre seeding complete!');
    console.log('\nAdded genres with proper cultural attribution:');
    console.log('  • Black American: Funk, Soul, Disco, Chicago House, Acid House, Detroit Techno');
    console.log('  • Black American Club: Baltimore Club, Jersey Club, Footwork');
    console.log('  • LGBTQ+: Ballroom (voguing culture)');
    console.log('  • Caribbean: Reggae, Dub, Dancehall, Soca, Zouk');
    console.log('  • African: Afrobeat, Amapiano');
    console.log('  • UK Black British: Jungle, UK Garage (UKG), Grime');
    console.log('\nInfluence genealogy will now show accurate cultural lineages!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error seeding genres:', error);
    process.exit(1);
  });
