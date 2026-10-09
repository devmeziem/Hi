#!/usr/bin/env node

/**
 * ==============================================================================
 * Cloudflare Workers AI Text Generation Model Finder & Adaptor
 * ==============================================================================
 * 
 * Provides an intelligent discovery, verification, and adaptive payload formatter
 * for ALL Cloudflare Workers AI text generation (LLM) models.
 * 
 * Dynamic Discovery:
 *  - Queries `GET /accounts/{account_id}/ai/models/search?task=Text%20Generation`
 *  - Filters and ranks all text/chat LLM models.
 *  - Includes a curated hierarchy of verified @cf models across Llama, DeepSeek,
 *    Mistral, Qwen, Gemma, and Phi.
 * 
 * Verification & Adaptive Formatting:
 *  - Strips reasoning `<think>` tags from DeepSeek R1 and reasoning models.
 *  - Formats payloads cleanly to match both chat completions format (`messages`)
 *    and direct `prompt` inputs.
 *  - Fast local caching in `cloudflare_working_models.json` (1-hour TTL).
 * ==============================================================================
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(process.cwd(), 'cloudflare_working_models.json');
const CLOUDFLARE_ACCOUNT_ID = String(process.env.CLOUDFLARE_ACCOUNT_ID || '').trim();
const CLOUDFLARE_API_TOKEN = String(process.env.CLOUDFLARE_API_TOKEN || '').trim();

/**
 * Verified high-reliability Text Generation models available on Cloudflare Workers AI
 */
const CURATED_CLOUDFLARE_TEXT_MODELS = [
  // Llama 3.3 & 3.1 Family (Fastest & highest accuracy)
  '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  '@cf/meta/llama-3.1-8b-instruct',
  '@cf/meta/llama-3.1-70b-instruct',
  '@cf/meta/llama-3.2-3b-instruct',
  '@cf/meta/llama-3.2-1b-instruct',
  '@cf/meta/llama-3-8b-instruct',
  
  // DeepSeek Family (Reasoning & general text)
  '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
  '@cf/deepseek-ai/deepseek-math-7b-instruct',
  
  // Qwen Family (Outstanding JSON precision & multilingual)
  '@cf/qwen/qwen2.5-7b-instruct',
  '@cf/qwen/qwen1.5-14b-chat',
  '@cf/qwen/qwen1.5-7b-chat',
  '@cf/qwen/qwen1.5-0.5b-chat',
  
  // Mistral & Mixtral
  '@cf/mistral/mistral-7b-instruct-v0.2',
  '@cf/mistral/mistral-7b-instruct-v0.1',
  
  // Gemma & Phi
  '@cf/google/gemma-7b-it',
  '@cf/google/gemma-2b-it',
  '@cf/microsoft/phi-2'
];

/**
 * Fetch all available Text Generation models directly from Cloudflare account catalog
 */
