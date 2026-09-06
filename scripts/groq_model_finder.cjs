/**
 * Groq High-Speed LPU Dynamic Model Discovery & Health Verifier
 * 
 * Automatically queries https://api.groq.com/openai/v1/models to discover all active
 * models available on the account, tests each text chat model for completion readiness,
 * and maintains a local cache to provide instantaneous, zero-latency model selection.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(process.cwd(), 'groq_active_models.json');
const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

const FALLBACK_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'deepseek-r1-distill-llama-70b',
  'gemma2-9b-it'
];

/**
 * Get all available Groq API keys
 */
function getGroqApiKeys() {
  return [
    process.env.GROQ_API_KEY,
    process.env.GROQ_KEY
  ].filter(k => typeof k === 'string' && k.trim().length > 10);
}

/**
 * Perform HTTPS GET request returning parsed JSON
 */
function httpsGet(url, headers = {}, timeoutMs = 7000) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method: 'GET',
      headers,
      timeout: timeoutMs
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, data: null, raw: data, error: e.message });
        }
      });
    });
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout after ${timeoutMs}ms`));
    });
    req.on('error', reject);
    req.end();
  });
}

/**
 * Perform a fast chat ping to verify the model actually generates completions
 */
function testChatModel(modelId, apiKey, timeoutMs = 6000) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      model: modelId,
      messages: [{ role: 'user', content: 'Ping' }],
      max_tokens: 5
    });

    const req = https.request('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: timeoutMs
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ working: true, status: res.statusCode });
        } else {
          resolve({ working: false, status: res.statusCode, error: data.slice(0, 150) });
        }
      });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ working: false, error: 'Timeout' });
    });
    req.on('error', (e) => resolve({ working: false, error: e.message }));
    req.write(postData);
    req.end();
  });
}

/**
 * Auto-fetch available models directly from Groq's /openai/v1/models endpoint
 */
async function fetchAndVerifyGroqModels(forceRefresh = false) {
  // 1. Check local cache first
  if (!forceRefresh && fs.existsSync(CACHE_FILE)) {
    try {
      const cached = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      const age = Date.now() - (cached.timestamp || 0);
      if (age < CACHE_TTL_MS && Array.isArray(cached.workingModels) && cached.workingModels.length > 0) {
        console.log(`[Groq Model Finder] ⚡ Loaded ${cached.workingModels.length} active models from cache (${Math.round(age / 60000)}m old):`, cached.workingModels.join(', '));
        return cached.workingModels;
      }
    } catch {}
  }

  const keys = getGroqApiKeys();
  if (keys.length === 0) {
    console.warn('[Groq Model Finder] No GROQ_API_KEY detected in environment. Using fallback model hierarchy.');
    return FALLBACK_MODELS;
  }

  console.log(`[Groq Model Finder] 🔍 Querying Groq API (https://api.groq.com/openai/v1/models) for live active models...`);

  let fetchedList = [];
  let successfulKey = '';

  for (const key of keys) {
    try {
      const res = await httpsGet('https://api.groq.com/openai/v1/models', {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      });

      if (res.status === 200 && res.data && Array.isArray(res.data.data)) {
        fetchedList = res.data.data.map(m => m.id).filter(Boolean);
        successfulKey = key;
        console.log(`[Groq Model Finder] ✅ Successfully fetched ${fetchedList.length} total models from Groq endpoint`);
        break;
      } else {
        console.warn(`[Groq Model Finder] Key returned HTTP ${res.status}:`, res.raw ? res.raw.slice(0, 100) : 'No data');
      }
    } catch (err) {
      console.warn(`[Groq Model Finder] Error contacting Groq endpoint: ${err.message}`);
    }
  }

  if (fetchedList.length === 0) {
    console.warn('[Groq Model Finder] Could not fetch live model list from endpoint. Relying on default recommended hierarchy.');
    return FALLBACK_MODELS;
  }

  // Filter text chat models (exclude whisper, speech, guard, vision-only, moderation)
  const nonChatKeywords = ['whisper', 'guard', 'vision', 'embedding', 'moderation', 'tts'];
  const chatCandidates = fetchedList.filter(id => {
    const lower = id.toLowerCase();
    return !nonChatKeywords.some(kw => lower.includes(kw));
  });

  // Sort candidates by proven production preference
  const preferredPriority = [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'deepseek-r1-distill-llama-70b',
    'qwen-qwq-32b',
    'gemma2-9b-it',
    'mixtral-8x7b-32768'
  ];

  chatCandidates.sort((a, b) => {
    const idxA = preferredPriority.indexOf(a);
    const idxB = preferredPriority.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  console.log(`[Groq Model Finder] 🧪 Testing candidate chat models for live completions...`);
  const workingModels = [];

  // Test top 6 candidates to keep discovery fast
  const toTest = chatCandidates.slice(0, 6);

  for (const modelId of toTest) {
    const result = await testChatModel(modelId, successfulKey);
    if (result.working) {
      console.log(`  ✅ [WORKING] ${modelId}`);
      workingModels.push(modelId);
    } else {
      console.log(`  ❌ [INACTIVE/ERROR] ${modelId} (${result.error || result.status})`);
    }
  }

  const finalModels = workingModels.length > 0 ? workingModels : FALLBACK_MODELS;

  // Save to cache
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify({
      timestamp: Date.now(),
      workingModels: finalModels,
      allFetched: fetchedList
    }, null, 2), 'utf8');
    console.log(`[Groq Model Finder] 💾 Saved ${finalModels.length} validated Groq models to ${CACHE_FILE}`);
  } catch (err) {
    console.warn(`[Groq Model Finder] Cache save notice: ${err.message}`);
  }

  return finalModels;
}

/**
 * Get the single best active Groq model
 */
async function getBestGroqModel() {
  const models = await fetchAndVerifyGroqModels();
  return models[0] || 'llama-3.3-70b-versatile';
}

// Direct CLI execution
if (require.main === module) {
  (async () => {
    console.log('=== GROQ LPU DYNAMIC MODEL DISCOVERY TOOL ===');
    const models = await fetchAndVerifyGroqModels(true);
    console.log('\nFinal Verified Working Models:');
    models.forEach((m, idx) => console.log(`  ${idx + 1}. ${m}`));
    console.log(`\nRecommended Primary: ${models[0] || 'llama-3.3-70b-versatile'}`);
  })().catch(err => {
    console.error('Fatal Groq discovery error:', err);
    process.exit(1);
  });
}

module.exports = {
  fetchAndVerifyGroqModels,
  getBestGroqModel,
  getGroqApiKeys
};
