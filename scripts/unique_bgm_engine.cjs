#!/usr/bin/env node
/**
 * Unique BGM per video — never reuse the same track/hash across recent runs.
 * Prefers Freesound/Openverse live search; rotates query + page; stores history.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const HIST = path.join(process.cwd(), 'data', 'bgm_use_history.json');

function loadHist() {
  try {
    const j = JSON.parse(fs.readFileSync(HIST, 'utf8'));
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
}
function saveHist(entry) {
  const h = loadHist();
  h.push({ ...entry, at: new Date().toISOString() });
  fs.mkdirSync(path.dirname(HIST), { recursive: true });
  fs.writeFileSync(HIST, JSON.stringify(h.slice(-200), null, 2));
}
function fileHash(p) {
  try {
    const buf = fs.readFileSync(p);
    return crypto.createHash('sha1').update(buf.slice(0, Math.min(buf.length, 256000))).digest('hex');
  } catch {
    return null;
  }
}
function recentUsed(hist, channel) {
  const set = new Set();
  for (const h of hist.slice(-80)) {
    if (h.hash) set.add(h.hash);
    if (h.name) set.add(String(h.name).toLowerCase());
    if (channel && h.channel === channel && h.query) set.add('q:' + h.query);
  }
  return set;
}

const QUERY_BANK = {
  stoic: [
    'dark ambient pad meditation',
    'soft piano minor contemplative',
    'deep drone atmospheric calm',
    'cinematic strings quiet tension',
    'rain soft room tone ambient',
    'low cello sustained emotional',
    'wind chimes distant ambient',
    'warm analog synth pad slow'
  ],
  archie: [
    'curious upbeat lofi beats',
    'light science documentary underscore',
    'playful xylophone soft ambient',
    'modern tech ambient pulse',
    'bright acoustic guitar chill',
    'soft electronic discovery theme'
  ],
  teen: [
    'motivational cinematic rise',
    'inspiring piano modern',
    'hopeful ambient electronic',
    'uplifting soft drums ambient',
    'emotional pop instrumental no vocals'
  ],
  cinema: [
    'dark documentary underscore',
    'tense cinematic ambient drone',
    'mysterious low strings',
    'investigative journalism score',
    'ominous soft percussion ambient'
  ],
  fin: [
    'modern business ambient',
    'confident soft electronic',
    'corporate calm underscore',
    'minimal tech beat ambient'
  ],
  default: [
    'ambient instrumental background',
    'cinematic soft underscore',
    'calm electronic pad'
  ]
};

async function fetchUniqueBgm(channel, durationSec = 30, preferredQuery = null) {
  const hist = loadHist();
  const used = recentUsed(hist, channel);
  const bank = QUERY_BANK[channel] || QUERY_BANK.default;
  const seed = Date.now() + Math.floor(Math.random() * 10000);
  const queries = [];
  if (preferredQuery) queries.push(preferredQuery);
  // shuffle bank with seed
  const shuffled = bank
    .map((q, i) => ({ q, k: (seed + i * 17) % 997 }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.q);
  for (const q of shuffled) queries.push(q);

  let searchAndFetchAudio = null;
  try {
    searchAndFetchAudio = require('./universal_media_fetcher.cjs').searchAndFetchAudio;
  } catch (_) {}

  for (const q of queries) {
    if (used.has('q:' + q) && queries.length > 2) continue;
    try {
      if (!searchAndFetchAudio) break;
      const res = await searchAndFetchAudio(q, Math.max(20, durationSec + 5), channel);
      const local = res?.localPath;
      if (!local || !fs.existsSync(local)) continue;
      const hash = fileHash(local);
      const name = path.basename(local).toLowerCase();
      if (hash && used.has(hash)) {
        console.log('[unique-bgm] skip reused hash', name);
        continue;
      }
      if (used.has(name)) continue;
      // Normalize + unique slice offset so same file still feels different
      const outDir = path.join(process.cwd(), 'test_artifacts', 'unique_bgm');
      fs.mkdirSync(outDir, { recursive: true });
      const out = path.join(outDir, `${channel}_${Date.now()}.wav`);
      let probe = 60;
      try {
        probe = parseFloat(
          execSync(`ffprobe -v error -show_entries format=duration -of default=nk=1:nw=1 "${local}"`, {
            encoding: 'utf8'
          })
        );
      } catch (_) {}
      const maxStart = Math.max(0, (probe || 60) - durationSec - 1);
      const start = maxStart > 1 ? (seed % Math.floor(maxStart * 10)) / 10 : 0;
      const vol = channel === 'stoic' ? 0.36 : channel === 'cinema' ? 0.4 : 0.32;
      execSync(
        `ffmpeg -y -ss ${start.toFixed(2)} -i "${local}" -t ${durationSec.toFixed(2)} -af "volume=${vol},afade=t=in:st=0:d=0.8,afade=t=out:st=${Math.max(0.5, durationSec - 1.2).toFixed(2)}:d=1.0,loudnorm=I=-18:TP=-1.5:LRA=11" -ar 44100 -ac 2 "${out}" 2>/dev/null`
      );
      if (fs.existsSync(out) && fs.statSync(out).size > 5000) {
        saveHist({ channel, query: q, name, hash, start, out: path.basename(out) });
        console.log(`[unique-bgm] ✓ ${channel} ← "${q}" (start ${start.toFixed(1)}s) → ${path.basename(out)}`);
        return { localPath: out, query: q, start };
      }
    } catch (e) {
      console.warn('[unique-bgm] try fail', q, e.message?.slice(0, 80));
    }
  }

  // Last resort: synthesize unique noise-pad (different each run) so never silent / never same file
  const outDir = path.join(process.cwd(), 'test_artifacts', 'unique_bgm');
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, `${channel}_synth_${Date.now()}.wav`);
  const f1 = 110 + (seed % 40);
  const f2 = 165 + ((seed * 3) % 55);
  execSync(
    `ffmpeg -y -f lavfi -i "sine=frequency=${f1}:duration=${durationSec}" -f lavfi -i "sine=frequency=${f2}:duration=${durationSec}" -filter_complex "[0][1]amix=inputs=2,volume=0.12,afade=t=in:d=1,afade=t=out:st=${Math.max(0.5, durationSec - 1)}:d=1" -ar 44100 -ac 2 "${out}" 2>/dev/null`
  );
  saveHist({ channel, query: 'synth-pad', name: path.basename(out), hash: fileHash(out) });
  console.warn('[unique-bgm] fallback synth pad (live search empty)');
  return { localPath: out, query: 'synth-pad', start: 0 };
}

module.exports = { fetchUniqueBgm, loadHist };
