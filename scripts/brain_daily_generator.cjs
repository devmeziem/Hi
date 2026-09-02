/**
 * 01 - The Brain: Daily Blueprint Generator
 * Initial / Primary: Grok 2 (xAI) for intelligent persona analysis and script creation.
 * Backup 1: Cloudflare Workers AI (Llama 3.3 70B / DeepSeek).
 * Secondary: Groq LPU (Llama 3.3 70B) and Deterministic Persona Templates.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const {
  fetchRecentHistoryFromFirestore,
  saveContentHistoryToFirestore,
  selectDailyDiverseSlots,
  buildStoicPromptForSlot,
  isTopicSimilarToHistory,
  formatViralShortsTitle
} = require('./stoic_diversity_engine.cjs');
const { discoverAndSelectTopicViaActiveAi } = require('./topic_discovery_engine.cjs');

const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();
const OPENAI_API_KEY = (process.env.OPENAI_API_KEY || '').trim();
const DEEPSEEK_API_KEY = (process.env.DEEPSEEK_API_KEY || '').trim();
const XAI_API_KEYS = Array.from(new Set([
  process.env.XAI_API_KEY,
  process.env.GROK_API_KEY,
  process.env.XAI_API_KEY_2,
  process.env.GROK_API_KEY_2,
  process.env.GROK_KEY
].filter(Boolean))).map(k => k.trim());
const CLOUDFLARE_ACCOUNT_ID = (process.env.CLOUDFLARE_ACCOUNT_ID || '').trim().replace(/^https?:\/\/[^\/]+\//, '').replace(/\/$/, '');
const CLOUDFLARE_API_TOKEN = (process.env.CLOUDFLARE_API_TOKEN || '').trim();
const GROQ_API_KEY = (process.env.GROQ_API_KEY || '').trim();

// Track generated topics for strict deduplication
const generatedTopicHistory = new Set();

function isDuplicateTopic(newTopic) {
  if (!newTopic) return true;
  const normalizedNew = newTopic.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
  const wordsNew = new Set(normalizedNew.split(/\s+/).filter(w => w.length > 3));

  for (const prev of generatedTopicHistory) {
    const normalizedPrev = prev.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
    if (normalizedNew === normalizedPrev) return true;
    
    // Check word overlap (> 65% overlap = duplicate)
    const wordsPrev = normalizedPrev.split(/\s+/).filter(w => w.length > 3);
    if (wordsNew.size > 0 && wordsPrev.length > 0) {
      let matches = 0;
      for (const w of wordsPrev) {
        if (wordsNew.has(w)) matches++;
      }
      const overlap = matches / Math.max(wordsNew.size, wordsPrev.length);
      if (overlap > 0.65) return true;
    }
  }
  return false;
}

const NICHES = [
  {
    id: 'finance_saas',
    channelName: 'Fin Blueprint (@bones_ceo)',
    displayName: 'Fin Blueprint',
    slots: [
      {
        formatType: 'side_hustle',
        topic: 'How to Start a High-Demand Side Hustle with Low Capital',
        hook: 'How to start a small side hustle that can boom with minimal friction',
        research: 'Local B2B WhatsApp digital catalog coordination & invoice tracking for small shops',
        action: 'Setup 1-page digital order forms for local retailers with zero upfront inventory',
        takeaway: 'Secure 3 local business retainers for steady cash flow. Link in bio for starter guide.',
        visualDetail: 'Professional entrepreneur in smart casual attire presenting a clean digital financial roadmap on tablet, 8k 9:16 vertical photorealistic'
      },
      {
        formatType: 'finance_news_poll',
        topic: 'Finance News: High-Yield Digital Vaults vs Inflation',
        hook: 'Latest breaking finance news on high-yield fintech savings rates',
        research: 'Fintech automated vaults offering 15-18% APY to outpace standard bank deposits',
        action: 'Comparing liquid digital vaults versus traditional 1.5% fixed bank accounts',
        takeaway: 'Option A: Save in digital vaults, or Option B: Reinvest in side hustle? Drop your vote below!',
        visualDetail: 'Modern sleek financial news studio broadcast backdrop with glowing green market indices and digital ticker, 8k 9:16 vertical photorealistic'
      },
      {
        formatType: 'realistic_story',
        topic: 'True Story: Starting with ₦10,000 to a 6-Figure Monthly Cashflow',
        hook: 'Realistic case study of starting with little funds and scaling big revenue',
        research: 'David started with ₦10,000 for mobile data, designing digital menus for 3 bakeries',
        action: 'Reinvested 100% of early profits into local delivery coordination without debt',
        takeaway: 'Start with what you have, keep overhead near zero, and compound daily.',
        visualDetail: 'Focused young entrepreneur working diligently on smartphone at clean wooden desk with morning sunlight, 8k 9:16 vertical photorealistic'
      },
      {
        formatType: 'wealth_discipline',
        topic: '4 Financial Habits That Separate Wealth Builders from the Broke',
        hook: 'Core money management habits for growing sustainable long-term wealth',
        research: 'The 50/30/20 rule customized for volatile income and mandatory emergency buffers',
        action: 'Automate first 20% of all incoming revenue into untouchable growth reserves',
        takeaway: 'Financial freedom is built on daily habits, not luck. Follow for daily financial blueprints.',
        visualDetail: 'Clean aesthetic personal finance budgeting dashboard with emerald savings metrics and structured balance sheet, 8k 9:16 vertical'
      }
    ]
  },
  {
    id: 'motivation_stoicism',
    channelName: 'The Stoic Architect (@thestoicarchitect-n4b)',
    displayName: 'The Stoic Architect',
    slots: [
      {
        formatType: 'discipline_mastery',
        topic: 'How to Build Discipline When You Have Zero Motivation',
        hook: 'Motivation is an emotion. Discipline is a non-negotiable contract with yourself.',
        theme: 'Eliminating Mood-Based Action & Executing Without Waiting to Feel Ready',
        visualDetail: 'Cinematic modern minimalist workspace at dawn, focused silhouette executing deep work in high-contrast morning light, 8k 9:16 vertical photorealistic'
      },
      {
        formatType: 'disrespect_immunity',
        topic: 'The Stoic Rule for Dealing with Disrespect Calmly',
        hook: 'When someone disrespects you, your silence is far more dangerous than anger.',
        theme: 'Emotional Sovereignty & The 5-Second Pause Against Provocation',
        visualDetail: 'Composed professional standing calm and unshakable in a busy city environment, sharp cinematic focus, 8k 9:16 vertical'
      },
      {
        formatType: 'silencing_overthinking',
        topic: 'How to Silence Late-Night Overthinking and Anxiety',
        hook: 'Overthinking is your brain inventing emergencies that will never actually happen.',
        theme: 'Present-Moment Grounding & Breaking the Mental Spiral with Action',
        visualDetail: 'Moody cinematic shot of hands writing clearly in a sleek notebook under focused warm desk lamp, 8k 9:16 vertical'
      },
      {
        formatType: 'rebuilding_after_failure',
        topic: 'How to Rebuild Your Life When Everything Falls Apart',
        hook: 'Hitting rock bottom gives you the firmest foundation to rebuild.',
        theme: 'Radical Acceptance & Systematic Step-by-Step Rebuilding',
        visualDetail: 'Solitary figure standing on a rain-slicked modern terrace overlooking a twilight cityscape with steely resolve, 8k 9:16 vertical'
      }
    ]
  },
  {
    id: 'tech_ai',
    channelName: 'Godswill Isaac (@bonesceo)',
    displayName: 'Godswill Isaac',
    slots: [
      {
        formatType: 'ai_benchmark',
        topic: 'DeepSeek-R1 vs Gemini 2.5 on Real Coding Tasks',
        hook: 'Practical AI tools that save you 10+ hours every week',
        research: 'Real-world benchmark of local reasoning models versus cloud inference APIs',
        takeaway: 'Which AI coding assistant do you use daily? Let me know in the comments!',
        visualDetail: 'Futuristic ultra-clean developer workspace with dual glowing OLED monitors showing AI code analysis matrix, 8k 9:16 vertical'
      },
      {
        formatType: 'tech_tools',
        topic: 'Top 3 Open-Source Developer CLI Tools in 2026',
        hook: 'Stop paying monthly subscriptions for tools you can run locally for free',
        research: 'Local terminal productivity utilities for modern full-stack software engineers',
        takeaway: 'Save this video and test these CLI tools this weekend.',
        visualDetail: 'High contrast aesthetic terminal console with green and cyan syntax highlighting on dark mode screen, 8k 9:16 vertical'
      },
      {
        formatType: 'cloud_infra',
        topic: 'How to Run Free Voice Synthesis with Cloudflare Workers AI',
        hook: 'Deepgram Aura-2 on Cloudflare edge servers costs $0 for creators',
        research: 'Deploying edge serverless audio pipelines for autonomous YouTube workflows',
        takeaway: 'Check the description for the full open-source setup blueprint.',
        visualDetail: 'Clean architectural diagram of global edge cloud computing nodes glowing in indigo and emerald, 8k 9:16 vertical'
      },
      {
        formatType: 'autonomous_pipeline',
        topic: 'Building Autonomous AI Content Pipelines with GitHub Actions',
        hook: 'How decoupled GitHub Actions runners produce high-CTR videos automatically',
        research: 'Automating multi-modal AI generation with zero server upkeep costs',
        takeaway: 'Drop a comment if you want the open-source GitHub workflow template!',
        visualDetail: 'Modern tech studio with automated robotic workflow interface and glowing server cluster, 8k 9:16 vertical'
      }
    ]
  }
];

/**
 * Call OpenAI API (Tier 1 Support)
 */
