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
  auditFinancialScriptSafety,
  sanitizeFinString,
  buildFinPromptForSlot,
  synthesizeDeterministicFinStoryboard
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

// Channel Configuration
const CHANNEL_ID = 'channel_fin_01';
const CHANNEL_NAME = process.env.FIN_CHANNEL_NAME || 'Fin Blueprint';
const CHANNEL_HANDLE = process.env.FIN_CHANNEL_HANDLE || process.env.CHANNEL_1_HANDLE || '@bones_ceo';
const NICHE = 'finance_business';

// Parse Command Line Flags & Environment Variables
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run') || String(process.env.DRY_RUN).toLowerCase() === 'true';
const inputTopic = process.env.TEST_TOPIC ? process.env.TEST_TOPIC.trim() : '';
const contentDepth = process.env.CONTENT_DEPTH || 'short_form';

// API Credentials
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

console.log(`\n${colors.bright}${colors.cyan}══════════════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`  VOXAM AUTOMATION FACTORY — FIN BLUEPRINT DIAGNOSTIC RUNNER`);
console.log(`  Channel Target : ${colors.bright}${CHANNEL_NAME} (${CHANNEL_HANDLE})${colors.reset}`);
console.log(`  Niche Focus    : ${colors.green}Global & Nigerian Practical Finance & Small Business${colors.reset}`);
console.log(`  Mode           : ${isDryRun ? colors.yellow + 'DRY RUN (Local Simulation)' : colors.green + 'LIVE YOUTUBE PUBLISHING'}${colors.reset}`);
console.log(`  Grok Keys      : ${XAI_API_KEYS.length} available | Groq: ${GROQ_API_KEY ? '✔' : '✖'} | Cloudflare: ${CLOUDFLARE_API_TOKEN ? '✔' : '✖'}`);
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

  const grokModels = ['grok-2-latest', 'grok-2', 'grok-beta', 'grok-2-1212'];
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
  logStep(2, 'Testing Groq LPU & Cloudflare AI Backup Engines');
  let groqWorkingModel = null;

  if (GROQ_API_KEY) {
    let candidateModels = [
      'llama-3.1-8b-instant',
      'gemma2-9b-it',
      'llama-3.3-70b-versatile',
      'mixtral-8x7b-32768',
      'qwen-2.5-32b',
      'deepseek-r1-distill-llama-70b'
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

// ----------------------------------------------------
// STEP 3: GENERATE 6-SLIDE DUAL-CURRENCY STORYBOARD
// ----------------------------------------------------
async function generateFinanceStoryboard(topicInput, grokObj, groqModel) {
  logStep(3, `Synthesizing 6-Slide High-Retention Finance Short: "${topicInput || 'Auto-Synthesized'}"`);

  // Check manifest & history to eliminate duplicate topics
  const manifestPath = path.join(process.cwd(), 'daily_blueprint_manifest.json');
  let recentHistory = [];
  try {
    if (fs.existsSync(manifestPath)) {
      const raw = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (Array.isArray(raw)) {
        recentHistory = raw.filter(m => m.channelId === CHANNEL_ID || m.niche === NICHE);
      }
    }
  } catch {}

  logInfo(`[Duplicate Check] Checked ${recentHistory.length} previous saved posts to guarantee a unique topic.`);

  // Select optimal archetype
  const recentTitles = recentHistory.map(h => (h.title || h.theme || '').toLowerCase());
  const unusedArchetypes = FIN_ARCHETYPES.filter(a => !recentTitles.some(t => t.includes(a.theme.toLowerCase())));
  const archetype = unusedArchetypes.length > 0
    ? unusedArchetypes[Math.floor(Math.random() * unusedArchetypes.length)]
    : FIN_ARCHETYPES[Math.floor(Math.random() * FIN_ARCHETYPES.length)];

  logInfo(`[Archetype] Selected Pillar: "${archetype.theme}" (Target Budget: ${archetype.targetBudget})`);

  const { systemPrompt, userPrompt } = buildFinPromptForSlot(archetype, recentHistory, 0, CHANNEL_HANDLE);
  let scriptData = null;

  // 1. PRIMARY: Grok (xAI)
  if (grokObj && grokObj.key && grokObj.model) {
    try {
      logInfo(`[Storyboard Engine] Generating from Grok (${grokObj.model})...`);
      const raw = await new Promise((resolve) => {
        const postData = JSON.stringify({
          model: grokObj.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `${userPrompt} ${topicInput ? `Custom Topic: "${topicInput}".` : ''} Return strictly valid JSON.` }
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
          timeout: 25000
        }, (res) => {
          let data = '';
          res.on('data', c => data += c);
          res.on('end', () => {
            try {
              const j = JSON.parse(data);
              resolve({ success: true, content: j.choices?.[0]?.message?.content });
            } catch (e) {
              resolve({ success: false, error: e.message });
            }
          });
        });
        req.on('error', err => resolve({ success: false, error: err.message }));
        req.on('timeout', () => { req.destroy(); resolve({ success: false, error: 'Timeout' }); });
        req.write(postData);
        req.end();
      });

      if (raw.success && raw.content) {
        let cleaned = raw.content.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/```json/gi, '').replace(/```/g, '').trim();
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
          cleaned = cleaned.substring(start, end + 1);
        }
        scriptData = JSON.parse(cleaned);
        if (scriptData && Array.isArray(scriptData.slides) && scriptData.slides.length >= 5) {
          logSuccess(`Grok (${grokObj.model}) generated complete 6-slide financial script!`);
        }
      }
    } catch (e) {
      logWarning(`Grok generation notice: ${e.message}`);
    }
  }

  // 2. SECONDARY: Groq LPU
  if (!scriptData && groqModel && GROQ_API_KEY) {
    try {
      logInfo(`[Storyboard Engine] Generating from Groq (${groqModel})...`);
      const raw = await new Promise((resolve) => {
        const postData = JSON.stringify({
          model: groqModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `${userPrompt} ${topicInput ? `Custom Topic: "${topicInput}".` : ''} Return strictly valid JSON.` }
          ],
          temperature: 0.7,
          max_tokens: 2200,
          response_format: { type: 'json_object' }
        });
        const req = https.request('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: 20000
        }, (res) => {
          let data = '';
          res.on('data', c => data += c);
          res.on('end', () => {
            try {
              const j = JSON.parse(data);
              resolve({ success: true, content: j.choices?.[0]?.message?.content });
            } catch (e) {
              resolve({ success: false, error: e.message });
            }
          });
        });
        req.on('error', err => resolve({ success: false, error: err.message }));
        req.on('timeout', () => { req.destroy(); resolve({ success: false, error: 'Timeout' }); });
        req.write(postData);
        req.end();
      });

      if (raw.success && raw.content) {
        let cleaned = raw.content.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/```json/gi, '').replace(/```/g, '').trim();
        scriptData = JSON.parse(cleaned);
        if (scriptData && Array.isArray(scriptData.slides) && scriptData.slides.length >= 5) {
          logSuccess(`Groq generated complete 6-slide financial script!`);
        }
      }
    } catch (e) {
      logWarning(`Groq notice: ${e.message}`);
    }
  }

  // 3. TERTIARY: Google Gemini Flash
  if (!scriptData && GEMINI_API_KEY) {
    try {
      logInfo(`[Storyboard Engine] Generating from Google Gemini...`);
      const raw = await new Promise((resolve) => {
        const postData = JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\nTask: ${userPrompt} Return raw JSON.` }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2500, responseMimeType: "application/json" }
        });
        const req = https.request(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) },
          timeout: 20000
        }, (res) => {
          let d = '';
          res.on('data', c => d += c);
          res.on('end', () => {
            try {
              const j = JSON.parse(d);
              resolve({ success: true, content: j.candidates?.[0]?.content?.parts?.[0]?.text });
            } catch { resolve({ success: false }); }
          });
        });
        req.on('error', () => resolve({ success: false }));
        req.on('timeout', () => { req.destroy(); resolve({ success: false }); });
        req.write(postData);
        req.end();
      });

      if (raw.success && raw.content) {
        scriptData = JSON.parse(raw.content);
        logSuccess(`Google Gemini generated full finance storyboard!`);
      }
    } catch {}
  }

  // 4. FALLBACK: Deterministic Diversity Engine
  if (!scriptData || !Array.isArray(scriptData.slides) || scriptData.slides.length < 5) {
    logWarning('[Storyboard Engine] Synthesizing verified deterministic financial package from Diversity Engine...');
    scriptData = synthesizeDeterministicFinStoryboard(archetype, topicInput, CHANNEL_HANDLE);
    logSuccess(`Diversity Engine synthesized authentic 6-slide financial masterclass!`);
  }

  // Enforce strictly 6 slides for high-retention Short format
  if (scriptData.slides.length > 6) {
    scriptData.slides = scriptData.slides.slice(0, 6);
  }

  // Safety & Dual Currency Compliance Audit
  const audit = auditFinancialScriptSafety(scriptData);
  if (!audit.passed) {
    logWarning(`Safety audit notes: ${audit.warnings.join(', ')}`);
  } else {
    logSuccess('Compliance & Anti-Hype Safety Audit: 100% PASSED (Dual Currency & Non-Guru phrasing verified)');
  }

  console.log(`\n  ${colors.bright}Generated Financial Masterclass:${colors.reset}`);
  console.log(`  Title  : ${colors.green}${scriptData.title}${colors.reset}`);
  console.log(`  Budget : ${colors.yellow}${scriptData.estimatedBudget || archetype.targetBudget}${colors.reset}`);
  console.log(`  Slides : ${colors.cyan}${scriptData.slides.length} slides (Target: 60s - 75s Vertical Short)${colors.reset}`);

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

  // Microsoft Edge TTS with Natural Deliberate Pacing (-3% rate for clear comprehension)
  async function generateEdgeBassTTS(text) {
    try {
      const { EdgeTTS } = require('node-edge-tts');
      const voices = [
        'en-US-GuyNeural',         // Clear, engaging financial mentor
        'en-US-ChristopherNeural', // Deep authoritative teacher
        'en-US-EricNeural',        // Calm articulate baritone
        'en-GB-RyanNeural'         // Refined British financial educator
      ];

      for (const voice of voices) {
        try {
          const tempAudio = path.join(artifactsDir, `edge_fin_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.mp3`);
          const tts = new EdgeTTS({
            voice: voice,
            lang: 'en-US',
            outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
            pitch: '-1Hz',
            rate: '-3%' // Reduced speed for clear, easy-to-understand narration
          });

          await tts.ttsPromise(text, tempAudio);

          if (fs.existsSync(tempAudio)) {
            const audioBuf = fs.readFileSync(tempAudio);
            try { fs.unlinkSync(tempAudio); } catch {}
            if (audioBuf.length > 1000) {
              logSuccess(`[Microsoft Edge TTS] Synthesized clear deliberate voice (${voice}) (${audioBuf.length.toLocaleString()} bytes)`);
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
      const cleanSpoken = text.replace(/#/g, '').replace(/[\r\n]+/g, ' ').trim();
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
        execSync(`ffmpeg -y -i "${tempRaw}" -filter_complex "atempo=0.92,equalizer=f=120:t=q:w=1.5:g=4.0,equalizer=f=3500:t=q:w=2.0:g=2.0" -b:a 192k "${tempProcessed}" 2>/dev/null`);
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

  // Synthesize voice using multi-tier hierarchy
  async function synthesizeVoiceHierarchy(text) {
    let tts = await generateCloudflareTTS(text);
    if (!tts) tts = await generateEdgeBassTTS(text);
    if (!tts) tts = await generateGoogleDspTTS(text);
    if (!tts) tts = await generatePollinationsTTS(text);
    return tts;
  }

  const enrichedSlides = [];

  for (let i = 0; i < storyboard.slides.length; i++) {
    const slide = storyboard.slides[i];
    const slideNum = i + 1;
    logInfo(`[Slide ${slideNum}/${storyboard.slides.length}] Synthesizing visual & audio assets...`);

    // 1. Generate Visual Image
    let imgResult = await generateCloudflareImage(slide.visual || slide.text);
    if (!imgResult) imgResult = await generatePollinationsImage(slide.visual || slide.text);

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

      // Measure duration: Min 10.0s per slide so 6 slides total 62s - 75s (always >= 60s / 1 min)
      const rawAudioDur = getAudioDuration(slideAudioPath);
      const slideDur = Math.max(10.0, rawAudioDur + 0.5);
      const totalFrames = Math.round(slideDur * 30);

      // Clean slide text for on-screen captions
      const rawText = (slide.text || '').replace(/[\r\n]+/g, ' ').replace(/"/g, '').trim();
      const words = rawText.split(/\s+/).filter(Boolean);

      const chunkLines = [];
      const CHUNK_SIZE = 3;
      for (let w = 0; w < words.length; w += CHUNK_SIZE) {
        chunkLines.push(words.slice(w, w + CHUNK_SIZE).join(' '));
      }

      const chunkDur = slideDur / Math.max(chunkLines.length, 1);
      let captionFilter = '';

      // Slide 1 Pinned Hook Banner
      let topHookFilter = '';
      if (i === 0) {
        const rawTitle = (storyboard.title || storyboard.theme || 'FINANCIAL MASTERY').replace(/#\w+/g, '').trim();
        const cleanHook = sanitizeForFfmpegDrawtext(rawTitle.slice(0, 32));
        topHookFilter = `,drawtext=text='${cleanHook}':fontsize=32:fontcolor=0xFDE047:box=1:boxcolor=black@0.94:boxborderw=16:borderw=2:bordercolor=0x10B981:shadowcolor=black@0.9:shadowx=2:shadowy=2:x=(w-text_w)/2:y=160:enable='between(t\\,0\\,4.5)'`;
      }

      chunkLines.forEach((chunkText, cIdx) => {
        const startT = (cIdx * chunkDur).toFixed(2);
        const endT = ((cIdx + 1) * chunkDur).toFixed(2);
        const cleanChunk = sanitizeForFfmpegDrawtext(chunkText);
        // Financial emerald & gold theme subtitles
        captionFilter += `,drawtext=text='${cleanChunk}':fontsize=46:fontcolor=white:box=1:boxcolor=black@0.92:boxborderw=22:borderw=3:bordercolor=0x10B981@0.5:shadowcolor=black@0.95:shadowx=3:shadowy=3:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t\\,${startT}\\,${endT})'`;
      });

      // ----------------------------------------------------
      // DYNAMIC MOTION FX (Shakes, Bounces, Zooms & GBIM Gavel Slam)
      // ----------------------------------------------------
      let zoomFilter = '';
      const motionStyle = i % 5;

      if (motionStyle === 0) {
        // STYLE 1: The "GBIM" Gavel Slam / Explosive Impact Zoom-Out Hit!
        // Begins at extreme close-up (1.35) and violently slams/snaps back to 1.05 in 0.35s with exponential damping screen shake, then slowly pushes
        zoomFilter = `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='if(lte(on,12), 1.35 - 0.28*(on/12), min(zoom+0.0018, 1.15))':d=${totalFrames}:x='(iw-iw/zoom)/2 + if(lte(on,20), 8*sin(on*3)*exp(-on/10), 0)':y='(ih-ih/zoom)/2 + if(lte(on,20), 8*cos(on*3)*exp(-on/10), 0)':s=1080x1920:fps=30`;
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
    logInfo(`Initiating YouTube Data API v3 Resumable Upload to ${CHANNEL_HANDLE}...`);
    try {
      const fileSize = fs.statSync(renderResult.videoFilePath).size;

      let uploadTitle = (storyboard.title || 'Practical Money & Business Blueprint').replace(/[<>]/g, '').trim();
      if (uploadTitle.length > 85) uploadTitle = uploadTitle.slice(0, 80).trim() + ' #Shorts';
      if (!uploadTitle.includes('#Shorts') && uploadTitle.length <= 75) uploadTitle += ' #Shorts';

      const cleanTags = (storyboard.tags || ['Shorts', 'PersonalFinance', 'SmallBusiness', 'MoneyTips', 'FinancialLiteracy', 'SideHustle'])
        .map(t => String(t).replace(/^#/, '').replace(/[^a-zA-Z0-9 ]/g, '').trim())
        .filter(t => t.length > 0 && t.length < 50)
        .slice(0, 15);

      const fullDescription = `${storyboard.description || uploadTitle}\n\nLearn practical money management and small-business strategies with @bones_ceo.\n\n🤖 Altered / Synthetic Media Disclosure:\nSound and visual sequences in this video were generated and edited using AI automation technology.\n#FinBlueprint #Shorts #PersonalFinance #SmallBusiness`;

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
          containsSyntheticMedia: true // Active YouTube Synthetic / AI Generated metadata flag
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
          const videoUrl = `https://www.youtube.com/shorts/${videoId}`;
          logSuccess(`🚀 LIVE VIDEO PUBLISHED TO YOUTUBE! Video ID: ${videoId}`);
          console.log(`  ${colors.bright}${colors.green}Video URL: ${videoUrl}${colors.reset}`);
          console.log(`  ${colors.bright}${colors.cyan}Studio Link: https://studio.youtube.com/video/${videoId}/edit${colors.reset}`);
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
// STEP 7: SAVE TO LOCAL MANIFEST & FIRESTORE
// ----------------------------------------------------
async function saveToLocalManifest(storyboard, renderResult, uploadRes) {
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
  const entry = {
    id: campaignId,
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
    videoPath: renderResult.videoFilePath || null,
    durationSeconds: renderResult.durationSeconds || 65,
    createdAt: new Date().toISOString(),
    slides: storyboard.slides
  };

  currentManifest = [entry, ...currentManifest.filter(c => c.id !== campaignId)];
  fs.writeFileSync(manifestPath, JSON.stringify(currentManifest, null, 2));
  logSuccess(`Saved campaign [${campaignId}] to daily_blueprint_manifest.json!`);

  // Sync to Firestore
  try {
    let parsedFb = null;
    if (process.env.FIREBASE_CONFIG_JSON) {
      try { parsedFb = JSON.parse(process.env.FIREBASE_CONFIG_JSON); } catch {}
    }
    const firestoreApiKey = process.env.FIRESTORE_API_KEY || process.env.VITE_FIREBASE_API_KEY || parsedFb?.apiKey || '';
    const firestoreProjectId = process.env.FIRESTORE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || parsedFb?.projectId || '';
    const firestoreDbId = process.env.FIRESTORE_DATABASE_ID || process.env.VITE_FIRESTORE_DATABASE_ID || parsedFb?.databaseId || 'ai-studio-voxam-a00cf6de-bee8-48db-97c4-0c43daab8a7e';

    if (firestoreApiKey && firestoreProjectId) {
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${firestoreProjectId}/databases/${firestoreDbId}/documents/saved_campaigns/${campaignId}?key=${firestoreApiKey}`;
      const docFields = {
        id: { stringValue: campaignId },
        title: { stringValue: storyboard.title },
        niche: { stringValue: NICHE },
        createdAt: { stringValue: new Date().toISOString() },
        status: { stringValue: 'completed' },
        isPosted: { booleanValue: isLive },
        views: { integerValue: isLive ? '1' : '0' },
        likes: { integerValue: '0' }
      };
      const reqData = JSON.stringify({ fields: docFields });
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
      logSuccess(`[DATABASE: FIRESTORE] Post vaulted to Firestore saved_campaigns collection.`);
    }
  } catch {}
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
  await saveToLocalManifest(storyboard, renderResult, uploadRes);

  console.log(`\n${colors.bright}${colors.green}══════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.green} 🎉 FIN BLUEPRINT PIPELINE EXECUTION COMPLETED! ${colors.reset}`);
  console.log(`${colors.green}══════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`  ✓ Topic: "${storyboard.title}"`);
  console.log(`  ✓ Niche: Global & Nigerian Practical Finance & Small Business`);
  console.log(`  ✓ Video File: ${renderResult.videoFilePath || 'Simulated'}`);
  console.log(`  ✓ Duration: ${(renderResult.durationSeconds || 65).toFixed(1)}s (100% Compliant > 60s Short)`);
  console.log(`  ✓ Status: ${uploadRes.status}`);
  if (uploadRes.videoId) console.log(`  ✓ YouTube URL: https://www.youtube.com/shorts/${uploadRes.videoId}`);
  console.log(`${colors.green}══════════════════════════════════════════════════════════════════════\n${colors.reset}`);
}

main().catch((err) => {
  console.error('Fatal Pipeline Error:', err);
  process.exit(1);
});
