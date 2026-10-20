#!/usr/bin/env node
/** Shared volumes, voices, history helpers for all channels */
const fs = require('fs');
const path = require('path');

const VOLUMES = {
  bgmUnderVoice: 0.3,
  bgmNoVoice: 0.42,
  teen: { voice: 1.55, bgm: 0.34, sfx: 0.35 },
  stoic: { voice: 1.35, bgm: 0.25, bgmNoVoice: 0.4 },
  fin: { voice: 1.35, bgm: 0.28 },
  archie: { voice: 1.35, bgm: 0.28 },
  cinema: { voice: 1.4, bgm: 0.3 }
};

/** Bold motivation voice: deeper + firm pace (user: "very bold voice") */
const VOICES = {
  stoic: { id: 'en-US-ChristopherNeural', rate: '-12%', pitch: '-25Hz' },
  motivation: { id: 'en-US-AndrewNeural', rate: '-8%', pitch: '-22Hz' },
  fin: { id: 'en-US-AndrewNeural', rate: '-5%', pitch: '-10Hz' },
  archie: { id: 'en-US-AndrewNeural', rate: '-3%', pitch: '-5Hz' },
  cinema: { id: 'en-US-AndrewMultilingualNeural', rate: '-4%', pitch: '-10Hz' }
};

function loadHistory(filePath) {
  try {
    if (!fs.existsSync(filePath)) return [];
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return Array.isArray(raw) ? raw : raw.items || [];
  } catch {
    return [];
  }
}

function saveHistory(filePath, items) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const trimmed = (items || []).slice(-120);
  fs.writeFileSync(filePath, JSON.stringify(trimmed, null, 2));
}

function isDuplicate(candidate, history, { overlapMax = 0.45, authorWindow = 3 } = {}) {
  const title = String(candidate.title || candidate.quote || candidate.hook || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!title) return false;
  const words = new Set(title.split(' ').filter((w) => w.length > 3));
  for (const h of history || []) {
    const ht = String(h.title || h.quote || h.hook || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!ht) continue;
    if (title === ht) return true;
    const hw = new Set(ht.split(' ').filter((w) => w.length > 3));
    let inter = 0;
    for (const w of words) if (hw.has(w)) inter++;
    const union = words.size + hw.size - inter || 1;
    if (inter / union >= overlapMax) return true;
  }
  return false;
}

module.exports = {
  VOLUMES,
  VOICES,
  loadHistory,
  saveHistory,
  isDuplicate
};
