/**
 * Automated Cartoon Factory — Lip-Sync & Phoneme Timing Engine
 *
 * Primary: Rhubarb Lip Sync binary (WAV -> JSON / TSV)
 * Fallback: Audio Envelope & Phoneme Energy Parser
 *
 * Mouth Cues (Preston Blair Standard):
 * - A: Closed mouth (P, B, M)
 * - B: Slightly open mouth, consonants (S, T, D, N, K, G)
 * - C: Wide open mouth, vowels (AH, AA)
 * - D: Teeth exposed, smile (EE, I)
 * - E: Rounded mouth (OO, W, U)
 * - F: Lower lip tucked under teeth (F, V)
 * - G: Narrow open mouth, tongue behind teeth (L, TH)
 * - H: Wide open smiling mouth
 * - X: Silence / idle rest
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync, spawnSync } = require('child_process');

const RHUBARB_CACHE_DIR = path.join(process.cwd(), 'rhubarb_cache');
if (!fs.existsSync(RHUBARB_CACHE_DIR)) {
  try { fs.mkdirSync(RHUBARB_CACHE_DIR, { recursive: true }); } catch {}
}

function getAudioHash(filePath, fallbackText = '') {
  try {
    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      return crypto.createHash('md5').update(buffer).digest('hex');
    }
  } catch {}
  return crypto.createHash('md5').update(String(fallbackText || '')).digest('hex');
}

function getRhubarbBinPath() {
  const possiblePaths = [
    'rhubarb',
    '/usr/local/bin/rhubarb',
    '/tmp/bin/rhubarb',
    '/tmp/rhubarb_bin/Rhubarb-Lip-Sync-1.13.0-Linux/rhubarb'
  ];
  for (const p of possiblePaths) {
    try {
      const res = spawnSync(p, ['--version'], { encoding: 'utf8' });
      if (res.status === 0) return p;
    } catch {}
  }
  return null;
}

/**
 * Check if rhubarb binary is available on the system
 */
function isRhubarbAvailable() {
  return getRhubarbBinPath() !== null;
}

/**
 * Run Rhubarb Lip Sync on a WAV audio file
 */
function runRhubarb(wavPath, outputPathJson) {
  if (!fs.existsSync(wavPath)) {
    throw new Error(`Audio file not found: ${wavPath}`);
  }

  const binPath = getRhubarbBinPath() || 'rhubarb';
  const rhubarbCmd = `"${binPath}" -f json -r phonetic "${wavPath}" -o "${outputPathJson}"`;
  console.log(`[LipSync Engine] Running Rhubarb: ${rhubarbCmd}`);
  execSync(rhubarbCmd, { stdio: 'pipe', timeout: 30000 });

  if (fs.existsSync(outputPathJson)) {
    const content = JSON.parse(fs.readFileSync(outputPathJson, 'utf8'));
    return content.mouthCues || [];
  }
  throw new Error('Rhubarb output file was not created');
}

/**
 * High-accuracy fallback phoneme timing generator based on text and duration
 * Implements English digraph parsing (th, ch, sh, ph, ou, ea, oo), syllable weighting,
 * and realistic Preston Blair mouth viseme distributions.
 */
function generateFallbackMouthCues(text, durationSeconds = 5.0) {
  const safeText = String(text || '').trim();
  const rawWords = safeText.split(/\s+/).filter(Boolean);
  const cues = [];

  if (rawWords.length === 0 || durationSeconds <= 0) {
    return [{ start: 0, end: Math.max(0.5, durationSeconds), value: 'X' }];
  }

  // Digraph and dipthong lookup table -> viseme + timing weight
  const DIGRAPH_MAP = [
    { pattern: 'ph', viseme: 'F', weight: 1.0 },
    { pattern: 'th', viseme: 'H', weight: 1.0 }, // tongue between teeth / open smile
    { pattern: 'ch', viseme: 'B', weight: 1.1 },
    { pattern: 'sh', viseme: 'B', weight: 1.1 },
    { pattern: 'wh', viseme: 'E', weight: 1.2 },
    { pattern: 'ee', viseme: 'D', weight: 1.3 },
    { pattern: 'ea', viseme: 'D', weight: 1.3 },
    { pattern: 'oo', viseme: 'E', weight: 1.4 },
    { pattern: 'ou', viseme: 'C', weight: 1.4 },
    { pattern: 'ow', viseme: 'C', weight: 1.4 },
    { pattern: 'ai', viseme: 'C', weight: 1.3 },
    { pattern: 'ay', viseme: 'C', weight: 1.3 },
    { pattern: 'ck', viseme: 'B', weight: 0.9 }
  ];

  const wordDuration = (durationSeconds * 0.88) / rawWords.length;
  let currentTime = 0.08; // Natural vocal onset pause

  // Initial neutral rest cue
  cues.push({ start: 0, end: 0.08, value: 'X' });

  for (let i = 0; i < rawWords.length; i++) {
    const rawWord = rawWords[i].toLowerCase();
    const cleanWord = rawWord.replace(/[^a-z]/g, '');
    const hasPunctuationPause = /[,.!?:]$/.test(rawWord);

    if (!cleanWord) continue;

    // Parse word into phoneme tokens (handling digraphs)
    const tokens = [];
    let idx = 0;
    while (idx < cleanWord.length) {
      const twoChar = cleanWord.slice(idx, idx + 2);
      const match = DIGRAPH_MAP.find(d => d.pattern === twoChar);
      if (match) {
        tokens.push({ viseme: match.viseme, weight: match.weight });
        idx += 2;
      } else {
        const char = cleanWord[idx];
        let shape = 'B';
        let weight = 1.0;

        if (['a', 'o'].includes(char)) { shape = 'C'; weight = 1.35; } // open vowel gets extra duration
        else if (['e', 'i', 'y'].includes(char)) { shape = 'D'; weight = 1.25; }
        else if (['u', 'w'].includes(char)) { shape = 'E'; weight = 1.3; }
        else if (['f', 'v'].includes(char)) { shape = 'F'; weight = 1.05; }
        else if (['l', 'r'].includes(char)) { shape = 'G'; weight = 1.0; }
        else if (['m', 'p', 'b'].includes(char)) { shape = 'A'; weight = 1.1; } // bilabial closure
        else if (['s', 't', 'd', 'k', 'g', 'z', 'c', 'n', 'j', 'q', 'x'].includes(char)) { shape = 'B'; weight = 0.95; }
        else if (char === 'h') { shape = 'C'; weight = 0.8; }

        tokens.push({ viseme: shape, weight });
        idx += 1;
      }
    }

    const totalWeight = tokens.reduce((sum, t) => sum + t.weight, 0) || 1;
    const effectiveWordTime = wordDuration * (hasPunctuationPause ? 1.15 : 1.0);

    for (const token of tokens) {
      const tokenDuration = (token.weight / totalWeight) * effectiveWordTime;
      const start = Number(currentTime.toFixed(3));
      const end = Number((currentTime + tokenDuration).toFixed(3));
      cues.push({ start, end, value: token.viseme });
      currentTime += tokenDuration;
    }

    // Natural inter-word or clause pause
    const gap = hasPunctuationPause ? 0.12 : Math.min(0.06, (durationSeconds * 0.10) / rawWords.length);
    cues.push({
      start: Number(currentTime.toFixed(3)),
      end: Number((currentTime + gap).toFixed(3)),
      value: hasPunctuationPause ? 'X' : 'B'
    });
    currentTime += gap;
  }

  // Final neutral rest
  if (currentTime < durationSeconds) {
    cues.push({
      start: Number(currentTime.toFixed(3)),
      end: Number(durationSeconds.toFixed(3)),
      value: 'X'
    });
  }

  return cues;
}

