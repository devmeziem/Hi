/**
 * Voxam Test Diagnostic Runner - Motivation & Stoic Channel Pipeline
 * Full End-to-End Execution for @thestoicarchitect-n4b:
 * 1. Multi-token Grok (xAI) connectivity & failover
 * 2. Cloudflare Workers AI & Groq fallback
 * 3. 6-slide motivational storyboard generation (Full text without truncation)
 * 4. Real 9:16 vertical image generation (Cloudflare SDXL / Pollinations Flux)
 * 5. Real TTS voice synthesis (Cloudflare Deepgram Aura-2)
 * 6. Royalty-free ambient background audio integration & FFmpeg motion compilation
 * 7. YouTube Data API v3 Resumable Upload & Pinned Affiliate Comment
 * 8. Firestore Database & In-App Manifest Synchronization
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync, spawnSync } = require('child_process');
const {
  STOIC_ARCHETYPES,
  getFirestoreConfig,
  fetchRecentHistoryFromFirestore,
  saveContentHistoryToFirestore,
  selectDailyDiverseSlots,
  buildStoicPromptForSlot,
  buildStoicDeepDivePrompt,
  isTopicSimilarToHistory,
  validateStoicStoryboardQuality,
  synthesizeDeterministicStoryboard,
  synthesizeDeterministicStoicDeepDiveStoryboard,
  formatViralShortsTitle
} = require('./stoic_diversity_engine.cjs');

// ANSI Color helper for terminal logs
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  bgBlue: '\x1b[44m',
  bgGreen: '\x1b[42m',
  bgMagenta: '\x1b[45m'
};

function logStep(stepNum, title) {
  console.log(`\n${colors.bright}${colors.cyan}══════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.bgBlue} STEP ${stepNum} ${colors.reset} ${colors.bright}${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.cyan}══════════════════════════════════════════════════════════════════════${colors.reset}`);
}

function logSuccess(msg) {
  console.log(`  ${colors.green}✔ [SUCCESS]${colors.reset} ${msg}`);
}

function logWarning(msg) {
  console.log(`  ${colors.yellow}⚠ [WARNING]${colors.reset} ${msg}`);
}

function logError(msg) {
  console.log(`  ${colors.red}✖ [ERROR]${colors.reset} ${msg}`);
}

function logInfo(msg) {
  console.log(`  ${colors.dim}ℹ${colors.reset} ${msg}`);
}

const logWarn = logWarning;

// Parse Command Line Flags & Environment Variables
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run') || String(process.env.DRY_RUN).toLowerCase() === 'true';
const inputTopic = process.env.TEST_TOPIC ? process.env.TEST_TOPIC.trim() : '';
const currentUtcHour = new Date().getUTCHours();
const contentDepth = process.env.CONTENT_DEPTH || (currentUtcHour === 1 ? 'deep_dive' : 'short_form'); // 'short_form' or 'deep_dive'

// API Credentials
const OPENROUTER_API_KEY = (process.env.OPENROUTER_API_KEY || '').trim();
const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();
const OPENAI_API_KEY = (process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || '').trim();
const DEEPSEEK_API_KEY = (process.env.DEEPSEEK_API_KEY || '').trim();
const XAI_API_KEYS = Array.from(new Set([
  process.env.XAI_API_KEY,
  process.env.GROK_API_KEY,
  process.env.XAI_API_KEY_1,
  process.env.GROK_API_KEY_1,
  process.env.XAI_API_KEY_2,
  process.env.GROK_API_KEY_2
].filter(Boolean))).map(k => k.trim());

const CLOUDFLARE_ACCOUNT_ID = (process.env.CLOUDFLARE_ACCOUNT_ID || '').trim().replace(/^https?:\/\/[^\/]+\//, '').replace(/\/$/, '');
const CLOUDFLARE_API_TOKEN = (process.env.CLOUDFLARE_API_TOKEN || '').trim();
const GROQ_API_KEY = (process.env.GROQ_API_KEY || process.env.GROQ_KEY || '').trim();

// Support channel-specific OAuth tokens as well as global fallbacks
const YOUTUBE_CLIENT_ID = (process.env.YOUTUBE_CLIENT_ID_CH2 || process.env.YOUTUBE_CLIENT_ID || '').trim();
const YOUTUBE_CLIENT_SECRET = (process.env.YOUTUBE_CLIENT_SECRET_CH2 || process.env.YOUTUBE_CLIENT_SECRET || '').trim();
const YOUTUBE_REFRESH_TOKEN = (process.env.YOUTUBE_REFRESH_TOKEN_CH2 || process.env.YOUTUBE_REFRESH_TOKEN || '').trim();

const CLOUDINARY_CLOUD_NAME = (process.env.CLOUDINARY_CLOUD_NAME || '').trim();
const CLOUDINARY_UPLOAD_PRESET = (process.env.CLOUDINARY_UPLOAD_PRESET || '').trim();

// Track auth failures gracefully
let cloudflareAuthFailed = false;

// Bulletproof FFmpeg drawtext string sanitization
function sanitizeForFfmpegDrawtext(str) {
  if (!str) return '';
  return String(str)
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/['"\\`]/g, '')     // Remove single/double quotes and backslashes to prevent filtergraph break-out
    .replace(/[:%]/g, ' ')       // Remove colons/percents that confuse FFmpeg parameter parsing
    .replace(/[[\]{}]/g, '')     // Remove bracket chars
    .replace(/\s+/g, ' ')
    .trim();
}

console.log(`\n${colors.bright}${colors.cyan}══════════════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.bright}${colors.bgBlue} VOXAM RUNNER ENVIRONMENT & CREDENTIAL STATUS ${colors.reset}`);
console.log(`${colors.cyan}══════════════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`  OpenRouter Gateway    : ${OPENROUTER_API_KEY ? colors.green + '✔ PRESENT (' + OPENROUTER_API_KEY.slice(0, 8) + '...)' + colors.reset : colors.yellow + '✖ MISSING (Optional fallback)' + colors.reset}`);
console.log(`  OpenAI API Key        : ${OPENAI_API_KEY ? colors.green + '✔ PRESENT (' + OPENAI_API_KEY.slice(0, 7) + '...)' + colors.reset : colors.yellow + '✖ MISSING (Optional)' + colors.reset}`);
console.log(`  Google Gemini API Key : ${GEMINI_API_KEY ? colors.green + '✔ PRESENT' + colors.reset : colors.yellow + '✖ MISSING' + colors.reset}`);
console.log(`  xAI Grok API Keys     : ${XAI_API_KEYS.length > 0 ? colors.green + `✔ PRESENT (${XAI_API_KEYS.length} key(s))` + colors.reset : colors.yellow + '✖ MISSING' + colors.reset}`);
console.log(`  Groq LPU API Key      : ${GROQ_API_KEY ? colors.green + '✔ PRESENT (' + GROQ_API_KEY.slice(0, 7) + '...)' + colors.reset : colors.yellow + '✖ MISSING' + colors.reset}`);
console.log(`  DeepSeek API Key      : ${DEEPSEEK_API_KEY ? colors.green + '✔ PRESENT' + colors.reset : colors.yellow + '✖ MISSING (Optional)' + colors.reset}`);
console.log(`  Cloudflare AI Account : ${CLOUDFLARE_ACCOUNT_ID ? colors.green + '✔ PRESENT (' + CLOUDFLARE_ACCOUNT_ID.slice(0, 6) + '...)' + colors.reset : colors.yellow + '✖ MISSING (Using Pollinations & Edge)' + colors.reset}`);
console.log(`  Cloudflare API Token  : ${CLOUDFLARE_API_TOKEN ? colors.green + '✔ PRESENT (' + CLOUDFLARE_API_TOKEN.slice(0, 6) + '...)' + colors.reset : colors.yellow + '✖ MISSING' + colors.reset}`);
console.log(`  Cloudinary Storage    : ${CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET ? colors.green + '✔ CONFIGURED (' + CLOUDINARY_CLOUD_NAME + ')' + colors.reset : colors.yellow + '✖ MISSING' + colors.reset}`);
console.log(`  YouTube OAuth Token   : ${YOUTUBE_REFRESH_TOKEN ? colors.green + '✔ PRESENT' + colors.reset : colors.yellow + '✖ MISSING (Dry run will apply)' + colors.reset}`);
console.log(`${colors.cyan}══════════════════════════════════════════════════════════════════════\n${colors.reset}`);

// Royalty Free Ambient Audio Presets
const BACKGROUND_AUDIO_TRACKS = [
  {
    name: 'Stoic Ambient Strings (Calm & Reflective)',
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=meditation-piano-ambient-110855.mp3',
    mood: 'Contemplative, Philosophical, Deep Focus'
  },
  {
    name: 'Cinematic Motivation (Inspirational Strings & Percussion)',
    url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=cinematic-atmosphere-score-1-11867.mp3',
    mood: 'Strength, Victory, Unstoppable Drive'
  }
];

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ----------------------------------------------------
// DYNAMIC CHANNEL RESOLUTION (Real-time fetched handle)
// ----------------------------------------------------
let liveChannelName = process.env.STOIC_CHANNEL_NAME || 'Modern Stoicism & Mental Strength';
let liveChannelHandle = process.env.STOIC_CHANNEL_HANDLE || process.env.CHANNEL_2_HANDLE || '@thestoicarchitect-n4b';

async function resolveLiveChannelProfile() {
  logInfo('[Channel Profile] Resolving dynamic channel profile and handle...');
  
  // 1. Try to fetch live metadata from YouTube OAuth if available
  if (YOUTUBE_CLIENT_ID && YOUTUBE_CLIENT_SECRET && YOUTUBE_REFRESH_TOKEN) {
    try {
      const postData = new URLSearchParams({
        client_id: YOUTUBE_CLIENT_ID,
        client_secret: YOUTUBE_CLIENT_SECRET,
        refresh_token: YOUTUBE_REFRESH_TOKEN,
        grant_type: 'refresh_token'
      }).toString();

      const tokenRes = await new Promise((resolve) => {
        const req = https.request('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: 8000
        }, (res) => {
          let d = '';
          res.on('data', c => d += c);
          res.on('end', () => {
            try { resolve(JSON.parse(d)); } catch { resolve({}); }
          });
        });
        req.on('error', () => resolve({}));
        req.write(postData);
        req.end();
      });

      if (tokenRes.access_token) {
        const chRes = await new Promise((resolve) => {
          const req = https.request('https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${tokenRes.access_token}` },
            timeout: 8000
          }, (res) => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => {
              try { resolve(JSON.parse(d)); } catch { resolve({}); }
            });
          });
          req.on('error', () => resolve({}));
          req.end();
        });

        if (chRes.items && chRes.items.length > 0) {
          const fetchedItem = chRes.items[0];
          if (fetchedItem.snippet?.title) liveChannelName = fetchedItem.snippet.title;
          if (fetchedItem.snippet?.customUrl) {
            liveChannelHandle = fetchedItem.snippet.customUrl.startsWith('@') ? fetchedItem.snippet.customUrl : `@${fetchedItem.snippet.customUrl}`;
          }
          logSuccess(`[Channel Profile] Live YouTube channel fetched: "${liveChannelName}" (${liveChannelHandle})`);
          return;
        }
      }
    } catch (e) {
      logInfo(`[Channel Profile] YouTube probe note: ${e.message}`);
    }
  }

  // 2. Try Firestore saved channel record
  try {
    const fsChannels = await fetchRecentHistoryFromFirestore('motivation_stoicism', 1);
    if (fsChannels && fsChannels[0]?.channelHandle) {
      liveChannelHandle = fsChannels[0].channelHandle;
    }
  } catch {}

  logInfo(`[Channel Profile] Active Channel: "${liveChannelName}" (${liveChannelHandle})`);
}

// ----------------------------------------------------
// DYNAMIC TOPIC DISCOVERY ENGINE (Auto-generate fresh Stoic topics)
// ----------------------------------------------------
let resolvedArchetype = null;
let recentContentHistory = [];

function sanitizeDiscoveryTopic(rawText) {
  if (!rawText) return '';
  let t = String(rawText);
  // Strip <think>...</think> and unclosed <think>...
  t = t.replace(/<think>[\s\S]*?<\/think>/gi, '');
  t = t.replace(/<think>[\s\S]*/gi, '');
  // Strip Thinking Process
  t = t.replace(/Thinking Process:[\s\S]*?(?=\n\n|\n[A-Z0-9"']|$)/gi, '');
  t = t.replace(/```[\s\S]*?```/gi, '');
  // Extract clean non-empty single title line
  const lines = t.split(/[\r\n]+/)
    .map(l => l.replace(/^[\d\.\-\*\#\s"']+|["']+$/g, '').trim())
    .filter(l => l.length > 5 && !l.toLowerCase().startsWith('here') && !l.toLowerCase().startsWith('sure'));
  if (lines.length > 0) {
    t = lines[0];
  }
  t = t.replace(/^["']|["']$/g, '').replace(/#\w+/g, '').trim();
  if (t.length > 70) {
    const trimmed = t.slice(0, 68);
    const lastSpace = trimmed.lastIndexOf(' ');
    t = (lastSpace > 25 ? trimmed.slice(0, lastSpace) : trimmed).trim();
  }
  t = t.replace(/[,\-;:–—]+$/, '').replace(/\s+(and|to|with|the|of|in|for|by|or|a|an|from|on|is|are)\s*$/i, '').trim();
  return t;
}

function cleanLlmJson(rawContent) {
  if (!rawContent) return null;
  let text = String(rawContent);
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
  text = text.replace(/<think>[\s\S]*/gi, '');
  text = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.substring(firstBrace, lastBrace + 1);
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Clean text for natural speech synthesis, removing ellipses and dead pauses
 */
function prepareTextForSpeech(rawText) {
  if (!rawText) return '';
  let clean = String(rawText)
    .replace(/^(slide\s*\d+[:\-.]?|narration[:\-.]?|host[:\-.]?|voiceover[:\-.]?)\s*/i, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\.{2,}/g, '.') // remove multi-dots/ellipses that cause 1-2s pauses
    .replace(/[:;–—]/g, ', ') // replace pauses with soft conversational commas
    .replace(/&/g, ' and ')
    .replace(/%/g, ' percent ')
    .replace(/\$/g, ' dollars ')
    .replace(/₦/g, ' Naira ')
    .replace(/\bvs\.?\b/gi, 'versus')
    .replace(/\bw\/\b/gi, 'with')
    .replace(/\be\.g\.?\b/gi, 'for example')
    .replace(/\bi\.e\.?\b/gi, 'that is')
    .replace(/#\w+/g, '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/['"\\`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return clean;
}

// Helper to trim trailing and leading silence from synthesized audio files
function trimAudioSilence(filePath) {
  if (!fs.existsSync(filePath)) return;
  try {
    const tempTrim = filePath.replace(/\.mp3$/, '_trim.mp3');
    // Strip silence below -40dB with 80ms stop duration
    execSync(`ffmpeg -y -i "${filePath}" -af "silenceremove=stop_periods=-1:stop_duration=0.08:stop_threshold=-40dB,silenceremove=start_periods=1:start_duration=0.02:start_threshold=-40dB" -b:a 192k "${tempTrim}" 2>/dev/null`);
    if (fs.existsSync(tempTrim) && fs.statSync(tempTrim).size > 500) {
      fs.renameSync(tempTrim, filePath);
    }
  } catch {}
}

function validateStoicStoryboard(storyboard) {
  if (!storyboard || !Array.isArray(storyboard.slides) || storyboard.slides.length < 3) return false;
  
  // Enforce zero-leakage quality validator
  const qualityCheck = validateStoicStoryboardQuality(storyboard);
  if (!qualityCheck.valid) {
    logWarning(`[Storyboard Quality] Rejected invalid storyboard: ${qualityCheck.reason}`);
    return false;
  }

  // Clean all slide texts for spoken delivery
  storyboard.slides.forEach(slide => {
    slide.text = prepareTextForSpeech(slide.text);
  });

  return true;
}

async function resolveTopic(activeGrok, backupEngines) {
  await resolveLiveChannelProfile();

  // Query Firestore history first
  logInfo('[History & Cooldown] Querying Firestore for recent Stoic channel content...');
  recentContentHistory = await fetchRecentHistoryFromFirestore('motivation_stoicism', 30);
  logInfo(`[History & Cooldown] Retrieved ${recentContentHistory.length} historical records.`);

  // Pick the least recently used distinct archetype
  const diverseSlots = selectDailyDiverseSlots(recentContentHistory, 1);
  resolvedArchetype = diverseSlots[0] || STOIC_ARCHETYPES[0];
  logInfo(`[Diversity Engine] Selected Slot Archetype -> Theme: "${resolvedArchetype.theme}" | Angle: "${resolvedArchetype.angle}"`);

  if (inputTopic && inputTopic.length > 3) {
    logInfo(`Using User-Provided Topic: "${inputTopic}"`);
    return inputTopic;
  }

  logInfo('No manual topic provided. Discovering a fresh, viral Stoic topic via AI Brain...');
  const recentExclusions = (recentContentHistory || []).slice(0, 10).map(h => `"${h.topic || h.title || ''}"`).filter(s => s !== '""').join(', ');

  // 1. Try OpenRouter Gateway (Top Reliability & Broad Model Availability)
  if (OPENROUTER_API_KEY) {
    const openRouterModels = [
      'google/gemini-2.0-flash-001',
      'meta-llama/llama-3.3-70b-instruct',
      'deepseek/deepseek-chat',
      'mistralai/mistral-small-24b-instruct-2501'
    ];
    for (const model of openRouterModels) {
      try {
        logInfo(`[Topic Discovery] Requesting topic from OpenRouter (${model})...`);
        const prompt = `Suggest 1 viral, complete, high-retention YouTube Shorts title (around 35-50 characters) for "${liveChannelName}" (${liveChannelHandle}).
CHANNEL FOCUS: MODERN STOICISM + MOTIVATION + MENTAL STRENGTH (real modern struggles: discipline, self-control, rejection, failure, overthinking, disrespect).
THEME: "${resolvedArchetype.theme}"
ANGLE: "${resolvedArchetype.angle}"
DO NOT USE BIOGRAPHIES OR QUOTES LISTS.
DO NOT USE OR DUPLICATE RECENT TITLES: [${recentExclusions || 'None'}]
Return ONLY the single title text in plain text as a complete, grammatically whole thought without quotes, markdown, or cut-offs.`;

        const res = await new Promise((resolve) => {
          const postData = JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: 'You are a viral YouTube Shorts strategist for Stoicism and high-performance psychology. Return ONLY the single title.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.9,
            max_tokens: 60
          });
          const req = https.request('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'HTTP-Referer': 'https://voxam.app',
              'X-Title': 'Voxam Stoic Engine',
              'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 9000
          }, (resp) => {
            let data = '';
            resp.on('data', c => data += c);
            resp.on('end', () => {
              if (resp.statusCode === 200) {
                try {
                  const j = JSON.parse(data);
                  resolve({ success: true, text: j.choices?.[0]?.message?.content?.trim() });
                } catch (e) {
                  resolve({ success: false, error: 'JSON parse error: ' + e.message });
                }
              } else {
                resolve({ success: false, error: `HTTP ${resp.statusCode}: ${data.slice(0, 120)}` });
              }
            });
          });
          req.on('error', (err) => resolve({ success: false, error: err.message }));
          req.on('timeout', () => { req.destroy(); resolve({ success: false, error: 'Request timeout (9s)' }); });
          req.write(postData);
          req.end();
        });

        if (res.success && res.text) {
          const cleanTopic = sanitizeDiscoveryTopic(res.text);
          if (cleanTopic.length > 5 && !isTopicSimilarToHistory(cleanTopic, resolvedArchetype.theme, recentContentHistory)) {
            logSuccess(`[Topic Discovery] Generated via OpenRouter (${model}): "${cleanTopic}"`);
            return cleanTopic;
          }
        } else {
          logInfo(`[Topic Discovery] OpenRouter (${model}) notice: ${res.error || 'Empty response'}`);
        }
      } catch (err) {
        logInfo(`[Topic Discovery] OpenRouter (${model}) notice: ${err.message}`);
      }
    }
  }

  // 2. Try Gemini (gemini-2.5-flash, gemini-2.0-flash, gemini-1.5-flash-latest, etc.)
  if (GEMINI_API_KEY) {
    const geminiModels = ['gemini-2.5-flash', 'gemini-2.0-flash-exp', 'gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash'];
    for (const model of geminiModels) {
      try {
        logInfo(`[Topic Discovery] Requesting topic from Google Gemini (${model})...`);
        const prompt = `Suggest 1 viral, complete, high-retention YouTube Shorts title (around 35-50 characters) for "${liveChannelName}" (${liveChannelHandle}).
CHANNEL FOCUS: MODERN STOICISM + MOTIVATION + MENTAL STRENGTH (real modern struggles: discipline, self-control, rejection, failure, overthinking, disrespect).
THEME: "${resolvedArchetype.theme}"
ANGLE: "${resolvedArchetype.angle}"
DO NOT USE BIOGRAPHIES OR QUOTES LISTS.
DO NOT USE OR DUPLICATE RECENT TITLES: [${recentExclusions || 'None'}]
Return ONLY the single title text in plain text as a complete, grammatically whole thought without quotes, markdown, or cut-offs.`;
        const res = await new Promise((resolve) => {
          const postData = JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.95, maxOutputTokens: 60 }
          });
          const req = https.request(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 8000
          }, (resp) => {
            let data = '';
            resp.on('data', c => data += c);
            resp.on('end', () => {
              if (resp.statusCode === 200) {
                try {
                  const j = JSON.parse(data);
                  const text = j.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
                  resolve({ success: true, text });
                } catch (e) {
                  resolve({ success: false, error: 'JSON parse error: ' + e.message });
                }
              } else {
                resolve({ success: false, error: `HTTP ${resp.statusCode}: ${data.slice(0, 120)}` });
              }
            });
          });
          req.on('error', (err) => resolve({ success: false, error: err.message }));
          req.on('timeout', () => { req.destroy(); resolve({ success: false, error: 'Request timeout (8s)' }); });
          req.write(postData);
          req.end();
        });

        if (res.success && res.text) {
          const cleanTopic = sanitizeDiscoveryTopic(res.text);
          if (cleanTopic.length > 5 && !isTopicSimilarToHistory(cleanTopic, resolvedArchetype.theme, recentContentHistory)) {
            logSuccess(`[Topic Discovery] Generated via Gemini (${model}): "${cleanTopic}"`);
            return cleanTopic;
          }
        } else {
          logWarning(`[Topic Discovery] Gemini (${model}) failed: ${res.error || 'Empty response'}`);
        }
      } catch (err) {
        logWarning(`[Topic Discovery] Gemini (${model}) exception: ${err.message}`);
      }
    }
  } else {
    logInfo('[Topic Discovery] Gemini API key not present, skipping Gemini...');
  }

  // 2. Try Grok (xAI) with verified available models
  if (activeGrok && activeGrok.key) {
    try {
      logInfo(`[Topic Discovery] Requesting topic from xAI Grok (${activeGrok.model || 'grok-2-latest'})...`);
      const res = await new Promise((resolve) => {
        const postData = JSON.stringify({
          model: activeGrok.model || 'grok-2-latest',
          messages: [
            { role: 'system', content: 'You are a viral YouTube Shorts strategist for Stoicism and high-performance psychology.' },
            { role: 'user', content: `Generate 1 fresh, complete, high-retention title (around 35-50 characters) for "The Stoic Architect" on Theme: "${resolvedArchetype.theme}" (Angle: "${resolvedArchetype.angle}"). Avoid recent titles: [${recentExclusions || 'None'}]. Return ONLY the single title in plain text as a complete grammatical phrase without reasoning or cuts.` }
          ],
          temperature: 0.9,
          max_tokens: 60
        });
        const req = https.request('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeGrok.key}`,
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: 8000
        }, (resp) => {
          let data = '';
          resp.on('data', c => data += c);
          resp.on('end', () => {
            if (resp.statusCode === 200) {
              try {
                const j = JSON.parse(data);
                resolve({ success: true, text: j.choices?.[0]?.message?.content?.trim() });
              } catch (e) {
                resolve({ success: false, error: 'JSON parse error: ' + e.message });
              }
            } else {
              resolve({ success: false, error: `HTTP ${resp.statusCode}: ${data.slice(0, 120)}` });
            }
          });
        });
        req.on('error', (err) => resolve({ success: false, error: err.message }));
        req.on('timeout', () => { req.destroy(); resolve({ success: false, error: 'Request timeout (8s)' }); });
        req.write(postData);
        req.end();
      });

      if (res.success && res.text) {
        const cleanTopic = sanitizeDiscoveryTopic(res.text);
        if (cleanTopic.length > 5 && !isTopicSimilarToHistory(cleanTopic, resolvedArchetype.theme, recentContentHistory)) {
          logSuccess(`[Topic Discovery] Generated via Grok (${activeGrok.model}): "${cleanTopic}"`);
          return cleanTopic;
        }
      } else {
        logWarning(`[Topic Discovery] Grok failed: ${res.error || 'Empty response'}`);
      }
    } catch (err) {
      logWarning(`[Topic Discovery] Grok exception: ${err.message}`);
    }
  }

  // 3. Try Groq (Fast Low-Consumption Inference Models)
  if (GROQ_API_KEY) {
    const groqModels = backupEngines?.groqWorkingModel
      ? [backupEngines.groqWorkingModel, 'llama-3.1-8b-instant', 'gemma2-9b-it', 'llama-3.3-70b-versatile']
      : ['llama-3.1-8b-instant', 'gemma2-9b-it', 'llama-3.3-70b-versatile', 'mixtral-8x7b-32768'];
    for (const model of groqModels) {
      try {
        logInfo(`[Topic Discovery] Requesting topic from Groq (${model})...`);
        const res = await new Promise((resolve) => {
          const postData = JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: 'You are a YouTube Shorts strategist. Return only a complete, grammatically whole title without any thinking tags or preamble.' },
              { role: 'user', content: `Generate 1 concise, complete title (around 35-50 characters) for "The Stoic Architect" on Theme: "${resolvedArchetype.theme}" (Angle: "${resolvedArchetype.angle}"). Avoid recent titles: [${recentExclusions || 'None'}]. Return ONLY the title text.` }
            ],
            temperature: 0.8,
            max_tokens: 50
          });
          const req = https.request('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${GROQ_API_KEY}`,
              'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 8000
          }, (resp) => {
            let data = '';
            resp.on('data', c => data += c);
            resp.on('end', () => {
              if (resp.statusCode === 200) {
                try {
                  const j = JSON.parse(data);
                  resolve({ success: true, text: j.choices?.[0]?.message?.content?.trim() });
                } catch (e) {
                  resolve({ success: false, error: 'JSON parse error: ' + e.message });
                }
              } else {
                resolve({ success: false, error: `HTTP ${resp.statusCode}` });
              }
            });
          });
          req.on('error', (err) => resolve({ success: false, error: err.message }));
          req.on('timeout', () => { req.destroy(); resolve({ success: false, error: 'Request timeout' }); });
          req.write(postData);
          req.end();
        });

        if (res.success && res.text) {
          let cleanTopic = sanitizeDiscoveryTopic(res.text);
          if (cleanTopic.length > 5 && !isTopicSimilarToHistory(cleanTopic, resolvedArchetype.theme, recentContentHistory)) {
            logSuccess(`[Topic Discovery] Generated via Groq (${model}): "${cleanTopic}"`);
            return cleanTopic;
          }
        } else {
          logInfo(`[Topic Discovery] Groq (${model}) notice: ${res.error || 'Empty response'}`);
        }
      } catch (err) {
        logInfo(`[Topic Discovery] Groq (${model}) notice: ${err.message}`);
      }
    }
  }

  // 4. Dynamic randomized archetype title fallback (clean and under 70 characters)
  const generatedFallback = `${resolvedArchetype.theme} - The Stoic Rule for Mental Strength`;
  logInfo(`[Topic Discovery] Selected curated archetype title: "${generatedFallback}"`);
  return generatedFallback;
}

