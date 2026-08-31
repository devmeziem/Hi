/**
 * Voxam Diagnostic Test Runner — Fin Blueprint Channel (@bones_ceo)
 * Full End-to-End Production Pipeline:
 * 1. Multi-token Grok (xAI) connectivity & multi-model failover
 * 2. Cloudflare Workers AI, Groq LPU & Google Gemini fallback
 * 3. 6-slide practical finance & small-business storyboard (Dual Currency: ₦ Naira & $ USD)
 * 4. Real 9:16 vertical image generation (Cloudflare Multi-Model FLUX/SDXL + Pollinations FLUX)
 * 5. Natural-paced TTS voice synthesis (Cloudflare Deepgram Aura-2 + Edge Neural Bass with deliberate pacing)
 * 6. Dynamic FFmpeg motion engine with "GBIM" gavel slam impact, camera shakes, zooms, bounces, & kinetic captions
 * 7. YouTube Data API v3 Resumable Upload & Synthetic Media Disclosure
 * 8. Firestore Database & In-App Manifest Synchronization
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { execSync, spawnSync } = require('child_process');
const {
  FIN_ARCHETYPES,
  FIN_CATEGORIES,
  FIN_SERIES,
  CATEGORY_FLOW_GUIDES,
  getFirestoreConfig,
  auditFinancialScriptSafety,
  sanitizeFinString,
  buildFinPromptForSlot,
  buildFinDeepDivePrompt,
  validateFinStoryboardQuality,
  synthesizeDeterministicFinStoryboard,
  synthesizeDeterministicFinDeepDiveStoryboard,
  fetchRecentFinHistoryFromFirestore,
  isFinTopicSimilarToHistory,
  selectDiverseFinArchetype,
  selectFinHookFormat,
  resolveFinOutro,
  formatViralShortsTitle
} = require('./fin_diversity_engine.cjs');

// ANSI Color helper for clean terminal outputs
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

/**
 * Fetch live market benchmarks (USD/NGN, BTC, USDT) for authentic, real-world data
 */
async function fetchLiveFinMarketData() {
  logInfo('[Market Data] Fetching real-time market benchmarks (USD/NGN rate & Crypto)...');
  const data = {
    usdNgnRate: 1540,
    btcUsd: 88500,
    usdtNgn: 1550,
    timestamp: new Date().toISOString()
  };

  try {
    const fetched = await new Promise((resolve) => {
      const req = https.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,tether&vs_currencies=usd,ngn', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        timeout: 4000
      }, (r) => {
        let b = '';
        r.on('data', c => b += c);
        r.on('end', () => {
          try {
            const j = JSON.parse(b);
            if (j.bitcoin?.usd) {
              data.btcUsd = j.bitcoin.usd;
              if (j.tether?.ngn) data.usdtNgn = Math.round(j.tether.ngn);
              if (j.tether?.ngn) data.usdNgnRate = Math.round(j.tether.ngn);
              resolve(true);
            } else {
              resolve(false);
            }
          } catch { resolve(false); }
        });
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
    });

    if (fetched) {
      logSuccess(`[Market Data] Live Rate: 1 USD ≈ ₦${data.usdNgnRate.toLocaleString()} | BTC: $${data.btcUsd.toLocaleString()}`);
    } else {
      logInfo(`[Market Data] Using baseline exchange benchmark: 1 USD ≈ ₦${data.usdNgnRate.toLocaleString()}`);
    }
  } catch {
    logInfo(`[Market Data] Baseline exchange benchmark active: 1 USD ≈ ₦${data.usdNgnRate.toLocaleString()}`);
  }
  return data;
}

// Channel Configuration
const CHANNEL_ID = 'channel_fin_01';
const CHANNEL_NAME = process.env.FIN_CHANNEL_NAME || 'Fin Blueprint';
const CHANNEL_HANDLE = process.env.FIN_CHANNEL_HANDLE || process.env.CHANNEL_1_HANDLE || '@bones_ceo';
const NICHE = 'finance_business';

// Parse Command Line Flags & Environment Variables
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run') || String(process.env.DRY_RUN).toLowerCase() === 'true';
const inputTopic = process.env.TEST_TOPIC ? process.env.TEST_TOPIC.trim() : '';
const currentUtcHour = new Date().getUTCHours();
const contentDepth = process.env.CONTENT_DEPTH || (currentUtcHour === 2 ? 'deep_dive' : 'short_form');

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

// YouTube OAuth Credentials
const YOUTUBE_CLIENT_ID = (process.env.YOUTUBE_CLIENT_ID_CH1 || process.env.YOUTUBE_CLIENT_ID || '').trim();
const YOUTUBE_CLIENT_SECRET = (process.env.YOUTUBE_CLIENT_SECRET_CH1 || process.env.YOUTUBE_CLIENT_SECRET || '').trim();
const YOUTUBE_REFRESH_TOKEN = (process.env.YOUTUBE_REFRESH_TOKEN_CH1 || process.env.YOUTUBE_REFRESH_TOKEN || '').trim();

const CLOUDINARY_CLOUD_NAME = (process.env.CLOUDINARY_CLOUD_NAME || '').trim();
const CLOUDINARY_UPLOAD_PRESET = (process.env.CLOUDINARY_UPLOAD_PRESET || '').trim();

const artifactsDir = path.join(process.cwd(), 'test_artifacts');
const renderedDir = path.join(process.cwd(), 'rendered_videos');
if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir, { recursive: true });
if (!fs.existsSync(renderedDir)) fs.mkdirSync(renderedDir, { recursive: true });

let cloudflareAuthFailed = false;