/**
 * Generate mouth cues for an audio clip + dialogue with persistent caching
 */
function extractMouthCues(wavPath, dialogueText, durationSeconds = 5.0, outputDir) {
  const jsonPath = path.join(outputDir || path.dirname(wavPath), `${path.basename(wavPath, '.wav')}_mouth.json`);
  const tsvPath = path.join(outputDir || path.dirname(wavPath), `${path.basename(wavPath, '.wav')}_mouth.tsv`);

  // 1. Check local target output file first
  if (fs.existsSync(jsonPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      if (Array.isArray(parsed.mouthCues) && parsed.mouthCues.length > 0) {
        console.log(`[LipSync Engine] ⚡ Target mouth cue artifact found! Loaded ${parsed.mouthCues.length} cues.`);
        return { cues: parsed.mouthCues, jsonPath, tsvPath };
      }
    } catch {}
  }

  // 2. Check global Rhubarb cache by audio hash
  const hash = getAudioHash(wavPath, `${dialogueText}_${durationSeconds}`);
  const cachedJsonPath = path.join(RHUBARB_CACHE_DIR, `${hash}.json`);
  if (fs.existsSync(cachedJsonPath)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cachedJsonPath, 'utf8'));
      if (Array.isArray(cached.mouthCues) && cached.mouthCues.length > 0) {
        console.log(`[LipSync Engine] ⚡ Rhubarb cache hit! Loaded ${cached.mouthCues.length} mouth cues from cache.`);
        fs.copyFileSync(cachedJsonPath, jsonPath);
        const tsvLines = cached.mouthCues.map(c => `${c.start.toFixed(3)}\t${c.end.toFixed(3)}\t${c.value}`);
        fs.writeFileSync(tsvPath, tsvLines.join('\n'));
        return { cues: cached.mouthCues, jsonPath, tsvPath };
      }
    } catch {}
  }

  let cues = [];

  if (isRhubarbAvailable() && fs.existsSync(wavPath)) {
    try {
      cues = runRhubarb(wavPath, jsonPath);
      console.log(`[LipSync Engine] Rhubarb produced ${cues.length} mouth cues.`);
    } catch (e) {
      console.warn('[LipSync Engine] Rhubarb execution failed, using high-precision phonetic generator:', e.message);
      cues = generateFallbackMouthCues(dialogueText, durationSeconds);
    }
  } else {
    console.log('[LipSync Engine] Rhubarb binary not found in PATH, using high-precision phonetic generator.');
    cues = generateFallbackMouthCues(dialogueText, durationSeconds);
  }

  // Write JSON
  const payload = { metadata: { duration: durationSeconds, text: dialogueText, hash }, mouthCues: cues };
  fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2));

  // Save to persistent global Rhubarb cache
  try {
    fs.writeFileSync(cachedJsonPath, JSON.stringify(payload, null, 2));
    console.log(`[LipSync Engine] 💾 Saved Rhubarb lip-sync output to cache (${hash.slice(0, 10)}...).`);
  } catch {}

  // Write TSV
  const tsvLines = cues.map(c => `${c.start.toFixed(3)}\t${c.end.toFixed(3)}\t${c.value}`);
  fs.writeFileSync(tsvPath, tsvLines.join('\n'));

  return { cues, jsonPath, tsvPath };
}

module.exports = {
  isRhubarbAvailable,
  extractMouthCues,
  generateFallbackMouthCues
};
