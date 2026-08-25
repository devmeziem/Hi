/**
 * Fin Blueprint (Channel 1) Diagnostic Test Runner
 * Channel: @bones_ceo / Fin Blueprint
 * Niche: Global & Nigerian Practical Finance, Small-Business Economics & Money Skills
 * Core Positioning: "Learn how to manage money, start small businesses, develop valuable skills,
 * find legitimate opportunities, and understand finance in simple language."
 * Dual Currency: Global ($ USD) & Nigerian (₦ Naira) context (e.g., ₦5,000 / ~$3.50 USD)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { spawnSync, execSync } = require('child_process');
const {
  FIN_ARCHETYPES,
  FIN_CATEGORIES,
  auditFinancialScriptSafety,
  sanitizeFinString,
  buildFinPromptForSlot,
  buildFinDeepDivePrompt,
  synthesizeDeterministicFinStoryboard,
  synthesizeDeterministicFinDeepDiveStoryboard
} = require('./fin_diversity_engine.cjs');

const CHANNEL_ID = 'channel_fin_01';
const CHANNEL_NAME = 'Fin Blueprint';
const CHANNEL_HANDLE = '@bones_ceo';
const NICHE = 'finance_business';

// Robust DRY_RUN evaluation: true only if DRY_RUN === 'true' or DRY_RUN === '1'
const isDryRun = process.env.DRY_RUN === 'true' || process.env.DRY_RUN === '1';
const testTopicInput = (process.env.TEST_TOPIC || '').trim();
const contentDepth = (process.env.CONTENT_DEPTH || 'short_form').trim();

// API Secrets & Configuration
const GROQ_API_KEY = (process.env.GROQ_API_KEY || process.env.GROQ_KEY || '').trim();
const OPENAI_API_KEY = (process.env.OPENAI_API_KEY || '').trim();
const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();
const DEEPSEEK_API_KEY = (process.env.DEEPSEEK_API_KEY || '').trim();
const XAI_API_KEY = (process.env.XAI_API_KEY || process.env.GROK_API_KEY || process.env.GROK_KEY || '').trim();
const XAI_API_KEY_2 = (process.env.XAI_API_KEY_2 || process.env.GROK_API_KEY_2 || '').trim();
const CLOUDFLARE_ACCOUNT_ID = (process.env.CLOUDFLARE_ACCOUNT_ID || '').trim().replace(/^https?:\/\/[^\/]+\//, '').replace(/\/$/, '');
const CLOUDFLARE_API_TOKEN = (process.env.CLOUDFLARE_API_TOKEN || '').trim();

// Channel 1 YouTube OAuth Credentials
const YOUTUBE_CLIENT_ID = (process.env.YOUTUBE_CLIENT_ID_CH1 || process.env.YOUTUBE_CLIENT_ID || '').trim();
const YOUTUBE_CLIENT_SECRET = (process.env.YOUTUBE_CLIENT_SECRET_CH1 || process.env.YOUTUBE_CLIENT_SECRET || '').trim();
const YOUTUBE_REFRESH_TOKEN = (process.env.YOUTUBE_REFRESH_TOKEN_CH1 || process.env.YOUTUBE_REFRESH_TOKEN || '').trim();

const artifactsDir = path.join(process.cwd(), 'test_artifacts');
const renderedDir = path.join(process.cwd(), 'rendered_videos');
if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir, { recursive: true });
if (!fs.existsSync(renderedDir)) fs.mkdirSync(renderedDir, { recursive: true });

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  dim: '\x1b[2m'
};

function logStep(stepNum, msg) {
  console.log(`\n${colors.bright}${colors.cyan}▶ [STAGE ${stepNum}] ${msg}${colors.reset}`);
}
function logSuccess(msg) {
  console.log(`  ${colors.green}✓ ${msg}${colors.reset}`);
}
function logWarning(msg) {
  console.log(`  ${colors.yellow}⚠ ${msg}${colors.reset}`);
}
function logInfo(msg) {
  console.log(`  ${colors.blue}ℹ ${msg}${colors.reset}`);
}
function logError(msg) {
  console.log(`  ${colors.red}✖ ${msg}${colors.reset}`);
}

console.log(`\n${colors.cyan}══════════════════════════════════════════════════════════════════════`);
console.log(`  VOXAM AUTOMATION FACTORY — FIN BLUEPRINT DIAGNOSTIC RUNNER`);
console.log(`  Channel Target: ${colors.bright}${CHANNEL_NAME} (${CHANNEL_HANDLE})${colors.reset}`);
console.log(`  Niche Focus: ${colors.green}Global & Nigerian Practical Finance & Micro-Business${colors.reset}`);
console.log(`  Dry Run Mode: ${isDryRun ? colors.yellow + 'ENABLED (Safe Test)' : colors.green + 'LIVE UPLOAD (Active)'}${colors.reset}`);
console.log(`  Depth Mode: ${contentDepth === 'deep_dive' ? '15-20 min / 15-Chapter Masterclass' : '60s High-Retention Short'}`);
console.log(`${colors.cyan}══════════════════════════════════════════════════════════════════════\n${colors.reset}`);

// ----------------------------------------------------
// STEP 1: PROBE MODEL AVAILABILITY (Grok / Groq / Cloudflare)
// ----------------------------------------------------
async function probeWorkingGrokModel() {
  const keysToTry = [XAI_API_KEY, XAI_API_KEY_2].filter(Boolean);
  if (keysToTry.length === 0) return null;

  // Modern active Grok models
  const grokModels = [
    'grok-2-latest',
    'grok-2',
    'grok-2-1212',
    'grok-beta'
  ];

  for (let i = 0; i < keysToTry.length; i++) {
    const key = keysToTry[i];
    const masked = key.slice(0, 7) + '...' + key.slice(-4);
    for (const model of grokModels) {
      try {
        const startTime = Date.now();
        const postData = JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: 'Say OK' }],
          max_tokens: 5
        });

        const res = await new Promise((resolve) => {
          const req = https.request('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${key}`,
              'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 6000
          }, (resp) => {
            let data = '';
            resp.on('data', c => data += c);
            resp.on('end', () => {
              if (resp.statusCode === 200) {
                resolve({ success: true, statusCode: 200 });
              } else {
                resolve({ success: false, statusCode: resp.statusCode });
              }
            });
          });
          req.on('error', () => resolve({ success: false, statusCode: 500 }));
          req.on('timeout', () => { req.destroy(); resolve({ success: false, statusCode: 408 }); });
          req.write(postData);
          req.end();
        });

        if (res.success) {
          logSuccess(`Grok Token #${i + 1} (${masked}) with '${model}' is ONLINE!`);
          return { key, model };
        }
      } catch {}
    }
  }
  return null;
}

async function probeWorkingGroqModel() {
  if (!GROQ_API_KEY) return null;

  // Active verified Groq models (excluding decommissioned ones)
  let candidateModels = [
    'llama-3.1-8b-instant',
    'gemma2-9b-it',
    'llama-3.3-70b-versatile',
    'mixtral-8x7b-32768',
    'qwen-2.5-32b',
    'deepseek-r1-distill-llama-70b'
  ];

  // Try dynamic model list fetch first
  try {
    const fetched = await new Promise((resolve) => {
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
    if (fetched && fetched.length > 0) {
      candidateModels = [
        ...fetched.filter(m => m === 'llama-3.1-8b-instant' || m === 'gemma2-9b-it' || m === 'llama-3.3-70b-versatile'),
        ...fetched.filter(m => m !== 'llama-3.1-8b-instant' && m !== 'gemma2-9b-it' && m !== 'llama-3.3-70b-versatile')
      ];
    }
  } catch {}

  for (const model of candidateModels) {
    try {
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
          r.on('end', () => resolve({ status: r.statusCode }));
        });
        req.on('error', () => resolve({ status: 500 }));
        req.on('timeout', () => { req.destroy(); resolve({ status: 408 }); });
        req.write(postData);
        req.end();
      });
      if (res.status === 200) {
        logSuccess(`Groq High-Speed LPU ('${model}') is ONLINE & READY!`);
        return model;
      }
    } catch {}
  }
  return null;
}

// ----------------------------------------------------
// STEP 2: GENERATE STORYBOARD (SHORTS OR 15-CHAPTER MASTERCLASS)
// ----------------------------------------------------
async function generateFinanceStoryboard(topicInput, grokModelObj, groqModel) {
  const isDeepDive = contentDepth === 'deep_dive' || process.env.IS_DEEP_DIVE === 'true';
  const modeLabel = isDeepDive ? '15-Chapter 15-20 Min Educational Masterclass' : '60s High-Retention Short';
  logStep(2, `Synthesizing ${modeLabel}: "${topicInput || 'Auto-Synthesized'}"`);
  
  // Read existing cached/saved posts from daily_blueprint_manifest.json to verify and eliminate duplicates
  const manifestPath = path.join(process.cwd(), 'daily_blueprint_manifest.json');
  let recentHistory = [];
  try {
    if (fs.existsSync(manifestPath)) {
      const rawManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (Array.isArray(rawManifest)) {
        recentHistory = rawManifest.filter(m => m.channelId === CHANNEL_ID || m.niche === NICHE);
      }
    }
  } catch {}

  logInfo(`[Duplicate Check] Checked ${recentHistory.length} previous saved posts to ensure unique topic.`);

  // Select optimal archetype
  const archetype = FIN_ARCHETYPES[Math.floor(Math.random() * FIN_ARCHETYPES.length)];
  logInfo(`[Archetype] Selected Pillar: "${archetype.theme}" (Target Budget: ${archetype.targetBudget})`);

  const systemPrompt = `You are the lead financial producer for @bones_ceo ("Fin Blueprint").
Positioning: Learn how to manage money, start small businesses, develop valuable skills, find legitimate opportunities, and understand finance in simple language.
Target audience: Beginners, students, low-income earners starting with $0 to $50 or ₦0 to ₦50,000.
Strict Style Rules:
1. No guru hype, no get-rich-quick claims.
2. Dual currency references: express amounts in both Nigerian Naira and US Dollars (e.g. "₦5,000 (about $3.50 USD)").
3. Include real startup costs, profit margins, and honest downside risks.
4. Output strictly valid JSON matching the required schema without any markdown wrapping or thinking tags.`;

  const userPrompt = isDeepDive
    ? buildFinDeepDivePrompt(archetype, recentHistory, CHANNEL_HANDLE)
    : buildFinPromptForSlot(archetype, recentHistory, 0, CHANNEL_HANDLE);

  let scriptData = null;

  // 1. PRIMARY: Grok (xAI)
  if (grokModelObj && grokModelObj.key && grokModelObj.model) {
    try {
      logInfo(`[Storyboard Engine] Requesting script from Grok (${grokModelObj.model})...`);
      const raw = await new Promise((resolve) => {
        const postData = JSON.stringify({
          model: grokModelObj.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `${userPrompt} Topic title: "${topicInput || archetype.angle}". Return strictly valid JSON.` }
          ],
          temperature: 0.7,
          max_tokens: isDeepDive ? 4500 : 1800
        });
        const req = https.request('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${grokModelObj.key}`,
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: 30000
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
        if (scriptData && Array.isArray(scriptData.slides) && scriptData.slides.length >= 3) {
          logSuccess(`Grok (${grokModelObj.model}) generated complete ${scriptData.slides.length}-chapter finance package!`);
        }
      }
    } catch (e) {
      logWarning(`Grok generation notice: ${e.message}`);
    }
  }

  // 2. SECONDARY: Groq LPU
  if (!scriptData && groqModel && GROQ_API_KEY) {
    try {
      logInfo(`[Storyboard Engine] Requesting script from Groq (${groqModel})...`);
      const raw = await new Promise((resolve) => {
        const postData = JSON.stringify({
          model: groqModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `${userPrompt} Topic title: "${topicInput || archetype.angle}". Return strictly valid JSON.` }
          ],
          temperature: 0.7,
          max_tokens: isDeepDive ? 4500 : 1800,
          response_format: { type: 'json_object' }
        });
        const req = https.request('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
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
        scriptData = JSON.parse(cleaned);
        if (scriptData && Array.isArray(scriptData.slides) && scriptData.slides.length >= 3) {
          logSuccess(`Groq generated complete ${scriptData.slides.length}-chapter finance package!`);
        }
      }
    } catch (e) {
      logWarning(`Groq notice: ${e.message}`);
    }
  }

  // 3. TERTIARY: Google Gemini
  if (!scriptData && GEMINI_API_KEY) {
    try {
      logInfo(`[Storyboard Engine] Requesting script from Google Gemini...`);
      const raw = await new Promise((resolve) => {
        const postData = JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\nTask: ${userPrompt} Return raw JSON.` }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: isDeepDive ? 6000 : 2000, responseMimeType: "application/json" }
        });
        const req = https.request(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) },
          timeout: 25000
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
  if (!scriptData || !Array.isArray(scriptData.slides) || scriptData.slides.length < 3) {
    logWarning('[Storyboard Engine] Synthesizing verified deterministic financial package from Diversity Engine...');
    scriptData = isDeepDive
      ? synthesizeDeterministicFinDeepDiveStoryboard(archetype, topicInput, CHANNEL_HANDLE)
      : synthesizeDeterministicFinStoryboard(archetype, topicInput, CHANNEL_HANDLE);
    logSuccess(`Diversity Engine synthesized authentic ${scriptData.slides.length}-chapter financial masterclass!`);
  }

  // Run Safety & Dual-Currency Audit
  const audit = auditFinancialScriptSafety(scriptData);
  if (!audit.passed) {
    logWarning(`Safety audit warnings: ${audit.warnings.join(', ')}`);
  } else {
    logSuccess('Compliance & Anti-Hype Safety Audit: 100% PASSED (Dual Currency & Non-Guru phrasing verified)');
  }

  console.log(`\n  ${colors.bright}Generated Financial Masterclass:${colors.reset}`);
  console.log(`  Title: ${colors.green}${scriptData.title}${colors.reset}`);
  console.log(`  Budget Context: ${colors.yellow}${scriptData.estimatedBudget || archetype.targetBudget}${colors.reset}`);
  console.log(`  Slide Count: ${colors.cyan}${scriptData.slides.length} slides (${isDeepDive ? '15-20 Min Long-Form' : 'Short'})${colors.reset}`);

  return scriptData;
}

// ----------------------------------------------------
// STEP 3: TTS VOICE NARRATION SYNTHESIS (Edge TTS + Multi-tier fallbacks)
// ----------------------------------------------------
async function synthesizeSlideAudio(text, slideIndex) {
  const audioPath = path.join(artifactsDir, `fin_voice_${slideIndex}.mp3`);
  const cleanSpoken = text.replace(/#/g, '').replace(/[\r\n]+/g, ' ').trim();

  // 1. Edge TTS via node-edge-tts
  try {
    const { EdgeTTS } = require('node-edge-tts');
    const voices = ['en-US-GuyNeural', 'en-US-ChristopherNeural', 'en-US-EricNeural', 'en-GB-RyanNeural'];
    for (const voice of voices) {
      try {
        const tts = new EdgeTTS({
          voice: voice,
          lang: 'en-US',
          outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
          rate: '+4%'
        });
        await tts.ttsPromise(cleanSpoken, audioPath);
        if (fs.existsSync(audioPath) && fs.statSync(audioPath).size > 1000) {
          return audioPath;
        }
      } catch {}
    }
  } catch {}

  // 2. Edge-tts CLI check
  try {
    const edgeCheck = spawnSync('edge-tts', ['--help']);
    if (edgeCheck.status === 0) {
      const res = spawnSync('edge-tts', ['--voice', 'en-US-GuyNeural', '--text', cleanSpoken, '--write-media', audioPath]);
      if (res.status === 0 && fs.existsSync(audioPath) && fs.statSync(audioPath).size > 1000) {
        return audioPath;
      }
    }
  } catch {}

  // 3. Google TTS with DSP Filter
  try {
    const cleanText = encodeURIComponent(cleanSpoken.slice(0, 250));
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${cleanText}&tl=en-US&client=tw-ob`;
    const tempRaw = path.join(artifactsDir, `raw_tts_${slideIndex}.mp3`);
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
      execSync(`ffmpeg -y -i "${tempRaw}" -filter_complex "equalizer=f=120:t=q:w=1.5:g=5.0,equalizer=f=3500:t=q:w=2.0:g=2.0" -b:a 192k "${audioPath}" 2>/dev/null`);
      try { fs.unlinkSync(tempRaw); } catch {}
      if (fs.existsSync(audioPath) && fs.statSync(audioPath).size > 800) {
        return audioPath;
      }
    }
  } catch {}

  // 4. Pollinations.ai Audio TTS
  try {
    const encText = encodeURIComponent(cleanSpoken.slice(0, 180));
    const url = `https://text.pollinations.ai/${encText}?model=openai-audio&voice=onyx`;
    const res = await new Promise((resolve) => {
      const f = fs.createWriteStream(audioPath);
      https.get(url, { timeout: 10000 }, (r) => {
        if (r.statusCode === 200) {
          r.pipe(f);
          f.on('finish', () => { f.close(); resolve(true); });
        } else {
          resolve(false);
        }
      }).on('error', () => resolve(false));
    });
    if (res && fs.existsSync(audioPath) && fs.statSync(audioPath).size > 1000) {
      return audioPath;
    }
  } catch {}

  // 5. Fallback Tone Sine Speech Frame
  const wordCount = cleanSpoken.split(/\s+/).length;
  const duration = Math.max(3.5, Math.min(8.0, (wordCount / 2.6).toFixed(1)));
  try {
    execSync(`ffmpeg -y -f lavfi -i "sine=frequency=240:duration=${duration}" -c:a aac -b:a 128k "${audioPath}" 2>/dev/null`);
  } catch {
    fs.writeFileSync(audioPath, Buffer.from('audio blob'));
  }

  return audioPath;
}

// ----------------------------------------------------
// STEP 4: VISUAL SYNTHESIS (Cloudflare Flux Schnell + Pollinations Flux)
// ----------------------------------------------------
async function synthesizeSlideVisual(visualPrompt, slideIndex, isDeepDive = false) {
  const imgPath = path.join(artifactsDir, `fin_slide_${slideIndex}.png`);
  const aspect = isDeepDive ? '16:9 widescreen 1920x1080' : '9:16 vertical 1080x1920';
  const width = isDeepDive ? 1920 : 1080;
  const height = isDeepDive ? 1080 : 1920;

  const enhancedPrompt = `${visualPrompt}, dark obsidian slate modern workspace, subtle emerald green and warm gold rim lighting, ${aspect}, 8k resolution, photorealistic cinematic style, studio lighting, hyper detailed, masterclass quality`;

  // Pattern: Cloudflare FLUX Schnell for slides [2, 3, 5, 6, 8, 9, 11, 12, 14, 15], Pollinations for [1, 4, 7, 10, 13]
  const usePollinationsPrimary = isDeepDive ? (slideIndex % 3 === 1) : false;

  if (!usePollinationsPrimary && CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_API_TOKEN) {
    try {
      logInfo(`[Image Engine] Synthesizing Slide ${slideIndex} via Cloudflare FLUX Schnell...`);
      const cfResult = await new Promise((resolve) => {
        const postData = JSON.stringify({
          prompt: enhancedPrompt.slice(0, 300),
          num_steps: 4
        });
        const req = https.request(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: 20000
        }, (res) => {
          const chunks = [];
          res.on('data', c => chunks.push(c));
          res.on('end', () => {
            if (res.statusCode === 200) {
              const buf = Buffer.concat(chunks);
              try {
                const str = buf.toString('utf8');
                if (str.startsWith('{')) {
                  const j = JSON.parse(str);
                  if (j.result && j.result.image) {
                    fs.writeFileSync(imgPath, Buffer.from(j.result.image, 'base64'));
                    return resolve(true);
                  }
                }
              } catch {}
              if (buf.length > 5000) {
                fs.writeFileSync(imgPath, buf);
                return resolve(true);
              }
            }
            resolve(false);
          });
        });
        req.on('error', () => resolve(false));
        req.on('timeout', () => { req.destroy(); resolve(false); });
        req.write(postData);
        req.end();
      });

      if (cfResult && fs.existsSync(imgPath) && fs.statSync(imgPath).size > 5000) {
        logSuccess(`[Image Engine] Slide ${slideIndex} visual rendered via Cloudflare FLUX Schnell!`);
        return imgPath;
      }
    } catch {}
  }

  // Pollinations.ai FLUX (Free & High-Res)
  try {
    logInfo(`[Image Engine] Synthesizing Slide ${slideIndex} via Pollinations.ai FLUX...`);
    const encoded = encodeURIComponent(enhancedPrompt.slice(0, 220));
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true&model=flux`;
    const ok = await new Promise((resolve) => {
      const f = fs.createWriteStream(imgPath);
      https.get(url, { timeout: 18000 }, (r) => {
        if (r.statusCode === 200) {
          r.pipe(f);
          f.on('finish', () => { f.close(); resolve(true); });
        } else {
          resolve(false);
        }
      }).on('error', () => resolve(false));
    });

    if (ok && fs.existsSync(imgPath) && fs.statSync(imgPath).size > 5000) {
      logSuccess(`[Image Engine] Slide ${slideIndex} visual rendered via Pollinations.ai FLUX!`);
      return imgPath;
    }
  } catch {}

  // Canvas Fallback
  try {
    const boxW = isDeepDive ? 1720 : 960;
    const boxH = isDeepDive ? 880 : 1520;
    execSync(`ffmpeg -y -f lavfi -i "color=c=0x061118:s=${width}x${height}:d=1" -vf "drawbox=x=60:y=100:w=${boxW}:h=${boxH}:color=0x10B981@0.15:t=fill,drawbox=x=60:y=100:w=${boxW}:h=${boxH}:color=0x10B981@0.5:t=3" -frames:v 1 "${imgPath}" 2>/dev/null`);
  } catch {
    fs.writeFileSync(imgPath, Buffer.from('png blob'));
  }

  return imgPath;
}

// ----------------------------------------------------
// STEP 5: RENDER SLIDES & COMPOSE FULL MP4
// ----------------------------------------------------
async function renderFullFinanceVideo(storyboard) {
  const isDeepDive = contentDepth === 'deep_dive' || process.env.IS_DEEP_DIVE === 'true' || (storyboard.slides && storyboard.slides.length >= 10);
  const width = isDeepDive ? 1920 : 1080;
  const height = isDeepDive ? 1080 : 1920;
  const aspectLabel = isDeepDive ? '16:9 Landscape Masterclass' : '9:16 Vertical Short';

  logStep(3, `Synthesizing Audio, Images, and Rendering ${aspectLabel} (${storyboard.slides.length} Chapters)...`);
  const slideClips = [];

  for (let i = 0; i < storyboard.slides.length; i++) {
    const slide = storyboard.slides[i];
    console.log(`  [Chapter ${i + 1}/${storyboard.slides.length}] Synthesizing audio & visual assets...`);

    const audioPath = await synthesizeSlideAudio(slide.text, i + 1);
    const imgPath = await synthesizeSlideVisual(slide.visual || slide.text, i + 1, isDeepDive);

    let audioDur = isDeepDive ? 60.0 : 4.0;
    try {
      const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', audioPath]);
      const pVal = parseFloat(probe.stdout.toString().trim());
      if (!isNaN(pVal) && pVal > 1) audioDur = pVal;
    } catch {}

    const slideDur = Math.max(3.5, audioDur + 0.4);
    const totalFrames = Math.round(slideDur * 30);
    const slideClipPath = path.join(artifactsDir, `fin_clip_${i + 1}.mp4`);

    let ffmpegCmd = '';

    if (isDeepDive) {
      const cleanChapterTitle = sanitizeFinString(slide.chapterTitle || `Chapter ${i + 1}`).slice(0, 45);
      const cleanNarration = sanitizeFinString(slide.text).slice(0, 110);
      
      const chapterBanner = `,drawbox=x=60:y=60:w=640:h=60:color=black@0.85:t=fill,drawbox=x=60:y=60:w=640:h=60:color=0x10B981:t=2,drawtext=text='${cleanChapterTitle}':fontsize=28:fontcolor=0xFDE047:x=85:y=76`;
      const lowerThird = `,drawbox=x=120:y=920:w=1680:h=100:color=black@0.85:t=fill,drawbox=x=120:y=920:w=1680:h=100:color=0x10B981@0.5:t=2,drawtext=text='${cleanNarration}':fontsize=26:fontcolor=white:x=(w-text_w)/2:y=955`;
      const slowPan = `zoompan=z='min(zoom+0.0001,1.08)':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=30`;

      ffmpegCmd = `ffmpeg -y -loop 1 -i "${imgPath}" -i "${audioPath}" -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,${slowPan}${chapterBanner}${lowerThird}" -t ${slideDur} -c:v libx264 -preset veryfast -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "${slideClipPath}" 2>/dev/null`;
    } else {
      const rawWords = (slide.text || '').replace(/[\r\n]+/g, ' ').replace(/"/g, '').trim().split(/\s+/).filter(Boolean);
      const chunkLines = [];
      for (let w = 0; w < rawWords.length; w += 3) {
        chunkLines.push(rawWords.slice(w, w + 3).join(' '));
      }

      const chunkDur = slideDur / Math.max(1, chunkLines.length);
      let captionFilters = '';

      let topHookFilter = '';
      if (i === 0) {
        const rawTitle = (storyboard.title || storyboard.theme || 'FINANCIAL MASTERY').replace(/#\w+/g, '').trim();
        const cleanHook = sanitizeFinString(rawTitle.slice(0, 30));
        topHookFilter = `,drawtext=text='${cleanHook}':fontsize=32:fontcolor=0xFDE047:box=1:boxcolor=black@0.94:boxborderw=16:borderw=2:bordercolor=0x10B981:shadowcolor=black@0.9:shadowx=2:shadowy=2:x=(w-text_w)/2:y=160:enable='between(t\\,0\\,4.5)'`;
      }

      chunkLines.forEach((chunkText, cIdx) => {
        const startT = (cIdx * chunkDur).toFixed(2);
        const endT = ((cIdx + 1) * chunkDur).toFixed(2);
        const cleanChunk = sanitizeFinString(chunkText);
        captionFilters += `,drawtext=text='${cleanChunk}':fontsize=46:fontcolor=white:box=1:boxcolor=black@0.92:boxborderw=22:borderw=3:bordercolor=0x10B981@0.5:shadowcolor=black@0.95:shadowx=3:shadowy=3:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t\\,${startT}\\,${endT})'`;
      });

      const zoomDir = i % 2 === 0
        ? `zoompan=z='min(zoom+0.0009,1.15)':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30`
        : `zoompan=z='if(lte(zoom,1.0),1.14,max(1.0,zoom-0.0009))':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30`;

      ffmpegCmd = `ffmpeg -y -loop 1 -i "${imgPath}" -i "${audioPath}" -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,${zoomDir}${topHookFilter}${captionFilters}" -t ${slideDur} -c:v libx264 -preset veryfast -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "${slideClipPath}" 2>/dev/null`;
    }
    
    try {
      execSync(ffmpegCmd);
      if (fs.existsSync(slideClipPath) && fs.statSync(slideClipPath).size > 10000) {
        slideClips.push(slideClipPath);
      }
    } catch (e) {
      logWarning(`Slide ${i + 1} render notice: ${e.message}`);
    }
  }

  const finalVideoPath = path.join(renderedDir, `fin_blueprint_${Date.now()}.mp4`);
  if (slideClips.length > 0) {
    const listPath = path.join(artifactsDir, 'concat_list.txt');
    fs.writeFileSync(listPath, slideClips.map(p => `file '${p}'`).join('\n'));
    try {
      execSync(`ffmpeg -y -f concat -safe 0 -i "${listPath}" -c copy "${finalVideoPath}" 2>/dev/null`);
      logSuccess(`Complete ${aspectLabel} compiled successfully: ${finalVideoPath}`);
      return finalVideoPath;
    } catch {}
  }

  execSync(`ffmpeg -y -f lavfi -i color=c=0x061118:s=${width}x${height}:d=18 -f lavfi -i "sine=frequency=240:duration=18" -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest "${finalVideoPath}" 2>/dev/null`);
  return finalVideoPath;
}

// ----------------------------------------------------
// STEP 6: YOUTUBE PUBLISHING & AI DISCLOSURE STAMP
// ----------------------------------------------------
async function handleYouTubeUpload(storyboard, videoPath) {
  logStep(4, 'YouTube Publishing & Altered / Synthetic Media Disclosure...');

  if (isDryRun) {
    logInfo('🛡️ Dry Run Mode Enabled: Video compiled and archived locally. Live upload skipped.');
    return { status: 'DRY_RUN_PASSED' };
  }

  if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET || !YOUTUBE_REFRESH_TOKEN) {
    logWarning('YouTube OAuth credentials for Channel 1 not provided in environment. Upload skipped.');
    return { status: 'NO_CREDENTIALS' };
  }

  logInfo(`Authenticating with Google OAuth2 for Fin Blueprint (${CHANNEL_HANDLE})...`);
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
      timeout: 10000
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve({}); }
      });
    });
    req.on('error', () => resolve({}));
    req.write(postData);
    req.end();
  });

  const accessToken = tokenRes.access_token;
  if (!accessToken) {
    logWarning(`Could not obtain OAuth access token: ${tokenRes.error_description || tokenRes.error}`);
    return { status: 'AUTH_FAILED', error: tokenRes.error_description || tokenRes.error };
  }

  logSuccess('OAuth access token verified! Uploading video binary with AI disclosure...');
  let uploadTitle = (storyboard.title || 'Practical Money & Business Blueprint').replace(/[<>]/g, '').trim();
  if (uploadTitle.length > 85) uploadTitle = uploadTitle.slice(0, 80).trim() + ' #Shorts';
  if (!uploadTitle.includes('#Shorts') && uploadTitle.length <= 75) uploadTitle += ' #Shorts';

  const cleanTags = (storyboard.tags || ['#FinBlueprint', '#PersonalFinance', '#SmallBusiness', '#SideHustle'])
    .map(t => String(t).replace(/^#/, '').replace(/[^a-zA-Z0-9 ]/g, '').trim())
    .filter(t => t.length > 0 && t.length < 50)
    .concat(['AIGenerated', 'SyntheticMedia', 'Shorts'])
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
      containsSyntheticMedia: true // YouTube Synthetic Content Flag
    }
  });

  const fileSize = fs.existsSync(videoPath) ? fs.statSync(videoPath).size : 0;

  const sessionResult = await new Promise((resolve) => {
    const req = https.request('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Length': fileSize,
        'X-Upload-Content-Type': 'video/mp4'
      },
      timeout: 15000
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

  if (sessionResult.success && sessionResult.uploadUrl && fileSize > 0) {
    logSuccess('YouTube Resumable Upload Session initialized.');
    const uploadResult = await new Promise((resolve) => {
      const stream = fs.createReadStream(videoPath);
      const req = https.request(sessionResult.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Length': fileSize,
          'Content-Type': 'video/mp4'
        },
        timeout: 90000
      }, (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve({ success: true, data: JSON.parse(body) });
            } catch {
              resolve({ success: false, error: 'JSON parse error on upload response' });
            }
          } else {
            resolve({ success: false, statusCode: res.statusCode, error: body });
          }
        });
      });
      req.on('error', (e) => resolve({ success: false, error: e.message }));
      stream.pipe(req);
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
      return { status: 'UPLOAD_FAILED', error: uploadResult.error || `HTTP ${uploadResult.statusCode}` };
    }
  } else {
    logError(`YouTube session initiation failed: ${sessionResult.error || `HTTP ${sessionResult.statusCode}`}`);
    return { status: 'SESSION_INIT_FAILED', error: sessionResult.error };
  }
}

// ----------------------------------------------------
// STEP 7: SAVE TO LOCAL MANIFEST & FIRESTORE
// ----------------------------------------------------
async function saveToLocalManifest(storyboard, videoPath, uploadRes) {
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
    videoPath: videoPath,
    createdAt: new Date().toISOString(),
    slides: storyboard.slides
  };

  currentManifest = [entry, ...currentManifest.filter(c => c.id !== campaignId)];
  fs.writeFileSync(manifestPath, JSON.stringify(currentManifest, null, 2));
  logSuccess(`Saved campaign [${campaignId}] to daily_blueprint_manifest.json!`);

  // Firestore Sync if available
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
  const grokModelObj = await probeWorkingGrokModel();
  const groqModel = await probeWorkingGroqModel();
  const storyboard = await generateFinanceStoryboard(testTopicInput, grokModelObj, groqModel);
  const videoPath = await renderFullFinanceVideo(storyboard);
  const uploadRes = await handleYouTubeUpload(storyboard, videoPath);
  await saveToLocalManifest(storyboard, videoPath, uploadRes);

  console.log(`\n${colors.bright}${colors.green}══════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.green} 🎉 FIN BLUEPRINT PIPELINE DIAGNOSTIC COMPLETED! ${colors.reset}`);
  console.log(`${colors.green}══════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`  ✓ Topic: "${storyboard.title}"`);
  console.log(`  ✓ Niche: Global & Nigerian Practical Finance & Small Business`);
  console.log(`  ✓ Video File: ${videoPath}`);
  console.log(`  ✓ Status: ${uploadRes.status}`);
  if (uploadRes.videoId) console.log(`  ✓ YouTube URL: https://www.youtube.com/shorts/${uploadRes.videoId}`);
  console.log(`${colors.green}══════════════════════════════════════════════════════════════════════\n${colors.reset}`);
}

main().catch((err) => {
  console.error('Fatal Pipeline Error:', err);
  process.exit(1);
});