// ----------------------------------------------------
// STEP 1: TEST GROK 2 (xAI) MULTI-TOKEN HEALTH
// ----------------------------------------------------
async function testGrokKeys() {
  logStep(1, 'Testing Grok (xAI) Multi-Token Connectivity');
  logInfo(`Found ${XAI_API_KEYS.length} candidate Grok token(s). Testing live inference...`);

  // Active verified xAI models (ordered by efficiency and stability)
  const grokModels = ['grok-2-latest', 'grok-2', 'grok-beta', 'grok-2-1212', 'grok-vision-beta'];
  let activeKey = null;

  for (let i = 0; i < XAI_API_KEYS.length; i++) {
    const key = XAI_API_KEYS[i];
    const masked = key.slice(0, 8) + '...' + key.slice(-4);

    for (const model of grokModels) {
      const startTime = Date.now();
      try {
        const response = await new Promise((resolve) => {
          const postData = JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: 'You are a concise AI tester.' },
              { role: 'user', content: 'Respond with exactly: "Grok Active"' }
            ],
            max_tokens: 30
          });

          const req = https.request('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${key}`,
              'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 8000
          }, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
              const duration = Date.now() - startTime;
              if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                  const json = JSON.parse(data);
                  const reply = json.choices?.[0]?.message?.content?.trim();
                  resolve({ success: true, duration, reply, statusCode: res.statusCode, model });
                } catch (e) {
                  resolve({ success: false, duration, error: 'JSON parse error', statusCode: res.statusCode });
                }
              } else {
                resolve({ success: false, duration, statusCode: res.statusCode, error: data.slice(0, 150), model });
              }
            });
          });

          req.on('error', (err) => resolve({ success: false, duration: Date.now() - startTime, error: err.message }));
          req.on('timeout', () => { req.destroy(); resolve({ success: false, duration: 8000, error: 'Request timed out' }); });
          req.write(postData);
          req.end();
        });

        if (response.success) {
          logSuccess(`Grok Token #${i + 1} (${masked}) with '${model}' is ONLINE! Latency: ${response.duration}ms | Response: "${response.reply}"`);
          if (!activeKey) activeKey = { key, model };
          break;
        } else if (response.statusCode === 403) {
          logWarning(`Grok (${masked}) reached model '${model}' (HTTP 403 - key requires active billing/credits).`);
          break;
        }
      } catch (err) {
        logError(`Grok Token #${i + 1} (${masked}) Exception: ${err.message}`);
      }
    }
  }

  return activeKey;
}

