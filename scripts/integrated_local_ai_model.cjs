/**
 * Integrated AI Intelligence & Topic Engine
 * 
 * NOTE: Per strict user directives, all hardcoded/preset fallback scripts have been PERMANENTLY REMOVED.
 * Real AI LLM models (Google Gemini, Groq, OpenRouter, Cloudflare AI, Ollama) must perform all script generation.
 * If AI fails, the workflow must fail and log the error.
 */

const { checkLocalSyntacticOverlap, evaluateScriptWithAi } = require('./ai_script_deduplicator.cjs');

module.exports = {
  checkLocalSyntacticOverlap,
  evaluateScriptWithAi
};