async function callOpenAI(prompt, systemPrompt) {
  if (!OPENAI_API_KEY) return null;
  const candidateModels = ['gpt-4o-mini', 'gpt-4o', 'o3-mini', 'gpt-3.5-turbo'];

  for (const model of candidateModels) {
    try {
      const result = await new Promise((resolve) => {
        const postData = JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.75,
          max_tokens: 1500,
          response_format: { type: 'json_object' }
        });

        const req = https.request('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: 14000
        }, (res) => {
          let data = '';
          res.on('data', chunk => { data += chunk; });
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const json = JSON.parse(data);
                const content = json.choices?.[0]?.message?.content;
                if (content && content.trim().length > 10) {
                  console.log(`  ✔ [OpenAI] Succeeded using model: ${model}`);
                  resolve(content.trim());
                  return;
                }
              } catch {}
            }
            resolve(null);
          });
        });

        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
        req.write(postData);
        req.end();
      });

      if (result) return result;
    } catch {}
  }
  return null;
}

/**
 * Call DeepSeek API (Tier 1 Support)
 */
async function callDeepSeek(prompt, systemPrompt) {
  if (!DEEPSEEK_API_KEY) return null;
  try {
    const result = await new Promise((resolve) => {
      const postData = JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      });

      const req = https.request('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 14000
      }, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const json = JSON.parse(data);
              const content = json.choices?.[0]?.message?.content;
              if (content && content.trim().length > 10) {
                console.log(`  ✔ [DeepSeek] Succeeded using model: deepseek-chat`);
                resolve(content.trim());
                return;
              }
            } catch {}
          }
          resolve(null);
        });
      });

      req.on('error', () => resolve(null));
      req.on('timeout', () => { req.destroy(); resolve(null); });
      req.write(postData);
      req.end();
    });

    if (result) return result;
  } catch {}
  return null;
}

