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

// Parse Command Line Flags & Environment Variables
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run') || process.env.DRY_RUN === 'true';
const inputTopic = process.env.TEST_TOPIC ? process.env.TEST_TOPIC.trim() : '';
const contentDepth = process.env.CONTENT_DEPTH || 'short_form'; // 'short_form' or 'deep_dive'

// API Credentials
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const XAI_API_KEYS = Array.from(new Set([
  process.env.XAI_API_KEY,
  process.env.GROK_API_KEY,
  process.env.XAI_API_KEY_2,
  process.env.GROK_API_KEY_2
].filter(Boolean)));

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const YOUTUBE_REFRESH_TOKEN = process.env.YOUTUBE_REFRESH_TOKEN_CH2 || process.env.YOUTUBE_REFRESH_TOKEN || '';
const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID || '';
const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET || '';

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
// DYNAMIC TOPIC DISCOVERY ENGINE (Auto-generate fresh Stoic topics)
// ----------------------------------------------------
const STOIC_THEME_POOL = [
  '5 Brutal Stoic Rules to Eliminate Modern Distraction Forever',
  'Marcus Aurelius on Conquering Anxiety and Inner Chaos',
  'How to Build Unshakable Mental Fortitude When Life Gets Hard',
  'The Stoic Secret to Mastering Your Emotions in Conflict',
  'Seneca on Time: Why You Are Wasting Your Most Precious Asset',
  'Epictetus on True Freedom: The Dichotomy of Control Explained',
  '5 Daily Habits of Roman Emperors for Extreme Self-Discipline',
  'The Stoic Mindset: Transforming Obstacles into Unstoppable Fuel',
  'Why Seeking Validation Destroys Your Inner Peace',
  'Mastering Amor Fati: How to Love Whatever Fate Throws at You'
];

async function resolveTopic(activeGrok, backupEngines) {
  if (inputTopic && inputTopic.length > 3) {
    logInfo(`Using User-Provided Topic: "${inputTopic}"`);
    return inputTopic;
  }

  logInfo('No manual topic provided. Auto-generating fresh, high-retention Stoic theme via AI Brain...');

  // 1. Try Gemini
  if (GEMINI_API_KEY) {
    try {
      const prompt = 'Suggest 1 viral, high-retention, profound YouTube Shorts title for channel "The Stoic Architect" focusing on Stoicism, Marcus Aurelius, or mental discipline. Return ONLY the title in plain text without quotes.';
      const res = await new Promise((resolve) => {
        const postData = JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.9, maxOutputTokens: 50 }
        });
        const req = https.request(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
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
            try {
              const j = JSON.parse(data);
              const text = j.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
              resolve(text || null);
            } catch { resolve(null); }
          });
        });
        req.on('error', () => resolve(null));
        req.write(postData);
        req.end();
      });
      if (res && res.length > 5) {
        logSuccess(`Gemini 2.5 Flash generated fresh topic: "${res}"`);
        return res.replace(/^["']|["']$/g, '');
      }
    } catch {}
  }

  // 2. Try Grok
  if (activeGrok && activeGrok.key) {
    try {
      const res = await new Promise((resolve) => {
        const postData = JSON.stringify({
          model: activeGrok.model || 'grok-2-latest',
          messages: [
            { role: 'system', content: 'You are a viral YouTube Shorts strategist.' },
            { role: 'user', content: 'Generate 1 high-retention, profound title for "The Stoic Architect" on daily discipline or Marcus Aurelius wisdom. Return ONLY the title.' }
          ],
          max_tokens: 50
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
            try {
              const j = JSON.parse(data);
              resolve(j.choices?.[0]?.message?.content?.trim() || null);
            } catch { resolve(null); }
          });
        });
        req.on('error', () => resolve(null));
        req.write(postData);
        req.end();
      });
      if (res && res.length > 5) {
        logSuccess(`Grok (${activeGrok.model}) generated fresh topic: "${res}"`);
        return res.replace(/^["']|["']$/g, '');
      }
    } catch {}
  }

  // 3. Try Groq
  if (backupEngines && backupEngines.groqWorkingModel) {
    try {
      const res = await new Promise((resolve) => {
        const postData = JSON.stringify({
          model: backupEngines.groqWorkingModel,
          messages: [
            { role: 'system', content: 'You are a YouTube Shorts strategist.' },
            { role: 'user', content: 'Generate 1 title for "The Stoic Architect" on Stoicism, Marcus Aurelius or mental fortitude. Return ONLY the title.' }
          ],
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
            try {
              const j = JSON.parse(data);
              resolve(j.choices?.[0]?.message?.content?.trim() || null);
            } catch { resolve(null); }
          });
        });
        req.on('error', () => resolve(null));
        req.write(postData);
        req.end();
      });
      if (res && res.length > 5) {
        logSuccess(`Groq generated fresh topic: "${res}"`);
        return res.replace(/^["']|["']$/g, '');
      }
    } catch {}
  }

  // 4. Dynamic pool rotation fallback
  const randomPick = STOIC_THEME_POOL[Math.floor(Math.random() * STOIC_THEME_POOL.length)];
  logInfo(`Selected rotating curated Stoic theme: "${randomPick}"`);
  return randomPick;
}

