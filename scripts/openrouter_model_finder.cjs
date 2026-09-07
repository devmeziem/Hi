/**
 * OpenRouter Dynamic Model Discovery & Live Availability Finder
 * 
 * Automatically queries https://openrouter.ai/api/v1/models to discover all active models,
 * prioritizes zero-cost free models (:free) and resilient high-throughput chat models,
 * tests candidate models with a fast ping if an API key is present,
 * and maintains a local cache (openrouter_active_models.json) for 0ms execution.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(process.cwd(), 'openrouter_active_models.json');
const CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours

const FALLBACK_FREE_MODELS = [
  'google/gemini-2.0-flash-exp:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'deepseek/deepseek-r1:free',
  'mistralai/mistral-small-24b-instruct-2501:free',
  'qwen/qwen-2.5-72b-instruct:free',
  'google/gemini-2.0-flash-thinking-exp:free'
];

const FALLBACK_POPULAR_MODELS = [
  'google/gemini-2.0-flash-001',
  'meta-llama/llama-3.3-70b-instruct',
  'deepseek/deepseek-chat',
  'mistralai/mistral-small-24b-instruct-2501',
  'qwen/qwen-2.5-72b-instruct'
];

function getOpenRouterApiKey() {
  return (process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY || '').trim();
}

/**
 * Perform HTTPS GET request returning parsed JSON
 */
function httpsGet(url, headers = {}, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Voxam-Cartoon-Pipeline/1.0',
        ...headers
      },
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
 * Fast chat ping to test if model actually generates completions on OpenRouter
 */
function testOpenRouterChatModel(modelId, apiKey, timeoutMs = 7000) {
  return new Promise((resolve) => {
    if (!apiKey) {
      // Without API key, cannot ping test, assume candidates valid
      resolve({ working: true, status: 200 });
      return;
    }

    const postData = JSON.stringify({
      model: modelId,
      messages: [{ role: 'user', content: 'Ping' }],
      max_tokens: 5
    });

    const req = https.request('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://voxam.ai',
        'X-Title': 'Voxam Model Finder',
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
          resolve({ working: false, status: res.statusCode, error: data.slice(0, 120) });
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
 * Auto-fetch and verify available models from OpenRouter endpoint
 */
async function fetchAndVerifyOpenRouterModels(forceRefresh = false) {
  // 1. Check local cache first
  if (!forceRefresh && fs.existsSync(CACHE_FILE)) {
    try {
      const cached = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      const age = Date.now() - (cached.timestamp || 0);
      if (age < CACHE_TTL_MS && Array.isArray(cached.workingModels) && cached.workingModels.length > 0) {
        console.log(`[OpenRouter Model Finder] ⚡ Loaded ${cached.workingModels.length} active models from cache (${Math.round(age / 60000)}m old):`, cached.workingModels.slice(0, 4).join(', '));
        return cached.workingModels;
      }
    } catch {}
  }

  const apiKey = getOpenRouterApiKey();
  console.log(`[OpenRouter Model Finder] 🔍 Discovering live OpenRouter models from API...`);

  let fetchedList = [];
  try {
    const headers = {};
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const res = await httpsGet('https://openrouter.ai/api/v1/models', headers);
    if (res.status === 200 && res.data && Array.isArray(res.data.data)) {
      fetchedList = res.data.data;
      console.log(`[OpenRouter Model Finder] ✅ Retrieved ${fetchedList.length} total models from OpenRouter endpoint`);
    } else {
      console.warn(`[OpenRouter Model Finder] Endpoint returned HTTP ${res.status}`);
    }
  } catch (err) {
    console.warn(`[OpenRouter Model Finder] Error contacting OpenRouter: ${err.message}`);
  }

  if (!fetchedList || fetchedList.length === 0) {
    console.warn('[OpenRouter Model Finder] Using default fallback model hierarchy.');
    return [...FALLBACK_FREE_MODELS, ...FALLBACK_POPULAR_MODELS];
  }

  // Filter out multimodal/image-only/embedding models
  const excludedKeywords = ['embed', 'whisper', 'moderation', 'guard', 'tts', 'audio', 'flux', 'midjourney', 'stable-diffusion'];
  const textModels = fetchedList.filter(m => {
    const id = (m.id || '').toLowerCase();
    return !excludedKeywords.some(kw => id.includes(kw));
  });

  // Separate free models and reliable paid models
  const freeModels = [];
  const standardModels = [];

  for (const m of textModels) {
    const id = m.id;
    const isFree = id.endsWith(':free') || (m.pricing && m.pricing.prompt === '0' && m.pricing.completion === '0');
    if (isFree) {
      freeModels.push(id);
    } else {
      standardModels.push(id);
    }
  }

  // Sort preferred models first
  const preferredSubstrings = ['llama-3.3', 'gemini-2.0', 'deepseek', 'mistral', 'qwen-2.5'];
  const sortFunc = (a, b) => {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    const aMatch = preferredSubstrings.findIndex(s => aLower.includes(s));
    const bMatch = preferredSubstrings.findIndex(s => bLower.includes(s));
    if (aMatch !== -1 && bMatch !== -1) return aMatch - bMatch;
    if (aMatch !== -1) return -1;
    if (bMatch !== -1) return 1;
    return a.localeCompare(b);
  };

  freeModels.sort(sortFunc);
  standardModels.sort(sortFunc);

  // Combine: free models first (so runs never fail due to zero balance), then top standard models
  const candidates = [...freeModels.slice(0, 8), ...standardModels.slice(0, 6)];

  console.log(`[OpenRouter Model Finder] 🧪 Found ${freeModels.length} free models, testing top candidates...`);

  let workingModels = [];
  if (apiKey) {
    for (const modelId of candidates.slice(0, 8)) {
      const ping = await testOpenRouterChatModel(modelId, apiKey);
      if (ping.working) {
        console.log(`  ✅ [WORKING] ${modelId}`);
        workingModels.push(modelId);
      } else {
        console.log(`  ❌ [INACTIVE/ERROR] ${modelId} (${ping.error || ping.status})`);
      }
    }
  }

  // If no ping succeeded or no key, use candidates with fallback priority
  if (workingModels.length === 0) {
    workingModels = candidates.length > 0 ? candidates : [...FALLBACK_FREE_MODELS, ...FALLBACK_POPULAR_MODELS];
  }

  // Cache to disk
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify({
      timestamp: Date.now(),
      workingModels
    }, null, 2));
    console.log(`[OpenRouter Model Finder] 💾 Cached ${workingModels.length} working models to ${CACHE_FILE}`);
  } catch {}

  return workingModels;
}

if (require.main === module) {
  fetchAndVerifyOpenRouterModels(true).then(models => {
    console.log('[OpenRouter Model Finder] Execution complete. Ready models:', models);
  }).catch(err => {
    console.error('[OpenRouter Model Finder Fatal]', err);
    process.exit(1);
  });
}

module.exports = {
  fetchAndVerifyOpenRouterModels,
  FALLBACK_FREE_MODELS,
  FALLBACK_POPULAR_MODELS
};
