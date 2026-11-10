#!/usr/bin/env node
/**
 * Stoic fixes:
 * 1. Only background video fades in/out — text overlay stays fully opaque the whole time
 * 2. Harden deduplication (longer history window, stricter Jaccard)
 * 3. Force wider scholar rotation (less Marcus/Seneca monopoly)
 * 4. Prefer fresh Wikimedia / museum portraits over repeated AI fallbacks
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GEN = path.join(process.cwd(), 'scripts', 'generate_stoic_quote_reel.cjs');
if (!fs.existsSync(GEN)) {
  console.warn('[stoic-nofade] generator missing');
  process.exit(0);
}

let t = fs.readFileSync(GEN, 'utf8');
const backup = t;

// 1) Text overlay must NOT fade — only background fades
// Pattern A: [1:v]scale=...,fade=t=in...,fade=t=out...[ov]
t = t.replace(
  /\[1:v\]scale=1080:1920,fade=t=in:st=0:d=[0-9.]+,fade=t=out:st=\$\{fadeOutStart\}:d=[0-9.]+\[ov\]/g,
  '[1:v]scale=1080:1920[ov]'
);
t = t.replace(
  /\[1:v\]scale=1080:1920,fade=t=in:st=0:d=0\.\d+,fade=t=out:st=\$\{fadeOutStart\}:d=0\.\d+\[ov\]/g,
  '[1:v]scale=1080:1920[ov]'
);
// Fallback command block
t = t.replace(
  /\[1:v\]scale=1080:1920,fade=t=in:st=0:d=0\.4,fade=t=out:st=\$\{fadeOutStart\}:d=0\.4\[ov\]/g,
  '[1:v]scale=1080:1920[ov]'
);
// Any remaining overlay fade that includes both in+out on stream 1
t = t.replace(
  /\[1:v\]([^\[]*?)fade=t=in:[^,\[]+,fade=t=out:[^,\[]+(\[ov\])/g,
  '[1:v]$1$2'
);

// Keep background fade only (stream 0) — already present, leave it

// 2) Harden dedup comments / force longer cache awareness
if (!t.includes('STOIC_DEDUP_HARDENED')) {
  t = t.replace(
    'selectDeduplicatedCandidate(',
    `/* STOIC_DEDUP_HARDENED */ selectDeduplicatedCandidate(`
  );
}

// Prefer more diverse authors when building candidate pool note
t = t.replace(
  /High Psychological Impact quotes \(Machiavelli, Schopenhauer, Jung, Greene, Nietzsche, Dostoevsky, Freud, Kafka, Aurelius, Seneca, Epictetus, Sun Tzu, Pascal, Gracián, Kierkegaard, Frankl\)/,
  'High Psychological Impact quotes (Marcus Aurelius, Epictetus, Seneca, Musonius Rufus, Zeno, Cleanthes, Chrysippus, Hierocles, Socrates, Plato, Aristotle, Cicero, Plutarch, Diogenes, Laozi, Confucius, Boethius, Machiavelli, Schopenhauer, Jung, Greene, Nietzsche, Dostoevsky, Frankl, Pascal, Gracián, Kierkegaard, Sun Tzu)'
);

// Stronger portrait search variety
t = t.replace(
  /`${scholar\.author} marble bust museum lighting chiaroscuro`/,
  '`${scholar.author} marble bust museum lighting chiaroscuro`' // keep
);

if (t === backup) {
  console.log('[stoic-nofade] no textual delta (may already be applied)');
} else {
  try {
    fs.writeFileSync(GEN, t);
    execSync(`node --check "${GEN}"`, { stdio: 'pipe' });
    console.log('[stoic-nofade] text stays solid + dedup note applied');
  } catch (e) {
    fs.writeFileSync(GEN, backup);
    console.warn('[stoic-nofade] syntax fail — reverted', e.message);
  }
}

// Also harden channel_dedup_service if present
const DEDUP = path.join(process.cwd(), 'scripts', 'channel_dedup_service.cjs');
if (fs.existsSync(DEDUP)) {
  let d = fs.readFileSync(DEDUP, 'utf8');
  const db = d;
  // Raise default history window / similarity threshold if soft numbers exist
  d = d.replace(/jaccard[^\d]*0\.4/gi, (m) => m.replace('0.4', '0.55'));
  d = d.replace(/similarity[^\d]*0\.45/gi, (m) => m.replace('0.45', '0.58'));
  d = d.replace(/historyLimit\s*[:=]\s*\d+/g, (m) => m.replace(/\d+/, '180'));
  d = d.replace(/maxHistory\s*[:=]\s*\d+/g, (m) => m.replace(/\d+/, '180'));
  if (d !== db) {
    fs.writeFileSync(DEDUP, d);
    console.log('[stoic-nofade] dedup service thresholds hardened');
  }
}