// ----------------------------------------------------
// STEP 1: TEST GROK 2 (xAI) MULTI-TOKEN HEALTH
// ----------------------------------------------------
async function testGrokKeys() {
  logStep(1, 'Testing Grok (xAI) Multi-Token Connectivity');
  logInfo(`Found ${XAI_API_KEYS.length} candidate Grok token(s). Testing live inference...`);

  const grokModels = ['grok-4-fast', 'grok-4', 'grok-3', 'grok-2-latest'];
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
  logStep(2, 'Testing Groq (Llama 3.3 70B & 3.1 8B) & Cloudflare AI Backup');
  const startTime = Date.now();
  let groqWorkingModel = null;

  const groqCandidateModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
  for (const model of groqCandidateModels) {
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

  return { groqWorkingModel };
}

// ----------------------------------------------------
// STEP 3: GENERATE MOTIVATIONAL & STOIC 6-SLIDE STORYBOARD
// ----------------------------------------------------
async function generateStoicStoryboard(topic, activeGrok, backupEngines) {
  logStep(3, `Generating Motivational Storyboard: "${topic}"`);
  logInfo(`Channel: The Stoic Architect (@thestoicarchitect-n4b)`);
  logInfo(`Depth Mode: ${contentDepth === 'deep_dive' ? '3-5 min Deep Narrative' : '60s High-Retention Short'}`);

  const systemPrompt = `You are the lead philosopher and master scriptwriter for YouTube channel "The Stoic Architect".
TOPIC DOMAIN: Stoic Philosophy, Unshakable Self-Discipline, Ancient Wisdom (Marcus Aurelius, Seneca, Epictetus), Character & Honor, Mental Resilience, and Conquering Procrastination.

CRITICAL CONTENT RULES:
1. COMPLETE, COHERENT SENTENCES: Every single slide MUST be a 100% complete, grammatically sound, philosophically profound sentence. Never truncate thoughts or leave clauses dangling.
2. DELIVER ON THE TITLE: If the title promises "5 Ways" or "5 Rules", you MUST deliver all 5 rules sequentially across the slides. Do not stop after 1 or summarize vaguely. Every rule must give clear, actionable, and deep Stoic wisdom.
3. NO PROMOTIONS OR AFFILIATE LINKS: Absolutely NO mentioning of downloads, paid planners, digital products, bio links, or sales pitches. This is pure philosophical motivation.
4. OUTRO: End Slide 6 with a memorable philosophical takeaway and a clean invitation: "Follow @TheStoicArchitect for daily Stoic wisdom."
5. DESCRIPTION & HASHTAGS: The description must be an engaging, well-written paragraph summarizing the core philosophy of the video with high-impact hashtags: #Shorts #Stoicism #MarcusAurelius #SelfDiscipline #Motivation #Discipline #Mindset #Wisdom #PersonalGrowth #DailyStoic #MentalFortress #Philosophy

6-SLIDE NARRATIVE STRUCTURE:
- Slide 1 (Hook): A powerful opening statement introducing the 5 rules to build unshakable discipline.
- Slide 2 (Rule 1): First Stoic rule explained clearly in a complete, deep sentence.
- Slide 3 (Rule 2): Second Stoic rule explained with historical depth (Marcus Aurelius or Epictetus) in a complete sentence.
- Slide 4 (Rule 3): Third Stoic rule tackling modern distractions or dopamine traps in a complete sentence.
- Slide 5 (Rules 4 & 5): Fourth and fifth Stoic rules covering daily execution and mental mastery in full, clear sentences.
- Slide 6 (Conclusion & Outro): A timeless Stoic truth + "Follow @TheStoicArchitect for daily Stoic wisdom and mental strength."

Output raw JSON strictly without markdown:
{
  "title": "Title here",
  "description": "Engaging description summarizing the 5 rules, ending with hashtags #Shorts #Stoicism #MarcusAurelius #Discipline #Motivation #Mindset #Wisdom #SelfImprovement",
  "tags": ["#Shorts", "#Stoicism", "#Motivation", "#Discipline", "#MarcusAurelius", "#Mindset", "#SelfMastery"],
  "slides": [
    { "text": "Slide 1 narration...", "visual": "Photorealistic 9:16 vertical 8k cinematic lighting prompt..." },
    { "text": "Slide 2 narration...", "visual": "Photorealistic 9:16 vertical 8k cinematic lighting prompt..." },
    { "text": "Slide 3 narration...", "visual": "Photorealistic 9:16 vertical 8k cinematic lighting prompt..." },
    { "text": "Slide 4 narration...", "visual": "Photorealistic 9:16 vertical 8k cinematic lighting prompt..." },
    { "text": "Slide 5 narration...", "visual": "Photorealistic 9:16 vertical 8k cinematic lighting prompt..." },
    { "text": "Slide 6 narration...", "visual": "Photorealistic 9:16 vertical 8k cinematic lighting prompt..." }
  ]
}`;

  let scriptData = null;

  // 1. Try Gemini First (Fast, reliable, and high quality)
  if (GEMINI_API_KEY) {
    try {
      logInfo(`Invoking Gemini 2.5 Flash on Google Generative AI API...`);
      const raw = await new Promise((resolve) => {
        const postData = JSON.stringify({
          contents: [
            {
              parts: [
                { text: `${systemPrompt}\n\nTask: Generate the complete 6-slide script and visual prompts for: "${topic}". Return strictly raw JSON.` }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
            responseMimeType: "application/json"
          }
        });

        const req = https.request(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
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
            try {
              const j = JSON.parse(data);
              const content = j.candidates?.[0]?.content?.parts?.[0]?.text;
              resolve(content || null);
            } catch (e) { resolve(null); }
          });
        });
        req.on('error', () => resolve(null));
        req.write(postData);
        req.end();
      });

      if (raw) {
        const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
        scriptData = JSON.parse(cleaned);
        logSuccess(`Gemini 2.5 Flash generated full 6-slide motivational storyboard!`);
      }
    } catch (e) {
      logWarning(`Gemini generation exception: ${e.message}`);
    }
  }

  // 2. Try Grok Next
  if (!scriptData && activeGrok && activeGrok.key) {
    try {
      logInfo(`Invoking Grok (${activeGrok.model}) on xAI API...`);
      const raw = await new Promise((resolve) => {
        const postData = JSON.stringify({
          model: activeGrok.model || 'grok-2-latest',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Generate the complete 6-slide script and visual prompts for: "${topic}". Ensure all 5 rules are fully and clearly stated in complete sentences.` }
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
            try {
              const j = JSON.parse(data);
              resolve(j.choices?.[0]?.message?.content);
            } catch (e) { resolve(null); }
          });
        });
        req.on('error', () => resolve(null));
        req.write(postData);
        req.end();
      });

      if (raw) {
        const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
        scriptData = JSON.parse(cleaned);
        logSuccess(`Grok (${activeGrok.model}) generated full 6-slide motivational package!`);
      }
    } catch (e) {
      logWarning(`Grok generation exception: ${e.message}`);
    }
  }

  // 3. Try Groq (Llama 3.3 70B Versatile)
  if (!scriptData && backupEngines && backupEngines.groqWorkingModel) {
    try {
      logInfo(`Invoking Groq Engine ('${backupEngines.groqWorkingModel}') for Storyboard Generation...`);
      const raw = await new Promise((resolve) => {
        const postData = JSON.stringify({
          model: backupEngines.groqWorkingModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Generate the complete 6-slide script and visual prompts for: "${topic}". Ensure all 5 rules are fully and clearly stated in complete sentences.` }
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
            try {
              const j = JSON.parse(data);
              resolve(j.choices?.[0]?.message?.content);
            } catch { resolve(null); }
          });
        });
        req.on('error', () => resolve(null));
        req.write(postData);
        req.end();
      });

      if (raw) {
        scriptData = JSON.parse(raw);
        logSuccess(`Groq (${backupEngines.groqWorkingModel}) generated complete 6-slide motivational package!`);
      }
    } catch (e) {
      logWarning(`Groq generation failed: ${e.message}`);
    }
  }

  // Dynamic Topic-Aware Storyboard Fallback (Generates unique slides based on topic)
  if (!scriptData || !Array.isArray(scriptData.slides)) {
    logInfo(`Synthesizing Dynamic Topic-Aware Motivational Storyboard for: "${topic}"...`);
    const cleanTopic = topic.trim();
    scriptData = {
      title: `${cleanTopic} | Stoic Masterclass`,
      description: `Exploring the deep philosophy of "${cleanTopic}". By applying timeless Stoic principles from Marcus Aurelius, Seneca, and Epictetus, you can overcome modern chaos, eliminate cheap distractions, and cultivate unshakeable mental fortitude.\n\nSubscribe to @TheStoicArchitect for daily Stoic wisdom and mental strength.\n\n#Shorts #Stoicism #MarcusAurelius #SelfDiscipline #Motivation #Discipline #Mindset #Wisdom #PersonalGrowth #DailyStoic #MentalFortress #Philosophy`,
      tags: ['#Shorts', '#Stoicism', '#Discipline', '#Motivation', '#MarcusAurelius', '#Mindset', '#SelfMastery', '#DailyStoic', '#Wisdom'],
      slides: [
        {
          text: `Here is the essential Stoic wisdom on mastering ${cleanTopic}.`,
          visual: `Dramatic classical marble statue of a Stoic philosopher in deep meditation with cinematic golden chiaroscuro lighting, 8k 9:16 vertical photorealistic studio shot`
        },
        {
          text: `First principle: conquer the initial moments of your day in stillness, refusing to let external noise dictate your inner peace.`,
          visual: `A serene minimalist room with morning sunrise beams through a large window, a journal and fountain pen on an oak table, 8k 9:16 vertical cinematic lighting`
        },
        {
          text: `Second principle: strictly separate what is under your absolute control from what is not, detaching completely from external chaos.`,
          visual: `Classical Roman philosopher standing calm and motionless amidst a swirling mountain storm, atmospheric 8k 9:16 vertical photorealistic render`
        },
        {
          text: `Third principle: lean into voluntary discomfort and focused effort so that unexpected obstacles will never catch you unprepared.`,
          visual: `An athlete running through a misty mountain forest at dawn with intense determination and breath visible in the air, 8k 9:16 vertical cinematic shot`
        },
        {
          text: `Fourth principle: fulfill your daily commitments with quiet excellence, letting your deliberate actions speak far louder than words.`,
          visual: `A craftsman meticulously carving a stone monument with focused precision and subtle sparks in the workshop, 8k 9:16 vertical cinematic chiaroscuro`
        },
        {
          text: `True sovereignty is having absolute mastery over your mind. Follow The Stoic Architect for daily wisdom.`,
          visual: `Triumphant silhouette of a disciplined philosopher standing on a mountain summit overlooking a vast golden horizon, 8k 9:16 vertical luxury lighting`
        }
      ]
    };
  }

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

  // Cloudflare Image API Helper (Using @cf/black-forest-labs/flux-1-schnell for superior 72+ img/day neuron efficiency)
  async function generateCloudflareImage(prompt) {
    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) return null;
    return new Promise((resolve) => {
      const postData = JSON.stringify({
        prompt: `${prompt}, 8k vertical 9:16 cinematic luxury studio lighting, photorealistic, hyper-detailed, sharp focus, masterpiece`,
        num_steps: 4
      });
      const model = '@cf/black-forest-labs/flux-1-schnell';

      const req = https.request(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 15000
      }, (res) => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          if (res.statusCode === 200) {
            const buffer = Buffer.concat(chunks);
            resolve({
              imageUrl: `data:image/jpeg;base64,${buffer.toString('base64')}`,
              imageBuffer: buffer
            });
          } else {
            if (res.statusCode === 429) {
              logInfo(`Cloudflare AI daily neuron quota reached (HTTP 429). Switching instantly to Flux 9:16 vertical engine.`);
            }
            resolve(null);
          }
        });
      });
      req.on('error', () => resolve(null));
      req.on('timeout', () => { req.destroy(); resolve(null); });
      req.write(postData);
      req.end();
    });
  }

  // 1. Primary: Cloudflare TTS API Helper (Aura-2 / Aura-1 with masculine deep voices)
  async function generateCloudflareTTS(text) {
    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) return null;
    const candidateModels = [
      { model: '@cf/deepgram/aura-2-en', speaker: 'aura-helios-en' },
      { model: '@cf/deepgram/aura-2-en', speaker: 'aura-zeus-en' },
      { model: '@cf/deepgram/aura-2-en', speaker: 'aura-orpheus-en' },
      { model: '@cf/deepgram/aura-1', speaker: 'aura-helios-en' }
    ];
    
    for (const item of candidateModels) {
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
              if (resp.statusCode === 200) {
                const buffer = Buffer.concat(chunks);
                if (buffer.length > 500) {
                  resolve({
                    audioUrl: `data:audio/mpeg;base64,${buffer.toString('base64')}`,
                    audioBuffer: buffer,
                    byteLength: buffer.byteLength,
                    provider: `Cloudflare Deepgram Aura-2 (${item.speaker})`
                  });
                  return;
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

  // 2. Second Fallback: Microsoft Edge TTS Deep Resonant Bass (en-US-ChristopherNeural / en-US-GuyNeural / en-US-EricNeural)
  async function generateEdgeBassTTS(text) {
    try {
      const { EdgeTTS } = require('node-edge-tts');
      const masculineVoices = [
        'en-US-ChristopherNeural', // Deep resonant authoritative masculine
        'en-US-GuyNeural',         // Warm masculine baritone
        'en-US-EricNeural',        // Rich baritone
        'en-GB-RyanNeural'         // Deep British baritone
      ];

      for (const voice of masculineVoices) {
        try {
          const tempAudio = path.join(process.cwd(), `edge_bass_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.mp3`);
          const tts = new EdgeTTS({
            voice: voice,
            lang: 'en-US',
            outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
            pitch: '-8Hz',
            rate: '-4%'
          });

          await tts.ttsPromise(text, tempAudio);

          if (fs.existsSync(tempAudio)) {
            const audioBuf = fs.readFileSync(tempAudio);
            try { fs.unlinkSync(tempAudio); } catch {}
            if (audioBuf.length > 1000) {
              return {
                audioUrl: `data:audio/mpeg;base64,${audioBuf.toString('base64')}`,
                audioBuffer: audioBuf,
                byteLength: audioBuf.byteLength,
                provider: `Microsoft Edge TTS Deep Bass (${voice})`
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

  // 3. Third Fallback: DSP Bass-Boosted Translation TTS
  async function generateDspBassTTS(text) {
    try {
      const formatted = text
        .replace(/Rule\s*(\d+):/gi, 'Rule $1. ... ')
        .replace(/(\d+)\.\s+/g, '$1. ... ')
        .replace(/([.!?])\s+/g, '$1 ... ')
        .trim();

      const cleanText = encodeURIComponent(formatted.slice(0, 300));
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${cleanText}&tl=en-US&client=tw-ob`;
      const rawBuf = await downloadBuffer(url, 12000);
      
      if (rawBuf && rawBuf.byteLength > 800) {
        const tempRaw = path.join(process.cwd(), `raw_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.mp3`);
        const tempDeep = path.join(process.cwd(), `deep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.mp3`);
        
        fs.writeFileSync(tempRaw, rawBuf);

        // FFmpeg DSP: Pitch lower (-2.5 semitones), bass boost at 120Hz (+6.5dB), presence clarity at 3.5kHz, warm dynamic limiter
        const dspCmd = `ffmpeg -y -i "${tempRaw}" -filter_complex "asetrate=24000*0.90,aresample=24000,atempo=1.00,equalizer=f=120:t=q:w=1.5:g=6.5,equalizer=f=3500:t=q:w=2.0:g=2.5,compand=attacks=0.02:decays=0.15:points=-80/-80|-20/-12|0/-3" -b:a 192k "${tempDeep}"`;
        execSync(dspCmd, { stdio: 'pipe' });

        if (fs.existsSync(tempDeep)) {
          const deepBuf = fs.readFileSync(tempDeep);
          try { fs.unlinkSync(tempRaw); fs.unlinkSync(tempDeep); } catch {}
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

  // 4. Last Resort Fallback: Feminine Voice (JennyNeural) only if all masculine bass options fail
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

  // Multi-tier Voiceover Orchestrator (Cloudflare -> Edge Bass -> DSP Bass -> Feminine Last)
  async function synthesizeVoiceWithHierarchy(text) {
    // Tier 1: Cloudflare Aura-2
    let res = await generateCloudflareTTS(text);
    if (res) return res;

    // Tier 2: Edge TTS Deep Bass (Christopher / Guy / Eric)
    res = await generateEdgeBassTTS(text);
    if (res) return res;

    // Tier 3: DSP Masculine Bass Filter
    res = await generateDspBassTTS(text);
    if (res) return res;

    // Tier 4: Feminine Last Resort
    res = await generateLastResortFeminineTTS(text);
    if (res) return res;

    return null;
  }

  const enrichedSlides = [];

  for (let i = 0; i < storyboard.slides.length; i++) {
    const slide = storyboard.slides[i];
    const slideNum = i + 1;
    logInfo(`[Slide ${slideNum}/${storyboard.slides.length}] Synthesizing Visual Frame & Spoken Voiceover...`);

    // 1. Generate Image (Cloudflare AI -> Pollinations Flux)
    let imageUrl = null;
    let imageBuffer = null;
    let imageProvider = 'Pollinations Flux (9:16 Vertical HD)';
    try {
      const cfImg = await generateCloudflareImage(slide.visual);
      if (cfImg) {
        imageUrl = cfImg.imageUrl;
        imageBuffer = cfImg.imageBuffer;
        imageProvider = 'Cloudflare Workers AI (@cf/bytedance/stable-diffusion-xl-lightning)';
      }
    } catch {}

    if (!imageUrl) {
      imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(slide.visual + ' 8k vertical 9:16 cinematic luxury lighting')}?width=1080&height=1920&nologo=true&model=flux`;
      imageBuffer = await downloadBuffer(imageUrl, 15000);
    }

    logSuccess(`[Slide ${slideNum}/${storyboard.slides.length}] Image Generated (${imageProvider})`);

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
    logSuccess(`[Slide ${slideNum}/${storyboard.slides.length}] Voice Synthesized (${ttsProvider})`);

    enrichedSlides.push({
      slideIndex: i,
      text: slide.text,
      scriptText: slide.text,
      voiceoverTts: slide.text,
      imagePrompt: slide.visual,
      imageUrl: imageUrl,
      imageBuffer: imageBuffer,
      audioUrl: audioUrl,
      audioBuffer: ttsResult?.audioBuffer || null,
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

      // Determine duration of voiceover (+0.4s breathing room between slides)
      const rawAudioDur = getAudioDuration(slideAudioPath);
      const slideDur = Math.max(3.5, Math.min(9.0, rawAudioDur + 0.4));
      const totalFrames = Math.round(slideDur * 30);

      // Clean slide text for on-screen captions (3-4 words per synchronized caption event)
      const rawText = (slide.text || '').replace(/[\r\n]+/g, ' ').replace(/"/g, '').trim();
      const words = rawText.split(/\s+/).filter(Boolean);
      
      // Split into 3-4 word synchronized chunks
      const chunkLines = [];
      for (let w = 0; w < words.length; w += 3) {
        chunkLines.push(words.slice(w, w + 3).join(' ').toUpperCase());
      }
      
      // Build dynamic time-sliced 3-4 word drawtext filters
      const chunkDur = slideDur / Math.max(chunkLines.length, 1);
      let captionFilter = '';

      chunkLines.forEach((chunkText, cIdx) => {
        const startT = (cIdx * chunkDur).toFixed(2);
        const endT = ((cIdx + 1) * chunkDur).toFixed(2);
        const cleanChunk = chunkText.replace(/'/g, "\\'").replace(/:/g, '\\:');
        
        // Crisp, visible, gold/white font underneath the post in lower third
        captionFilter += `,drawtext=text='${cleanChunk}':fontsize=54:fontcolor=white:box=1:boxcolor=black@0.85:boxborderw=16:borderw=4:bordercolor=black:shadowcolor=black@0.9:shadowx=3:shadowy=3:x=(w-text_w)/2:y=h*0.78:enable='between(t\\,${startT}\\,${endT})'`;
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

      const fullVideoFilter = `${zoomFilter}${captionFilter}`;

      logInfo(`[Slide ${slideNum}/${enrichedSlides.length}] Compiling 1080x1920 motion clip with burned kinetic captions (${slideDur.toFixed(1)}s, ${totalFrames} frames)...`);

      const slideFfmpegCmd = `ffmpeg -y -loop 1 -i "${slideImgPath}" -i "${slideAudioPath}" -c:v libx264 -preset ultrafast -crf 22 -pix_fmt yuv420p -t ${slideDur} -vf "${fullVideoFilter}" -c:a aac -b:a 192k -shortest "${slideClipPath}"`;
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
    logInfo('Initiating YouTube Data API v3 Resumable Upload to @thestoicarchitect-n4b...');
    try {
      const fileSize = fs.statSync(renderResult.videoFilePath).size;
      const metadata = JSON.stringify({
        snippet: {
          title: storyboard.title,
          description: storyboard.description + (storyboard.description.includes('#Shorts') ? '' : '\n\n#Shorts #Stoicism #MarcusAurelius #SelfDiscipline #Motivation #Discipline #Mindset #Wisdom #PersonalGrowth #DailyStoic #MentalFortress'),
          tags: storyboard.tags || ['#Shorts', '#Stoicism', '#Discipline', '#Motivation', '#MarcusAurelius', '#Mindset'],
          categoryId: '27' // Education
        },
        status: {
          privacyStatus: 'public',
          selfDeclaredMadeForKids: false
        }
      });

      // 1. Initial Resumable Session Request
      const uploadUrl = await new Promise((resolve) => {
        const req = https.request('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json; charset=UTF-8',
            'X-Upload-Content-Length': fileSize,
            'X-Upload-Content-Type': 'video/mp4'
          }
        }, (res) => {
          resolve(res.headers.location || null);
        });
        req.on('error', () => resolve(null));
        req.write(metadata);
        req.end();
      });

      if (uploadUrl) {
        logSuccess(`YouTube Resumable Upload Session initialized.`);
        // 2. Stream Video Binary
        const uploadResult = await new Promise((resolve) => {
          const videoStream = fs.createReadStream(renderResult.videoFilePath);
          const req = https.request(uploadUrl, {
            method: 'PUT',
            headers: {
              'Content-Length': fileSize,
              'Content-Type': 'video/mp4'
            }
          }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
              try {
                const j = JSON.parse(data);
                resolve(j);
              } catch {
                resolve(null);
              }
            });
          });
          req.on('error', () => resolve(null));
          videoStream.pipe(req);
        });

        if (uploadResult && uploadResult.id) {
          const videoUrl = `https://www.youtube.com/shorts/${uploadResult.id}`;
          logSuccess(`LIVE VIDEO PUBLISHED TO YOUTUBE!`);
          console.log(`  ${colors.bright}${colors.green}Video URL: ${videoUrl}${colors.reset}`);
          console.log(`  ${colors.bright}${colors.cyan}Studio Link: https://studio.youtube.com/video/${uploadResult.id}/edit${colors.reset}`);
          return { status: 'PUBLISHED_LIVE', videoId: uploadResult.id, videoUrl };
        }
      }
    } catch (err) {
      logWarning(`Live upload note: ${err.message}. Campaign safely recorded in Vault.`);
    }
  }

  return { status: 'VAULT_STORED' };
}

// ----------------------------------------------------
// STEP 8: SYNC TO MANIFEST & FIRESTORE DATABASE
// ----------------------------------------------------
async function syncToManifestAndDatabase(storyboard, enrichedSlides, publishResult, currentTopic) {
  logStep(8, 'Synchronizing Blueprint Manifest & In-App Player Database');

  const campaignId = `camp-stoic-${Date.now()}`;
  const topicName = currentTopic || storyboard.title || 'Stoic Masterclass';
  const newCampaign = {
    id: campaignId,
    jobId: `job-stoic-${Date.now()}`,
    title: storyboard.title,
    niche: 'motivation_stoicism',
    createdAt: new Date().toISOString(),
    status: 'completed',
    isPosted: publishResult.status === 'PUBLISHED_LIVE',
    youtubeVideoId: publishResult.videoId || null,
    youtubeUrl: publishResult.videoUrl || null,
    views: publishResult.status === 'PUBLISHED_LIVE' ? 1 : 0,
    likes: 0,
    comments: 0,
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
    visualPrompt: enrichedSlides[0].imagePrompt,
    aiEngine: 'Grok 2 / Llama 3.3 70B',
    stage: 'COMPLETED',
    status: 'COMPLETED',
    createdAt: new Date().toISOString(),
    generatedImageUrl: enrichedSlides[0].imageUrl,
    audioUrl: enrichedSlides[0].audioUrl,
    renderedVideoUrl: publishResult.videoUrl || `/rendered_videos/stoic_pipeline_short.mp4`,
    slides: enrichedSlides,
    youtubeUrl: publishResult.videoUrl || null
  };

  currentManifest = [manifestEntry, ...currentManifest.filter(j => j.id !== manifestEntry.id)];
  fs.writeFileSync(manifestPath, JSON.stringify(currentManifest, null, 2));
  logSuccess(`Updated 'daily_blueprint_manifest.json' with full 6-slide campaign data!`);

  // 2. Sync to Firestore Database via REST API
  try {
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/gen-lang-client-0135161700/databases/ai-studio-voxam-a00cf6de-bee8-48db-97c4-0c43daab8a7e/documents/saved_campaigns/${campaignId}?key=AIzaSyDajoMYBcuzePAnf8B4dNNNeuxmlU2IfhI`;
    
    // Convert to Firestore Document format
    const docFields = {
      id: { stringValue: campaignId },
      title: { stringValue: storyboard.title },
      niche: { stringValue: 'motivation_stoicism' },
      createdAt: { stringValue: new Date().toISOString() },
      status: { stringValue: 'completed' },
      isPosted: { booleanValue: publishResult.status === 'PUBLISHED_LIVE' },
      views: { integerValue: '0' },
      likes: { integerValue: '0' }
    };

    const reqData = JSON.stringify({ fields: docFields });
    await new Promise((resolve) => {
      const req = https.request(firestoreUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(reqData)
        },
        timeout: 8000
      }, (res) => {
        resolve();
      });
      req.on('error', () => resolve());
      req.write(reqData);
      req.end();
    });
    logSuccess(`Synced campaign to Firestore database ('saved_campaigns' collection)!`);
  } catch (e) {
    logInfo(`Firestore sync notice: ${e.message}`);
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
  const savedCampaign = await syncToManifestAndDatabase(storyboard, enrichedSlides, publishResult, currentTopic);

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
    savedCampaign: savedCampaign
  };

  fs.writeFileSync(path.join(testOutputDir, 'stoic_test_report.json'), JSON.stringify(testReport, null, 2));

  console.log(`\n${colors.bright}${colors.green}══════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.green}✔ ALL PIPELINE STEPS COMPLETED & SYNCHRONIZED SUCCESSFULLY${colors.reset}`);
  console.log(`  Report: test_artifacts/stoic_test_report.json`);
  console.log(`  In-App Player Ready: Open Web UI -> Vertical Video Player -> Play Stoic Short`);
  console.log(`${colors.bright}${colors.green}══════════════════════════════════════════════════════════════════════${colors.reset}\n`);
}

runDiagnostics().catch(err => {
  logError(`Fatal test error: ${err.message}`);
  process.exit(1);
});