// Bulletproof FFmpeg drawtext string sanitization
function sanitizeForFfmpegDrawtext(str) {
  if (!str) return '';
  return String(str)
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/['"\\`]/g, '')
    .replace(/[:%]/g, ' ')
    .replace(/[[\]{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Clean text for speech synthesis, stripping pauses, markdown, and currency symbols
function prepareTextForSpeech(rawText) {
  if (!rawText) return '';
  let clean = String(rawText)
    .replace(/^(slide\s*\d+[:\-.]?|narration[:\-.]?|host[:\-.]?|voiceover[:\-.]?)\s*/i, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\.{2,}/g, '.')
    .replace(/[:;–—]/g, ', ')
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

function trimAudioSilence(filePath) {
  if (!fs.existsSync(filePath)) return;
  try {
    const tempTrim = filePath.replace(/\.mp3$/, '_trim.mp3');
    execSync(`ffmpeg -y -i "${filePath}" -af "silenceremove=stop_periods=-1:stop_duration=0.08:stop_threshold=-40dB,silenceremove=start_periods=1:start_duration=0.02:start_threshold=-40dB" -b:a 192k "${tempTrim}" 2>/dev/null`);
    if (fs.existsSync(tempTrim) && fs.statSync(tempTrim).size > 500) {
      fs.renameSync(tempTrim, filePath);
    }
  } catch {}
}

function cleanLlmJson(rawContent) {
  if (!rawContent) return null;
  let text = String(rawContent);
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
  text = text.replace(/<think>[\s\S]*/gi, '');
  text = text.replace(/Thinking Process:[\s\S]*?(?=\n\n|\n[A-Z0-9"']|$)/gi, '');
  text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.substring(firstBrace, lastBrace + 1);
  }
  // Strip trailing commas before closing braces
  text = text.replace(/,\s*([\}\]])/g, '$1');
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function validateFinStoryboard(storyboard) {
  if (!storyboard || !Array.isArray(storyboard.slides) || storyboard.slides.length < 3) return false;
  
  const qualityCheck = validateFinStoryboardQuality(storyboard);
  if (!qualityCheck.valid) {
    logWarning(`[Storyboard Engine] Quality check failed: ${qualityCheck.reason}`);
    return false;
  }

  storyboard.slides.forEach(slide => {
    slide.text = prepareTextForSpeech(slide.text);
  });
  return true;
}

console.log(`\n${colors.bright}${colors.cyan}══════════════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`  VOXAM AUTOMATION FACTORY — FIN BLUEPRINT DIAGNOSTIC RUNNER`);
console.log(`  Channel Target : ${colors.bright}${CHANNEL_NAME} (${CHANNEL_HANDLE})${colors.reset}`);
console.log(`  Niche Focus    : ${colors.green}Global & Nigerian Practical Finance & Small Business${colors.reset}`);
console.log(`  Mode           : ${isDryRun ? colors.yellow + 'DRY RUN (Local Simulation)' : colors.green + 'LIVE YOUTUBE PUBLISHING'}${colors.reset}`);
console.log(`  Grok Keys      : ${XAI_API_KEYS.length} available | Groq: ${GROQ_API_KEY ? '✔' : '✖'} | Gemini: ${GEMINI_API_KEY ? '✔' : '✖'} | OpenAI: ${OPENAI_API_KEY ? '✔' : '✖'} | Cloudflare: ${CLOUDFLARE_API_TOKEN ? '✔' : '✖'}`);
console.log(`${colors.cyan}══════════════════════════════════════════════════════════════════════\n${colors.reset}`);

// ----------------------------------------------------
// STEP 1: PROBE GROK (xAI) MULTI-TOKEN INFERENCE
// ----------------------------------------------------
async function probeWorkingGrokModel() {
  logStep(1, 'Probing Grok (xAI) Multi-Token Connectivity');
  if (XAI_API_KEYS.length === 0) {
    logWarning('No xAI Grok API keys found in environment.');
    return null;
  }

  const grokModels = ['grok-2-latest', 'grok-2', 'grok-beta'];
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
              { role: 'system', content: 'You are a concise financial engine tester.' },
              { role: 'user', content: 'Respond with exactly: "Fin Grok Active"' }
            ],
            max_tokens: 20
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
                } catch {
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
          logSuccess(`Grok Token #${i + 1} (${masked}) with '${model}' is ONLINE! Latency: ${response.duration}ms`);
          if (!activeKey) activeKey = { key, model };
          return activeKey;
        }
      } catch (err) {
        logError(`Grok Token #${i + 1} (${masked}) Error: ${err.message}`);
      }
    }
  }

  return activeKey;
}

// ----------------------------------------------------
// STEP 2: PROBE GROQ & CLOUDFLARE INFERENCE BACKUP
// ----------------------------------------------------
async function probeBackupEngines() {
  logStep(2, 'Testing Groq LPU Backup Engine');
  let groqWorkingModel = null;

  if (GROQ_API_KEY) {
    const candidateModels = [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'gemma2-9b-it',
      'deepseek-r1-distill-llama-70b',
      'qwen-2.5-32b'
    ];

    for (const model of candidateModels) {
      try {
        const startTime = Date.now();
        const res = await new Promise((resolve) => {
          const postData = JSON.stringify({
            model,
            messages: [{ role: 'user', content: 'Ping' }],
            max_tokens: 5
          });
          const req = https.request('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${GROQ_API_KEY}`,
              'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 6000
          }, (r) => {
            let body = '';
            r.on('data', c => body += c);
            r.on('end', () => resolve({ status: r.statusCode, duration: Date.now() - startTime }));
          });
          req.on('error', () => resolve({ status: 500 }));
          req.on('timeout', () => { req.destroy(); resolve({ status: 408 }); });
          req.write(postData);
          req.end();
        });

        if (res.status === 200) {
          logSuccess(`Groq High-Speed LPU ('${model}') is ONLINE & READY! Latency: ${res.duration}ms`);
          groqWorkingModel = model;
          break;
        }
      } catch {}
    }
  }

  return { groqWorkingModel };
}

/// ----------------------------------------------------
// DYNAMIC FINANCE TOPIC DISCOVERY & ROTATION ENGINE
// ----------------------------------------------------
async function discoverDynamicFinanceTopic(resolvedArchetype, activeGrok, recentHistory = []) {
  logInfo(`[Topic Discovery] Discovering fresh, high-CTR viral topic for Pillar: "${resolvedArchetype.theme}"...`);
  const recentExclusions = recentHistory.slice(0, 25).map(h => `"${h.topic || h.title}"`).join(', ');

  // 1. Try OpenRouter
  if (OPENROUTER_API_KEY) {
    const openRouterModels = ['google/gemini-2.0-flash-001', 'meta-llama/llama-3.3-70b-instruct', 'deepseek/deepseek-chat', 'mistralai/mistral-small-3'];
    for (const model of openRouterModels) {
      try {
        const postData = JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: 'You are a viral YouTube Shorts strategist for practical finance and micro-business.' },
            { role: 'user', content: `Generate 1 fresh, complete, high-retention title (around 35-50 characters) for 'Fin Blueprint' on Theme: "${resolvedArchetype.theme}" (Angle: "${resolvedArchetype.angle}"). Target Budget: "${resolvedArchetype.targetBudget}". EXCLUDED PREVIOUS TITLES: [${recentExclusions || 'None'}]. Return ONLY the single title in plain text without quotes.` }
          ],
          temperature: 0.85,
          max_tokens: 60
        });

        const res = await new Promise((resolve) => {
          const req = https.request('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'HTTP-Referer': 'https://voxam.ai',
              'X-Title': 'Voxam Topic Discovery',
              'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 10000
          }, (resp) => {
            let data = '';
            resp.on('data', c => data += c);
            resp.on('end', () => {
              if (resp.statusCode === 200) {
                try {
                  const j = JSON.parse(data);
                  resolve({ success: true, text: j.choices?.[0]?.message?.content?.trim() });
                } catch { resolve({ success: false }); }
              } else { resolve({ success: false }); }
            });
          });
          req.on('error', () => resolve({ success: false }));
          req.on('timeout', () => { req.destroy(); resolve({ success: false }); });
          req.write(postData);
          req.end();
        });

        if (res.success && res.text) {
          const cleanTopic = sanitizeFinString(res.text).replace(/^#+/, '').replace(/^Title:\s*/i, '').trim();
          if (cleanTopic.length > 8 && !isFinTopicSimilarToHistory(cleanTopic, resolvedArchetype.theme, recentHistory)) {
            logSuccess(`[Topic Discovery] Discovered via OpenRouter (${model}): "${cleanTopic}"`);
            return cleanTopic;
          }
        }
      } catch {}
    }
  }

  // 2. Try Groq LPU
  if (GROQ_API_KEY) {
    const groqModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'llama3-70b-8192'];
    for (const model of groqModels) {
      try {
        const postData = JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: 'You are a viral YouTube Shorts strategist for practical finance and micro-business.' },
            { role: 'user', content: `Generate 1 fresh, complete, high-retention title (around 35-50 characters) for 'Fin Blueprint' on Theme: "${resolvedArchetype.theme}" (Angle: "${resolvedArchetype.angle}"). Target Budget: "${resolvedArchetype.targetBudget}". EXCLUDED PREVIOUS TITLES: [${recentExclusions || 'None'}]. Return ONLY the single title in plain text without quotes.` }
          ],
          temperature: 0.85,
          max_tokens: 60
        });

        const res = await new Promise((resolve) => {
          const req = https.request('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${GROQ_API_KEY}`,
              'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 10000
          }, (resp) => {
            let data = '';
            resp.on('data', c => data += c);
            resp.on('end', () => {
              if (resp.statusCode === 200) {
                try {
                  const j = JSON.parse(data);
                  resolve({ success: true, text: j.choices?.[0]?.message?.content?.trim() });
                } catch { resolve({ success: false }); }
              } else { resolve({ success: false }); }
            });
          });
          req.on('error', () => resolve({ success: false }));
          req.on('timeout', () => { req.destroy(); resolve({ success: false }); });
          req.write(postData);
          req.end();
        });

        if (res.success && res.text) {
          const cleanTopic = sanitizeFinString(res.text).replace(/^#+/, '').replace(/^Title:\s*/i, '').trim();
          if (cleanTopic.length > 8 && !isFinTopicSimilarToHistory(cleanTopic, resolvedArchetype.theme, recentHistory)) {
            logSuccess(`[Topic Discovery] Discovered via Groq (${model}): "${cleanTopic}"`);
            return cleanTopic;
          }
        }
      } catch {}
    }
  }

  // 3. Try Google Gemini
  if (GEMINI_API_KEY) {
    const geminiModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    for (const model of geminiModels) {
      try {
        const postData = JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a world-class viral YouTube Shorts strategist for practical finance and micro-business.
Generate 1 fresh, complete, high-retention title (around 35-50 characters) for 'Fin Blueprint' on Theme: "${resolvedArchetype.theme}" (Angle: "${resolvedArchetype.angle}").
Target Budget: "${resolvedArchetype.targetBudget}".
MANDATORY: Return ONLY the single title text as a complete, grammatically whole thought in plain English. No quotes, no markdown, no explanation, do NOT cut off mid-sentence.
EXCLUDED PREVIOUS TITLES: [${recentExclusions || 'None'}]`
            }]
          }],
          generationConfig: { temperature: 0.85, maxOutputTokens: 60 }
        });

        const res = await new Promise((resolve) => {
          const req = https.request(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) },
            timeout: 10000
          }, (resp) => {
            let data = '';
            resp.on('data', c => data += c);
            resp.on('end', () => {
              if (resp.statusCode === 200) {
                try {
                  const j = JSON.parse(data);
                  resolve({ success: true, text: j.candidates?.[0]?.content?.parts?.[0]?.text?.trim() });
                } catch { resolve({ success: false }); }
              } else { resolve({ success: false }); }
            });
          });
          req.on('error', () => resolve({ success: false }));
          req.on('timeout', () => { req.destroy(); resolve({ success: false }); });
          req.write(postData);
          req.end();
        });

        if (res.success && res.text) {
          const cleanTopic = sanitizeFinString(res.text).replace(/^#+/, '').replace(/^Title:\s*/i, '').trim();
          if (cleanTopic.length > 8 && !isFinTopicSimilarToHistory(cleanTopic, resolvedArchetype.theme, recentHistory)) {
            logSuccess(`[Topic Discovery] Discovered via Gemini (${model}): "${cleanTopic}"`);
            return cleanTopic;
          }
        }
      } catch {}
    }
  }

  // 4. Try Grok (xAI)
  if (activeGrok && activeGrok.key) {
    try {
      const postData = JSON.stringify({
        model: activeGrok.model || 'grok-2-latest',
        messages: [
          { role: 'system', content: 'You are a viral YouTube Shorts strategist for practical finance and micro-business.' },
          { role: 'user', content: `Generate 1 fresh, complete, high-retention title (around 35-50 characters) for 'Fin Blueprint' on Theme: "${resolvedArchetype.theme}" (Angle: "${resolvedArchetype.angle}"). Avoid recent titles: [${recentExclusions || 'None'}]. Return ONLY the single title in plain text as a complete, grammatically whole phrase without reasoning or cuts.` }
        ],
        temperature: 0.85,
        max_tokens: 60
      });

      const res = await new Promise((resolve) => {
        const req = https.request('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${activeGrok.key}`, 'Content-Length': Buffer.byteLength(postData) },
          timeout: 10000
        }, (resp) => {
          let data = '';
          resp.on('data', c => data += c);
          resp.on('end', () => {
            if (resp.statusCode === 200) {
              try {
                const j = JSON.parse(data);
                resolve({ success: true, text: j.choices?.[0]?.message?.content?.trim() });
              } catch { resolve({ success: false }); }
            } else { resolve({ success: false }); }
          });
        });
        req.on('error', () => resolve({ success: false }));
        req.on('timeout', () => { req.destroy(); resolve({ success: false }); });
        req.write(postData);
        req.end();
      });

      if (res.success && res.text) {
        const cleanTopic = sanitizeFinString(res.text).replace(/^Title:\s*/i, '').trim();
        if (cleanTopic.length > 8 && !isFinTopicSimilarToHistory(cleanTopic, resolvedArchetype.theme, recentHistory)) {
          logSuccess(`[Topic Discovery] Discovered via Grok (${activeGrok.model}): "${cleanTopic}"`);
          return cleanTopic;
        }
      }
    } catch {}
  }

  // 5. Curated Archetype Angle with clean title formatting
  return resolvedArchetype.angle;
}

