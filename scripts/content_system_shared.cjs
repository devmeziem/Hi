#!/usr/bin/env node
/**
 * SHARED CONTENT SYSTEM — volumes, dedup, text normalize
 * Use from every channel generator.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/** Target mix levels (voice = reference ~1.0–1.5 after gain) */
const VOLUMES = {
  voice: 1.35,
  bgmUnderVoice: 0.30,
  bgmNoVoice: 0.42,
  sfx: 0.32,
  teen: { voice: 1.50, bgm: 0.32, sfx: 0.35 },
  stoic: { voice: 1.35, bgm: 0.25, bgmNoVoice: 0.40 },
  fin: { voice: 1.35, bgm: 0.28 },
  archie: { voice: 1.35, bgm: 0.28 },
  cinema: { voice: 1.40, bgm: 0.30 }
};

/** Locked Edge TTS presets (user-approved) */
const VOICES = {
  stoic: { id: 'en-US-AndrewNeural', rate: '-12%', pitch: '-25Hz' },
  motivation: { id: 'en-US-AndrewNeural', rate: '-5%', pitch: '-15Hz' },
  fin: { id: 'en-US-AndrewNeural', rate: '-5%', pitch: '-10Hz' },
  archie: { id: 'en-US-AndrewNeural', rate: '-3%', pitch: '-5Hz' },
  cinema: { id: 'en-US-AndrewMultilingualNeural', rate: '-4%', pitch: '-10Hz' }
};

function normalizeQuote(q) {
  return String(q || '')
    .toLowerCase()
    .replace(/[“”"']/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function topicHash(text) {
  const n = normalizeQuote(text).split(' ').filter(Boolean).slice(0, 8).join(' ');
  return crypto.createHash('sha1').update(n).digest('hex').slice(0, 12);
}

function wordOverlap(a, b) {
  const A = new Set(normalizeQuote(a).split(' ').filter((w) => w.length > 3));
  const B = new Set(normalizeQuote(b).split(' ').filter((w) => w.length > 3));
  if (!A.size || !B.size) return 0;
  let hit = 0;
  for (const w of A) if (B.has(w)) hit++;
  return hit / Math.max(A.size, B.size);
}

function loadHistory(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const j = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return Array.isArray(j) ? j : j.entries || j.used || [];
    }
  } catch (_) {}
  return [];
}

function saveHistory(filePath, entry, max = 200) {
  const hist = loadHistory(filePath);
  hist.push({ ...entry, ts: Date.now(), at: new Date().toISOString() });
  const trimmed = hist.slice(-max);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(trimmed, null, 2));
  return trimmed;
}

/**
 * Reject if exact match, high overlap, or same author in last `authorWindow` posts.
 */
function isDuplicate(candidate, history, opts = {}) {
  const overlapMax = opts.overlapMax ?? 0.28;
  const authorWindow = opts.authorWindow ?? 6;
  const q = normalizeQuote(candidate.quote || candidate.title || candidate.text || '');
  if (!q) return true;
  const recentAuthors = history.slice(-authorWindow).map((h) => (h.author || '').toLowerCase());
  if (candidate.author && recentAuthors.includes(String(candidate.author).toLowerCase())) {
    return true;
  }
  for (const h of history.slice(-80)) {
    const prev = normalizeQuote(h.quote || h.title || h.text || '');
    if (!prev) continue;
    if (prev === q) return true;
    if (wordOverlap(q, prev) >= overlapMax) return true;
  }
  return false;
}

function pickUnique(candidates, history, opts = {}) {
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  for (const c of shuffled) {
    if (!isDuplicate(c, history, opts)) return c;
  }
  return null;
}

module.exports = {
  VOLUMES,
  VOICES,
  normalizeQuote,
  topicHash,
  wordOverlap,
  loadHistory,
  saveHistory,
  isDuplicate,
  pickUnique
};
