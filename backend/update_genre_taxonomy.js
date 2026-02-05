const Database = require('better-sqlite3');
const db = new Database('./starforge_genres.db');

try {
  // Get parent genres
  const hipHop = db.prepare('SELECT id FROM genres WHERE name = ?').get('Hip Hop');
  const afrobeat = db.prepare('SELECT id FROM genres WHERE name = ?').get('Afrobeat');
  const house = db.prepare('SELECT id FROM genres WHERE name = ?').get('House');

  // Update Grime to be child of Hip Hop
  db.prepare('UPDATE genres SET parent_id = ? WHERE name = ?').run(hipHop.id, 'Grime');
  console.log('✓ Set Grime as child of Hip Hop');

  // Update UK Garage to be child of House (or could be standalone)
  // For now keeping UK Garage as root since it's a distinct lineage

  // Add Afro House if it doesn't exist
  const afroHouseExists = db.prepare('SELECT id FROM genres WHERE name = ?').get('Afro House');
  if (!afroHouseExists && afrobeat) {
    db.prepare(`
      INSERT INTO genres (
        name, slug, parent_id, era_start, era_end, decade,
        bpm_min, bpm_max, energy_min, energy_max,
        description, origin_location, cultural_context
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'Afro House',
      'afro-house',
      afrobeat.id, // Child of Afrobeat
      2010, 2024, '2010s',
      115, 125, 0.6, 0.85,
      'South African house music with African percussion and vocals',
      'South Africa',
      'Black South African - blend of house music with African rhythms'
    );
    console.log('✓ Added Afro House as child of Afrobeat');
  } else if (afroHouseExists) {
    console.log('- Afro House already exists');
  }

  // Show updated structure
  console.log('\n=== Hip Hop Family ===');
  const hipHopChildren = db.prepare('SELECT name, bpm_min, bpm_max FROM genres WHERE parent_id = ?').all(hipHop.id);
  console.log('Hip Hop children:');
  hipHopChildren.forEach(g => console.log('  ↳', g.name, '(BPM:', g.bpm_min, '-', g.bpm_max, ')'));

  console.log('\n=== Afrobeat Family ===');
  if (afrobeat) {
    const afrobeatChildren = db.prepare('SELECT name, bpm_min, bpm_max FROM genres WHERE parent_id = ?').all(afrobeat.id);
    console.log('Afrobeat children:');
    afrobeatChildren.forEach(g => console.log('  ↳', g.name, '(BPM:', g.bpm_min, '-', g.bpm_max, ')'));
  }

  console.log('\n✅ Genre taxonomy updated');

} catch (error) {
  console.error('Error updating taxonomy:', error);
} finally {
  db.close();
}