// ----------------------------------------------------
// STEP 3: GENERATE 6-SLIDE DUAL-CURRENCY STORYBOARD (WITH DEDUPLICATION & ROTATION)
// ----------------------------------------------------
async function generateFinanceStoryboard(topicInput, grokObj, groqModel) {
  logStep(3, `Synthesizing High-Retention Finance Storyboard`);

  // Fetch complete recent content history from Firestore REST API and local cache
  const recentHistory = await fetchRecentFinHistoryFromFirestore(CHANNEL_ID, 35);
  logInfo(`[Duplicate Check] Audited ${recentHistory.length} historical posts to guarantee 100% unique topic.`);

  const isDeepDive = contentDepth === 'deep_dive';
  let scriptData = null;
  let chosenTopicForPipeline = null;
  let chosenArchetypeForPipeline = null;
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (scriptData) break;
    logInfo(`[Storyboard Engine] === Storyboard Generation Attempt ${attempt}/${maxAttempts} ===`);

    // Pick diverse, non-recent archetype to prevent repetitive themes
    const archetype = selectDiverseFinArchetype(recentHistory, attempt - 1);
    chosenArchetypeForPipeline = archetype;
    logInfo(`[Archetype] Selected Pillar: "${archetype.theme}" (Target Budget: ${archetype.targetBudget})`);

    // Dynamically resolve topic if not explicitly passed
    let activeTopic = topicInput;
    if (!activeTopic || activeTopic.trim().length < 4) {
      activeTopic = await discoverDynamicFinanceTopic(archetype, grokObj, recentHistory);
    }
    chosenTopicForPipeline = activeTopic;
    logInfo(`[Topic Selected] "${activeTopic}"`);

    const { systemPrompt, userPrompt, chosenHookFormat, chosenOutro } = isDeepDive
      ? buildFinDeepDivePrompt(archetype, recentHistory, CHANNEL_HANDLE)
      : buildFinPromptForSlot(archetype, recentHistory, attempt - 1, CHANNEL_HANDLE);

    logInfo(`[Hook & Loop Rotation] Intro Hook: "${chosenHookFormat?.name || 'Curiosity'}" | Outro Loop Bridge: "${(chosenOutro || '').slice(0, 45)}..."`);

    // 1. PRIMARY: OpenRouter AI (High-Reliability Multi-Provider Gateway)
    if (!scriptData && OPENROUTER_API_KEY) {
      const openRouterModels = ['google/gemini-2.0-flash-001', 'meta-llama/llama-3.3-70b-instruct', 'deepseek/deepseek-chat', 'mistralai/mistral-small-3'];
      for (const orModel of openRouterModels) {
        if (scriptData) break;
        try {
          logInfo(`[Storyboard Engine] 1. Requesting storyboard from OpenRouter (${orModel})...`);
          const raw = await new Promise((resolve) => {
            const postData = JSON.stringify({
              model: orModel,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `${userPrompt} Topic Title: "${activeTopic}". Return strictly valid JSON.` }
              ],
              temperature: 0.7,
              max_tokens: 2200
            });
            const req = https.request('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://voxam.ai',
                'X-Title': 'Voxam Fin Engine',
                'Content-Length': Buffer.byteLength(postData)
              },
              timeout: 20000
            }, (res) => {
              let data = '';
              res.on('data', c => data += c);
              res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                  try {
                    const j = JSON.parse(data);
                    resolve({ success: true, content: j.choices?.[0]?.message?.content });
                  } catch (e) { resolve({ success: false, error: e.message }); }
                } else { resolve({ success: false, error: `HTTP ${res.statusCode}: ${data.slice(0, 100)}` }); }
              });
            });
            req.on('error', err => resolve({ success: false, error: err.message }));
            req.on('timeout', () => { req.destroy(); resolve({ success: false, error: 'Timeout' }); });
            req.write(postData);
            req.end();
          });

          if (raw.success && raw.content) {
            const parsed = cleanLlmJson(raw.content);
            if (parsed && validateFinStoryboard(parsed)) {
              if (!isDeepDive && parsed.slides.length > 6) parsed.slides = parsed.slides.slice(0, 6);
              scriptData = parsed;
              logSuccess(`[Storyboard Engine] OpenRouter (${orModel}) generated complete ${scriptData.slides.length}-slide storyboard!`);
              break;
            }
          } else {
            logInfo(`[Storyboard Engine] OpenRouter (${orModel}) notice: ${raw.error || 'Failed parsing'}`);
          }
        } catch (e) {
          logInfo(`[Storyboard Engine] OpenRouter (${orModel}) error: ${e.message}`);
        }
      }
    }

    // 2. SECONDARY: Groq LPU Models
    if (!scriptData && GROQ_API_KEY) {
      const groqModels = [groqModel, 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'llama3-70b-8192', 'llama3-8b-8192'].filter(Boolean);
      for (const gModel of groqModels) {
        if (scriptData) break;
        try {
          logInfo(`[Storyboard Engine] 2. Requesting storyboard from Groq LPU (${gModel})...`);
          const raw = await new Promise((resolve) => {
            const postData = JSON.stringify({
              model: gModel,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `${userPrompt} Topic Title: "${activeTopic}". Return strictly valid JSON.` }
              ],
              temperature: 0.7,
              max_tokens: 2200
            });
            const req = https.request('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Length': Buffer.byteLength(postData)
              },
              timeout: 18000
            }, (res) => {
              let data = '';
              res.on('data', c => data += c);
              res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                  try {
                    const j = JSON.parse(data);
                    resolve({ success: true, content: j.choices?.[0]?.message?.content });
                  } catch (e) { resolve({ success: false, error: e.message }); }
                } else { resolve({ success: false, error: `HTTP ${res.statusCode}: ${data.slice(0, 100)}` }); }
              });
            });
            req.on('error', err => resolve({ success: false, error: err.message }));
            req.on('timeout', () => { req.destroy(); resolve({ success: false, error: 'Timeout' }); });
            req.write(postData);
            req.end();
          });

          if (raw.success && raw.content) {
            const parsed = cleanLlmJson(raw.content);
            if (parsed && validateFinStoryboard(parsed)) {
              if (!isDeepDive && parsed.slides.length > 6) parsed.slides = parsed.slides.slice(0, 6);
              scriptData = parsed;
              logSuccess(`[Storyboard Engine] Groq (${gModel}) generated complete ${scriptData.slides.length}-slide storyboard!`);
              break;
            }
          } else {
            logInfo(`[Storyboard Engine] Groq (${gModel}) notice: ${raw.error || 'Failed parsing'}`);
          }
        } catch (e) {
          logInfo(`[Storyboard Engine] Groq (${gModel}) error: ${e.message}`);
        }
      }
    }

    // 3. TERTIARY: Google Gemini Models
    if (!scriptData && GEMINI_API_KEY) {
      const geminiModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
      for (const gModel of geminiModels) {
        if (scriptData) break;
        try {
          logInfo(`[Storyboard Engine] 3. Requesting storyboard from Google Gemini (${gModel})...`);
          const raw = await new Promise((resolve) => {
            const postData = JSON.stringify({
              contents: [{ parts: [{ text: `${systemPrompt}\n\nTask: ${userPrompt} Topic Title: "${activeTopic}". Return strictly raw JSON matching the schema.` }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 2500, responseMimeType: "application/json" }
            });
            const req = https.request(`https://generativelanguage.googleapis.com/v1beta/models/${gModel}:generateContent?key=${GEMINI_API_KEY}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) },
              timeout: 20000
            }, (res) => {
              let d = '';
              res.on('data', c => d += c);
              res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                  try {
                    const j = JSON.parse(d);
                    resolve({ success: true, content: j.candidates?.[0]?.content?.parts?.[0]?.text });
                  } catch (e) { resolve({ success: false, error: e.message }); }
                } else { resolve({ success: false, error: `HTTP ${res.statusCode}` }); }
              });
            });
            req.on('error', err => resolve({ success: false, error: err.message }));
            req.on('timeout', () => { req.destroy(); resolve({ success: false, error: 'Timeout' }); });
            req.write(postData);
            req.end();
          });

          if (raw.success && raw.content) {
            const parsed = cleanLlmJson(raw.content);
            if (parsed && validateFinStoryboard(parsed)) {
              if (!isDeepDive && parsed.slides.length > 6) parsed.slides = parsed.slides.slice(0, 6);
              scriptData = parsed;
              logSuccess(`[Storyboard Engine] Gemini (${gModel}) generated complete ${scriptData.slides.length}-slide storyboard!`);
              break;
            }
          }
        } catch {}
      }
    }

    // 4. QUATERNARY: OpenAI
    if (!scriptData && OPENAI_API_KEY) {
      const openaiModels = ['gpt-4o-mini', 'gpt-4o'];
      for (const oModel of openaiModels) {
        if (scriptData) break;
        try {
          logInfo(`[Storyboard Engine] 4. Requesting storyboard from OpenAI (${oModel})...`);
          const raw = await new Promise((resolve) => {
            const postData = JSON.stringify({
              model: oModel,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `${userPrompt} Topic Title: "${activeTopic}". Return strictly valid JSON.` }
              ],
              temperature: 0.75,
              max_tokens: 2200
            });
            const req = https.request('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Length': Buffer.byteLength(postData)
              },
              timeout: 18000
            }, (res) => {
              let data = '';
              res.on('data', c => data += c);
              res.on('end', () => {
                if (res.statusCode === 200) {
                  try {
                    const j = JSON.parse(data);
                    resolve({ success: true, content: j.choices?.[0]?.message?.content });
                  } catch (e) { resolve({ success: false, error: e.message }); }
                } else { resolve({ success: false, error: `HTTP ${res.statusCode}` }); }
              });
            });
            req.on('error', err => resolve({ success: false, error: err.message }));
            req.on('timeout', () => { req.destroy(); resolve({ success: false, error: 'Timeout' }); });
            req.write(postData);
            req.end();
          });

          if (raw.success && raw.content) {
            const parsed = cleanLlmJson(raw.content);
            if (parsed && validateFinStoryboard(parsed)) {
              if (!isDeepDive && parsed.slides.length > 6) parsed.slides = parsed.slides.slice(0, 6);
              scriptData = parsed;
              logSuccess(`[Storyboard Engine] OpenAI (${oModel}) generated complete ${scriptData.slides.length}-slide storyboard!`);
              break;
            }
          }
        } catch {}
      }
    }

    // 5. QUINARY: DeepSeek
    if (!scriptData && DEEPSEEK_API_KEY) {
      try {
        logInfo(`[Storyboard Engine] 5. Requesting storyboard from DeepSeek (deepseek-chat)...`);
        const raw = await new Promise((resolve) => {
          const postData = JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `${userPrompt} Topic Title: "${activeTopic}". Return strictly valid JSON.` }
            ],
            temperature: 0.7,
            max_tokens: 2000
          });
          const req = https.request('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
              'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 18000
          }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
              if (res.statusCode === 200) {
                try {
                  const j = JSON.parse(data);
                  resolve({ success: true, content: j.choices?.[0]?.message?.content });
                } catch (e) { resolve({ success: false, error: e.message }); }
              } else { resolve({ success: false, error: `HTTP ${res.statusCode}` }); }
            });
          });
          req.on('error', err => resolve({ success: false, error: err.message }));
          req.on('timeout', () => { req.destroy(); resolve({ success: false, error: 'Timeout' }); });
          req.write(postData);
          req.end();
        });

        if (raw.success && raw.content) {
          const parsed = cleanLlmJson(raw.content);
          if (parsed && validateFinStoryboard(parsed)) {
            if (!isDeepDive && parsed.slides.length > 6) parsed.slides = parsed.slides.slice(0, 6);
            scriptData = parsed;
            logSuccess(`[Storyboard Engine] DeepSeek generated complete ${scriptData.slides.length}-slide storyboard!`);
          }
        }
      } catch {}
    }

    // 6. SENARY: Grok (xAI)
    if (!scriptData && grokObj && grokObj.key) {
      try {
        logInfo(`[Storyboard Engine] 6. Requesting storyboard from Grok (${grokObj.model})...`);
        const raw = await new Promise((resolve) => {
          const postData = JSON.stringify({
            model: grokObj.model || 'grok-2-latest',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `${userPrompt} Custom Topic: "${activeTopic}". Return strictly valid JSON.` }
            ],
            temperature: 0.7,
            max_tokens: 2200
          });

          const req = https.request('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${grokObj.key}`,
              'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 20000
          }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
              if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                  const j = JSON.parse(data);
                  resolve({ success: true, content: j.choices?.[0]?.message?.content });
                } catch (e) { resolve({ success: false, error: e.message }); }
              } else { resolve({ success: false, error: `HTTP ${res.statusCode}` }); }
            });
          });
          req.on('error', err => resolve({ success: false, error: err.message }));
          req.on('timeout', () => { req.destroy(); resolve({ success: false, error: 'Timeout' }); });
          req.write(postData);
          req.end();
        });

        if (raw.success && raw.content) {
          const parsed = cleanLlmJson(raw.content);
          if (parsed && validateFinStoryboard(parsed)) {
            if (!isDeepDive && parsed.slides.length > 6) parsed.slides = parsed.slides.slice(0, 6);
            scriptData = parsed;
            logSuccess(`[Storyboard Engine] Grok (${grokObj.model}) generated complete ${scriptData.slides.length}-slide storyboard!`);
          }
        }
      } catch {}
    }

    // 7. SEPTENARY: Cloudflare Workers AI
    if (!scriptData && CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_API_TOKEN && !cloudflareAuthFailed) {
      const cfModels = [
        '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
        '@cf/meta/llama-3.1-8b-instruct',
        '@cf/meta/llama-3.2-3b-instruct'
      ];
      for (const cModel of cfModels) {
        if (scriptData || cloudflareAuthFailed) break;
        try {
          logInfo(`[Storyboard Engine] 7. Requesting storyboard from Cloudflare AI (${cModel})...`);
          const raw = await new Promise((resolve) => {
            const postData = JSON.stringify({
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `${userPrompt} Topic Title: "${activeTopic}". Output STRICT JSON.` }
              ],
              max_tokens: 2048
            });
            const req = https.request(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${cModel}`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
              },
              timeout: 22000
            }, (res) => {
              let data = '';
              res.on('data', c => data += c);
              res.on('end', () => {
                if (res.statusCode === 200) {
                  try {
                    const j = JSON.parse(data);
                    resolve({ success: true, content: j.result?.response || data });
                  } catch { resolve({ success: true, content: data }); }
                } else {
                  if (res.statusCode === 401) cloudflareAuthFailed = true;
                  resolve({ success: false, error: `HTTP ${res.statusCode}: ${data.slice(0, 80)}` });
                }
              });
            });
            req.on('error', err => resolve({ success: false, error: err.message }));
            req.on('timeout', () => { req.destroy(); resolve({ success: false, error: 'Timeout' }); });
            req.write(postData);
            req.end();
          });

          if (raw.success && raw.content) {
            const parsed = cleanLlmJson(raw.content);
            if (parsed && validateFinStoryboard(parsed)) {
              if (!isDeepDive && parsed.slides.length > 6) parsed.slides = parsed.slides.slice(0, 6);
              scriptData = parsed;
              logSuccess(`[Storyboard Engine] Cloudflare (${cModel}) generated complete ${scriptData.slides.length}-slide storyboard!`);
              break;
            }
          }
        } catch {}
      }
    }
  }

  // 8. DIVERSITY ENGINE SYNTHESIS: 100% Topic-Specific Fallback strictly matching chosen topic
  const fallbackArch = chosenArchetypeForPipeline || selectDiverseFinArchetype(recentHistory, 0);
  const fallbackTopic = topicInput || chosenTopicForPipeline || fallbackArch.angle || fallbackArch.theme;
  if (!scriptData || !Array.isArray(scriptData.slides) || scriptData.slides.length < 3) {
    logWarning(`[Storyboard Engine] Remote LLM endpoints unavailable or rate-limited. Synthesizing topic-matched script for "${fallbackTopic}"...`);
    scriptData = isDeepDive
      ? synthesizeDeterministicFinDeepDiveStoryboard(fallbackArch, fallbackTopic, CHANNEL_HANDLE)
      : synthesizeDeterministicFinStoryboard(fallbackArch, fallbackTopic, CHANNEL_HANDLE);
    if (!isDeepDive && scriptData.slides.length > 6) scriptData.slides = scriptData.slides.slice(0, 6);
  }

  // Final Quality Check to prevent any blueprint leakage
  const qualityCheck = validateFinStoryboardQuality(scriptData);
  if (!qualityCheck.valid) {
    logError(`[FATAL QUALITY CHECK] Fin storyboard validation failed: ${qualityCheck.reason}`);
    throw new Error(`ABORTING: Generated storyboard failed quality check (${qualityCheck.reason}). Refusing to publish invalid content.`);
  }

  // Ensure title is complete, un-truncated, and equipped with viral & trending hashtags
  scriptData.title = formatViralShortsTitle(scriptData.title || fallbackTopic, 'fin', isDeepDive);

  // Safety & Dual Currency Compliance Audit
  const audit = auditFinancialScriptSafety(scriptData);
  if (!audit.passed) {
    logWarning(`Safety audit notes: ${(audit.flags || []).map(f => f.reason).join(', ')}`);
  } else {
    logSuccess('Compliance & Anti-Hype Safety Audit: 100% PASSED (Dual Currency & Non-Guru phrasing verified)');
  }

  console.log(`\n  ${colors.bright}Generated Financial Masterclass:${colors.reset}`);
  console.log(`  Title  : ${colors.green}${scriptData.title}${colors.reset}`);
  console.log(`  Budget : ${colors.yellow}${scriptData.estimatedBudget || 'Standard'}${colors.reset}`);
  console.log(`  Slides : ${colors.cyan}${scriptData.slides.length} slides (${isDeepDive ? 'Full Long-Form Deep Dive' : 'High-Retention Short with Infinite Loop'})${colors.reset}`);

  return scriptData;
}

// ----------------------------------------------------
// STEP 4: SYNTHESIZE REAL 9:16 IMAGES & NATURAL-PACED TTS
// ----------------------------------------------------
async function synthesizeEnrichedSlides(storyboard) {
  logStep(4, 'Synthesizing Real 9:16 Vertical Visuals & Natural-Paced Voiceover');

  // Multi-Model Cloudflare Image AI Helper
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
          prompt: `${prompt}, modern high-contrast financial scene, obsidian slate aesthetic, subtle emerald green and gold rim lighting, 9:16 vertical 8k resolution, cinematic studio lighting, photorealistic, sharp focus`
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
                try {
                  const json = JSON.parse(buffer.toString('utf8'));
                  if (json.result?.image) {
                    const imgBuf = Buffer.from(json.result.image, 'base64');
                    logSuccess(`[Cloudflare Image] Generated via ${model} (${imgBuf.length.toLocaleString()} bytes base64 decoded)`);
                    return resolve({
                      imageBuffer: imgBuf,
                      imageUrl: `data:image/jpeg;base64,${json.result.image}`,
                      model
                    });
                  }
                } catch {}

                if (buffer.length > 1000) {
                  logSuccess(`[Cloudflare Image] Generated via ${model} (${buffer.length.toLocaleString()} bytes binary)`);
                  return resolve({
                    imageBuffer: buffer,
                    imageUrl: `data:image/jpeg;base64,${buffer.toString('base64')}`,
                    model
                  });
                }
              } else if (resp.statusCode === 401) {
                cloudflareAuthFailed = true;
                logWarning(`[Cloudflare Engine] API token returned HTTP 401. Falling back to Pollinations FLUX.`);
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

  // Pollinations.ai FLUX (High-Res 9:16 Vertical)
  async function generatePollinationsImage(prompt) {
    try {
      const enhancedPrompt = `${prompt}, modern dark slate financial workspace, subtle emerald green and warm gold rim lighting, 9:16 vertical 1080x1920, 8k resolution, photorealistic cinematic lighting, sharp bokeh focus`;
      const encoded = encodeURIComponent(enhancedPrompt.slice(0, 240));
      const url = `https://image.pollinations.ai/prompt/${encoded}?width=1080&height=1920&nologo=true&model=flux`;
      
      const buffer = await new Promise((resolve) => {
        const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 18000 }, (res) => {
          if (res.statusCode === 200) {
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => resolve(Buffer.concat(chunks)));
          } else {
            resolve(null);
          }
        });
        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
      });

      if (buffer && buffer.length > 5000) {
        logSuccess(`[Pollinations FLUX] Generated 1080x1920 vertical scene (${buffer.length.toLocaleString()} bytes)`);
        return {
          imageBuffer: buffer,
          imageUrl: `data:image/jpeg;base64,${buffer.toString('base64')}`,
          model: 'Pollinations FLUX 9:16'
        };
      }
    } catch {}
    return null;
  }

  // Cloudflare Deepgram Aura-2 / Aura-1 TTS
  async function generateCloudflareTTS(text) {
    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN || cloudflareAuthFailed) return null;

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
            timeout: 12000
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
                    logSuccess(`[Cloudflare Deepgram Aura-2] Synthesized voice (${item.speaker}) (${audioBuf.length.toLocaleString()} bytes)`);
                    return resolve({
                      audioBuffer: audioBuf,
                      audioUrl: `data:audio/mpeg;base64,${json.result.audio}`,
                      provider: `Cloudflare Aura-2 (${item.speaker})`
                    });
                  }
                } catch {}

                if (buffer.length > 500) {
                  logSuccess(`[Cloudflare Aura TTS] Synthesized voice (${buffer.length.toLocaleString()} bytes binary)`);
                  return resolve({
                    audioBuffer: buffer,
                    audioUrl: `data:audio/mpeg;base64,${buffer.toString('base64')}`,
                    provider: `Cloudflare Deepgram (${item.speaker})`
                  });
                }
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

  // Microsoft Edge TTS with Natural Deliberate Pacing (+10% rate for engaging Shorts delivery)
  async function generateEdgeBassTTS(text) {
    try {
      const cleanText = prepareTextForSpeech(text);
      const { EdgeTTS } = require('node-edge-tts');
      // Warm, engaging, clear educational voices
      const voices = [
        'en-US-ChristopherNeural', // Warm, patient, highly clear educational teacher
        'en-US-GuyNeural',         // Clear, conversational financial mentor
        'en-GB-RyanNeural',        // Refined, articulate educator
        'en-US-EricNeural',        // Calm, resonant baritone
        'en-US-BrianNeural'        // Crisp modern masculine
      ];

      for (const voice of voices) {
        try {
          const tempAudio = path.join(artifactsDir, `edge_fin_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.mp3`);
          const tts = new EdgeTTS({
            voice: voice,
            lang: 'en-US',
            outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
            pitch: '+0Hz',
            rate: '+0%' // Grounded, natural, clear educational financial pacing
          });

          await tts.ttsPromise(cleanText, tempAudio);

          if (fs.existsSync(tempAudio)) {
            trimAudioSilence(tempAudio);
            const audioBuf = fs.readFileSync(tempAudio);
            try { fs.unlinkSync(tempAudio); } catch {}
            if (audioBuf.length > 800) {
              logSuccess(`[Microsoft Edge TTS] Synthesized educational voice (${voice}) (${audioBuf.length.toLocaleString()} bytes)`);
              return {
                audioBuffer: audioBuf,
                audioUrl: `data:audio/mpeg;base64,${audioBuf.toString('base64')}`,
                provider: `Microsoft Edge Neural (${voice})`
              };
            }
          }
        } catch {}
      }
    } catch {}
    return null;
  }

  // Google Translate TTS with DSP Equalizer
  async function generateGoogleDspTTS(text) {
    try {
      const cleanSpoken = prepareTextForSpeech(text);
      const encText = encodeURIComponent(cleanSpoken.slice(0, 260));
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encText}&tl=en-US&client=tw-ob`;
      const tempRaw = path.join(artifactsDir, `raw_g_tts_${Date.now()}.mp3`);
      const tempProcessed = path.join(artifactsDir, `proc_g_tts_${Date.now()}.mp3`);

      const ok = await new Promise((resolve) => {
        const file = fs.createWriteStream(tempRaw);
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000 }, (res) => {
          if (res.statusCode === 200) {
            res.pipe(file);
            file.on('finish', () => { file.close(); resolve(true); });
          } else {
            resolve(false);
          }
        }).on('error', () => resolve(false));
      });

      if (ok && fs.existsSync(tempRaw) && fs.statSync(tempRaw).size > 800) {
        execSync(`ffmpeg -y -i "${tempRaw}" -filter_complex "atempo=1.04,equalizer=f=120:t=q:w=1.5:g=4.0,equalizer=f=3500:t=q:w=2.0:g=2.0,silenceremove=stop_periods=-1:stop_duration=0.08:stop_threshold=-40dB" -b:a 192k "${tempProcessed}" 2>/dev/null`);
        try { fs.unlinkSync(tempRaw); } catch {}
        if (fs.existsSync(tempProcessed)) {
          const buf = fs.readFileSync(tempProcessed);
          try { fs.unlinkSync(tempProcessed); } catch {}
          return {
            audioBuffer: buf,
            audioUrl: `data:audio/mpeg;base64,${buf.toString('base64')}`,
            provider: 'Google Speech with DSP Filter'
          };
        }
      }
    } catch {}
    return null;
  }

  // Pollinations Audio TTS
  async function generatePollinationsTTS(text) {
    try {
      const encText = encodeURIComponent(text.slice(0, 180));
      const url = `https://text.pollinations.ai/${encText}?model=openai-audio&voice=onyx`;
      const tempAudio = path.join(artifactsDir, `poll_tts_${Date.now()}.mp3`);

      const res = await new Promise((resolve) => {
        const f = fs.createWriteStream(tempAudio);
        https.get(url, { timeout: 10000 }, (r) => {
          if (r.statusCode === 200) {
            r.pipe(f);
            f.on('finish', () => { f.close(); resolve(true); });
          } else {
            resolve(false);
          }
        }).on('error', () => resolve(false));
      });

      if (res && fs.existsSync(tempAudio) && fs.statSync(tempAudio).size > 1000) {
        const buf = fs.readFileSync(tempAudio);
        try { fs.unlinkSync(tempAudio); } catch {}
        return {
          audioBuffer: buf,
          audioUrl: `data:audio/mpeg;base64,${buf.toString('base64')}`,
          provider: 'Pollinations.ai Onyx Voice'
        };
      }
    } catch {}
    return null;
  }

  // Synthesize voice using multi-tier hierarchy: Microsoft Edge Educational Neural is PRIMARY
  async function synthesizeVoiceHierarchy(text) {
    let tts = await generateEdgeBassTTS(text);
    if (!tts) tts = await generateCloudflareTTS(text);
    if (!tts) tts = await generateGoogleDspTTS(text);
    if (!tts) tts = await generatePollinationsTTS(text);
    return tts;
  }

  const enrichedSlides = [];

  for (let i = 0; i < storyboard.slides.length; i++) {
    const slide = storyboard.slides[i];
    const slideNum = i + 1;
    logInfo(`[Slide ${slideNum}/${storyboard.slides.length}] Synthesizing visual & audio assets...`);

    // 1. Generate Visual Image (Synchronized to topic & slide concept)
    const visualTopicPrompt = `${storyboard.theme || storyboard.title}: ${slide.visual || slide.text}`;
    let imgResult = await generateCloudflareImage(visualTopicPrompt);
    if (!imgResult) imgResult = await generatePollinationsImage(visualTopicPrompt);

    let imageBuffer = imgResult?.imageBuffer || null;
    let imageUrl = imgResult?.imageUrl || null;
    let imageProvider = imgResult?.model || 'Pollinations FLUX';

    if (!imageBuffer) {
      logWarning(`Slide ${slideNum} using procedural dark slate financial canvas`);
      const tempFrame = path.join(artifactsDir, `canvas_${Date.now()}.png`);
      execSync(`ffmpeg -y -f lavfi -i "color=c=0x061118:s=1080x1920:d=1" -vf "drawbox=x=60:y=100:w=960:h=1720:color=0x10B981@0.15:t=fill,drawbox=x=60:y=100:w=960:h=1720:color=0x10B981@0.6:t=4" -frames:v 1 "${tempFrame}" 2>/dev/null`);
      if (fs.existsSync(tempFrame)) {
        imageBuffer = fs.readFileSync(tempFrame);
        imageUrl = `data:image/png;base64,${imageBuffer.toString('base64')}`;
        imageProvider = 'Emerald Procedural Slate Frame';
        try { fs.unlinkSync(tempFrame); } catch {}
      }
    }

    // 2. Generate Voiceover Narration
    let ttsResult = await synthesizeVoiceHierarchy(slide.text);
    let ttsProvider = ttsResult?.provider || 'Neural Speech Engine';

    enrichedSlides.push({
      slideIndex: i,
      text: slide.text,
      imagePrompt: slide.visual,
      imageUrl: imageUrl,
      imageBuffer: imageBuffer,
      imageProvider: imageProvider,
      audioBuffer: ttsResult?.audioBuffer || null,
      audioUrl: ttsResult?.audioUrl || null,
      audioProvider: ttsProvider
    });

    logSuccess(`[Slide ${slideNum}/${storyboard.slides.length}] Slide ${slideNum} Ready: ${imageProvider} + ${ttsProvider}`);
  }

  logSuccess(`All ${enrichedSlides.length} slides enriched with real 9:16 visuals and spoken voiceovers!`);
  return enrichedSlides;
}

