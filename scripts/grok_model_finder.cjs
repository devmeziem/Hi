/**
 * Grok / xAI Dynamic Model Discovery & Health Verifier
 * 
 * Automatically queries https://api.x.ai/v1/models to fetch all active models
 * available for the account, tests each model for chat completion readiness,
 * and maintains a local cache to provide instantaneous, zero-latency model selection.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(process.cwd(), 'grok_active_models.json');
const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

/**
 * Get all available xAI API keys
 */
function getGrokApiKeys() {
  return [
    process.env.XAI_API_KEY,
    process.env.GROK_API_KEY,
    process.env.GROK_API_KEY_2
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

    const req = https.request('https://api.x.ai/v1/chat/completions', {
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
 * Auto-fetch available models directly from xAI's /v1/models endpoint
 */
async function fetchAndVerifyGrokModels(forceRefresh = false) {
  // Check local cache first
  if (!forceRefresh && fs.existsSync(CACHE_FILE)) {
    try {
      const cached = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      const age = Date.now() - (cached.timestamp || 0);
      if (age < CACHE_TTL_MS && Array.isArray(cached.workingModels) && cached.workingModels.length > 0) {
        console.log(`[Grok Model Finder] ⚡ Loaded ${cached.workingModels.length} active models from cache (${Math.round(age / 60000)}m old):`, cached.workingModels.join(', '));
        return cached.workingModels;
      }
    } catch {}
  }

  const keys = getGrokApiKeys();
  if (keys.length === 0) {
    console.warn('[Grok Model Finder] No GROK_API_KEY or XAI_API_KEY detected in environment. Using fallback model hierarchy.');
    return ['grok-2-latest', 'grok-2', 'grok-beta'];
  }

  console.log(`[Grok Model Finder] 🔍 Querying xAI API (https://api.x.ai/v1/models) for live active models...`);

  let fetchedList = [];
  let successfulKey = '';

  for (const key of keys) {
    try {
      const res = await httpsGet('https://api.x.ai/v1/models', {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      });

      if (res.status === 200 && res.data && Array.isArray(res.data.data)) {
        fetchedList = res.data.data.map(m => m.id).filter(Boolean);
        successfulKey = key;
        console.log(`[Grok Model Finder] ✅ Successfully fetched ${fetchedList.length} total models from xAI endpoint:`, fetchedList);
        break;
      } else {
        console.warn(`[Grok Model Finder] Key returned HTTP ${res.status}:`, res.raw ? res.raw.slice(0, 100) : 'No data');
      }
    } catch (err) {
      console.warn(`[Grok Model Finder] Error contacting xAI endpoint: ${err.message}`);
    }
  }

  if (fetchedList.length === 0) {
    console.warn('[Grok Model Finder] Could not fetch live model list from endpoint. Relying on default recommended hierarchy.');
    return ['grok-2-latest', 'grok-2', 'grok-beta'];
  }

  // Filter and sort models: prioritize chat and latest models
  const chatCandidates = fetchedList.filter(id => {
    const lower = id.toLowerCase();
    // Keep grok chat models, skip image/vision/embedding only if distinct
    return lower.includes('grok') && !lower.includes('embed');
  });

  // Sort: put 'latest' and newer versions first
  chatCandidates.sort((a, b) => {
    if (a.includes('latest') && !b.includes('latest')) return -1;
    if (!a.includes('latest') && b.includes('latest')) return 1;
    return b.localeCompare(a);
  });

  console.log(`[Grok Model Finder] 🧪 Testing ${chatCandidates.length} candidate chat models for live completions...`);
  const workingModels = [];

  for (const modelId of chatCandidates) {
    const result = await testChatModel(modelId, successfulKey);
    if (result.working) {
      console.log(`  ✅ [WORKING] ${modelId}`);
      workingModels.push(modelId);
    } else {
      console.log(`  ❌ [INACTIVE/ERROR] ${modelId} (${result.error || result.status})`);
    }
  }

  const finalModels = workingModels.length > 0 ? workingModels : chatCandidates;

  // Save to cache
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify({
      timestamp: Date.now(),
      workingModels: finalModels,
      allFetched: fetchedList
    }, null, 2), 'utf8');
    console.log(`[Grok Model Finder] 💾 Saved ${finalModels.length} validated Grok models to ${CACHE_FILE}`);
  } catch (err) {
    console.warn(`[Grok Model Finder] Cache save notice: ${err.message}`);
  }

  return finalModels;
}

/**
 * Get the single best active Grok model
 */
async function getBestGrokModel() {
  const models = await fetchAndVerifyGrokModels();
  return models[0] || 'grok-2-latest';
}

// Direct CLI execution
if (require.main === module) {
  (async () => {
    console.log('=== XAI / GROK DYNAMIC MODEL DISCOVERY TOOL ===');
    const models = await fetchAndVerifyGrokModels(true);
    console.log('\nFinal Verified Working Models:');
    models.forEach((m, idx) => console.log(`  ${idx + 1}. ${m}`));
    console.log(`\nRecommended Primary: ${models[0] || 'grok-2-latest'}`);
  })().catch(err => {
    console.error('Fatal discovery error:', err);
    process.exit(1);
  });
}

module.exports = {
  fetchAndVerifyGrokModels,
  getBestGrokModel,
  getGrokApiKeys
};