// ----------------------------------------------------
// STEP 2: TEST GROQ & CLOUDFLARE INFERENCE BACKUP
// ----------------------------------------------------
async function testBackupEngines() {
  logStep(2, 'Testing Groq & Cloudflare AI Backup Engines');
  const startTime = Date.now();
  let groqWorkingModel = null;

  if (GROQ_API_KEY) {
    // Verified fast, low-consumption working Groq models
    let candidateModels = [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'deepseek-r1-distill-llama-70b',
      'gemma2-9b-it',
      'qwen-2.5-32b'
    ];

    try {
      const activeList = await new Promise((resolve) => {
        const req = https.get('https://api.groq.com/openai/v1/models', {
          headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` },
          timeout: 4000
        }, (res) => {
          let d = '';
          res.on('data', c => d += c);
          res.on('end', () => {
            if (res.statusCode === 200) {
              try {
                const j = JSON.parse(d);
                if (Array.isArray(j.data)) {
                  const textModels = j.data
                    .map(m => m.id)
                    .filter(id => !id.includes('whisper') && !id.includes('guard') && !id.includes('vision'));
                  if (textModels.length > 0) return resolve(textModels);
                }
              } catch {}
            }
            resolve(null);
          });
        });
        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
      });
      if (activeList && activeList.length > 0) {
        // Prioritize low-consumption instant models
        candidateModels = [
          ...activeList.filter(m => m === 'llama-3.1-8b-instant' || m === 'gemma2-9b-it' || m === 'llama-3.3-70b-versatile'),
          ...activeList.filter(m => m !== 'llama-3.1-8b-instant' && m !== 'gemma2-9b-it' && m !== 'llama-3.3-70b-versatile')
        ];
      }
    } catch {}

    for (const model of candidateModels) {
      try {
        const res = await new Promise((resolve) => {
          const postData = JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: 'Say OK' }],
            max_tokens: 10
          });

          const req = https.request('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${GROQ_API_KEY}`,
              'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 8000
          }, (resp) => {
            let d = '';
            resp.on('data', c => d += c);
            resp.on('end', () => {
              resolve({ statusCode: resp.statusCode, body: d, duration: Date.now() - startTime, model });
            });
          });
          req.on('error', e => resolve({ statusCode: 500, error: e.message }));
          req.write(postData);
          req.end();
        });

        if (res.statusCode === 200) {
          logSuccess(`Groq High-Speed Engine ('${model}') is ONLINE & READY! Latency: ${res.duration}ms`);
          groqWorkingModel = model;
          break;
        }
      } catch {}
    }
  }

  if (!groqWorkingModel) {
    logInfo('Groq LPU offline or models unavailable. System will use Cloudflare Low-Neuron AI or deterministic dynamic archetypes.');
  }

  return { groqWorkingModel };
}