/**
 * Call Google Gemini API (Primary Google AI Model with Multi-Model Fallback)
 */
async function callGemini(prompt, systemPrompt) {
  if (!GEMINI_API_KEY) return null;
  const candidateModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-flash'];

  for (const model of candidateModels) {
    try {
      const result = await new Promise((resolve) => {
        const postData = JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 1500,
            responseMimeType: 'application/json'
          }
        });

        const req = https.request(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: 12000
        }, (res) => {
          let data = '';
          res.on('data', chunk => { data += chunk; });
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const json = JSON.parse(data);
                const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
                if (content && content.trim().length > 10) {
                  console.log(`  ✔ [Gemini] Succeeded using model: ${model}`);
                  resolve(content.trim());
                  return;
                }
              } catch (e) {
                console.log(`  ⚠ [Gemini] JSON parse issue for ${model}`);
              }
            } else {
              console.log(`  ⚠ [Gemini] ${model} returned HTTP ${res.statusCode}: ${data.slice(0, 120).replace(/\n/g, ' ')}`);
            }
            resolve(null);
          });
        });

        req.on('error', (e) => {
          console.log(`  ⚠ [Gemini] ${model} network error: ${e.message}`);
          resolve(null);
        });
        req.on('timeout', () => {
          console.log(`  ⚠ [Gemini] ${model} timed out`);
          req.destroy();
          resolve(null);
        });
        req.write(postData);
        req.end();
      });

      if (result) return result;
    } catch (err) {
      console.log(`  ⚠ [Gemini] ${model} exception: ${err.message}`);
    }
  }
  return null;
}

/**
 * Call xAI Grok API (Primary - FIRST for Analysis & Creation) with Multi-Token Failover
 */
