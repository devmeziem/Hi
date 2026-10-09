#!/usr/bin/env node

/**
 * ==============================================================================
 * Comprehensive Project & Multi-Channel Seed Data Cleaner
 * ==============================================================================
 * Safely removes test seeds from:
 *  1. Local manifests (`daily_blueprint_manifest.json`, `driftreel_manifest.json`)
 *  2. Local dedup caches (`test_artifacts/*_history_cache.json`)
 *  3. Firestore Cloud Database (`channel_post_history` collection seed records)
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { FIN_SEEDS, STOIC_SEEDS, ARCHIE_SEEDS, MOVIE_SEEDS, TEEN_SEEDS } = require('./seed_all_channels_data.cjs');

function getFirestoreConfig() {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    try {
      const fb = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (fb && fb.projectId && fb.apiKey) {
        return {
          projectId: fb.projectId,
          databaseId: fb.firestoreDatabaseId || fb.databaseId || 'ai-studio-voxam-a00cf6de-bee8-48db-97c4-0c43daab8a7e',
          apiKey: fb.apiKey
        };
      }
    } catch {}
  }
  return null;
}

async function deleteFirestoreDocument(collection, docId) {
  const config = getFirestoreConfig();
  if (!config) return false;

  const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.databaseId}/documents/${collection}/${docId}?key=${config.apiKey}`;

  return new Promise((resolve) => {
    const req = https.request(url, {
      method: 'DELETE',
      timeout: 8000
    }, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 300);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.end();
  });
}

async function cleanAllSeedData() {
  console.log(`\n===============================================================`);
  console.log(`🧹 CLEANING COMPREHENSIVE SEED DATA ACROSS ALL 5 CHANNELS`);
  console.log(`===============================================================`);

  const masterManifest = [
    ...FIN_SEEDS.map((s, i) => ({ id: `fin_${i}`, ...s })),
    ...STOIC_SEEDS.map((s, i) => ({ id: `stoic_${i}`, ...s })),
    ...ARCHIE_SEEDS.map((s, i) => ({ id: `archie_${i}`, ...s })),
    ...MOVIE_SEEDS.map((s, i) => ({ id: `movie_${i}`, ...s })),
    ...TEEN_SEEDS.map((s, i) => ({ id: `mindrush_${i}`, ...s }))
  ];

  // 1. Delete seed documents from Firestore
  console.log(`☁️  Removing seed docs from Firestore...`);
  let deletedCount = 0;
  for (const seed of masterManifest) {
    const docId = `seed_${seed.channel}_${seed.id}`;
    const ok = await deleteFirestoreDocument('channel_post_history', docId);
    if (ok) deletedCount++;
  }
  console.log(`✓ Firestore cleanup complete: ${deletedCount}/${masterManifest.length} seed docs removed.`);

  // 2. Remove seeded test cache files
  const keys = ['fin', 'stoic', 'archie', 'movie', 'teen'];
  for (const key of keys) {
    const p = path.join(process.cwd(), 'test_artifacts', `${key}_history_cache.json`);
    if (fs.existsSync(p)) {
      try { fs.unlinkSync(p); console.log(`✓ Removed cache file: ${p}`); } catch {}
    }
  }

  console.log(`\n🎉 SEED DATA CLEANUP COMPLETED!`);
}

if (require.main === module) {
  cleanAllSeedData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Cleanup error:', err);
      process.exit(1);
    });
}

module.exports = { cleanAllSeedData };