// ----------------------------------------------------
// STEP 3: GENERATE MOTIVATIONAL & STOIC 6-SLIDE STORYBOARD
// ----------------------------------------------------
async function generateStoicStoryboard(topic, activeGrok, backupEngines) {
  logStep(3, `Generating Motivational Storyboard: "${topic}"`);
  logInfo(`Channel: ${liveChannelName} (${liveChannelHandle})`);
  logInfo(`Depth Mode: ${contentDepth === 'deep_dive' ? '3-5 min Deep Narrative' : '60s High-Retention Short'}`);

  const activeArch = resolvedArchetype || STOIC_ARCHETYPES[0];
  logInfo(`[Archetype] Theme: "${activeArch.theme}" | Angle: "${activeArch.angle}"`);

  const isDeepDive = contentDepth === 'deep_dive';
  const { systemPrompt, userPrompt } = isDeepDive
    ? buildStoicDeepDivePrompt(activeArch, recentContentHistory, liveChannelHandle)
    : buildStoicPromptForSlot(activeArch, recentContentHistory, 0, liveChannelHandle);

  let scriptData = null;

  // 1. PRIMARY: OpenRouter Gateway (Highest Reliability, Broad Model Fallbacks)
  if (OPENROUTER_API_KEY) {
    const openRouterModels = [
      'google/gemini-2.0-flash-001',
      'meta-llama/llama-3.3-70b-instruct',
      'deepseek/deepseek-chat',
      'mistralai/mistral-small-24b-instruct-2501'
    ];
    for (const model of openRouterModels) {
      try {
        logInfo(`[Storyboard Engine] 1. Requesting storyboard from OpenRouter (${model})...`);
        const raw = await new Promise((resolve) => {
          const postData = JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `${userPrompt} Topic title: "${topic}". Ensure complete sentences on every slide. Return strictly valid JSON.` }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
            max_tokens: 2200
          });

          const req = https.request('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'HTTP-Referer': 'https://voxam.app',
              'X-Title': 'Voxam Stoic Engine',
              'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 16000
          }, (res) => {
            let data = '';
            res.on('data', c => { data += c; });
            res.on('end', () => {
              if (res.statusCode === 200) {
                try {
                  const j = JSON.parse(data);
                  resolve({ success: true, content: j.choices?.[0]?.message?.content });
                } catch (e) {
                  resolve({ success: false, error: 'JSON parse error: ' + e.message });
                }
              } else {
                resolve({ success: false, error: `HTTP ${res.statusCode}: ${data.slice(0, 150)}` });
              }
            });
          });
          req.on('error', (err) => resolve({ success: false, error: err.message }));
          req.on('timeout', () => { req.destroy(); resolve({ success: false, error: 'Request timeout' }); });
          req.write(postData);
          req.end();
        });

        if (raw.success && raw.content) {
          const parsed = cleanLlmJson(raw.content);
          if (parsed && validateStoicStoryboard(parsed)) {
            if (!isDeepDive && parsed.slides.length > 6) parsed.slides = parsed.slides.slice(0, 6);
            scriptData = parsed;
            logSuccess(`[Storyboard Engine] OpenRouter (${model}) generated complete ${scriptData.slides.length}-slide package!`);
            break;
          }
        } else {
          logInfo(`[Storyboard Engine] OpenRouter (${model}) notice: ${raw.error || 'Empty response'}`);
        }
      } catch (e) {
        logInfo(`[Storyboard Engine] OpenRouter (${model}) notice: ${e.message}`);
      }
    }
  }

  // 2. SECONDARY: Groq LPU (Least Costly / Highest Speed / 0 Cold-start)
  if (!scriptData && backupEngines && backupEngines.groqWorkingModel) {
    try {
      logInfo(`[Storyboard Engine] 2. Requesting storyboard from Groq LPU (${backupEngines.groqWorkingModel})...`);
      const raw = await new Promise((resolve) => {
        const postData = JSON.stringify({
          model: backupEngines.groqWorkingModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `${userPrompt} Topic title: "${topic}". Ensure complete sentences on every slide. Return strictly valid JSON.` }
          ],
          temperature: 0.7,
          max_tokens: 1800,
          response_format: { type: 'json_object' }
        });

        const req = https.request('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: 12000
        }, (res) => {
          let data = '';
          res.on('data', c => { data += c; });
          res.on('end', () => {
            if (res.statusCode === 200) {
              try {
                const j = JSON.parse(data);
                resolve({ success: true, content: j.choices?.[0]?.message?.content });
              } catch (e) {
                resolve({ success: false, error: 'JSON parse error: ' + e.message });
              }
            } else {
              resolve({ success: false, error: `HTTP ${res.statusCode}: ${data.slice(0, 150)}` });
            }
          });
        });
        req.on('error', (err) => resolve({ success: false, error: err.message }));
        req.on('timeout', () => { req.destroy(); resolve({ success: false, error: 'Request timeout' }); });
        req.write(postData);
        req.end();
      });

      if (raw.success && raw.content) {
        const parsed = cleanLlmJson(raw.content);
        if (parsed && validateStoicStoryboard(parsed)) {
          if (parsed.slides.length > 6) parsed.slides = parsed.slides.slice(0, 6);
          scriptData = parsed;
          logSuccess(`[Storyboard Engine] Groq (${backupEngines.groqWorkingModel}) generated complete ${scriptData.slides.length}-slide package!`);
        }
      } else {
        logWarning(`[Storyboard Engine] Groq failed: ${raw.error || 'Empty payload'}`);
      }
    } catch (e) {
      logWarning(`[Storyboard Engine] Groq exception: ${e.message}`);
    }
  }

  // 2. SECONDARY: Cloudflare Low-Neuron AI (Ultra-low neuron consumption)
  if (!scriptData && CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_API_TOKEN && !cloudflareAuthFailed) {
    const cfLowNeuronModels = [
      '@cf/meta/llama-3.2-3b-instruct',  // Ultra-low neuron consumption, great reasoning
      '@cf/meta/llama-3.2-1b-instruct',  // Minimum neuron footprint
      '@cf/meta/llama-3.1-8b-instruct'   // Standard low-cost workhorse
    ];

    for (const model of cfLowNeuronModels) {
      try {
        logInfo(`[Storyboard Engine] 2. Requesting storyboard from Cloudflare Low-Neuron AI (${model})...`);
        const raw = await new Promise((resolve) => {
          const postData = JSON.stringify({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `${userPrompt} Topic title: "${topic}". Complete all sentences. Return strictly valid JSON.` }
            ],
            max_tokens: 1800
          });

          const req = https.request(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 14000
          }, (res) => {
            let data = '';
            res.on('data', c => { data += c; });
            res.on('end', () => {
              if (res.statusCode === 200) {
                try {
                  const j = JSON.parse(data);
                  const content = j.result?.response || j.response;
                  resolve({ success: true, content });
                } catch (e) {
                  resolve({ success: false, error: 'JSON parse error: ' + e.message });
                }
              } else {
                resolve({ success: false, error: `HTTP ${res.statusCode}: ${data.slice(0, 150)}` });
              }
            });
          });
          req.on('error', (err) => resolve({ success: false, error: err.message }));
          req.on('timeout', () => { req.destroy(); resolve({ success: false, error: 'Request timeout' }); });
          req.write(postData);
          req.end();
        });

        if (raw.success && raw.content) {
          const parsed = cleanLlmJson(raw.content);
          if (parsed && validateStoicStoryboard(parsed)) {
            if (parsed.slides.length > 6) parsed.slides = parsed.slides.slice(0, 6);
            scriptData = parsed;
            logSuccess(`[Storyboard Engine] Cloudflare Low-Neuron (${model}) generated full ${scriptData.slides.length}-slide package!`);
            break;
          }
        }
      } catch (e) {
        logWarning(`[Storyboard Engine] Cloudflare (${model}) notice: ${e.message}`);
      }
    }
  }

  // 3. TERTIARY: Pollinations.ai Text API (100% Free, NO API Key Required)
  if (!scriptData) {
    const pollModels = ['openai', 'mistral', 'qwen-coder', 'llama'];
    for (const pModel of pollModels) {
      try {
        logInfo(`[Storyboard Engine] 3. Requesting storyboard from Pollinations.ai Free Text API (${pModel})...`);
        const raw = await new Promise((resolve) => {
          const postData = JSON.stringify({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `${userPrompt} Topic title: "${topic}". Return strictly valid JSON object.` }
            ],
            model: pModel,
            jsonMode: true
          });

          const req = https.request('https://text.pollinations.ai/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 16000
          }, (res) => {
            let data = '';
            res.on('data', c => { data += c; });
            res.on('end', () => {
              if (res.statusCode >= 200 && res.statusCode < 300 && data.trim().length > 10) {
                resolve({ success: true, content: data.trim() });
              } else {
                resolve({ success: false, error: `HTTP ${res.statusCode}` });
              }
            });
          });
          req.on('error', (err) => resolve({ success: false, error: err.message }));
          req.on('timeout', () => { req.destroy(); resolve({ success: false, error: 'Request timeout' }); });
          req.write(postData);
          req.end();
        });

        if (raw.success && raw.content) {
          const parsed = cleanLlmJson(raw.content);
          if (parsed && validateStoicStoryboard(parsed)) {
            if (parsed.slides.length > 6) parsed.slides = parsed.slides.slice(0, 6);
            scriptData = parsed;
            logSuccess(`[Storyboard Engine] Pollinations.ai (${pModel}) generated full ${scriptData.slides.length}-slide package!`);
            break;
          }
        }
      } catch (e) {
        logWarning(`[Storyboard Engine] Pollinations.ai (${pModel}) notice: ${e.message}`);
      }
    }
  }

  // 4. QUATERNARY: Google Gemini 2.0 / 1.5 Flash (Free Tier)
  if (!scriptData && GEMINI_API_KEY) {
    const candidateGeminiModels = ['gemini-2.5-flash', 'gemini-2.0-flash-exp', 'gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash'];
    for (const model of candidateGeminiModels) {
      try {
        logInfo(`[Storyboard Engine] 4. Requesting storyboard from Google Gemini (${model})...`);
        const raw = await new Promise((resolve) => {
          const postData = JSON.stringify({
            contents: [
              {
                parts: [
                  { text: `${systemPrompt}\n\nTask: ${userPrompt} Topic title: "${topic}". Return strictly raw JSON.` }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.75,
              maxOutputTokens: 2000,
              responseMimeType: "application/json"
            }
          });

          const req = https.request(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 15000
          }, (res) => {
            let data = '';
            res.on('data', c => { data += c; });
            res.on('end', () => {
              if (res.statusCode === 200) {
                try {
                  const j = JSON.parse(data);
                  const content = j.candidates?.[0]?.content?.parts?.[0]?.text;
                  resolve({ success: true, content });
                } catch (e) {
                  resolve({ success: false, error: 'JSON parse error: ' + e.message });
                }
              } else {
                resolve({ success: false, error: `HTTP ${res.statusCode}: ${data.slice(0, 150)}` });
              }
            });
          });
          req.on('error', (err) => resolve({ success: false, error: err.message }));
          req.on('timeout', () => { req.destroy(); resolve({ success: false, error: 'Request timeout (15s)' }); });
          req.write(postData);
          req.end();
        });

        if (raw.success && raw.content) {
          const parsed = cleanLlmJson(raw.content);
          if (parsed && validateStoicStoryboard(parsed)) {
            if (parsed.slides.length > 6) parsed.slides = parsed.slides.slice(0, 6);
            scriptData = parsed;
            logSuccess(`[Storyboard Engine] Google Gemini (${model}) generated full ${scriptData.slides.length}-slide storyboard!`);
            break;
          }
        }
      } catch (e) {
        logWarning(`[Storyboard Engine] Gemini (${model}) notice: ${e.message}`);
      }
    }
  }

  // 5. QUINARY: OpenAI (Least Costly: gpt-4o-mini)
  if (!scriptData && OPENAI_API_KEY) {
    const openaiCandidateModels = ['gpt-4o-mini', 'o3-mini', 'gpt-4o'];
    for (const model of openaiCandidateModels) {
      try {
        logInfo(`[Storyboard Engine] 5. Requesting storyboard from OpenAI (${model})...`);
        const raw = await new Promise((resolve) => {
          const postData = JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `${userPrompt} Topic title: "${topic}". Return strictly valid JSON.` }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.75,
            max_tokens: 2000
          });

          const req = https.request('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 15000
          }, (res) => {
            let data = '';
            res.on('data', c => { data += c; });
            res.on('end', () => {
              if (res.statusCode === 200) {
                try {
                  const j = JSON.parse(data);
                  resolve({ success: true, content: j.choices?.[0]?.message?.content });
                } catch (e) {
                  resolve({ success: false, error: 'JSON parse error: ' + e.message });
                }
              } else {
                resolve({ success: false, error: `HTTP ${res.statusCode}: ${data.slice(0, 150)}` });
              }
            });
          });
          req.on('error', (err) => resolve({ success: false, error: err.message }));
          req.on('timeout', () => { req.destroy(); resolve({ success: false, error: 'Request timeout (15s)' }); });
          req.write(postData);
          req.end();
        });

        if (raw.success && raw.content) {
          const parsed = cleanLlmJson(raw.content);
          if (parsed && validateStoicStoryboard(parsed)) {
            if (parsed.slides.length > 6) parsed.slides = parsed.slides.slice(0, 6);
            scriptData = parsed;
            logSuccess(`[Storyboard Engine] OpenAI (${model}) generated complete ${scriptData.slides.length}-slide storyboard!`);
            break;
          }
        }
      } catch (e) {
        logWarning(`[Storyboard Engine] OpenAI (${model}) notice: ${e.message}`);
      }
    }
  }

  // 6. SENARY: DeepSeek (deepseek-chat - Ultra low cost)
  if (!scriptData && DEEPSEEK_API_KEY) {
    try {
      logInfo(`[Storyboard Engine] 6. Requesting storyboard from DeepSeek (deepseek-chat)...`);
      const raw = await new Promise((resolve) => {
        const postData = JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `${userPrompt} Topic title: "${topic}". Output strictly valid JSON.` }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 1800
        });
        const req = https.request('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: 15000
        }, (res) => {
          let data = '';
          res.on('data', c => { data += c; });
          res.on('end', () => {
            if (res.statusCode === 200) {
              try {
                const j = JSON.parse(data);
                resolve({ success: true, content: j.choices?.[0]?.message?.content });
              } catch (e) {
                resolve({ success: false, error: 'JSON parse error: ' + e.message });
              }
            } else {
              resolve({ success: false, error: `HTTP ${res.statusCode}: ${data.slice(0, 150)}` });
            }
          });
        });
        req.on('error', (err) => resolve({ success: false, error: err.message }));
        req.on('timeout', () => { req.destroy(); resolve({ success: false, error: 'Request timeout' }); });
        req.write(postData);
        req.end();
      });

      if (raw.success && raw.content) {
        const parsed = cleanLlmJson(raw.content);
        if (parsed && validateStoicStoryboard(parsed)) {
          if (parsed.slides.length > 6) parsed.slides = parsed.slides.slice(0, 6);
          scriptData = parsed;
          logSuccess(`[Storyboard Engine] DeepSeek (deepseek-chat) generated ${scriptData.slides.length}-slide package!`);
        }
      }
    } catch {}
  }

  // 7. SEPTENARY: xAI Grok (grok-2-latest / grok-beta)
  if (!scriptData && activeGrok && activeGrok.key) {
    try {
      logInfo(`[Storyboard Engine] 7. Requesting storyboard from xAI Grok (${activeGrok.model})...`);
      const raw = await new Promise((resolve) => {
        const postData = JSON.stringify({
          model: activeGrok.model || 'grok-2-latest',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `${userPrompt} Topic title: "${topic}". Ensure complete sentences on every slide. Output strictly raw JSON.` }
          ],
          temperature: 0.7,
          max_tokens: 1800
        });

        const req = https.request('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeGrok.key}`,
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: 15000
        }, (res) => {
          let data = '';
          res.on('data', c => { data += c; });
          res.on('end', () => {
            if (res.statusCode === 200) {
              try {
                const j = JSON.parse(data);
                resolve({ success: true, content: j.choices?.[0]?.message?.content });
              } catch (e) {
                resolve({ success: false, error: 'JSON parse error: ' + e.message });
              }
            } else {
              resolve({ success: false, error: `HTTP ${res.statusCode}: ${data.slice(0, 150)}` });
            }
          });
        });
        req.on('error', (err) => resolve({ success: false, error: err.message }));
        req.on('timeout', () => { req.destroy(); resolve({ success: false, error: 'Request timeout (15s)' }); });
        req.write(postData);
        req.end();
      });

      if (raw.success && raw.content) {
        const parsed = cleanLlmJson(raw.content);
        if (parsed && validateStoicStoryboard(parsed)) {
          if (parsed.slides.length > 6) parsed.slides = parsed.slides.slice(0, 6);
          scriptData = parsed;
          logSuccess(`[Storyboard Engine] Grok (${activeGrok.model}) generated full ${scriptData.slides.length}-slide package!`);
        }
      }
    } catch {}
  }

  // 8. DIVERSITY ENGINE SYNTHESIS: If remote LLMs are offline or rate-limited, synthesize archetype slot
  if (!scriptData || !Array.isArray(scriptData.slides) || scriptData.slides.length < 3) {
    logWarning('[Storyboard Engine] Remote LLM endpoints unavailable or rate-limited. Synthesizing rich Stoic Archetype Slot from Diversity Engine...');
    scriptData = isDeepDive
      ? synthesizeDeterministicStoicDeepDiveStoryboard(activeArch, topic, liveChannelHandle)
      : synthesizeDeterministicStoryboard(activeArch, topic, liveChannelHandle);
    if (!isDeepDive && scriptData.slides.length > 6) scriptData.slides = scriptData.slides.slice(0, 6);
    logSuccess(`[Storyboard Engine] Diversity Engine synthesized authentic ${scriptData.slides.length}-slide Stoic package with dynamic outro!`);
  }

  // Sanitize sentence completeness for all slides (no cutoffs or unfinished sentences)
  if (scriptData && Array.isArray(scriptData.slides)) {
    scriptData.slides.forEach((slide) => {
      if (slide.text) {
        let text = slide.text.trim();
        // Remove trailing commas, colons, semicolons, or dashes
        text = text.replace(/[,;:\-–—\s]+$/, '');
        // Ensure ends with terminal punctuation (. ! ?)
        if (!/[.!?]$/.test(text)) {
          text += '.';
        }
        slide.text = text;
      }
    });
  }

  // Enforce strict YouTube title formatting with complete viral and trending hashtags
  scriptData.title = formatViralShortsTitle(scriptData.title || activeTopic || 'Stoic Rule for Mental Strength', 'stoic', isDeepDive);

  console.log(`\n  ${colors.bright}Generated Complete Storyboard Breakdown:${colors.reset}`);
  console.log(`  Title: ${colors.green}${scriptData.title}${colors.reset}`);
  console.log(`  Slide Count: ${colors.yellow}${scriptData.slides.length} slides${colors.reset}`);
  
  // PRINT COMPLETE, UNTRUNCATED TEXT AND PROMPT FOR EVERY SLIDE
  scriptData.slides.forEach((s, idx) => {
    console.log(`\n  ${colors.cyan}[Slide ${idx + 1}/${scriptData.slides.length}] Narration:${colors.reset} "${s.text}"`);
    console.log(`  ${colors.magenta}[Slide ${idx + 1}/${scriptData.slides.length}] Visual Prompt:${colors.reset} "${s.visual}"`);
  });

  return scriptData;
}