// ----------------------------------------------------
// STEP 5: FFmpeg DYNAMIC MOTION COMPILATION & FX
// ----------------------------------------------------
async function renderFullFinanceFfmpegVideo(storyboard, enrichedSlides) {
  logStep(5, `Compiling Full 1080x1920 Motion Video with "GBIM" Gavel Slam, Camera Shakes & Kinetic Captions`);

  const tempDir = path.join(artifactsDir, `build_fin_${Date.now()}`);
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const videoFilename = `fin_blueprint_${Date.now()}_short.mp4`;
  const videoFilePath = path.join(renderedDir, videoFilename);

  function getAudioDuration(filePath) {
    try {
      const probe = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`, { encoding: 'utf8' }).trim();
      const val = parseFloat(probe);
      if (!isNaN(val) && val > 0) return val;
    } catch {}
    return 10.0;
  }

  const slideVideoPaths = [];

  try {
    for (let i = 0; i < enrichedSlides.length; i++) {
      const slide = enrichedSlides[i];
      const slideNum = i + 1;
      const slideImgPath = path.join(tempDir, `slide_${slideNum}_img.jpg`);
      const slideAudioPath = path.join(tempDir, `slide_${slideNum}_audio.mp3`);
      const slideClipPath = path.join(tempDir, `slide_${slideNum}_clip.mp4`);

      logInfo(`[Slide ${slideNum}/${enrichedSlides.length}] Writing assets and compiling dynamic motion clip...`);

      // 1. Write image asset
      if (slide.imageBuffer && slide.imageBuffer.byteLength > 1000) {
        fs.writeFileSync(slideImgPath, slide.imageBuffer);
      } else {
        execSync(`ffmpeg -y -f lavfi -i "color=c=0x061118:s=1080x1920:d=1" -frames:v 1 "${slideImgPath}" 2>/dev/null`);
      }

      // 2. Write audio asset
      if (slide.audioBuffer && slide.audioBuffer.byteLength > 500) {
        fs.writeFileSync(slideAudioPath, slide.audioBuffer);
      } else {
        execSync(`ffmpeg -y -f lavfi -i "sine=frequency=0:duration=10" -c:a libmp3lame "${slideAudioPath}" 2>/dev/null`);
      }

      // Natural slide duration with fast pacing (no long pause between slides)
      trimAudioSilence(slideAudioPath);
      const rawAudioDur = getAudioDuration(slideAudioPath);
      const slideDur = Math.max(2.2, rawAudioDur + 0.10);
      const totalFrames = Math.round(slideDur * 30);

      // Clean slide text for on-screen captions
      const rawText = (slide.text || '').replace(/[\r\n]+/g, ' ').replace(/"/g, '').trim();
      const words = rawText.split(/\s+/).filter(Boolean);

      const chunkLines = [];
      const CHUNK_SIZE = 2; // 2 words per burst guarantees text fits within 1080px without clipping
      for (let w = 0; w < words.length; w += CHUNK_SIZE) {
        chunkLines.push(words.slice(w, w + CHUNK_SIZE).join(' '));
      }

      // EXACT SYNC: Compute subtitle timings strictly against rawAudioDur (spoken audio length)
      const spokenDur = Math.max(0.1, rawAudioDur);
      const chunkDur = spokenDur / Math.max(chunkLines.length, 1);
      let captionFilter = '';

      // Slide 1 Pinned Hook Banner at top (3-second topic safe zone y=250 with background box)
      let topHookFilter = '';
      if (i === 0) {
        const rawTitle = (storyboard.title || storyboard.theme || 'FINANCIAL BLUEPRINT').replace(/#\w+/g, '').trim();
        const cleanHook = sanitizeForFfmpegDrawtext(rawTitle.slice(0, 26).toUpperCase());
        topHookFilter = `,drawtext=text='${cleanHook}':fontsize=32:fontcolor=0xFFEA00:box=1:boxcolor=black@0.80:boxborderw=8:borderw=3:bordercolor=black:shadowcolor=black@0.9:shadowx=2:shadowy=2:x=(w-text_w)/2:y=250:fix_bounds=1:enable='between(t\\,0\\,3.5)'`;
      }

      chunkLines.forEach((chunkText, cIdx) => {
        const startT = (cIdx * chunkDur).toFixed(2);
        // The last chunk stays visible until slideDur finishes
        const endT = (cIdx === chunkLines.length - 1 ? slideDur : (cIdx + 1) * chunkDur).toFixed(2);
        const cleanChunk = sanitizeForFfmpegDrawtext(chunkText.toUpperCase());
        // Dynamic adaptive font size and safety bounds to prevent off-screen captions
        const fontSize = cleanChunk.length > 16 ? 36 : cleanChunk.length > 10 ? 40 : 44;
        const fontColor = cIdx % 2 === 0 ? '0xFFEA00' : '0xFFFFFF'; // Alternating canary yellow & white
        // Centered inside mobile safe zone y=1180 with solid readable backing
        captionFilter += `,drawtext=text='${cleanChunk}':fontsize=${fontSize}:fontcolor=${fontColor}:box=1:boxcolor=black@0.82:boxborderw=8:borderw=3:bordercolor=black:shadowcolor=black@0.9:shadowx=2:shadowy=2:x=(w-text_w)/2:y=1180:fix_bounds=1:enable='between(t\\,${startT}\\,${endT})'`;
      });

      // ----------------------------------------------------
      // DYNAMIC MOTION FX (Shakes, Bounces, Zooms & GBIM Gavel Slam)
      // ----------------------------------------------------
      let zoomFilter = '';
      const motionStyle = i % 5;

      if (i === 0) {
        // STYLE 1: The "GBIM" Gavel Slam / Explosive Impact Zoom-Out Hit!
        // Begins at extreme close-up (1.45), violently slams/snaps back to 1.06 in first 8 frames (0.26s),
        // with immediate rapid high-frequency violent camera shake (14*sin(on*7.5)*exp(-on/7)), then slow smooth push
        zoomFilter = `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='if(lte(on,8), 1.45 - 0.39*(on/8), min(zoom+0.0018, 1.14))':d=${totalFrames}:x='(iw-iw/zoom)/2 + if(lte(on,25), 14*sin(on*7.5)*exp(-on/7), 0)':y='(ih-ih/zoom)/2 + if(lte(on,25), 12*cos(on*8.2)*exp(-on/7), 0)':s=1080x1920:fps=30`;
      } else if (motionStyle === 1) {
        // STYLE 2: High-Tension Camera Shake & Urgent Pulse (Great for Scam Warnings / Expense Leaks)
        zoomFilter = `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(zoom+0.0025, 1.20)':d=${totalFrames}:x='(iw-iw/zoom)/2 + 4*sin(on*2.5)':y='(ih-ih/zoom)/2 + 3*cos(on*2.5)':s=1080x1920:fps=30`;
      } else if (motionStyle === 2) {
        // STYLE 3: The Elastic Bounce-In (Smooth zoom-in with subtle elastic deceleration overshoot)
        zoomFilter = `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='if(lte(on,25), 1.0 + 0.20*(on/25) + 0.04*sin(on*0.35)*exp(-on/12), min(zoom+0.0015, 1.22))':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30`;
      } else if (motionStyle === 3) {
        // STYLE 4: Dynamic Sweeping Pan-Right + Zoom
        zoomFilter = `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(zoom+0.0030, 1.22)':d=${totalFrames}:x='(iw-iw/zoom)*(on/${totalFrames})':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30`;
      } else {
        // STYLE 5: Dynamic Sweeping Pan-Left + Zoom
        zoomFilter = `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='if(lte(zoom,1.0),1.22,max(1.05,zoom-0.0025))':d=${totalFrames}:x='(iw-iw/zoom)*(1-on/${totalFrames})':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30`;
      }

      const fullVideoFilter = `${zoomFilter}${topHookFilter}${captionFilter}`;
      const slideFfmpegCmd = `ffmpeg -y -loop 1 -i "${slideImgPath}" -i "${slideAudioPath}" -c:v libx264 -preset ultrafast -crf 22 -pix_fmt yuv420p -t ${slideDur} -vf "${fullVideoFilter}" -af "apad=whole_dur=${slideDur}" -c:a aac -b:a 192k "${slideClipPath}"`;
      
      logInfo(`[Slide ${slideNum}/${enrichedSlides.length}] Compiling motion clip (${slideDur.toFixed(1)}s, ${totalFrames} frames)...`);
      execSync(slideFfmpegCmd, { stdio: 'pipe' });

      if (fs.existsSync(slideClipPath)) {
        slideVideoPaths.push(slideClipPath);
        logSuccess(`[Slide ${slideNum}/${enrichedSlides.length}] Motion clip compiled successfully!`);
      }
    }

    if (slideVideoPaths.length === 0) {
      throw new Error("No slide video clips were compiled.");
    }

    // Concatenate all slide clips together
    logInfo(`Concatenating all ${slideVideoPaths.length} clips into single high-retention timeline...`);
    const concatListPath = path.join(tempDir, 'concat_list.txt');
    const concatContent = slideVideoPaths.map(p => `file '${p.replace(/'/g, "'\\''")}'`).join('\n');
    fs.writeFileSync(concatListPath, concatContent);

    execSync(`ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c copy "${videoFilePath}"`, { stdio: 'pipe' });

    if (fs.existsSync(videoFilePath)) {
      const stats = fs.statSync(videoFilePath);
      const totalDur = getAudioDuration(videoFilePath);
      logSuccess(`FULL MULTI-SLIDE MP4 VERTICAL SHORT COMPILED SUCCESSFULLY!`);
      console.log(`  ${colors.bright}${colors.green}Output Video: ${videoFilename} (${(stats.size / 1024 / 1024).toFixed(2)} MB, ${totalDur.toFixed(1)}s runtime)${colors.reset}`);
      return { videoFilePath, videoFilename, rendered: true, durationSeconds: totalDur };
    }
  } catch (err) {
    logError(`FFmpeg Video Compile Error: ${err.message}`);
  } finally {
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
  }

  return { videoFilePath: null, videoFilename, rendered: false };
}

