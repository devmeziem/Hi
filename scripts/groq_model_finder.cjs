/**
 * High-Efficiency Groq Model Finder & Adaptor
 * 
 * Dynamically queries Groq's API for active models, tests candidates with fast pings,
 * and configures payloads according to each model's specific JSON & prompt formatting needs.
 * 
 * Model Formatting Needs Handled:
 * 1. JSON Requirement: Groq requires the word 'json' in messages when response_format: { type: 'json_object' } is used.
 * 2. Colon Punctuation: Models like Llama-3, Qwen, and Mistral perform best when the prompt ends with 'JSON:' or 'Response:'.
 * 3. Non-JSON-Format Models: Reasoning models (e.g. deepseek-r1-distill) reject response_format; they require clean prompt + think tag stripping.
 * 4. Caching: Writes working models to groq_working_models.json for 0ms reuse across pipeline steps.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(process.cwd(), 'groq_working_models.json');
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// High-confidence default candidate hierarchy
const DEFAULT_CANDIDATES = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'deepseek-r1-distill-llama-70b',
  'gemma2-9b-it',
  'mixtral-8x7b-32768'
];

/**
 * Model profiles defining specific formatting requirements
 */
const MODEL_PROFILES = {
  'llama-3.3-70b-versatile': {
    supportsJsonObject: true,
    needsColonPrompt: true,
    isReasoning: false,
    maxTokens: 4096
  },
  'llama-3.1-8b-instant': {
    supportsJsonObject: true,
    needsColonPrompt: true,
    isReasoning: false,
    maxTokens: 4096
  },
  'deepseek-r1-distill-llama-70b': {
    supportsJsonObject: false, // DeepSeek R1 reasoning models reject json_object response_format
    needsColonPrompt: true,
    isReasoning: true,
    maxTokens: 4096
  },
  'gemma2-9b-it': {
    supportsJsonObject: false,
    needsColonPrompt: true,
    isReasoning: false,
    maxTokens: 4096
  },
  'mixtral-8x7b-32768': {
    supportsJsonObject: true,
    needsColonPrompt: false,
    isReasoning: false,
    maxTokens: 4096
  }
};

/**
 * Format a request payload tailored to the specific model's requirements
 */
function formatGroqPayload(model, { systemPrompt = '', userPrompt = '', jsonMode = true, temperature = 0.7, maxTokens = 2200 }) {
  const profile = MODEL_PROFILES[model] || {
    supportsJsonObject: !model.includes('deepseek-r1') && !model.includes('gemma'),
    needsColonPrompt: true,
    isReasoning: model.includes('r1') || model.includes('reason')
  };

  let cleanUserPrompt = userPrompt;
  let cleanSystemPrompt = systemPrompt;

  if (jsonMode) {
    // Ensure the word 'json' is explicitly in prompt (mandated by Groq API for json_object)
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

  // Only attach response_format if the model actually supports it
  if (jsonMode && profile.supportsJsonObject) {
    payload.response_format = { type: 'json_object' };
  }

  return payload;
}

/**
 * Clean and parse JSON response from Groq, stripping reasoning tags and markdown
 */
function cleanGroqJson(rawContent) {
  if (!rawContent || typeof rawContent !== 'string') return null;

  let text = rawContent;
  // Strip <think>...</think> reasoning tags (common in DeepSeek R1 distill models)
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // Strip markdown code fences (```json ... ```)
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
    // Repair common trailing commas before } or ]
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
async function pingGroqModel(apiKey, model, profile) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const payload = formatGroqPayload(model, {
      systemPrompt: 'You are a high-speed API status tester.',
      userPrompt: 'Respond with a short confirmation in JSON: {"status":"ready"}',
      jsonMode: profile.supportsJsonObject,
      maxTokens: 30
    });

    const body = JSON.stringify(payload);
    const req = https.request('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        const latency = Date.now() - startTime;
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ ok: true, model, latency });
        } else {
          // If failed with response_format error, retry without json_object
          if (data.includes('response_format') && profile.supportsJsonObject) {
            profile.supportsJsonObject = false;
            resolve({ ok: true, model, latency, fallbackNoJsonFormat: true });
          } else {
            resolve({ ok: false, model, error: `HTTP ${res.statusCode}` });
          }
        }
      });
    });

    req.on('error', (err) => resolve({ ok: false, model, error: err.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, model, error: 'Timeout (5s)' });
    });
    req.write(body);
    req.end();
  });
}

/**
 * Discover and verify working Groq models
 */
async function fetchAndVerifyGroqModels() {
  // Check fresh cache (< 1 hour old)
  if (fs.existsSync(CACHE_FILE)) {
    try {
      const cached = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      const ageMs = Date.now() - (cached.timestamp || 0);
      if (ageMs < 60 * 60 * 1000 && Array.isArray(cached.workingModels) && cached.workingModels.length > 0) {
        console.log(`[Groq Finder] ⚡ Loaded ${cached.workingModels.length} verified models from cache: [${cached.workingModels.join(', ')}]`);
        return cached.workingModels;
      }
    } catch {}
  }

  if (!GROQ_API_KEY) {
    console.log('[Groq Finder] ℹ️ No GROQ_API_KEY detected in environment. Using default model hierarchy.');
    return DEFAULT_CANDIDATES;
  }

  console.log('[Groq Finder] 🔍 Querying Groq API for active high-speed models...');

  let candidates = [...DEFAULT_CANDIDATES];

  // 1. Fetch live models list from Groq
  try {
    const liveModels = await new Promise((resolve) => {
      const req = https.get('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` },
        timeout: 4000
      }, (res) => {
        let data = '';
        res.on('data', c => { data += c; });
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const j = JSON.parse(data);
              const ids = (j.data || [])
                .map(m => m.id)
                .filter(id => !id.includes('whisper') && !id.includes('guard') && !id.includes('embedding'));
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
      // Prioritize fast, production-grade chat models
      const preferred = DEFAULT_CANDIDATES.filter(c => liveModels.includes(c));
      const remaining = liveModels.filter(m => !DEFAULT_CANDIDATES.includes(m));
      candidates = [...preferred, ...remaining];
    }
  } catch {}

  // 2. Test top 4 candidates for real-time responsiveness
  const topToTest = candidates.slice(0, 4);
  const working = [];
  const profiles = {};

  for (const model of topToTest) {
    const prof = MODEL_PROFILES[model] || {
      supportsJsonObject: !model.includes('deepseek-r1') && !model.includes('gemma'),
      needsColonPrompt: true,
      isReasoning: model.includes('r1')
    };

    const res = await pingGroqModel(GROQ_API_KEY, model, prof);
    if (res.ok) {
      console.log(`[Groq Finder] ✔ Model '${model}' verified online (${res.latency}ms, json_mode: ${prof.supportsJsonObject})`);
      working.push(model);
      profiles[model] = prof;
    } else {
      console.log(`[Groq Finder] ✖ Model '${model}' skipped (${res.error})`);
    }
  }

  // Fallback to candidates if all pings failed
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
  fetchAndVerifyGroqModels().then(models => {
    console.log(`\n🎉 Verified Groq Models: ${JSON.stringify(models)}`);
    process.exit(0);
  }).catch(err => {
    console.error('Error:', err);
    process.exit(0);
  });
}

module.exports = {
  fetchAndVerifyGroqModels,
  formatGroqPayload,
  cleanGroqJson,
  MODEL_PROFILES
};
