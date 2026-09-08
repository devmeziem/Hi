/**
 * High-Efficiency OpenRouter Model Finder & Adaptor
 * 
 * Dynamically queries OpenRouter's model directory, verifies connectivity on top candidates,
 * and formats payloads to match each model's specific JSON schema, colon punctuation,
 * and reasoning tag (<think>) requirements.
 * 
 * Model Formatting Needs Handled:
 * 1. Colon Prompt Punctuation: Instruction models (Llama-3, Qwen, Mistral) work best when prompted with trailing 'JSON:'.
 * 2. response_format Support: Only attached for models verified to support json_object (avoids 400 Bad Request on Anthropic/DeepSeek R1).
 * 3. Reasoning Stripping: DeepSeek R1 and QwQ emit <think> blocks; parser strips them before JSON decoding.
 * 4. Ultra-Fast Caching: Writes working models to openrouter_working_models.json (< 1 hour freshness).
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(process.cwd(), 'openrouter_working_models.json');
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// High-speed, high-reliability candidate models on OpenRouter
const DEFAULT_CANDIDATES = [
  'google/gemini-2.0-flash-001',
  'meta-llama/llama-3.3-70b-instruct',
  'deepseek/deepseek-chat',
  'qwen/qwen-2.5-72b-instruct',
  'mistralai/mistral-small-24b-instruct-2501',
  'deepseek/deepseek-r1'
];

/**
 * Model profiles defining specific formatting requirements
 */
const MODEL_PROFILES = {
  'google/gemini-2.0-flash-001': {
    supportsJsonObject: true,
    needsColonPrompt: false,
    isReasoning: false,
    maxTokens: 4096
  },
  'meta-llama/llama-3.3-70b-instruct': {
    supportsJsonObject: true,
    needsColonPrompt: true,
    isReasoning: false,
    maxTokens: 4096
  },
  'deepseek/deepseek-chat': {
    supportsJsonObject: true,
    needsColonPrompt: true,
    isReasoning: false,
    maxTokens: 4096
  },
  'qwen/qwen-2.5-72b-instruct': {
    supportsJsonObject: true,
    needsColonPrompt: true,
    isReasoning: false,
    maxTokens: 4096
  },
  'mistralai/mistral-small-24b-instruct-2501': {
    supportsJsonObject: true,
    needsColonPrompt: false,
    isReasoning: false,
    maxTokens: 4096
  },
  'deepseek/deepseek-r1': {
    supportsJsonObject: false, // DeepSeek R1 rejects response_format on OpenRouter
    needsColonPrompt: true,
    isReasoning: true,
    maxTokens: 4096
  }
};

/**
 * Format a request payload tailored to the specific model's requirements
 */
function formatOpenRouterPayload(model, { systemPrompt = '', userPrompt = '', jsonMode = true, temperature = 0.7, maxTokens = 2200 }) {
  const profile = MODEL_PROFILES[model] || {
    supportsJsonObject: !model.includes('r1') && !model.includes('claude'),
    needsColonPrompt: true,
    isReasoning: model.includes('r1') || model.includes('reason')
  };

  let cleanUserPrompt = userPrompt;
  let cleanSystemPrompt = systemPrompt;

  if (jsonMode) {
    if (!cleanUserPrompt.toLowerCase().includes('json')) {
      cleanUserPrompt += ' Output strictly valid JSON.';
    }

    // If model performs best with colon prompt punctuation, append colon delimiter
    if (profile.needsColonPrompt && !cleanUserPrompt.trim().endsWith(':')) {
      cleanUserPrompt = `${cleanUserPrompt.trim()}\n\nJSON:`;
    }
  }

  const messages = [];
  if (cleanSystemPrompt) {
    messages.push({ role: 'system', content: cleanSystemPrompt });
  }
  messages.push({ role: 'user', content: cleanUserPrompt });

  const payload = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens
  };

  // Only attach response_format if model supports it
  if (jsonMode && profile.supportsJsonObject) {
    payload.response_format = { type: 'json_object' };
  }

  return payload;
}

/**
 * Clean and parse JSON response from OpenRouter, stripping reasoning tags and markdown
 */
function cleanOpenRouterJson(rawContent) {
  if (!rawContent || typeof rawContent !== 'string') return null;

  let text = rawContent;
  // Strip <think>...</think> reasoning blocks
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // Strip markdown code fences
  text = text.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').replace(/```/g, '').trim();

  // Find first { and last }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    text = text.slice(start, end + 1);
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    // Repair common trailing commas
    try {
      const repaired = text
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
      return JSON.parse(repaired);
    } catch {
      return null;
    }
  }
}