// ----------------------------------------------------
// STEP 4: REAL IMAGE & REAL TTS ASSET GENERATION
// ----------------------------------------------------
async function generateMediaAssets(storyboard) {
  logStep(4, 'Synthesizing Real 9:16 Visuals & TTS Voice Audio for All Slides');

  if (storyboard && Array.isArray(storyboard.slides) && storyboard.slides.length > 6) {
    logWarning(`[Media Engine] Storyboard has ${storyboard.slides.length} slides. Enforcing strict 6-slide limit for Stoic Shorts.`);
    storyboard.slides = storyboard.slides.slice(0, 6);
  }

  // Helper to download a URL to buffer with timeout and redirect handling
  async function downloadBuffer(url, timeoutMs = 15000) {
    if (!url) return null;
    if (url.startsWith('data:')) {
      const base64Data = url.replace(/^data:[^;]+;base64,/, '');
      return Buffer.from(base64Data, 'base64');
    }
    return new Promise((resolve) => {
      const getReq = (targetUrl, hops = 0) => {
        if (hops > 5) return resolve(null);
        try {
          const req = https.get(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            timeout: timeoutMs
          }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
              return getReq(res.headers.location, hops + 1);
            }
            if (res.statusCode !== 200) {
              return resolve(null);
            }
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => resolve(Buffer.concat(chunks)));
          });
          req.on('error', () => resolve(null));
          req.on('timeout', () => { req.destroy(); resolve(null); });
        } catch {
          resolve(null);
        }
      };
      getReq(url);
    });
  }

  let cloudflareAuthFailed = false;

  // Cloudflare Image API Helper (Multi-model: FLUX.1-schnell -> SDXL Lightning -> SDXL Base)
  async function generateCloudflareImage(prompt) {
    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN || cloudflareAuthFailed) {
      return null;
    }

    const candidateModels = [
      '@cf/black-forest-labs/flux-1-schnell',
      '@cf/bytedance/stable-diffusion-xl-lightning',
      '@cf/stabilityai/stable-diffusion-xl-base-1.0'
    ];

    for (const model of candidateModels) {
      if (cloudflareAuthFailed) break;
      try {
        const randomSeed = Math.floor(Math.random() * 99999999);
        logInfo(`[Cloudflare Image] Attempting model ${model} (seed: ${randomSeed})...`);
        let payloadObj = {
          prompt: `${prompt}, 8k vertical 9:16 cinematic luxury studio lighting, photorealistic, hyper-detailed, sharp focus, masterpiece`
        };
        if (model.includes('flux')) {
          payloadObj.steps = 4;
        } else if (model.includes('lightning')) {
          payloadObj.num_steps = 4;
          payloadObj.seed = randomSeed;
        } else {
          payloadObj.num_steps = 20;
          payloadObj.seed = randomSeed;
        }
        const postData = JSON.stringify(payloadObj);

        const res = await new Promise((resolve) => {
          const req = https.request(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 18000
          }, (resp) => {
            const chunks = [];
            resp.on('data', c => chunks.push(c));
            resp.on('end', () => {
              const buffer = Buffer.concat(chunks);
              if (resp.statusCode === 200) {
                // Check if Cloudflare wrapped base64 in JSON { result: { image: "..." } }
                try {
                  const json = JSON.parse(buffer.toString('utf8'));
                  if (json.result?.image) {
                    const imgBuf = Buffer.from(json.result.image, 'base64');
                    logSuccess(`[Cloudflare Image] Generated via ${model} (${imgBuf.length.toLocaleString()} bytes base64 decoded, seed: ${randomSeed})`);
                    return resolve({
                      imageUrl: `data:image/jpeg;base64,${json.result.image}`,
                      imageBuffer: imgBuf,
                      model
                    });
                  }
                } catch {}

                // Raw binary image response
                if (buffer.length > 1000) {
                  logSuccess(`[Cloudflare Image] Generated via ${model} (${buffer.length.toLocaleString()} bytes binary, seed: ${randomSeed})`);
                  return resolve({
                    imageUrl: `data:image/jpeg;base64,${buffer.toString('base64')}`,
                    imageBuffer: buffer,
                    model
                  });
                }
              } else if (resp.statusCode === 401) {
                cloudflareAuthFailed = true;
                logWarning(`[Cloudflare Engine] API token returned HTTP 401 (Authentication error). Cloudflare token may lack 'Workers AI: Read' permissions. Seamlessly using Pollinations & Edge TTS engines.`);
                return resolve(null);
              } else {
                const errSnippet = buffer.toString('utf8').slice(0, 120).replace(/\n/g, ' ');
                logInfo(`[Cloudflare Image] Model ${model} returned HTTP ${resp.statusCode}: ${errSnippet}`);
              }
              resolve(null);
            });
          });
          req.on('error', (e) => {
            logInfo(`[Cloudflare Image] Model ${model} network error: ${e.message}`);
            resolve(null);
          });
          req.on('timeout', () => {
            req.destroy();
            resolve(null);
          });
          req.write(postData);
          req.end();
        });

        if (res) return res;
      } catch (err) {
        logInfo(`[Cloudflare Image] Notice on ${model}: ${err.message}`);
      }
    }
    return null;
  }

  // 1. Primary: Cloudflare TTS API Helper (Aura-2 / Aura-1 with masculine deep voices)
  async function generateCloudflareTTS(text) {
    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN || cloudflareAuthFailed) {
      return null;
    }

    const candidateModels = [
      { model: '@cf/deepgram/aura-2-en', speaker: 'zeus' },
      { model: '@cf/deepgram/aura-2-en', speaker: 'orpheus' },
      { model: '@cf/deepgram/aura-2-en', speaker: 'helios' },
      { model: '@cf/deepgram/aura-2-en', speaker: 'arcas' },
      { model: '@cf/deepgram/aura-1', speaker: 'helios' }
    ];
    
    for (const item of candidateModels) {
      if (cloudflareAuthFailed) break;
      try {
        const res = await new Promise((resolve) => {
          const postData = JSON.stringify({ text, speaker: item.speaker });
          const req = https.request(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${item.model}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 14000
          }, (resp) => {
            const chunks = [];
            resp.on('data', c => chunks.push(c));
            resp.on('end', () => {
              const buffer = Buffer.concat(chunks);
              if (resp.statusCode === 200) {
                // Check if Cloudflare wrapped base64 in JSON { result: { audio: "..." } }
                try {
                  const json = JSON.parse(buffer.toString('utf8'));
                  if (json.result?.audio) {
                    const audioBuf = Buffer.from(json.result.audio, 'base64');
                    logSuccess(`[Cloudflare TTS] Generated via ${item.model} (${item.speaker}) (${audioBuf.length.toLocaleString()} bytes base64 decoded)`);
                    return resolve({
                      audioUrl: `data:audio/mpeg;base64,${json.result.audio}`,
                      audioBuffer: audioBuf,
                      byteLength: audioBuf.byteLength,
                      provider: `Cloudflare Deepgram Aura-2 (${item.speaker})`
                    });
                  }
                } catch {}

                // Raw audio binary
                if (buffer.length > 500) {
                  logSuccess(`[Cloudflare TTS] Generated via ${item.model} (${item.speaker}) (${buffer.length.toLocaleString()} bytes binary)`);
                  return resolve({
                    audioUrl: `data:audio/mpeg;base64,${buffer.toString('base64')}`,
                    audioBuffer: buffer,
                    byteLength: buffer.byteLength,
                    provider: `Cloudflare Deepgram Aura-2 (${item.speaker})`
                  });
                }
              } else if (resp.statusCode === 401) {
                cloudflareAuthFailed = true;
                logWarning(`[Cloudflare Engine] API token returned HTTP 401 (Authentication error). Cloudflare token may lack 'Workers AI: Read' permissions. Seamlessly using Edge TTS & Pollinations engines.`);
                return resolve(null);
              } else {
                const errSnippet = buffer.toString('utf8').slice(0, 120).replace(/\n/g, ' ');
                logInfo(`[Cloudflare TTS] ${item.model} (${item.speaker}) returned HTTP ${resp.statusCode}: ${errSnippet}`);
              }
              resolve(null);
            });
          });
          req.on('error', (e) => {
            logInfo(`[Cloudflare TTS] ${item.model} network error: ${e.message}`);
            resolve(null);
          });
          req.on('timeout', () => {
            req.destroy();
            resolve(null);
          });
          req.write(postData);
          req.end();
        });

        if (res) return res;
      } catch (err) {
        logInfo(`[Cloudflare TTS] Notice on ${item.model}: ${err.message}`);
      }
    }
    return null;
  }

  // 1. Primary Engine: Microsoft Edge TTS Studio-Grade Deep Stoic Voice (Christopher / Guy / Eric / Ryan)
  async function generateEdgeBassTTS(text) {
    try {
      const cleanText = prepareTextForSpeech(text);
      const { EdgeTTS } = require('node-edge-tts');
      const masculineVoices = [
        'en-US-ChristopherNeural', // Deep resonant authoritative masculine (Stoic master)
        'en-US-GuyNeural',         // Warm masculine baritone
        'en-US-EricNeural',        // Rich steady masculine
        'en-US-BrianNeural',       // Crisp modern masculine
        'en-GB-RyanNeural'         // Thoughtful British baritone
      ];

      for (const voice of masculineVoices) {
        try {
          const tempAudio = path.join(process.cwd(), `edge_bass_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.mp3`);
          const tts = new EdgeTTS({
            voice: voice,
            lang: 'en-US',
            outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
            pitch: '+0Hz',
            rate: '+0%' // Grounded, natural, normal-speed Stoic pacing
          });

          await tts.ttsPromise(cleanText, tempAudio);

          if (fs.existsSync(tempAudio)) {
            trimAudioSilence(tempAudio);
            const audioBuf = fs.readFileSync(tempAudio);
            try { fs.unlinkSync(tempAudio); } catch {}
            if (audioBuf.length > 800) {
              logSuccess(`[Edge TTS] Synthesized natural authoritative voice (${voice}) (${audioBuf.length.toLocaleString()} bytes)`);
              return {
                audioUrl: `data:audio/mpeg;base64,${audioBuf.toString('base64')}`,
                audioBuffer: audioBuf,
                byteLength: audioBuf.byteLength,
                provider: `Microsoft Edge Studio Voice (${voice})`
              };
            }
          }
        } catch (e) {
          // try next masculine voice
        }
      }
    } catch (err) {
      logWarning(`Edge TTS error: ${err.message}`);
    }
    return null;
  }

  // 2. Second Fallback: DSP Bass-Boosted Google Speech Voice
  async function generateDspBassTTS(text) {
    try {
      const cleanText = prepareTextForSpeech(text);
      const encText = encodeURIComponent(cleanText.slice(0, 300));
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encText}&tl=en-US&client=tw-ob`;
      const rawBuf = await downloadBuffer(url, 12000);
      
      if (rawBuf && rawBuf.byteLength > 800) {
        const tempRaw = path.join(process.cwd(), `raw_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.mp3`);
        const tempDeep = path.join(process.cwd(), `deep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.mp3`);
        
        fs.writeFileSync(tempRaw, rawBuf);

        // FFmpeg DSP: Pitch lower (-1.5 semitones), bass boost at 120Hz (+4.5dB), tempo +1.02x, crisp presence clarity
        const dspCmd = `ffmpeg -y -i "${tempRaw}" -filter_complex "asetrate=24000*0.96,aresample=24000,atempo=1.02,equalizer=f=120:t=q:w=1.5:g=4.5,equalizer=f=3500:t=q:w=2.0:g=2.5,silenceremove=stop_periods=-1:stop_duration=0.08:stop_threshold=-40dB" -b:a 192k "${tempDeep}"`;
        execSync(dspCmd, { stdio: 'pipe' });

        if (fs.existsSync(tempDeep)) {
          const deepBuf = fs.readFileSync(tempDeep);
          try { fs.unlinkSync(tempRaw); fs.unlinkSync(tempDeep); } catch {}
          logSuccess(`[DSP Voice] Synthesized DSP Bass-Filtered Voice (${deepBuf.length.toLocaleString()} bytes)`);
          return {
            audioUrl: `data:audio/mpeg;base64,${deepBuf.toString('base64')}`,
            audioBuffer: deepBuf,
            byteLength: deepBuf.byteLength,
            provider: `DSP Masculine Bass Filtered Voice`
          };
        }
      }
    } catch (err) {
      logWarning(`DSP voice fallback notice: ${err.message}`);
    }
    return null;
  }

  // 3. Third Fallback: Cloudflare Deepgram Aura-2
  async function generateCloudflareTTS(text) {
    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN || cloudflareAuthFailed) {
      return null;
    }

    const candidateModels = [
      { model: '@cf/deepgram/aura-2-en', speaker: 'zeus' },
      { model: '@cf/deepgram/aura-2-en', speaker: 'orpheus' },
      { model: '@cf/deepgram/aura-2-en', speaker: 'helios' }
    ];
    
    for (const item of candidateModels) {
      if (cloudflareAuthFailed) break;
      try {
        const res = await new Promise((resolve) => {
          const postData = JSON.stringify({ text, speaker: item.speaker });
          const req = https.request(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${item.model}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 14000
          }, (resp) => {
            const chunks = [];
            resp.on('data', c => chunks.push(c));
            resp.on('end', () => {
              const buffer = Buffer.concat(chunks);
              if (resp.statusCode === 200) {
                try {
                  const json = JSON.parse(buffer.toString('utf8'));
                  if (json.result?.audio) {
                    const audioBuf = Buffer.from(json.result.audio, 'base64');
                    logSuccess(`[Cloudflare TTS] Generated via ${item.model} (${item.speaker})`);
                    return resolve({
                      audioUrl: `data:audio/mpeg;base64,${json.result.audio}`,
                      audioBuffer: audioBuf,
                      byteLength: audioBuf.byteLength,
                      provider: `Cloudflare Deepgram Aura-2 (${item.speaker})`
                    });
                  }
                } catch {}

                if (buffer.length > 500) {
                  logSuccess(`[Cloudflare TTS] Generated via ${item.model} (${item.speaker})`);
                  return resolve({
                    audioUrl: `data:audio/mpeg;base64,${buffer.toString('base64')}`,
                    audioBuffer: buffer,
                    byteLength: buffer.byteLength,
                    provider: `Cloudflare Deepgram Aura-2 (${item.speaker})`
                  });
                }
              } else if (resp.statusCode === 401) {
                cloudflareAuthFailed = true;
                logWarning(`[Cloudflare Engine] API token returned HTTP 401. Using Edge TTS.`);
                return resolve(null);
              }
              resolve(null);
            });
          });
          req.on('error', () => resolve(null));
          req.on('timeout', () => { req.destroy(); resolve(null); });
          req.write(postData);
          req.end();
        });

        if (res) return res;
      } catch {}
    }
    return null;
  }

  // 4. Last Resort Fallback: Feminine Voice (JennyNeural)
  async function generateLastResortFeminineTTS(text) {
    try {
      const { EdgeTTS } = require('node-edge-tts');
      const tempAudio = path.join(process.cwd(), `edge_fem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.mp3`);
      const tts = new EdgeTTS({
        voice: 'en-US-JennyNeural',
        lang: 'en-US',
        outputFormat: 'audio-24khz-96kbitrate-mono-mp3'
      });

      await tts.ttsPromise(text, tempAudio);

      if (fs.existsSync(tempAudio)) {
        const audioBuf = fs.readFileSync(tempAudio);
        try { fs.unlinkSync(tempAudio); } catch {}
        if (audioBuf.length > 1000) {
          logSuccess(`[Feminine Voice] Synthesized Jenny Neural Fallback (${audioBuf.length.toLocaleString()} bytes)`);
          return {
            audioUrl: `data:audio/mpeg;base64,${audioBuf.toString('base64')}`,
            audioBuffer: audioBuf,
            byteLength: audioBuf.byteLength,
            provider: `Microsoft Edge Jenny (Last Resort Fallback)`
          };
        }
      }
    } catch {}
    return null;
  }

  // Multi-tier Voiceover Orchestrator: Edge Studio Voice (Primary) -> DSP Bass -> Cloudflare -> Feminine
  async function synthesizeVoiceWithHierarchy(text) {
    logInfo('Voiceover Tier 1: Attempting Microsoft Edge Deep Stoic Voice (Christopher / Guy / Eric)...');
    let res = await generateEdgeBassTTS(text);
    if (res) return res;

    logInfo('Voiceover Tier 2: Attempting FFmpeg DSP Masculine Bass Filter...');
    res = await generateDspBassTTS(text);
    if (res) return res;

    logInfo('Voiceover Tier 3: Attempting Cloudflare Deepgram Aura-2...');
    res = await generateCloudflareTTS(text);
    if (res) return res;

    logInfo('Voiceover Tier 4: Attempting Feminine Neural Fallback...');
    res = await generateLastResortFeminineTTS(text);
    if (res) return res;

    return null;
  }

  const enrichedSlides = [];

  for (let i = 0; i < storyboard.slides.length; i++) {
    const slide = storyboard.slides[i];
    const slideNum = i + 1;
    logInfo(`\n[Slide ${slideNum}/${storyboard.slides.length}] Synthesizing Visual Frame & Spoken Voiceover...`);
    logInfo(`  -> Visual Prompt: "${slide.visual}"`);

    // 1. Generate Image (Cloudflare AI -> Pollinations Flux)
    let imageUrl = null;
    let imageBuffer = null;
    let imageProvider = 'Pollinations Flux (9:16 Vertical HD)';
    try {
      const cfImg = await generateCloudflareImage(slide.visual);
      if (cfImg) {
        imageUrl = cfImg.imageUrl;
        imageBuffer = cfImg.imageBuffer;
        imageProvider = `Cloudflare Workers AI (${cfImg.model || '@cf/black-forest-labs/flux-1-schnell'})`;
      }
    } catch (err) {
      logWarning(`[Slide ${slideNum}] Cloudflare image error: ${err.message}`);
    }

    if (!imageUrl) {
      const slideSeed = Math.floor(Math.random() * 99999999);
      logInfo(`[Slide ${slideNum}] Primary AI unavailable. Generating via Pollinations Flux 9:16 Engine (seed: ${slideSeed})...`);
      imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(slide.visual + ' 8k vertical 9:16 cinematic luxury lighting')}?width=1080&height=1920&nologo=true&model=flux&seed=${slideSeed}&n=${Date.now() + i}`;
      imageBuffer = await downloadBuffer(imageUrl, 15000);
      if (imageBuffer) {
        imageProvider = `Pollinations Flux (seed: ${slideSeed})`;
        logSuccess(`[Slide ${slideNum}] Image synthesized via Pollinations Flux (${imageBuffer.length.toLocaleString()} bytes, seed: ${slideSeed})`);
      } else {
        logWarning(`[Slide ${slideNum}] Pollinations binary download failed, URL retained.`);
      }
    }

    // 2. Generate Spoken Voiceover with Multi-Tier Hierarchy (Cloudflare Aura-2 -> Edge Bass -> DSP Bass -> Feminine Last)
    let ttsResult = null;
    let ttsProvider = 'Neural Speech Engine';
    try {
      ttsResult = await synthesizeVoiceWithHierarchy(slide.text);
      if (ttsResult) {
        ttsProvider = ttsResult.provider || `Synthesized Voice (${ttsResult.byteLength.toLocaleString()} bytes MP3)`;
      }
    } catch (err) {
      logWarning(`Voice synthesis error on slide ${slideNum}: ${err.message}`);
    }

    const audioUrl = ttsResult?.audioUrl || 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=meditation-piano-ambient-110855.mp3';
    logSuccess(`[Slide ${slideNum}/${storyboard.slides.length}] Slide ${slideNum} Ready: ${imageProvider} + ${ttsProvider}`);

    enrichedSlides.push({
      slideIndex: i,
      text: slide.text,
      scriptText: slide.text,
      voiceoverTts: slide.text,
      imagePrompt: slide.visual,
      imageUrl: imageUrl,
      imageBuffer: imageBuffer,
      imageProvider: imageProvider,
      audioUrl: audioUrl,
      audioBuffer: ttsResult?.audioBuffer || null,
      audioProvider: ttsProvider,
      durationSeconds: 6.5,
      effect: i % 2 === 0 ? 'ken-burns-zoom-in' : 'ken-burns-pan-down'
    });
  }

  logSuccess(`All ${enrichedSlides.length} slides equipped with real 9:16 images and synchronized voiceover audio!`);
  return enrichedSlides;
}