async function callGrok(prompt, systemPrompt) {
  for (let i = 0; i < XAI_API_KEYS.length; i++) {
    const key = XAI_API_KEYS[i];
    const masked = key.slice(0, 8) + '...' + key.slice(-4);
    try {
      const result = await new Promise((resolve) => {
        const postData = JSON.stringify({
          model: 'grok-2-latest',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1200
        });

        const req = https.request('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: 12000
        }, (res) => {
          let data = '';
          res.on('data', chunk => { data += chunk; });
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const json = JSON.parse(data);
                const content = json.choices?.[0]?.message?.content;
                resolve(content || null);
              } catch (e) {
                resolve(null);
              }
            } else {
              console.warn(`  [Grok]: Token #${i + 1} (${masked}) returned HTTP ${res.statusCode}`);
              resolve(null);
            }
          });
        });

        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
        req.write(postData);
        req.end();
      });

      if (result) {
        console.log(`  -> [Grok Token #${i + 1} Succeeded] (${masked})`);
        return result;
      }
    } catch (err) {
      console.warn(`  [Grok]: Token #${i + 1} exception:`, err.message);
    }
  }
  return null;
}

/**
 * Call Cloudflare Workers AI (BACKUP for Analysis & Creation)
 */
async function callCloudflareAI(prompt, systemPrompt) {
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    console.log("  [Cloudflare LLM] Skipped: CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN is not set.");
    return null;
  }

  // Low-Neuron Consumption Models for maximum free-tier longevity
  const candidateModels = [
    '@cf/meta/llama-3.2-3b-instruct',  // Low neuron consumption, high coherence
    '@cf/meta/llama-3.2-1b-instruct',  // Ultra-low neuron consumption, super fast
    '@cf/meta/llama-3.1-8b-instruct',  // Standard low-neuron workhorse
    '@cf/qwen/qwen1.5-1.8b-chat',      // Ultra-lightweight fallback
    '@cf/meta/llama-3.3-70b-instruct'  // Heavy fallback only if needed
  ];

  for (const model of candidateModels) {
    try {
      const result = await new Promise((resolve) => {
        const postData = JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
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
          res.on('data', chunk => { data += chunk; });
          res.on('end', () => {
            if (res.statusCode === 200) {
              try {
                const json = JSON.parse(data);
                const content = json.result?.response || json.response;
                if (content && content.trim().length > 0) {
                  console.log(`  ✔ [Cloudflare Low-Neuron LLM] Generated via ${model}`);
                  resolve(content.trim());
                  return;
                }
              } catch (e) {
                console.log(`  ⚠ [Cloudflare LLM] Failed parsing JSON for ${model}`);
              }
            } else {
              console.log(`  ⚠ [Cloudflare LLM] ${model} returned HTTP ${res.statusCode}: ${data.slice(0, 150).replace(/\n/g, ' ')}`);
            }
            resolve(null);
          });
        });

        req.on('error', (e) => {
          console.log(`  ⚠ [Cloudflare LLM] ${model} error: ${e.message}`);
          resolve(null);
        });
        req.on('timeout', () => {
          console.log(`  ⚠ [Cloudflare LLM] ${model} timed out`);
          req.destroy();
          resolve(null);
        });
        req.write(postData);
        req.end();
      });

      if (result) return result;
    } catch (err) {
      console.log(`  ⚠ [Cloudflare LLM] ${model} exception: ${err.message}`);
    }
  }
  return null;
}

/**
 * Call Pollinations.ai Text API (100% Free Tier, No API Key Required)
 */
async function callPollinationsText(prompt, systemPrompt) {
  const candidateModels = ['openai', 'mistral', 'qwen-coder', 'llama'];
  for (const model of candidateModels) {
    try {
      const result = await new Promise((resolve) => {
        const postData = JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          model: model,
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
          res.on('data', chunk => { data += chunk; });
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              if (data && data.trim().length > 10) {
                console.log(`  ✔ [Pollinations Text AI] Succeeded using model: ${model}`);
                resolve(data.trim());
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

      if (result) return result;
    } catch {}
  }
  return null;
}

/**
 * Dynamically discover active Groq models or use verified active list
 */
async function getActiveGroqModels() {
  const verifiedFallbacks = [
    'llama-3.1-8b-instant',           // Always active, 100% reliable
    'llama-3.3-70b-specdec',          // Active Groq 70B Speculative Decoding
    'qwen-2.5-32b',                   // Active high-IQ model
    'deepseek-r1-distill-llama-70b',  // Active reasoning model
    'gemma2-9b-it',                   // Active Google Gemma on Groq
    'llama-3.3-70b-versatile'         // Legacy fallback
  ];

  if (!GROQ_API_KEY) return verifiedFallbacks;

  try {
    const list = await new Promise((resolve) => {
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

    if (list && list.length > 0) return list;
  } catch {}

  return verifiedFallbacks;
}

/**
 * Call Groq with Dynamic Auto-Discovery for Deprecation Resilience
 */
async function callGroq(prompt, systemPrompt) {
  if (!GROQ_API_KEY) return null;
  const candidateModels = await getActiveGroqModels();

  for (const model of candidateModels) {
    try {
      const result = await new Promise((resolve) => {
        const postData = JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
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
          res.on('data', chunk => { data += chunk; });
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const json = JSON.parse(data);
                const content = json.choices?.[0]?.message?.content;
                resolve(content || null);
              } catch (e) {
                resolve(null);
              }
            } else {
              resolve(null);
            }
          });
        });

        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
        req.write(postData);
        req.end();
      });

      if (result) {
        console.log(`  -> [Groq Succeeded using active model: ${model}]`);
        return result;
      }
    } catch {
      // Try next candidate model
    }
  }

  return null;
}