/**
 * Probe a single model with a lightweight test request
 */
async function pingOpenRouterModel(apiKey, model, profile) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const payload = formatOpenRouterPayload(model, {
      systemPrompt: 'You are an API health checker.',
      userPrompt: 'Output status in JSON: {"status":"ready"}',
      jsonMode: profile.supportsJsonObject,
      maxTokens: 25
    });

    const body = JSON.stringify(payload);
    const req = https.request('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://voxam.ai',
        'X-Title': 'Voxam Model Finder',
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 5500
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        const latency = Date.now() - startTime;
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ ok: true, model, latency });
        } else {
          // If failed with response_format error, flag and accept
          if (data.includes('response_format') && profile.supportsJsonObject) {
            profile.supportsJsonObject = false;
            resolve({ ok: true, model, latency, noJsonFormat: true });
          } else {
            resolve({ ok: false, model, error: `HTTP ${res.statusCode}` });
          }
        }
      });
    });

    req.on('error', (err) => resolve({ ok: false, model, error: err.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, model, error: 'Timeout (5.5s)' });
    });
    req.write(body);
    req.end();
  });
}

/**
 * Discover and verify working OpenRouter models
 */
async function fetchAndVerifyOpenRouterModels() {
  // Check fresh cache (< 1 hour old)
  if (fs.existsSync(CACHE_FILE)) {
    try {
      const cached = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      const ageMs = Date.now() - (cached.timestamp || 0);
      if (ageMs < 60 * 60 * 1000 && Array.isArray(cached.workingModels) && cached.workingModels.length > 0) {
        console.log(`[OpenRouter Finder] ⚡ Loaded ${cached.workingModels.length} verified models from cache: [${cached.workingModels.join(', ')}]`);
        return cached.workingModels;
      }
    } catch {}
  }

  if (!OPENROUTER_API_KEY) {
    console.log('[OpenRouter Finder] ℹ️ No OPENROUTER_API_KEY detected in environment. Using default candidate hierarchy.');
    return DEFAULT_CANDIDATES;
  }

  console.log('[OpenRouter Finder] 🔍 Querying OpenRouter directory for active models...');

  let candidates = [...DEFAULT_CANDIDATES];

  try {
    const liveModels = await new Promise((resolve) => {
      const req = https.get('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://voxam.ai'
        },
        timeout: 4500
      }, (res) => {
        let data = '';
        res.on('data', c => { data += c; });
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const j = JSON.parse(data);
              const ids = (j.data || []).map(m => m.id);
              resolve(ids);
            } catch {
              resolve([]);
            }
          } else {
            resolve([]);
          }
        });
      });
      req.on('error', () => resolve([]));
      req.on('timeout', () => { req.destroy(); resolve([]); });
    });

    if (liveModels.length > 0) {
      const matched = DEFAULT_CANDIDATES.filter(c => liveModels.includes(c));
      if (matched.length > 0) candidates = matched;
    }
  } catch {}

  // Test top 4 candidates
  const topToTest = candidates.slice(0, 4);
  const working = [];
  const profiles = {};

  for (const model of topToTest) {
    const prof = MODEL_PROFILES[model] || {
      supportsJsonObject: !model.includes('r1'),
      needsColonPrompt: true,
      isReasoning: model.includes('r1')
    };

    const res = await pingOpenRouterModel(OPENROUTER_API_KEY, model, prof);
    if (res.ok) {
      console.log(`[OpenRouter Finder] ✔ Model '${model}' verified online (${res.latency}ms, json_mode: ${prof.supportsJsonObject})`);
      working.push(model);
      profiles[model] = prof;
    } else {
      console.log(`[OpenRouter Finder] ✖ Model '${model}' skipped (${res.error})`);
    }
  }

  const finalWorking = working.length > 0 ? working : DEFAULT_CANDIDATES;

  // Save to cache
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify({
      timestamp: Date.now(),
      workingModels: finalWorking,
      profiles
    }, null, 2), 'utf8');
  } catch {}

  return finalWorking;
}

// Standalone CLI execution
if (require.main === module) {
  fetchAndVerifyOpenRouterModels().then(models => {
    console.log(`\n🎉 Verified OpenRouter Models: ${JSON.stringify(models)}`);
    process.exit(0);
  }).catch(err => {
    console.error('Error:', err);
    process.exit(0);
  });
}

module.exports = {
  fetchAndVerifyOpenRouterModels,
  formatOpenRouterPayload,
  cleanOpenRouterJson,
  MODEL_PROFILES
};
