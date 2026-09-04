/**
 * Local AI Model Response Cache
 * Caches prompts and responses for local Ollama models (TinyLlama, Qwen, etc.)
 * Provides instantaneous 0ms response for repeated or similar queries and prevents duplicate inference.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CACHE_FILE = path.join(process.cwd(), 'local_model_cache.json');

function getCacheKey(model, prompt, systemPrompt = '') {
  const hash = crypto.createHash('sha256');
  hash.update(String(model || 'default'));
  hash.update(':::');
  hash.update(String(systemPrompt || ''));
  hash.update(':::');
  hash.update(String(prompt || '').trim());
  return hash.digest('hex');
}

function loadCache() {
  if (fs.existsSync(CACHE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    } catch {
      return {};
    }
  }
  return {};
}

function getCachedResponse(model, prompt, systemPrompt = '') {
  const key = getCacheKey(model, prompt, systemPrompt);
  const cache = loadCache();
  if (cache[key]) {
    console.log(`[Local AI Cache] ⚡ Cache hit for model ${model} (Key: ${key.slice(0, 10)}...)`);
    return cache[key].response;
  }
  return null;
}

function setCachedResponse(model, prompt, systemPrompt = '', response) {
  if (!response) return;
  const key = getCacheKey(model, prompt, systemPrompt);
  const cache = loadCache();
  cache[key] = {
    model,
    timestamp: new Date().toISOString(),
    response
  };
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
    console.log(`[Local AI Cache] 💾 Saved response for model ${model} to cache.`);
  } catch (err) {
    console.warn(`[Local AI Cache] Failed to write cache: ${err.message}`);
  }
}

module.exports = {
  getCachedResponse,
  setCachedResponse,
  getCacheKey
};
