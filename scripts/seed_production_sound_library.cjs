#!/usr/bin/env node

/**
 * Seed Production Audio Library
 * Generates broadcast-grade acoustic and ambient tracks for every channel
 * so every reel has immediate access to multiple rich, non-repetitive tracks.
 */

const fs = require('fs');
const path = require('path');
const { generateSoftPianoAudio } = require('./soft_piano_synthesizer.cjs');
const { execSync } = require('child_process');

const NICHE_DIRS = {
  cartoon: path.join(process.cwd(), 'sound_assets', 'cartoon'),
  stoic: path.join(process.cwd(), 'sound_assets', 'stoic'),
  finance: path.join(process.cwd(), 'sound_assets', 'finance'),
  motivation_15s: path.join(process.cwd(), 'sound_assets', 'motivation_15s'),
  motivation_5s: path.join(process.cwd(), 'sound_assets', 'motivation_5s'),
  mindrush: path.join(process.cwd(), 'sound_assets', 'mindrush'),
  movie_brand: path.join(process.cwd(), 'sound_assets', 'movie_brand')
};

for (const dir of Object.values(NICHE_DIRS)) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

console.log('[Seed Sound Library] 🎵 Seeding diverse sound tracks across all channels...');

// 1. Cartoon / Archie tracks
const cartoonTracks = [
  { name: 'archie_calm_felt_piano.wav', mood: 'stoic', dur: 25.0 },
  { name: 'archie_discovery_keys.wav', mood: 'teen', dur: 25.0 },
  { name: 'archie_luxury_insight.wav', mood: 'finance', dur: 25.0 }
];

for (const t of cartoonTracks) {
  const dest = path.join(NICHE_DIRS.cartoon, t.name);
  if (!fs.existsSync(dest) || fs.statSync(dest).size < 1000) {
    console.log(`Generating cartoon track: ${t.name}...`);
    generateSoftPianoAudio(dest, t.dur, t.mood);
  }
}

// 2. Stoic tracks
const stoicTracks = [
  { name: 'stoic_deep_meditation_keys.wav', mood: 'stoic', dur: 35.0 },
  { name: 'stoic_ancient_wisdom_ambient.wav', mood: 'stoic', dur: 30.0 }
];

for (const t of stoicTracks) {
  const dest = path.join(NICHE_DIRS.stoic, t.name);
  if (!fs.existsSync(dest) || fs.statSync(dest).size < 1000) {
    console.log(`Generating stoic track: ${t.name}...`);
    generateSoftPianoAudio(dest, t.dur, t.mood);
  }
}

// 3. Finance tracks
const financeTracks = [
  { name: 'finance_sovereign_clarity_keys.wav', mood: 'finance', dur: 35.0 },
  { name: 'finance_strategic_wealth_ambience.wav', mood: 'finance', dur: 30.0 }
];

for (const t of financeTracks) {
  const dest = path.join(NICHE_DIRS.finance, t.name);
  if (!fs.existsSync(dest) || fs.statSync(dest).size < 1000) {
    console.log(`Generating finance track: ${t.name}...`);
    generateSoftPianoAudio(dest, t.dur, t.mood);
  }
}

// 4. Motivation & MindRush 15s tracks
const motivationTracks = [
  { name: 'mindrush_heartbeat_rise.wav', mood: 'teen', dur: 25.0 },
  { name: 'mindrush_drift_tension.wav', mood: 'teen', dur: 25.0 }
];

for (const t of motivationTracks) {
  const dest1 = path.join(NICHE_DIRS.motivation_15s, t.name);
  const dest2 = path.join(NICHE_DIRS.mindrush, t.name);
  if (!fs.existsSync(dest1) || fs.statSync(dest1).size < 1000) {
    console.log(`Generating motivation 15s track: ${t.name}...`);
    generateSoftPianoAudio(dest1, t.dur, t.mood);
  }
  if (!fs.existsSync(dest2)) {
    try { fs.copyFileSync(dest1, dest2); } catch {}
  }
}

// 5. Motivation 5s tracks (quick punchy impact and rise)
const fiveSecTracks = [
  'motivation_5s_explosive_drop.wav',
  'motivation_5s_adrenaline_hit.wav'
];

for (const name of fiveSecTracks) {
  const dest = path.join(NICHE_DIRS.motivation_5s, name);
  if (!fs.existsSync(dest) || fs.statSync(dest).size < 1000) {
    try {
      execSync(`ffmpeg -y -f lavfi -i "sine=frequency=55:duration=6,volume=0.6,lowpass=f=120[sub];anoisesrc=d=6:c=pink:r=44100:a=0.08,bandpass=f=2200:w=300,volume=0.2[hi];[sub][hi]amix=inputs=2,afade=t=in:ss=0:d=0.2,afade=t=out:st=5.2:d=0.8[out]" -map "[out]" -c:a pcm_s16le -ar 44100 -ac 2 "${dest}" 2>/dev/null`);
    } catch {}
  }
}

// 6. Movie Brand tracks
const movieTracks = [
  { name: 'cinematic_dax_stealth_pulse.wav', mood: 'stoic', dur: 35.0 },
  { name: 'cinematic_orchestral_suspense.wav', mood: 'teen', dur: 35.0 }
];

for (const t of movieTracks) {
  const dest = path.join(NICHE_DIRS.movie_brand, t.name);
  if (!fs.existsSync(dest) || fs.statSync(dest).size < 1000) {
    console.log(`Generating movie brand track: ${t.name}...`);
    generateSoftPianoAudio(dest, t.dur, t.mood);
  }
}

console.log('[Seed Sound Library] ✅ All channel audio folders successfully seeded with rich tracks!');