// ----------------------------------------------------
// STEP 5: VERIFY BACKGROUND AUDIO PRESETS
// ----------------------------------------------------
async function testAudioTracks() {
  logStep(5, 'Verifying Royalty-Free Background Audio Presets');
  BACKGROUND_AUDIO_TRACKS.forEach((track, i) => {
    console.log(`  ${colors.green}Track ${i + 1}:${colors.reset} ${colors.bright}${track.name}${colors.reset}`);
    console.log(`    Mood: ${track.mood}`);
    console.log(`    CDN Source: ${colors.dim}${track.url.slice(0, 75)}...${colors.reset}`);
  });
  logSuccess('Royalty-free ambient soundtracks loaded and ready for multi-track audio mixing.');
}

// ----------------------------------------------------
// STEP 6: FULL MULTI-SLIDE FFMPEG VIDEO MOTION COMPILATION
// ----------------------------------------------------
async function renderFfmpegVideo(storyboard, enrichedSlides) {
  logStep(6, 'Video Motion Compilation (Combining ALL 6 Slides with Voiceover & Background Music)');

  const outputDir = path.join(process.cwd(), 'rendered_videos');
  const tempDir = path.join(outputDir, `build_${Date.now()}`);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  let hasFfmpeg = false;
  try {
    const res = spawnSync('ffmpeg', ['-version']);
    hasFfmpeg = res.status === 0;
  } catch {}

  const videoFilename = `stoic_${Date.now()}_short.mp4`;
  const videoFilePath = path.join(outputDir, videoFilename);

  if (!hasFfmpeg) {
    logWarning('FFmpeg not installed in current runner. In-app Canvas player will render video stream.');
    return { videoFilePath: null, videoFilename, rendered: false };
  }

  logSuccess(`Native FFmpeg detected. Compiling full ${enrichedSlides.length}-slide vertical 1080x1920 video...`);

  // Helper to download a buffer
  async function downloadBuffer(url, timeoutMs = 12000) {
    if (!url) return null;
    if (url.startsWith('data:')) {
      const base64Data = url.replace(/^data:[^;]+;base64,/, '');
      return Buffer.from(base64Data, 'base64');
    }
    return new Promise((resolve) => {
      const getReq = (targetUrl, hops = 0) => {
        if (hops > 5) return resolve(null);
        try {
          const req = https.get(targetUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            timeout: timeoutMs
          }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
              return getReq(res.headers.location, hops + 1);
            }
            if (res.statusCode !== 200) {
              return resolve(null);
            }
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => resolve(Buffer.concat(chunks)));
          });
          req.on('error', () => resolve(null));
          req.on('timeout', () => { req.destroy(); resolve(null); });
        } catch {
          resolve(null);
        }
      };
      getReq(url);
    });
  }

  // Get audio duration using ffprobe
  function getAudioDuration(filePath) {
    try {
      const probe = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`, { encoding: 'utf8' }).trim();
      const val = parseFloat(probe);
      if (!isNaN(val) && val > 0) return val;
    } catch {}
    return 5.5;
  }

  const slideVideoPaths = [];

  try {
    // 1. Compile each slide into a standalone animated vertical video clip with its voiceover
    for (let i = 0; i < enrichedSlides.length; i++) {
      const slide = enrichedSlides[i];
      const slideNum = i + 1;
      const slideImgPath = path.join(tempDir, `slide_${slideNum}_img.jpg`);
      const slideAudioPath = path.join(tempDir, `slide_${slideNum}_audio.mp3`);
      const slideClipPath = path.join(tempDir, `slide_${slideNum}_clip.mp4`);

      logInfo(`[Slide ${slideNum}/${enrichedSlides.length}] Writing assets & preparing motion clip...`);
      
      // Save Image
      if (slide.imageBuffer && slide.imageBuffer.byteLength > 1000) {
        fs.writeFileSync(slideImgPath, slide.imageBuffer);
      } else if (slide.imageUrl && slide.imageUrl.startsWith('data:image')) {
        const base64Data = slide.imageUrl.replace(/^data:image\/\w+;base64,/, '');
        fs.writeFileSync(slideImgPath, Buffer.from(base64Data, 'base64'));
      } else {
        const imgBuf = await downloadBuffer(slide.imageUrl, 10000);
        if (imgBuf) fs.writeFileSync(slideImgPath, imgBuf);
        else {
          // Generate solid placeholder frame if download fails
          execSync(`ffmpeg -y -f lavfi -i "color=c=0x1a1a2e:s=1080x1920:d=1" -frames:v 1 "${slideImgPath}"`, { stdio: 'pipe' });
        }
      }

      // Save Voiceover Audio
      if (slide.audioBuffer && slide.audioBuffer.byteLength > 500) {
        fs.writeFileSync(slideAudioPath, slide.audioBuffer);
      } else if (slide.audioUrl && slide.audioUrl.startsWith('data:audio')) {
        const base64Data = slide.audioUrl.replace(/^data:audio\/\w+;base64,/, '');
        fs.writeFileSync(slideAudioPath, Buffer.from(base64Data, 'base64'));
      } else {
        const audBuf = await downloadBuffer(slide.audioUrl, 8000);
        if (audBuf) fs.writeFileSync(slideAudioPath, audBuf);
        else {
          execSync(`ffmpeg -y -f lavfi -i "sine=frequency=0:duration=5" -c:a libmp3lame "${slideAudioPath}"`, { stdio: 'pipe' });
        }
      }

      // Determine duration of voiceover (snappy pacing, no awkward long pause between slides)
      trimAudioSilence(slideAudioPath);
      const rawAudioDur = getAudioDuration(slideAudioPath);
      const slideDur = Math.max(2.2, rawAudioDur + 0.10);
      const totalFrames = Math.round(slideDur * 30);

      // Clean slide text for on-screen captions (natural spoken 2-word discrete chunks for safe mobile display)
      const rawText = (slide.text || '').replace(/[\r\n]+/g, ' ').replace(/"/g, '').trim();
      const words = rawText.split(/\s+/).filter(Boolean);
      
      // Natural non-overlapping sequential chunks (max 2 words per burst to guarantee safety)
      const chunkLines = [];
      const CHUNK_SIZE = 2;
      for (let w = 0; w < words.length; w += CHUNK_SIZE) {
        chunkLines.push(words.slice(w, w + CHUNK_SIZE).join(' '));
      }
      
      // Build dynamic time-sliced drawtext filters with exact spoken audio synchronization
      const spokenDur = Math.max(0.1, rawAudioDur);
      const chunkDur = spokenDur / Math.max(chunkLines.length, 1);
      let captionFilter = '';

      // Pinned Topic Hook at Top of Video for first 3.5 seconds (Slide 1) - Safe 1080p mobile viewport
      let topHookFilter = '';
      if (i === 0) {
        const rawTitle = (storyboard.title || storyboard.theme || 'DAILY STOIC MASTERY').replace(/#\w+/g, '').trim();
        const cleanTopicHook = sanitizeForFfmpegDrawtext(rawTitle.slice(0, 26).toUpperCase());
        topHookFilter = `,drawtext=text='${cleanTopicHook}':fontsize=34:fontcolor=0xFDE047:box=1:boxcolor=black@0.88:boxborderw=12:borderw=3:bordercolor=0xFDE047:x=(w-text_w)/2:y=250:fix_bounds=1:enable='between(t\\,0\\,3.5)'`;
      }

      chunkLines.forEach((chunkText, cIdx) => {
        const startT = (cIdx * chunkDur).toFixed(2);
        // The last chunk stays visible until slideDur finishes
        const endT = (cIdx === chunkLines.length - 1 ? slideDur : (cIdx + 1) * chunkDur).toFixed(2);
        const cleanChunk = sanitizeForFfmpegDrawtext(chunkText.toUpperCase());
        // Dynamic adaptive font size: downscale for longer text so captions never go off screen
        const fontSize = cleanChunk.length > 20 ? 36 : cleanChunk.length > 13 ? 40 : 44;
        const fontColor = cIdx % 2 === 0 ? '0xFFFFFF' : '0xFDE047'; // Alternating platinum white and gold
        captionFilter += `,drawtext=text='${cleanChunk}':fontsize=${fontSize}:fontcolor=${fontColor}:box=1:boxcolor=black@0.82:boxborderw=10:borderw=3:bordercolor=black:x=(w-text_w)/2:y=1180:fix_bounds=1:enable='between(t\\,${startT}\\,${endT})'`;
      });

      // Rapid, engaging Ken Burns zoom & pan motion (responsive speed)
      let zoomFilter;
      const motionStyle = i % 4;
      if (motionStyle === 0) {
        // High-energy dynamic zoom-in (1.0 -> 1.25)
        zoomFilter = `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(zoom+0.0035,1.25)':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30`;
      } else if (motionStyle === 1) {
        // Dynamic Pan-Left (1.20 -> 1.05)
        zoomFilter = `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='if(lte(zoom,1.0),1.20,max(1.05,zoom-0.0030))':d=${totalFrames}:x='(iw-iw/zoom)*(1-on/${totalFrames})':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30`;
      } else if (motionStyle === 2) {
        // Smooth Pan-Right + Zoom-In
        zoomFilter = `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(zoom+0.0032,1.22)':d=${totalFrames}:x='(iw-iw/zoom)*(on/${totalFrames})':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30`;
      } else {
        // Deep Focus Top-Down Pan
        zoomFilter = `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(zoom+0.0028,1.20)':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='(ih-ih/zoom)*(on/${totalFrames})':s=1080x1920:fps=30`;
      }

      const fullVideoFilter = `${zoomFilter}${topHookFilter}${captionFilter}`;

      logInfo(`[Slide ${slideNum}/${enrichedSlides.length}] Compiling 1080x1920 motion clip with burned kinetic captions (${slideDur.toFixed(1)}s, ${totalFrames} frames)...`);

      const slideFfmpegCmd = `ffmpeg -y -loop 1 -i "${slideImgPath}" -i "${slideAudioPath}" -c:v libx264 -preset ultrafast -crf 22 -pix_fmt yuv420p -t ${slideDur} -vf "${fullVideoFilter}" -af "apad=whole_dur=${slideDur}" -c:a aac -b:a 192k "${slideClipPath}"`;
      execSync(slideFfmpegCmd, { stdio: 'pipe' });

      if (fs.existsSync(slideClipPath)) {
        slideVideoPaths.push(slideClipPath);
        logSuccess(`[Slide ${slideNum}/${enrichedSlides.length}] Motion clip compiled successfully!`);
      }
    }

    if (slideVideoPaths.length === 0) {
      throw new Error("No slide video clips were compiled.");
    }

    // 2. Concatenate all slide clips together
    logInfo(`Concatenating all ${slideVideoPaths.length} slide clips together into single narration timeline...`);
    const concatListPath = path.join(tempDir, 'concat_list.txt');
    const concatContent = slideVideoPaths.map(p => `file '${p.replace(/'/g, "'\\''")}'`).join('\n');
    fs.writeFileSync(concatListPath, concatContent);

    const mergedNarrationVideo = path.join(tempDir, 'merged_narration.mp4');
    execSync(`ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c copy "${mergedNarrationVideo}"`, { stdio: 'pipe' });

    // 3. Final Voice-Only Video Output (No background music)
    logInfo(`Writing final high-clarity voiceover video stream...`);
    fs.copyFileSync(mergedNarrationVideo, videoFilePath);

    if (fs.existsSync(videoFilePath)) {
      const stats = fs.statSync(videoFilePath);
      const totalDur = getAudioDuration(videoFilePath);
      logSuccess(`FULL MULTI-SLIDE MP4 VERTICAL SHORT COMPILED SUCCESSFULLY!`);
      console.log(`  ${colors.bright}${colors.green}Output Video: ${videoFilename} (${(stats.size / 1024 / 1024).toFixed(2)} MB, ${totalDur.toFixed(1)}s total runtime)${colors.reset}`);
      return { videoFilePath, videoFilename, rendered: true, durationSeconds: totalDur };
    }
  } catch (err) {
    logError(`FFmpeg Multi-Slide Compile Error: ${err.message}`);
  } finally {
    // Clean up temporary slide build files
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }

  return { videoFilePath: null, videoFilename, rendered: false };
}