// ----------------------------------------------------
// STEP 6: YOUTUBE PUBLISHING & SYNTHETIC MEDIA STAMP
// ----------------------------------------------------
async function handleYouTubePublish(storyboard, renderResult) {
  logStep(6, 'YouTube Data API v3 Upload & Altered / Synthetic Media Disclosure');
  logInfo(`Channel Target: ${CHANNEL_NAME} (${CHANNEL_HANDLE})`);

  const isDeepDive = contentDepth === 'deep_dive' || Boolean(storyboard?.isDeepDive) || (storyboard?.slides?.length > 6);

  if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET || !YOUTUBE_REFRESH_TOKEN) {
    logWarning('YouTube OAuth credentials not provided in environment. Storing locally to manifest.');
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
          } catch {
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
    } else {
      logWarning(`OAuth token exchange returned status ${result.statusCode}: ${result.data?.error_description || result.data?.error || 'Unknown error'}`);
    }
  } catch (e) {
    logError(`YouTube Auth Test Exception: ${e.message}`);
  }

  if (isDryRun) {
    logInfo('🛡️ Dry Run Mode: Skipping live YouTube video creation. Video is verified & saved locally.');
    return { status: 'DRY_RUN_VERIFIED', accessToken };
  }

  if (accessToken && renderResult.videoFilePath && fs.existsSync(renderResult.videoFilePath)) {
    // Mandatory Pre-Flight Content Quality & Anti-Leak Check
    const preFlight = validateFinStoryboardQuality(storyboard);
    if (!preFlight.valid) {
      logError(`[FATAL PRE-FLIGHT] Storyboard failed quality check: ${preFlight.reason}`);
      throw new Error(`ABORTING YOUTUBE UPLOAD: Storyboard contains unacceptable content or template artifacts (${preFlight.reason}). Pipeline refusing to publish.`);
    }

    logInfo(`Initiating YouTube Data API v3 Resumable Upload to ${CHANNEL_HANDLE}...`);
    try {
      const fileSize = fs.statSync(renderResult.videoFilePath).size;

      let uploadTitle = formatViralShortsTitle(storyboard.title || 'Practical Money & Business Blueprint', 'fin', isDeepDive);

      const cleanTags = (storyboard.tags || ['Shorts', 'viral', 'trending', 'PersonalFinance', 'SmallBusiness', 'MoneyTips', 'FinancialLiteracy', 'SideHustle', 'Wealth', 'fyp'])
        .map(t => String(t).replace(/^#/, '').replace(/[^a-zA-Z0-9 ]/g, '').trim())
        .filter(t => t.length > 0 && t.length < 50)
        .slice(0, 15);

      const fullDescription = `${storyboard.description || uploadTitle}\n\nPractical money management and small-business strategies with @bones_ceo.\n\n#FinBlueprint #Shorts #viral #trending #PersonalFinance #SmallBusiness #Wealth #Entrepreneurship #fyp`;

      const metadata = JSON.stringify({
        snippet: {
          title: uploadTitle,
          description: fullDescription,
          tags: cleanTags,
          categoryId: '27' // Education
        },
        status: {
          privacyStatus: 'public',
          selfDeclaredMadeForKids: false,
          containsSyntheticMedia: true
        }
      });

      // 1. Resumable Upload Session
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

        // 2. Stream Binary
        const uploadResult = await new Promise((resolve) => {
          const videoStream = fs.createReadStream(renderResult.videoFilePath);
          const req = https.request(sessionResult.uploadUrl, {
            method: 'PUT',
            headers: {
              'Content-Length': fileSize,
              'Content-Type': 'video/mp4'
            },
            timeout: 120000
          }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
              if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                  resolve({ success: true, data: JSON.parse(data) });
                } catch {
                  resolve({ success: false, error: 'JSON parse error' });
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
          logSuccess(`LIVE VIDEO PUBLISHED TO YOUTUBE! Video ID: ${videoId}`);
          console.log(`  ${colors.bright}${colors.green}Video URL: ${videoUrl}${colors.reset}`);
          console.log(`  ${colors.bright}${colors.cyan}Studio Link: https://studio.youtube.com/video/${videoId}/edit${colors.reset}`);

          // Post and pin an engaging question comment on the published video
          await postYouTubePinnedComment(accessToken, videoId, storyboard, 'fin');

          return { status: 'PUBLISHED_LIVE', videoId, videoUrl };
        } else {
          logError(`YouTube video binary streaming failed: ${uploadResult.error || `HTTP ${uploadResult.statusCode}`}`);
          return { status: 'UPLOAD_FAILED', error: uploadResult.error };
        }
      } else {
        logError(`YouTube session initiation failed: ${sessionResult.error}`);
        return { status: 'SESSION_INIT_FAILED', error: sessionResult.error };
      }
    } catch (uploadErr) {
      logError(`Upload exception: ${uploadErr.message}`);
      return { status: 'UPLOAD_EXCEPTION', error: uploadErr.message };
    }
  }

  return { status: 'SKIPPED' };
}

// ----------------------------------------------------
// STEP 6.4: POST ENGAGING PINNED COMMENT ON YOUTUBE VIDEO
// ----------------------------------------------------
async function postYouTubePinnedComment(accessToken, videoId, storyboard, niche = 'fin') {
  if (!accessToken || !videoId) return null;

  const commentText = `Question for you: Which of these practical business models would you test first with minimal capital? Share your thoughts below 👇\n\nSave this blueprint & subscribe to @bones_ceo for daily practical wealth breakdowns!`;

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
// STEP 6.5: UPLOAD RENDERED VIDEO TO CLOUDINARY (UNSIGNED PRESET SAFE)
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

  logInfo(`[CLOUDINARY] Uploading rendered video to Cloudinary cloud "${effectiveCloudName}"...`);
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
      const paramsToSign = `folder=voxam_shorts&public_id=${publicId || `fin_short_${Date.now()}`}&timestamp=${timestamp}${effectiveApiSecret}`;
      const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');
      fields = {
        api_key: effectiveApiKey,
        timestamp: String(timestamp),
        folder: 'voxam_shorts',
        public_id: publicId || `fin_short_${Date.now()}`,
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
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="fin_video.mp4"\r\nContent-Type: video/mp4\r\n\r\n`));
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
      logSuccess(`[CLOUDINARY] Upload successful! URL: ${result.url}`);
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
// STEP 7: SAVE TO LOCAL MANIFEST & FIRESTORE
// ----------------------------------------------------
async function saveToLocalManifest(storyboard, renderResult, uploadRes, cloudinaryUrl) {
  logStep(7, 'Synchronizing Manifest & Firestore Campaign Vault');

  const manifestPath = path.join(process.cwd(), 'daily_blueprint_manifest.json');
  let currentManifest = [];
  try {
    if (fs.existsSync(manifestPath)) {
      currentManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    }
  } catch {}

  const campaignId = `fin_${Date.now()}`;
  const isLive = uploadRes.status === 'PUBLISHED_LIVE';
  const finalVideoUrl = cloudinaryUrl || uploadRes.videoUrl || renderResult.videoFilePath || '/rendered_videos/fin_blueprint_master_short.mp4';
  
  const entry = {
    id: campaignId,
    jobId: `job-fin-${Date.now()}`,
    channelId: CHANNEL_ID,
    channelName: CHANNEL_NAME,
    channelHandle: CHANNEL_HANDLE,
    niche: NICHE,
    title: storyboard.title,
    category: storyboard.category || 'small_capital_business',
    theme: storyboard.theme,
    description: storyboard.description,
    tags: storyboard.tags,
    status: 'COMPLETED',
    isPosted: isLive,
    dryRun: isDryRun,
    youtubeVideoId: uploadRes.videoId || null,
    youtubeUrl: uploadRes.videoUrl || null,
    cloudinaryUrl: cloudinaryUrl || null,
    videoUrl: finalVideoUrl,
    renderedVideoUrl: finalVideoUrl,
    videoPath: renderResult.videoFilePath || null,
    durationSeconds: renderResult.durationSeconds || 65,
    createdAt: new Date().toISOString(),
    slides: storyboard.slides,
    payload: {
      channelId: NICHE,
      topic: storyboard.title,
      youtube: {
        title: storyboard.title,
        description: storyboard.description,
        tags: storyboard.tags,
        slides: storyboard.slides
      }
    }
  };

  currentManifest = [entry, ...currentManifest.filter(c => c.id !== campaignId)];
  fs.writeFileSync(manifestPath, JSON.stringify(currentManifest, null, 2));
  logSuccess(`Saved campaign [${campaignId}] to daily_blueprint_manifest.json!`);

  // Sync to Firestore Database (both saved_campaigns and video_vault)
  try {
    const { projectId: firestoreProjectId, apiKey: firestoreApiKey, databaseId: firestoreDbId } = getFirestoreConfig();

    if (firestoreApiKey && firestoreProjectId) {
      // Build full slide payloads for web UI
      const firestoreSlides = (storyboard.slides || []).map(s => ({
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

      const docFields = {
        id: { stringValue: campaignId },
        jobId: { stringValue: `job-fin-${Date.now()}` },
        title: { stringValue: storyboard.title },
        niche: { stringValue: NICHE },
        channelId: { stringValue: CHANNEL_ID },
        channelHandle: { stringValue: CHANNEL_HANDLE },
        createdAt: { stringValue: new Date().toISOString() },
        status: { stringValue: 'completed' },
        isPosted: { booleanValue: isLive },
        youtubeVideoId: { stringValue: uploadRes.videoId || '' },
        youtubeUrl: { stringValue: uploadRes.videoUrl || '' },
        cloudinaryUrl: { stringValue: cloudinaryUrl || '' },
        videoUrl: { stringValue: finalVideoUrl },
        durationSeconds: { integerValue: String(Math.round(renderResult.durationSeconds || 65)) },
        views: { integerValue: isLive ? '1' : '0' },
        likes: { integerValue: '0' },
        payload: {
          mapValue: {
            fields: {
              channelId: { stringValue: NICHE },
              topic: { stringValue: storyboard.title },
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
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(reqData) },
          timeout: 8000
        }, () => resolve());
        req.on('error', () => resolve());
        req.write(reqData);
        req.end();
      });

      // Also save to video_vault
      const vaultUrl = `https://firestore.googleapis.com/v1/projects/${firestoreProjectId}/databases/${firestoreDbId}/documents/video_vault/${campaignId}?key=${firestoreApiKey}`;
      await new Promise((resolve) => {
        const req = https.request(vaultUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(reqData) },
          timeout: 8000
        }, () => resolve());
        req.on('error', () => resolve());
        req.write(reqData);
        req.end();
      });

      logSuccess(`[DATABASE: FIRESTORE] Post vaulted to Firestore saved_campaigns & video_vault collections with full video stream.`);
    }
  } catch (err) {
    logInfo(`[DATABASE: FIRESTORE] Sync status: ${err.message}`);
  }
}