async function generateDailyBlueprints() {
  console.log("=== [01: THE BRAIN] STARTING DAILY BLUEPRINT GENERATION ===");
  console.log(`Execution Time: ${new Date().toISOString()}`);
  console.log(`[AI Engine Hierarchy]: Grok 2 (xAI) FIRST -> Cloudflare Workers AI BACKUP -> Groq (Llama 3.3)`);

  // 1. Fetch persistent Firestore history for topic deduplication and cooldowns
  console.log("\n[History & Cooldown] Querying Firestore for recently generated/published content...");
  const recentHistory = await fetchRecentHistoryFromFirestore('motivation_stoicism', 30);
  console.log(`[History & Cooldown] Found ${recentHistory.length} historical entries. Initializing deduplication filters...`);
  for (const h of recentHistory) {
    if (h.topic) generatedTopicHistory.add(h.topic);
    if (h.title) generatedTopicHistory.add(h.title);
  }

  const jobs = [];

  for (const niche of NICHES) {
    console.log(`\nGenerating 4 blueprints for ${niche.channelName}...`);

    // For the Stoic channel, dynamically select 4 distinct archetypes (angle, theme, visual style, narrative arc)
    let effectiveSlots = niche.slots;
    let stoicArchetypes = [];
    if (niche.id === 'motivation_stoicism') {
      stoicArchetypes = selectDailyDiverseSlots(recentHistory, 4);
      console.log(`[Diversity System] Selected 4 distinct Stoic archetypes for today's run:`);
      stoicArchetypes.forEach((arch, idx) => {
        console.log(`  Slot ${idx + 1}: [Theme: ${arch.theme}] -> Angle: ${arch.angle} (Visual: ${arch.visualStyle.slice(0, 45)}...)`);
      });
    }

    for (let slotIdx = 0; slotIdx < effectiveSlots.length; slotIdx++) {
      const slot = effectiveSlots[slotIdx];
      let stoicArch = stoicArchetypes[slotIdx] || null;
      const jobId = `job_${Date.now()}_${niche.id}_${slotIdx + 1}`;

      // Dynamically discover and select fresh viral topic via DuckDuckGo + Active AI
      let resolvedSlotTopic = slot.topic;
      try {
        const discovery = await discoverAndSelectTopicViaActiveAi(niche.id === 'motivation_stoicism' ? 'stoic' : (niche.id === 'fin_blueprint' ? 'fin' : 'cartoon'));
        if (discovery && discovery.chosenTopic) {
          resolvedSlotTopic = discovery.chosenTopic.title;
          console.log(`[Topic Engine] Active AI (${discovery.modelUsed}) selected: "${resolvedSlotTopic}"`);
        }
      } catch (err) {
        console.warn(`[Topic Engine Warning] ${err.message}. Using default.`);
      }

      let scriptText = '';
      let visualPrompt = '';
      let title = '';
      let usedAiModel = 'Deterministic Template';

      const channelName = niche.displayName || niche.channelName;
      let systemPrompt = '';
      let userPrompt = '';

      if (niche.id === 'motivation_stoicism' && stoicArch) {
        const prompts = buildStoicPromptForSlot(stoicArch, recentHistory, slotIdx);
        systemPrompt = prompts.systemPrompt;
        userPrompt = prompts.userPrompt;
      } else {
        systemPrompt = `You are a professional YouTube Shorts producer for "${channelName}".
STRICT YOUTUBE TOS COMPLIANCE: Professional, realistic, strictly educational, zero get-rich-quick claims, authentic numbers, engaging audience retention.

MANDATORY 5 TO 6 SCENE STORYBOARD STRUCTURE:
You MUST generate 5 to 6 sequential storyboard slides:
- Slide 1: "Hello, welcome to ${channelName}! Today we'll be discussing on how to [topic/hook]..." (12-16 words)
- Slide 2: Foundation / Problem / Economic Context (12-15 words)
- Slide 3: Practical Action Step 1 / Mechanism (12-15 words)
- Slide 4: Practical Action Step 2 / Real Example (12-15 words)
- Slide 5: Golden Rule / Mindset Discipline (12-15 words)
- Slide 6: Engagement Question (Option A vs B) or Action Takeaway + Link in Bio (10-14 words)

VISUAL PROMPT DIRECTIVE:
Every single slide (all 5-6) MUST have an extremely descriptive 9:16 vertical 8k photorealistic luxury studio prompt matching that exact moment.

Respond strictly in raw JSON format:
{
  "title": "High CTR Professional Title",
  "script": "Complete spoken voiceover of all slides combined",
  "visualPrompt": "Photorealistic 9:16 vertical luxury scene for the primary hook",
  "slides": [
    { "text": "Slide 1 narration...", "visual": "Photorealistic 9:16 vertical prompt 1..." },
    { "text": "Slide 2 narration...", "visual": "Photorealistic 9:16 vertical prompt 2..." },
    { "text": "Slide 3 narration...", "visual": "Photorealistic 9:16 vertical prompt 3..." },
    { "text": "Slide 4 narration...", "visual": "Photorealistic 9:16 vertical prompt 4..." },
    { "text": "Slide 5 narration...", "visual": "Photorealistic 9:16 vertical prompt 5..." },
    { "text": "Slide 6 narration...", "visual": "Photorealistic 9:16 vertical prompt 6..." }
  ]
}`;
        userPrompt = `Create a professional YouTube Short script for topic: "${resolvedSlotTopic}". Focus details: ${JSON.stringify(slot)}. Channel: "${channelName}". Do not duplicate recent topics: ${Array.from(generatedTopicHistory).slice(-6).join(', ')}`;
      }

      // 1. Primary Attempt: Groq LPU (Highest speed, lowest cost)
      let aiResponse = null;
      if (!aiResponse) {
        try {
          aiResponse = await callGroq(userPrompt, systemPrompt);
          if (aiResponse) usedAiModel = 'Groq (High-Speed LPU)';
        } catch {}
      }

      // 2. Secondary Attempt: Cloudflare Workers AI (Low-Neuron Models)
      if (!aiResponse) {
        try {
          aiResponse = await callCloudflareAI(userPrompt, systemPrompt);
          if (aiResponse) usedAiModel = 'Cloudflare Low-Neuron AI';
        } catch {}
      }

      // 3. Tertiary Attempt: Pollinations.ai Text API (100% Free, No Key Required)
      if (!aiResponse) {
        try {
          aiResponse = await callPollinationsText(userPrompt, systemPrompt);
          if (aiResponse) usedAiModel = 'Pollinations.ai Free Text API';
        } catch {}
      }

      // 4. Quaternary Attempt: Google Gemini (Free Tier Flash)
      if (!aiResponse && GEMINI_API_KEY) {
        try {
          aiResponse = await callGemini(userPrompt, systemPrompt);
          if (aiResponse) usedAiModel = 'Google Gemini Flash';
        } catch {}
      }

      // 5. Quinary Attempt: OpenAI (GPT-4o-mini)
      if (!aiResponse && OPENAI_API_KEY) {
        try {
          aiResponse = await callOpenAI(userPrompt, systemPrompt);
          if (aiResponse) usedAiModel = 'OpenAI (GPT-4o-mini)';
        } catch {}
      }

      // 6. Senary Attempt: DeepSeek
      if (!aiResponse && DEEPSEEK_API_KEY) {
        try {
          aiResponse = await callDeepSeek(userPrompt, systemPrompt);
          if (aiResponse) usedAiModel = 'DeepSeek (Chat)';
        } catch {}
      }

      // 7. Septenary Attempt: Grok (xAI)
      if (!aiResponse) {
        try {
          aiResponse = await callGrok(userPrompt, systemPrompt);
          if (aiResponse) usedAiModel = 'Grok 2 (xAI)';
        } catch {}
      }

      // Parse AI output if available
      let generatedSlides = null;
      let parsedTheme = stoicArch ? stoicArch.theme : '';
      let parsedAngle = stoicArch ? stoicArch.angle : '';
      let parsedHook = '';

      if (aiResponse) {
        try {
          const clean = aiResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(clean);
          if (parsed.title && !isDuplicateTopic(parsed.title)) {
            title = parsed.title;
          }
          if (parsed.theme) parsedTheme = parsed.theme;
          if (parsed.angle) parsedAngle = parsed.angle;
          if (parsed.hook) parsedHook = parsed.hook;
          scriptText = parsed.script || parsed.scriptText || scriptText;
          visualPrompt = parsed.visualPrompt || visualPrompt;
          if (Array.isArray(parsed.slides) && parsed.slides.length >= 3) {
            generatedSlides = parsed.slides.map((s, sIndex) => ({
              slideIndex: sIndex,
              text: s.text || s.narration || '',
              visual: s.visual || s.visualPrompt || visualPrompt
            }));
          }
        } catch (e) {
          // Keep raw or fall back
        }
      }

      // Fallback defaults if not set
      if (!title || !scriptText) {
        if (niche.id === 'motivation_stoicism' && stoicArch) {
          title = `${stoicArch.theme}: ${stoicArch.angle}`;
          visualPrompt = `${stoicArch.visualStyle}, photorealistic 8k vertical 9:16`;
          parsedHook = stoicArch.hookPatterns[slotIdx % stoicArch.hookPatterns.length];
          scriptText = `Hello, welcome to ${channelName}! ${parsedHook} ${stoicArch.philosophicalPrinciple} ${stoicArch.storyExample} ${stoicArch.outroPattern}`;
        } else {
          title = slot.topic;
          visualPrompt = slot.visualDetail || `Cinematic photorealistic 9:16 vertical workspace in Nigeria with modern studio lighting, 8k resolution`;

          if (slot.formatType === 'side_hustle') {
            scriptText = `Hello, welcome to ${channelName}! Today we'll be discussing on how to start a high-demand side hustle with low capital that can boom with minimal friction. Focus on local digital service coordination: create automated WhatsApp catalogs and invoice tracking for retail shops with zero inventory. Secure 3 local retainers this week. Link to the blueprint is in bio!`;
          } else if (slot.formatType === 'finance_news_poll') {
            scriptText = `Hello, welcome to ${channelName}! Today we'll be discussing the latest finance news on high-yield fintech savings rates. Automated digital vaults now offer 15% to 18% APY to beat inflation compared to standard fixed deposits. What would you do: Option A — Save in digital vaults, or Option B — Reinvest in your side hustle? Drop your thoughts below!`;
          } else if (slot.formatType === 'realistic_story') {
            scriptText = `Hello, welcome to ${channelName}! Today we'll be discussing the realistic story of how starting with just little funds built big revenue. David started with only ₦10,000 for mobile data, designing digital menus for 3 local bakeries and reinvesting every single kobo into local deliveries. Start with what you have and compound daily!`;
          } else if (slot.formatType === 'wealth_discipline') {
            scriptText = `Hello, welcome to ${channelName}! Today we'll be discussing the 4 essential money management habits for growing long-term wealth. Automate the first 20% of every payment into an emergency growth reserve before spending a single kobo. Discipline builds freedom. Follow for daily financial blueprints!`;
          } else if (slot.quote) {
            scriptText = `Hello, welcome to ${channelName}! Today we'll be discussing timeless wisdom on ${slot.theme}. "${slot.quote}" — ${slot.author}. True power begins when you master your reaction to outside noise. Focus on what you control.`;
          } else {
            scriptText = `Hello, welcome to ${channelName}! Today we'll be discussing on ${slot.topic}. ${slot.hook}. Check out the full breakdown and let me know your thoughts in the comments!`;
          }
        }
      }

      // Generate structured 5-6 slides if missing
      if (!generatedSlides || generatedSlides.length < 3) {
        if (niche.id === 'motivation_stoicism' && stoicArch) {
          generatedSlides = [
            {
              slideIndex: 0,
              text: stoicArch.hookPatterns[slotIdx % stoicArch.hookPatterns.length],
              visual: `${stoicArch.visualStyle}, cinematic lighting, photorealistic 8k vertical 9:16`
            },
            {
              slideIndex: 1,
              text: `Ancient Stoic anchor: ${stoicArch.philosophicalPrinciple}`,
              visual: `Classical Roman colonnade with dramatic sunlight through tall marble columns, 8k vertical 9:16`
            },
            {
              slideIndex: 2,
              text: `Historical truth: ${stoicArch.storyExample}`,
              visual: `Deep historical composition depicting ancient Roman philosopher in reflection, 8k vertical 9:16`
            },
            {
              slideIndex: 3,
              text: `Actionable principle: eliminate instant gratification and build sovereign command over your attention.`,
              visual: `High-contrast scene of disciplined individual working in calm focus sanctuary, 8k vertical 9:16`
            },
            {
              slideIndex: 4,
              text: `Golden rule: master your internal reactions so external events can never disturb your peace.`,
              visual: `Immovable warrior overlooking tempestuous sea from high cliff with composed stance, 8k vertical 9:16`
            },
            {
              slideIndex: 5,
              text: stoicArch.outroPattern,
              visual: `Majestic mountain peak at golden sunrise with god rays, 8k vertical 9:16 masterpiece`
            }
          ];
        } else {
          generatedSlides = [
            {
              slideIndex: 0,
              text: `Hello, welcome to ${channelName}! Today we'll be discussing ${title}.`,
              visual: `${visualPrompt}, opening establishing shot, 8k vertical 9:16 cinematic lighting`
            },
            {
              slideIndex: 1,
              text: `Here is the essential breakdown: understand the core mechanism before committing resources.`,
              visual: `Professional workspace with analytics charts, financial blueprints on tablet, warm luxury lighting, 8k vertical 9:16`
            },
            {
              slideIndex: 2,
              text: `First actionable step: eliminate friction by using automated digital tools for execution.`,
              visual: `Close-up shot of hands typing on modern laptop with vibrant dashboard UI, 8k vertical 9:16 studio shot`
            },
            {
              slideIndex: 3,
              text: `Second actionable step: focus on consistent daily output rather than sudden unpredictable spikes.`,
              visual: `Determined entrepreneur reviewing growth metrics in sleek modern office, 8k vertical 9:16 cinematic photography`
            },
            {
              slideIndex: 4,
              text: `Golden takeaway: build resilient systems that compound your value over time.`,
              visual: `Sleek high-tech minimalist desk with golden morning sunbeams through glass wall, 8k vertical 9:16 luxury render`
            },
            {
              slideIndex: 5,
              text: `Follow ${channelName} for daily high-impact blueprints and actionable guides.`,
              visual: `Inspiring skyline view from high-rise office at sunset, god rays, 8k vertical 9:16 masterpiece`
            }
          ];
        }
      }

      // Enforce viral & trending hashtag formatting and prevent truncation
      title = formatViralShortsTitle(title, niche.id === 'finance_business' ? 'fin' : 'stoic');

      // Record topic for deduplication
      generatedTopicHistory.add(title);

      const description = `${scriptText || title}\n\n#Shorts #${niche.id.replace(/[^a-zA-Z0-9]/g, '')} #viral #trending #Motivation #Mindset #Discipline #Success #fyp`;
      const tags = ['#Shorts', '#viral', '#trending', `#${niche.id.replace(/[^a-zA-Z0-9]/g, '')}`, '#Motivation', '#Mindset', '#Discipline', '#Success', '#fyp'];

      const jobData = {
        id: jobId,
        channelId: niche.id,
        channelName: niche.channelName,
        slotNumber: slotIdx + 1,
        title,
        description,
        tags,
        scriptText,
        visualPrompt,
        slides: generatedSlides,
        aiEngine: usedAiModel,
        stage: 'QUEUED_FOR_ASSETS',
        status: 'PENDING',
        createdAt: new Date().toISOString()
      };

      jobs.push(jobData);
      console.log(`  [Slot ${slotIdx + 1}/4] Title: "${title}" (Generated via ${usedAiModel})`);

      // 2. Persist new topic metadata to Firestore content_history
      if (niche.id === 'motivation_stoicism') {
        saveContentHistoryToFirestore({
          channelId: niche.id,
          title,
          topic: title,
          theme: parsedTheme || (stoicArch ? stoicArch.theme : 'Stoicism'),
          angle: parsedAngle || (stoicArch ? stoicArch.angle : 'Mental Fortitude'),
          hook: parsedHook || (generatedSlides[0] ? generatedSlides[0].text : ''),
          storyExample: stoicArch ? stoicArch.storyExample : '',
          visualStyle: stoicArch ? stoicArch.visualStyle : visualPrompt,
          narrativeStructure: stoicArch ? stoicArch.narrativeStructure : '6-Slide Narrative',
          usedAiModel
        }).catch(() => {});
      }
    }
  }

  // Save manifest locally for pipeline inspection
  const outPath = path.join(process.cwd(), 'daily_blueprint_manifest.json');
  fs.writeFileSync(outPath, JSON.stringify(jobs, null, 2));
  console.log(`\nSuccessfully generated ${jobs.length} blueprints. Saved manifest to ${outPath}`);
  console.log("=== [01: THE BRAIN] BLUEPRINT RUN FINISHED ===");
}

generateDailyBlueprints().catch(err => {
  console.error("The Brain Generation Failed:", err);
  process.exit(1);
});