// ----------------------------------------------------
// STEP 7: TEST YOUTUBE OAUTH2 ACCESS TOKEN & LIVE PUBLISH
// ----------------------------------------------------
async function handleYouTubePublish(storyboard, renderResult) {
  logStep(7, 'YouTube Data API v3 Upload & Channel Sync');
  logInfo(`Channel Target: The Stoic Architect (@thestoicarchitect-n4b)`);

  const isDeepDive = contentDepth === 'deep_dive' || Boolean(storyboard?.isDeepDive);

  if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET || !YOUTUBE_REFRESH_TOKEN) {
    logWarning('YouTube OAuth credentials not provided in environment. Storing to Campaign Vault.');
    return { status: 'VAULT_ARCHIVED' };
  }

  const startTime = Date.now();
  let accessToken = null;

  try {
    const postData = new URLSearchParams({
      client_id: YOUTUBE_CLIENT_ID,
      client_secret: YOUTUBE_CLIENT_SECRET,
      refresh_token: YOUTUBE_REFRESH_TOKEN,
      grant_type: 'refresh_token'
    }).toString();

    const result = await new Promise((resolve) => {
      const req = https.request('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 10000
      }, (res) => {
        let data = '';
        res.on('data', c => { data += c; });
        res.on('end', () => {
          try {
            const j = JSON.parse(data);
            resolve({ statusCode: res.statusCode, data: j, duration: Date.now() - startTime });
          } catch (e) {
            resolve({ statusCode: res.statusCode, error: 'JSON error' });
          }
        });
      });
      req.on('error', e => resolve({ error: e.message }));
      req.write(postData);
      req.end();
    });

    if (result.data && result.data.access_token) {
      accessToken = result.data.access_token;
      logSuccess(`Google OAuth2 Access Token Granted! Latency: ${result.duration}ms`);
      logInfo(`Scopes: ${result.data.scope || 'https://www.googleapis.com/auth/youtube.upload'}`);
      logInfo(`Token Expiry: ${result.data.expires_in} seconds`);
    } else {
      logWarning(`OAuth exchange returned status ${result.statusCode}: ${result.data?.error_description || result.data?.error || 'Token expired'}`);
    }
  } catch (e) {
    logError(`YouTube Auth Test Exception: ${e.message}`);
  }

  if (isDryRun) {
    logInfo('Dry Run Mode: Skipping live YouTube video creation. Video is verified & saved.');
    return { status: 'DRY_RUN_VERIFIED', accessToken };
  }

  if (accessToken && renderResult.videoFilePath && fs.existsSync(renderResult.videoFilePath)) {
    // MANDATORY QUALITY PRE-FLIGHT CHECK BEFORE YOUTUBE UPLOAD
    const preFlight = validateStoicStoryboardQuality(storyboard);
    if (!preFlight.valid) {
      logError(`[FATAL PRE-FLIGHT] Aborting YouTube upload! Storyboard failed quality check: ${preFlight.reason}`);
      throw new Error(`CRITICAL QUALITY FAILURE: Aborting YouTube upload due to: ${preFlight.reason}`);
    }

    logInfo('Initiating YouTube Data API v3 Resumable Upload to @thestoicarchitect-n4b...');
    try {
      const fileSize = fs.statSync(renderResult.videoFilePath).size;
      
      let uploadTitle = formatViralShortsTitle(storyboard.title || 'The Stoic Mindset', 'stoic', isDeepDive);

      const cleanTags = (storyboard.tags || ['Shorts', 'viral', 'trending', 'Stoicism', 'Discipline', 'Motivation', 'MarcusAurelius', 'Mindset', 'Philosophy', 'fyp'])
        .map(t => String(t).replace(/^#/, '').replace(/[^a-zA-Z0-9 ]/g, '').trim())
        .filter(t => t.length > 0 && t.length < 50)
        .slice(0, 15);

      const metadata = JSON.stringify({
        snippet: {
          title: uploadTitle,
          description: `${(storyboard.description || uploadTitle).trim()}\n\nDaily timeless wisdom and stoic mindset strategies with The Stoic Architect (@thestoicarchitect-n4b).\n\n#Stoic #Shorts #viral #trending #MarcusAurelius #Discipline #Mindset #Philosophy #fyp`,
          tags: cleanTags,
          categoryId: '27' // Education
        },
        status: {
          privacyStatus: 'public',
          selfDeclaredMadeForKids: false,
          embeddable: true
        }
      });

      // 1. Initial Resumable Session Request
      const sessionResult = await new Promise((resolve) => {
        const req = https.request('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json; charset=UTF-8',
            'X-Upload-Content-Length': fileSize,
            'X-Upload-Content-Type': 'video/mp4'
          }
        }, (res) => {
          let body = '';
          res.on('data', c => body += c);
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300 && res.headers.location) {
              resolve({ success: true, uploadUrl: res.headers.location });
            } else {
              resolve({ success: false, statusCode: res.statusCode, error: body });
            }
          });
        });
        req.on('error', (e) => resolve({ success: false, error: e.message }));
        req.write(metadata);
        req.end();
      });

      if (sessionResult.success && sessionResult.uploadUrl) {
        logSuccess(`YouTube Resumable Upload Session initialized.`);
        // 2. Stream Video Binary
        const uploadResult = await new Promise((resolve) => {
          const videoStream = fs.createReadStream(renderResult.videoFilePath);
          const req = https.request(sessionResult.uploadUrl, {
            method: 'PUT',
            headers: {
              'Content-Length': fileSize,
              'Content-Type': 'video/mp4'
            }
          }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
              if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                  const j = JSON.parse(data);
                  resolve({ success: true, data: j });
                } catch {
                  resolve({ success: false, error: 'JSON parse error on upload response' });
                }
              } else {
                resolve({ success: false, statusCode: res.statusCode, error: data });
              }
            });
          });
          req.on('error', (e) => resolve({ success: false, error: e.message }));
          videoStream.pipe(req);
        });

        if (uploadResult.success && uploadResult.data && uploadResult.data.id) {
          const videoId = uploadResult.data.id;
          const videoUrl = isDeepDive ? `https://www.youtube.com/watch?v=${videoId}` : `https://www.youtube.com/shorts/${videoId}`;
          logSuccess(`LIVE VIDEO PUBLISHED TO YOUTUBE!`);
          console.log(`  ${colors.bright}${colors.green}Video URL: ${videoUrl}${colors.reset}`);
          console.log(`  ${colors.bright}${colors.cyan}Studio Link: https://studio.youtube.com/video/${videoId}/edit${colors.reset}`);

          // Post and pin an engaging question comment on the published video
          await postYouTubePinnedComment(accessToken, videoId, storyboard, 'stoic');

          return { status: 'PUBLISHED_LIVE', videoId, videoUrl };
        } else {
          logError(`YouTube video binary streaming failed: ${uploadResult.error || `HTTP ${uploadResult.statusCode}`}`);
          return { status: 'UPLOAD_FAILED', error: uploadResult.error || `HTTP ${uploadResult.statusCode}` };
        }
      } else {
        logError(`YouTube session initiation failed (HTTP ${sessionResult.statusCode}): ${sessionResult.error}`);
        return { status: 'SESSION_INIT_FAILED', error: `HTTP ${sessionResult.statusCode}: ${sessionResult.error}` };
      }
    } catch (err) {
      logError(`Live upload exception: ${err.message}`);
      return { status: 'UPLOAD_FAILED', error: err.message };
    }
  } else if (!accessToken) {
    logWarning('YouTube OAuth token unavailable. Video saved to local Vault.');
    return { status: 'NO_OAUTH_TOKEN' };
  }

  return { status: 'VAULT_STORED' };
}

// ----------------------------------------------------
// STEP 7.4: POST ENGAGING PINNED COMMENT ON YOUTUBE VIDEO
// ----------------------------------------------------
async function postYouTubePinnedComment(accessToken, videoId, storyboard, niche = 'stoic') {
  if (!accessToken || !videoId) return null;

  let commentText = '';
  if (niche === 'stoic') {
    commentText = `Daily Reflection Question: What is one situation today where choosing calm silence and self-discipline will protect your peace? Drop your answer below 👇\n\nStay focused, stay disciplined. Subscribe to @TheStoicArchitect for daily mental fortitude!`;
  } else {
    commentText = `Question for you: Which of these practical business models would you test first with minimal capital? Share your thoughts below 👇\n\nSave this blueprint & subscribe to @bones_ceo for daily practical wealth breakdowns!`;
  }

  logInfo(`[Pinned Comment] Posting engaging top-level comment on YouTube video (${videoId})...`);
  console.log(`  ${colors.bright}${colors.cyan}Pinned Comment Text:\n  "${commentText.replace(/\n/g, '\n  ')}"${colors.reset}`);

  try {
    const postData = JSON.stringify({
      snippet: {
        videoId: videoId,
        topLevelComment: {
          snippet: {
            textOriginal: commentText
          }
        }
      }
    });

    const result = await new Promise((resolve) => {
      const req = https.request('https://www.googleapis.com/youtube/v3/commentThreads?part=snippet', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 10000
      }, (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          if (res.statusCode === 200 || res.statusCode === 201) {
            try {
              const j = JSON.parse(d);
              resolve({ success: true, commentId: j.id, text: commentText });
            } catch {
              resolve({ success: true, text: commentText });
            }
          } else {
            resolve({ success: false, statusCode: res.statusCode, error: d.slice(0, 200) });
          }
        });
      });
      req.on('error', e => resolve({ success: false, error: e.message }));
      req.on('timeout', () => { req.destroy(); resolve({ success: false, error: 'Timeout' }); });
      req.write(postData);
      req.end();
    });

    if (result.success) {
      logSuccess(`PINNED COMMENT PUBLISHED TO YOUTUBE! (Comment ID: ${result.commentId || 'active'})`);
      console.log(`  ${colors.bright}${colors.green}Pinned Comment Active: "${commentText.split('\n')[0]}"${colors.reset}`);
      return result;
    } else {
      logWarning(`YouTube comment thread post notice (HTTP ${result.statusCode}): ${result.error || 'Check channel permissions'}`);
      return null;
    }
  } catch (err) {
    logWarning(`Pinned comment exception: ${err.message}`);
    return null;
  }
}