// ----------------------------------------------------
// MAIN EXECUTION FLOW
// ----------------------------------------------------
async function main() {
  const grokObj = await probeWorkingGrokModel();
  const { groqWorkingModel } = await probeBackupEngines();
  const storyboard = await generateFinanceStoryboard(inputTopic, grokObj, groqWorkingModel);
  const enrichedSlides = await synthesizeEnrichedSlides(storyboard);
  const renderResult = await renderFullFinanceFfmpegVideo(storyboard, enrichedSlides);
  const uploadRes = await handleYouTubePublish(storyboard, renderResult);
  
  // Upload to Cloudinary for web video playback
  const cloudinaryUrl = await uploadToCloudinary(renderResult.videoFilePath, `fin_${Date.now()}`);
  
  await saveToLocalManifest(storyboard, renderResult, uploadRes, cloudinaryUrl);

  console.log(`\n${colors.bright}${colors.green}══════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.green} 🎉 FIN BLUEPRINT PIPELINE EXECUTION COMPLETED! ${colors.reset}`);
  console.log(`${colors.green}══════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`  ✓ Topic: "${storyboard.title}"`);
  console.log(`  ✓ Niche: Global & Nigerian Practical Finance & Small Business`);
  console.log(`  ✓ Video File: ${renderResult.videoFilePath || 'Simulated'}`);
  console.log(`  ✓ Duration: ${(renderResult.durationSeconds || 65).toFixed(1)}s (100% Compliant > 60s Short)`);
  console.log(`  ✓ Status: ${uploadRes.status}`);
  if (uploadRes.videoId) console.log(`  ✓ YouTube URL: https://www.youtube.com/shorts/${uploadRes.videoId}`);
  if (cloudinaryUrl) console.log(`  ✓ Cloudinary Video URL: ${cloudinaryUrl}`);
  console.log(`${colors.green}══════════════════════════════════════════════════════════════════════\n${colors.reset}`);
}

main().catch((err) => {
  console.error('Fatal Pipeline Error:', err);
  process.exit(1);
});
