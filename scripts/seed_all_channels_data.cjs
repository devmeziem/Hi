#!/usr/bin/env node

/**
 * ==============================================================================
 * Comprehensive Project & Multi-Channel Seed Data Injector
 * ==============================================================================
 * Seeds rich, authentic data across all 5 video channels & workflows:
 *  - Channel 1: Finance Blueprint (@bones_ceo) — Historic Sagas & Wisdom
 *  - Channel 2: The Stoic Architect (@TheStoicArchitect) — Long Essays & 5s Quotes
 *  - Channel 3: Archie Explains (@ArchieExplains) — Animated Curiosities & 3-in-1 Q&A
 *  - Channel 4: Cinema Vanguard / Driftreel (@CinemaVanguard) — Episodic Crime & Horror
 *  - Channel 5: Apex Discipline / MindRush (@MindRushOfficial) — Youth & Teen Mentorship
 *  - Omnichannel: Facebook & Instagram Knowledge Cards
 *
 * Persists into:
 *  1. Local manifests (`daily_blueprint_manifest.json`, `driftreel_manifest.json`, etc.)
 *  2. Local dedup caches (`test_artifacts/*_history_cache.json`)
 *  3. Firestore Cloud Database (`channel_post_history` collection)
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Ensure directories exist
const ARTIFACTS_DIR = path.join(process.cwd(), 'test_artifacts');
const RENDERED_DIR = path.join(process.cwd(), 'rendered_videos');
for (const d of [ARTIFACTS_DIR, RENDERED_DIR]) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

// Load Firestore configuration
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

async function writeFirestoreDocument(collection, docId, fields) {
  const config = getFirestoreConfig();
  if (!config) return false;

  const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.databaseId}/documents/${collection}/${docId}?key=${config.apiKey}`;
  const payload = JSON.stringify({ fields });

  return new Promise((resolve) => {
    const req = https.request(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 8000
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(res.statusCode >= 200 && res.statusCode < 300));
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.write(payload);
    req.end();
  });
}

// 1. Channel 1: Finance Blueprint Seed Data
const FIN_SEEDS = [
  {
    channel: 'finance_saas',
    title: 'The Tulip Mania Meltdown',
    quote: 'In 1637 Amsterdam, a single tulip bulb bought an entire estate before vanishing into thin air.',
    author: 'Amsterdam Merchant Chronicle',
    theme: 'historic_bubble',
    duration: 38.5
  },
  {
    channel: 'finance_saas',
    title: 'The South Sea Bubble of 1720',
    quote: 'Sir Isaac Newton lost his fortune confessing he could calculate stars but not crowd madness.',
    author: 'Sir Isaac Newton',
    theme: 'historic_crash',
    duration: 40.2
  },
  {
    channel: 'finance_saas',
    title: 'Rule No. 1: Never Lose Money',
    quote: 'Rule No. 1: Never lose money. Rule No. 2: Never forget rule No. 1.',
    author: 'Warren Buffett',
    theme: 'value_investing',
    duration: 5.0
  }
];

// 2. Channel 2: The Stoic Architect Seed Data
const STOIC_SEEDS = [
  {
    channel: 'stoic',
    title: 'The Inner Citadel of Calm',
    quote: 'You have power over your mind, not outside events. Realize this, and you will find strength.',
    author: 'Marcus Aurelius',
    theme: 'inner_fortress',
    duration: 32.0
  },
  {
    channel: 'stoic',
    title: 'Mastering What You Control',
    quote: 'He who conquers himself is the mightiest warrior.',
    author: 'Confucius',
    theme: 'self_mastery',
    duration: 30.5
  },
  {
    channel: 'stoic',
    title: 'The Art of Not Reacting',
    quote: 'We suffer more often in imagination than in reality.',
    author: 'Seneca',
    theme: 'emotional_resilience',
    duration: 5.0
  }
];

// 3. Channel 3: Archie Explains Seed Data
const ARCHIE_SEEDS = [
  {
    channel: 'cartoon_factory',
    title: 'How Noise-Cancelling Headphones Silence the World',
    quote: 'Microphones listen to incoming sound and shoot identical inverted waves to collide them to zero.',
    author: 'Archie Explains Science',
    theme: 'acoustics_physics',
    duration: 28.0
  },
  {
    channel: 'cartoon_factory',
    title: 'Why Onions Make You Cry',
    quote: 'Slicing ruptures cell walls, releasing sulfur gas that turns into mild sulfuric acid on your cornea.',
    author: 'Archie Explains Chemistry',
    theme: 'kitchen_chemistry',
    duration: 5.0
  },
  {
    channel: 'archie_qa_everyday_logic',
    title: 'Why Do Flamingos Stand on One Leg?',
    quote: 'Standing on one leg in water cuts convective body heat loss by over fifty percent.',
    author: 'Archie 3-in-1 Showdown',
    theme: 'avian_biology',
    duration: 18.0
  }
];

// 4. Channel 4: Cinema Vanguard / Driftreel Seed Data
const MOVIE_SEEDS = [
  {
    channel: 'documentary',
    title: 'The Ghost Blimp of San Francisco',
    quote: 'In 1942, Navy blimp L-8 crash-landed gently into Daly City with engines running and zero crew inside.',
    author: 'Pacific Coast Naval Archive',
    theme: 'unsolved_aviation',
    duration: 41.3
  },
  {
    channel: 'documentary',
    title: 'The Amber Room Vanishing',
    quote: 'Six tons of glowing Baltic amber packed into twenty-seven crates vanished forever in 1945.',
    author: 'Konigsberg Castle War Records',
    theme: 'lost_treasures',
    duration: 39.0
  }
];

// 5. Channel 5: Apex Discipline / MindRush Seed Data
const TEEN_SEEDS = [
  {
    channel: 'teen_motivation',
    title: 'Why You Feel Behind in Life',
    quote: 'You compare your private messy behind-the-scenes with their edited peak highlights. You are right on schedule.',
    author: 'MindRush Mentorship',
    theme: 'comparison_overthinking',
    duration: 29.5
  },
  {
    channel: 'teen_motivation',
    title: 'The 1 AM Screentime Trap',
    quote: 'Put the screen face down right now. Tomorrow does not need your perfection; it just needs you to wake up and try.',
    author: 'MindRush Mentorship',
    theme: 'dopamine_reset',
    duration: 28.0
  }
];

async function seedAllChannels() {
  console.log(`\n===============================================================`);
  console.log(`🌱 INJECTING COMPREHENSIVE SEED DATA ACROSS ALL 5 CHANNELS`);
  console.log(`===============================================================`);

  const allChannelsData = {
    fin: FIN_SEEDS,
    stoic: STOIC_SEEDS,
    archie: ARCHIE_SEEDS,
    movie: MOVIE_SEEDS,
    teen: TEEN_SEEDS
  };

  // 1. Write local channel caches
  for (const [key, items] of Object.entries(allChannelsData)) {
    const cacheFile = path.join(ARTIFACTS_DIR, `${key}_history_cache.json`);
    fs.writeFileSync(cacheFile, JSON.stringify(items, null, 2), 'utf8');
    console.log(`✓ Local cache seeded: test_artifacts/${key}_history_cache.json (${items.length} records)`);
  }

  // 2. Write master manifest
  const masterManifest = [
    ...FIN_SEEDS.map((s, i) => ({ id: `fin_${i}`, ...s })),
    ...STOIC_SEEDS.map((s, i) => ({ id: `stoic_${i}`, ...s })),
    ...ARCHIE_SEEDS.map((s, i) => ({ id: `archie_${i}`, ...s })),
    ...MOVIE_SEEDS.map((s, i) => ({ id: `movie_${i}`, ...s })),
    ...TEEN_SEEDS.map((s, i) => ({ id: `mindrush_${i}`, ...s }))
  ];
  fs.writeFileSync(path.join(process.cwd(), 'daily_blueprint_manifest.json'), JSON.stringify(masterManifest, null, 2), 'utf8');
  console.log(`✓ Master manifest seeded: daily_blueprint_manifest.json (${masterManifest.length} records)`);

  // 3. Write Driftreel Manifest
  const driftreelManifest = {
    title: MOVIE_SEEDS[0].title,
    genre: 'horror',
    era: '1942 • Pacific Coast Airbase',
    narration: MOVIE_SEEDS[0].quote,
    hashtags: ['#CinemaVanguard', '#Documentary', '#UnsolvedMysteries', '#Horror', '#Shorts'],
    timestamp: Date.now()
  };
  fs.writeFileSync(path.join(RENDERED_DIR, 'driftreel_manifest.json'), JSON.stringify(driftreelManifest, null, 2), 'utf8');
  console.log(`✓ Driftreel manifest seeded: rendered_videos/driftreel_manifest.json`);

  // 4. Inject into Firestore channel_post_history
  console.log(`\n☁️  Syncing seed candidates to Firestore database...`);
  let firestoreCount = 0;
  for (const seed of masterManifest) {
    const docId = `seed_${seed.channel}_${seed.id}`;
    const fields = {
      id: { stringValue: docId },
      channel: { stringValue: seed.channel },
      title: { stringValue: seed.title || '' },
      quote: { stringValue: seed.quote || '' },
      author: { stringValue: seed.author || '' },
      theme: { stringValue: seed.theme || '' },
      duration: { doubleValue: Number(seed.duration || 5.0) },
      isSeedData: { booleanValue: true },
      timestamp: { stringValue: new Date().toISOString() }
    };
    const ok = await writeFirestoreDocument('channel_post_history', docId, fields);
    if (ok) firestoreCount++;
  }
  console.log(`✓ Firestore sync complete: ${firestoreCount}/${masterManifest.length} seed docs registered.`);

  console.log(`\n🎉 SEED DATA INJECTION FINISHED SUCCESSFULLY!`);
}

if (require.main === module) {
  seedAllChannels()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed injection error:', err);
      process.exit(1);
    });
}

module.exports = { seedAllChannels, FIN_SEEDS, STOIC_SEEDS, ARCHIE_SEEDS, MOVIE_SEEDS, TEEN_SEEDS };