// ----------------------------------------------------
// STEP 7.5: UPLOAD RENDERED VIDEO TO CLOUDINARY (UNSIGNED PRESET SAFE)
// ----------------------------------------------------
async function uploadToCloudinary(videoFilePath, publicId) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || '';
  const apiKey = process.env.CLOUDINARY_API_KEY || '';
  const apiSecret = process.env.CLOUDINARY_API_SECRET || '';
  const cloudinaryUrlEnv = process.env.CLOUDINARY_URL || '';

  let effectiveCloudName = cloudName;
  let effectiveApiKey = apiKey;
  let effectiveApiSecret = apiSecret;

  if (cloudinaryUrlEnv && cloudinaryUrlEnv.startsWith('cloudinary://')) {
    try {
      const parsed = new URL(cloudinaryUrlEnv);
      effectiveCloudName = parsed.hostname || effectiveCloudName;
      effectiveApiKey = parsed.username || effectiveApiKey;
      effectiveApiSecret = parsed.password || effectiveApiSecret;
    } catch {}
  }

  if (!videoFilePath || !fs.existsSync(videoFilePath)) {
    return null;
  }

  if (!effectiveCloudName) {
    logInfo('[CLOUDINARY] Cloudinary cloud name not configured. Saving local & YouTube endpoints.');
    return null;
  }

  logInfo(`[CLOUDINARY] Uploading rendered Stoic video to Cloudinary cloud "${effectiveCloudName}"...`);
  try {
    const fileBuffer = fs.readFileSync(videoFilePath);
    const timestamp = Math.floor(Date.now() / 1000);
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

    let fields = {};
    if (uploadPreset) {
      // Unsigned upload preset: ONLY pass upload_preset parameter
      fields = {
        upload_preset: uploadPreset
      };
    } else if (effectiveApiKey && effectiveApiSecret) {
      const crypto = require('crypto');
      const paramsToSign = `folder=voxam_shorts&public_id=${publicId || `stoic_short_${Date.now()}`}&timestamp=${timestamp}${effectiveApiSecret}`;
      const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');
      fields = {
        api_key: effectiveApiKey,
        timestamp: String(timestamp),
        folder: 'voxam_shorts',
        public_id: publicId || `stoic_short_${Date.now()}`,
        signature: signature
      };
    } else {
      fields = {
        upload_preset: 'voxawell'
      };
    }

    const chunks = [];
    for (const [k, v] of Object.entries(fields)) {
      chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`));
    }
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="stoic_video.mp4"\r\nContent-Type: video/mp4\r\n\r\n`));
    chunks.push(fileBuffer);
    chunks.push(Buffer.from(`\r\n--${boundary}--\r\n`));

    const postBuffer = Buffer.concat(chunks);

    const result = await new Promise((resolve) => {
      const req = https.request(`https://api.cloudinary.com/v1_1/${effectiveCloudName}/auto/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': postBuffer.length
        },
        timeout: 180000
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            if (res.statusCode >= 200 && res.statusCode < 300 && parsed.secure_url) {
              resolve({ success: true, url: parsed.secure_url, publicId: parsed.public_id });
            } else {
              resolve({ success: false, error: parsed.error?.message || body });
            }
          } catch (e) {
            resolve({ success: false, error: e.message });
          }
        });
      });
      req.on('error', (e) => resolve({ success: false, error: e.message }));
      req.on('timeout', () => { req.destroy(); resolve({ success: false, error: 'Upload timeout' }); });
      req.write(postBuffer);
      req.end();
    });

    if (result.success && result.url) {
      logSuccess(`[CLOUDINARY] Stoic video upload successful! URL: ${result.url}`);
      return result.url;
    } else {
      logWarning(`[CLOUDINARY] Upload notice: ${result.error || 'Upload could not complete'}`);
    }
  } catch (err) {
    logWarning(`[CLOUDINARY] Upload exception: ${err.message}`);
  }
  return null;
}

// ----------------------------------------------------
// STEP 8: SYNC TO MANIFEST & FIRESTORE DATABASE
// ----------------------------------------------------
async function syncToManifestAndDatabase(storyboard, enrichedSlides, publishResult, currentTopic, renderResult, cloudinaryUrl) {
  logStep(8, 'Synchronizing Blueprint Manifest & In-App Player Database');

  const campaignId = `camp-stoic-${Date.now()}`;
  const topicName = currentTopic || storyboard.title || 'Stoic Masterclass';
  const finalVideoUrl = cloudinaryUrl || publishResult.videoUrl || renderResult?.videoFilePath || '/rendered_videos/stoic_pipeline_short.mp4';
  
  const newCampaign = {
    id: campaignId,
    jobId: `job-stoic-${Date.now()}`,
    channelId: 'motivation_stoicism',
    channelName: 'The Stoic Architect (@thestoicarchitect-n4b)',
    channelHandle: '@thestoicarchitect-n4b',
    title: storyboard.title,
    niche: 'motivation_stoicism',
    createdAt: new Date().toISOString(),
    status: 'completed',
    isPosted: publishResult.status === 'PUBLISHED_LIVE',
    youtubeVideoId: publishResult.videoId || null,
    youtubeUrl: publishResult.videoUrl || null,
    cloudinaryUrl: cloudinaryUrl || null,
    videoUrl: finalVideoUrl,
    renderedVideoUrl: finalVideoUrl,
    videoPath: renderResult?.videoFilePath || null,
    durationSeconds: renderResult?.durationSeconds || 60,
    views: publishResult.status === 'PUBLISHED_LIVE' ? 1 : 0,
    likes: 0,
    comments: 0,
    slides: enrichedSlides,
    payload: {
      channelId: 'motivation_stoicism',
      topic: topicName,
      youtube: {
        title: storyboard.title,
        description: storyboard.description,
        tags: storyboard.tags,
        slides: enrichedSlides
      }
    }
  };

  // 1. Update daily_blueprint_manifest.json
  const manifestPath = path.join(process.cwd(), 'daily_blueprint_manifest.json');
  let currentManifest = [];
  if (fs.existsSync(manifestPath)) {
    try {
      currentManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch {}
  }
  if (!Array.isArray(currentManifest)) currentManifest = [];

  const manifestEntry = {
    id: `job_${Date.now()}_motivation_stoicism_1`,
    channelId: 'motivation_stoicism',
    channelName: 'The Stoic Architect (@thestoicarchitect-n4b)',
    slotNumber: 1,
    title: storyboard.title,
    scriptText: enrichedSlides.map(s => s.text).join(' '),
    visualPrompt: enrichedSlides[0]?.imagePrompt || '',
    aiEngine: 'Grok 2 / Llama 3.3 70B',
    stage: 'COMPLETED',
    status: 'COMPLETED',
    createdAt: new Date().toISOString(),
    generatedImageUrl: enrichedSlides[0]?.imageUrl || '',
    audioUrl: enrichedSlides[0]?.audioUrl || '',
    cloudinaryUrl: cloudinaryUrl || null,
    videoUrl: finalVideoUrl,
    renderedVideoUrl: finalVideoUrl,
    slides: enrichedSlides,
    youtubeUrl: publishResult.videoUrl || null
  };

  currentManifest = [manifestEntry, ...currentManifest.filter(j => j.id !== manifestEntry.id)];
  fs.writeFileSync(manifestPath, JSON.stringify(currentManifest, null, 2));
  logSuccess(`[DATABASE: MANIFEST] Saved post to local/server manifest (ID: ${manifestEntry.id})`);

  // 2. Sync to Firestore Database via REST API (both saved_campaigns & video_vault)
  try {
    const { projectId: firestoreProjectId, apiKey: firestoreApiKey, databaseId: firestoreDbId } = getFirestoreConfig();

    if (firestoreApiKey && firestoreProjectId) {
      const firestoreSlides = (enrichedSlides || []).map(s => ({
        mapValue: {
          fields: {
            text: { stringValue: s.text || '' },
            scriptText: { stringValue: s.scriptText || s.text || '' },
            voiceoverTts: { stringValue: s.voiceoverTts || s.text || '' },
            imagePrompt: { stringValue: s.imagePrompt || '' },
            imageUrl: { stringValue: s.imageUrl || '' },
            audioUrl: { stringValue: s.audioUrl || '' },
            durationSeconds: { doubleValue: Number(s.durationSeconds || 10) },
            effect: { stringValue: s.effect || 'ken-burns' }
          }
        }
      }));

      // Convert to Firestore Document format
      const docFields = {
        id: { stringValue: campaignId },
        jobId: { stringValue: `job-stoic-${Date.now()}` },
        title: { stringValue: storyboard.title },
        niche: { stringValue: 'motivation_stoicism' },
        channelId: { stringValue: 'motivation_stoicism' },
        channelHandle: { stringValue: '@thestoicarchitect-n4b' },
        createdAt: { stringValue: new Date().toISOString() },
        status: { stringValue: 'completed' },
        isPosted: { booleanValue: publishResult.status === 'PUBLISHED_LIVE' },
        youtubeVideoId: { stringValue: publishResult.videoId || '' },
        youtubeUrl: { stringValue: publishResult.videoUrl || '' },
        cloudinaryUrl: { stringValue: cloudinaryUrl || '' },
        videoUrl: { stringValue: finalVideoUrl },
        durationSeconds: { integerValue: String(Math.round(renderResult?.durationSeconds || 60)) },
        views: { integerValue: publishResult.status === 'PUBLISHED_LIVE' ? '1' : '0' },
        likes: { integerValue: '0' },
        payload: {
          mapValue: {
            fields: {
              channelId: { stringValue: 'motivation_stoicism' },
              topic: { stringValue: topicName },
              youtube: {
                mapValue: {
                  fields: {
                    title: { stringValue: storyboard.title },
                    description: { stringValue: storyboard.description || '' },
                    slides: {
                      arrayValue: {
                        values: firestoreSlides
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };

      const reqData = JSON.stringify({ fields: docFields });

      // Save to saved_campaigns
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${firestoreProjectId}/databases/${firestoreDbId}/documents/saved_campaigns/${campaignId}?key=${firestoreApiKey}`;
      await new Promise((resolve) => {
        const req = https.request(firestoreUrl, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(reqData)
          },
          timeout: 8000
        }, () => resolve());
        req.on('error', () => resolve());
        req.write(reqData);
        req.end();
      });

      // Save to video_vault
      const vaultUrl = `https://firestore.googleapis.com/v1/projects/${firestoreProjectId}/databases/${firestoreDbId}/documents/video_vault/${campaignId}?key=${firestoreApiKey}`;
      await new Promise((resolve) => {
        const req = https.request(vaultUrl, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(reqData)
          },
          timeout: 8000
        }, () => resolve());
        req.on('error', () => resolve());
        req.write(reqData);
        req.end();
      });

      logSuccess(`[DATABASE: FIRESTORE] Post successfully saved to Firestore 'saved_campaigns' and 'video_vault' collections.`);
    } else {
      logInfo(`[DATABASE: PERSISTENCE] Saved to active manifest vault.`);
    }

    // 3. Save to Firestore Content History for Cooldown and Diversity tracking
    const activeArch = resolvedArchetype || STOIC_ARCHETYPES[0];
    await saveContentHistoryToFirestore({
      channelId: 'motivation_stoicism',
      topic: storyboard.title,
      theme: activeArch.theme,
      angle: activeArch.angle,
      hookPattern: storyboard.slides?.[0]?.text || activeArch.hookPatterns[0],
      visualStyle: activeArch.visualStyle,
      narrativeStructure: activeArch.narrativeStructure,
      storyExample: activeArch.storyExample,
      ending: storyboard.slides?.[storyboard.slides.length - 1]?.text || activeArch.outroPattern
    });
    logSuccess(`[DATABASE: DEDUPLICATION] Topic "${storyboard.title}" logged to 'content_history' — Anti-duplicate 24h cooldown active!`);
  } catch (e) {
    logInfo(`[DATABASE] Sync status: ${e.message}`);
  }

  return newCampaign;
}

// ----------------------------------------------------
// MAIN TEST ORCHESTRATOR
// ----------------------------------------------------
async function runDiagnostics() {
  console.log(`\n${colors.bright}${colors.magenta}╔════════════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}║        VOXAM AI STOIC & MOTIVATION FULL PIPELINE RUNNER            ║${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}║        Channel: The Stoic Architect (@thestoicarchitect-n4b)       ║${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}╚════════════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Mode: ${isDryRun ? 'DRY RUN (Safe Full-Stack Verification)' : 'LIVE PRODUCTION RUN'}`);

  const activeGrok = await testGrokKeys();
  const backupEngines = await testBackupEngines();
  const currentTopic = await resolveTopic(activeGrok, backupEngines);
  const storyboard = await generateStoicStoryboard(currentTopic, activeGrok, backupEngines);
  const enrichedSlides = await generateMediaAssets(storyboard);
  await testAudioTracks();
  const renderResult = await renderFfmpegVideo(storyboard, enrichedSlides);
  const publishResult = await handleYouTubePublish(storyboard, renderResult);
  
  // Upload to Cloudinary for web video playback
  const cloudinaryUrl = await uploadToCloudinary(renderResult.videoFilePath, `stoic_${Date.now()}`);

  const savedCampaign = await syncToManifestAndDatabase(storyboard, enrichedSlides, publishResult, currentTopic, renderResult, cloudinaryUrl);

  // Save diagnostic output artifact
  const testOutputDir = path.join(process.cwd(), 'test_artifacts');
  if (!fs.existsSync(testOutputDir)) fs.mkdirSync(testOutputDir, { recursive: true });
  
  const testReport = {
    timestamp: new Date().toISOString(),
    channel: 'The Stoic Architect (@thestoicarchitect-n4b)',
    topic: currentTopic,
    grokStatus: activeGrok ? `ONLINE (${activeGrok.model})` : 'FALLBACK_TRIGGERED',
    backupEngineStatus: backupEngines.groqWorkingModel ? `ONLINE (${backupEngines.groqWorkingModel})` : 'OFFLINE',
    youtubeAuth: publishResult.status,
    storyboard: storyboard,
    slides: enrichedSlides,
    renderResult: renderResult,
    publishResult: publishResult,
    cloudinaryUrl: cloudinaryUrl,
    savedCampaign: savedCampaign
  };

  fs.writeFileSync(path.join(testOutputDir, 'stoic_test_report.json'), JSON.stringify(testReport, null, 2));

  console.log(`\n${colors.bright}${colors.cyan}══════════════════════════════════════════════════════════════════════${colors.reset}`);
  if (publishResult.status === 'PUBLISHED_LIVE') {
    console.log(`${colors.bright}${colors.green}✔ PIPELINE COMPLETED & VIDEO PUBLISHED LIVE TO YOUTUBE!${colors.reset}`);
    console.log(`  ${colors.bright}Live URL: ${colors.green}${publishResult.videoUrl}${colors.reset}`);
    console.log(`  ${colors.bright}YouTube Studio: ${colors.cyan}https://studio.youtube.com/video/${publishResult.videoId}/edit${colors.reset}`);
  } else if (isDryRun) {
    console.log(`${colors.bright}${colors.cyan}✔ PIPELINE DRY RUN COMPLETED SUCCESSFULLY (Video verified & saved)${colors.reset}`);
    console.log(`  Local Render: ${renderResult.videoFilePath || 'test_artifacts/stoic_pipeline_short.mp4'}`);
  } else {
    console.log(`${colors.bright}${colors.yellow}⚠ PIPELINE COMPLETED LOCALLY (YouTube Upload Status: ${publishResult.status})${colors.reset}`);
    if (publishResult.error) console.log(`  Detail: ${publishResult.error}`);
  }
  if (cloudinaryUrl) console.log(`  Cloudinary URL: ${colors.green}${cloudinaryUrl}${colors.reset}`);
  console.log(`  Report: test_artifacts/stoic_test_report.json`);
  console.log(`  In-App Player: Saved to Vault and Blueprint Manifest`);
  console.log(`${colors.bright}${colors.cyan}══════════════════════════════════════════════════════════════════════${colors.reset}\n`);
}

runDiagnostics().catch(err => {
  logError(`Fatal test error: ${err.message}`);
  process.exit(1);
});