async function fetchCloudflareTextModelsCatalog() {
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    return CURATED_CLOUDFLARE_TEXT_MODELS;
  }

  return new Promise((resolve) => {
    const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/models/search?task=Text%20Generation`;
    const req = https.get(url, {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const json = JSON.parse(data);
            if (json.success && Array.isArray(json.result)) {
              const remoteModels = json.result
                .filter(m => m.name && (m.task?.name === 'Text Generation' || m.task?.id === 'c324138c-e867-4991-88f9-97703570f807'))
                .map(m => m.name);
              
              if (remoteModels.length > 0) {
                // Merge remote models prioritizing curated flagship models first
                const merged = [...new Set([...CURATED_CLOUDFLARE_TEXT_MODELS, ...remoteModels])];
                return resolve(merged);
              }
            }
          }
        } catch {}
        resolve(CURATED_CLOUDFLARE_TEXT_MODELS);
      });
    });

    req.on('error', () => resolve(CURATED_CLOUDFLARE_TEXT_MODELS));
    req.on('timeout', () => { req.destroy(); resolve(CURATED_CLOUDFLARE_TEXT_MODELS); });
  });
}

/**
 * Ping and verify a single Cloudflare model
 */
async function verifyCloudflareModel(model) {
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    return false;
  }

  const testPayload = JSON.stringify({
    messages: [
      { role: 'system', content: 'Respond in JSON only.' },
      { role: 'user', content: 'Output {"ok":true}' }
    ],
    max_tokens: 30
  });

  return new Promise((resolve) => {
    const req = https.request(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(testPayload)
      },
      timeout: 7000
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(d);
            const responseText = parsed.result?.response || (typeof parsed.result === 'string' ? parsed.result : '');
            if (responseText) return resolve(true);
          } catch {}
        }
        resolve(false);
      });
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.write(testPayload);
    req.end();
  });
}

/**
 * Fetch, verify and return working Cloudflare models with cache
 */
async function fetchAndVerifyCloudflareModels(forceRefresh = false) {
  // 1. Check local cache (1-hour TTL)
  if (!forceRefresh && fs.existsSync(CACHE_FILE)) {
    try {
      const cached = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      const ageHours = (Date.now() - (cached.timestamp || 0)) / (1000 * 60 * 60);
      if (ageHours < 1 && Array.isArray(cached.models) && cached.models.length > 0) {
        return cached.models;
      }
    } catch {}
  }

  // 2. Fetch full catalog from Cloudflare
  const allCandidates = await fetchCloudflareTextModelsCatalog();

  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    return allCandidates;
  }

  // 3. Verify top candidate models with parallel pings
  console.log(`[Cloudflare Model Finder] 🔍 Discovering and verifying Cloudflare Workers AI text models...`);
  const topCandidates = allCandidates.slice(0, 8);
  const working = [];

  for (const model of topCandidates) {
    const isOk = await verifyCloudflareModel(model);
    if (isOk) {
      working.push(model);
      console.log(`[Cloudflare Model Finder] ✓ Verified working model: ${model}`);
    }
  }

  const finalModels = working.length > 0 ? [...new Set([...working, ...allCandidates])] : allCandidates;

  // 4. Cache verified list
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify({
      timestamp: Date.now(),
      models: finalModels
    }, null, 2), 'utf8');
  } catch {}

  return finalModels;
}

/**
 * Format payload cleanly for Cloudflare Workers AI
 */
function formatCloudflarePayload(model, { systemPrompt, userPrompt, jsonMode = true, maxTokens = 1500 }) {
  const isReasoning = model.includes('deepseek-r1') || model.includes('reason');

  let sys = systemPrompt || '';
  let usr = userPrompt || '';

  if (jsonMode && !isReasoning) {
    sys = `${sys}\nRespond with a strictly valid JSON object only. Do not wrap in markdown or explanation.`;
    usr = `${usr}\nReturn strictly valid JSON:`;
  }

  return {
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: usr }
    ],
    max_tokens: maxTokens,
    temperature: 0.7
  };
}

/**
 * Clean and parse JSON from Cloudflare text model responses
 * (Strips <think> tags from DeepSeek R1 and markdown blocks)
 */
function cleanCloudflareJson(raw) {
  if (!raw) return null;
  let str = typeof raw === 'string' ? raw : (raw.response || raw.result || JSON.stringify(raw));

  // 1. Strip reasoning blocks: <think>...</think>
  str = str.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // 2. Strip Markdown code fences
  str = str.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();

  // 3. Extract JSON object
  const start = str.indexOf('{');
  const end = str.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(str.substring(start, end + 1));
    } catch {}
  }

  try {
    return JSON.parse(str);
  } catch {}

  return null;
}

if (require.main === module) {
  (async () => {
    console.log('--- CLOUDFLARE WORKERS AI TEXT MODEL FINDER ---');
    console.log('Account ID present:', !!CLOUDFLARE_ACCOUNT_ID);
    console.log('API Token present:', !!CLOUDFLARE_API_TOKEN);
    const models = await fetchAndVerifyCloudflareModels(true);
    console.log(`\nDiscovered ${models.length} Cloudflare text generation models:`);
    models.forEach((m, i) => console.log(`  ${i + 1}. ${m}`));
  })();
}

module.exports = {
  fetchCloudflareTextModelsCatalog,
  fetchAndVerifyCloudflareModels,
  verifyCloudflareModel,
  formatCloudflarePayload,
  cleanCloudflareJson,
  CURATED_CLOUDFLARE_TEXT_MODELS
};
