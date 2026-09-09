/**
 * One-time migration: copies existing JSON data files into Supabase.
 * Run once from the admin directory:
 *   node migrate-to-supabase.js
 * Requires SUPABASE_URL and SUPABASE_SERVICE_KEY in the environment
 * (copy .env.example to .env and fill in your values first).
 */
'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const fs   = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const DATA_DIR = path.join(__dirname, 'data');

function read(file) {
  const p = path.join(DATA_DIR, file);
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

async function migrate(table, rows) {
  if (!rows.length) { console.log(`  ${table}: nothing to migrate`); return; }
  const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
  if (error) { console.error(`  ${table} error:`, error.message); }
  else        { console.log(`  ${table}: migrated ${rows.length} row(s)`); }
}

(async () => {
  console.log('\nMigrating JSON data → Supabase...\n');
  await migrate('posts',       read('posts.json'));
  await migrate('careers',     read('careers.json'));
  await migrate('research',    read('research.json'));
  await migrate('directory',   read('directory.json'));
  await migrate('merchandise', read('merchandise.json'));
  console.log('\nDone. You can now delete the data/ folder.\n');
})();
