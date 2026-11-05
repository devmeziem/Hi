#!/usr/bin/env node
/**
 * Fin Blueprint daily slot (CH1) — listicle-first under 60s
 * Modes: listicle (default), skill, trap, income, documentary, quote
 */
const { execSync } = require('child_process');

const modeInput = (process.env.VIDEO_MODE || 'auto').toLowerCase();
const hour = parseInt(process.env.FORCE_HOUR || new Date().getUTCHours(), 10);

function resolveMode() {
  if (modeInput && modeInput !== 'auto') {
    if (modeInput.includes('list') || modeInput.includes('ways') || modeInput.includes('behavior')) return 'listicle';
    if (modeInput.includes('doc') || modeInput.includes('story')) return 'documentary';
    if (modeInput.includes('income') || modeInput.includes('hustle') || modeInput.includes('earn')) return 'income';
    if (modeInput.includes('trap') || modeInput.includes('scam')) return 'trap';
    if (modeInput.includes('skill') || modeInput.includes('teach')) return 'skill';
    if (modeInput.includes('quote')) return 'quote';
    return modeInput;
  }
  // Default: listicle most hours; occasional trap/income/skill for variety
  if (hour === 20 || hour === 4) return 'listicle';
  if (hour === 15) return 'income';
  if (hour === 11) return 'trap';
  return 'listicle';
}

const mode = resolveMode();
console.log(`=== Fin daily slot | UTC hour=${hour} | mode=${mode} ===`);

const env = { ...process.env, FIN_SLOT_MODE: mode };

function run(cmd) {
  console.log('> ' + cmd);
  execSync(cmd, { stdio: 'inherit', env });
}

if (mode === 'listicle' || mode === 'auto') {
  try {
    run('node scripts/generate_fin_listicle_short.cjs');
  } catch (e) {
    console.warn('[Fin] listicle failed → education short', e.message);
    run('node scripts/generate_fin_income_short.cjs');
  }
} else if (mode === 'documentary') {
  try {
    run('node scripts/generate_financial_story_documentary.cjs');
  } catch (e) {
    console.warn('[Fin] doc failed → listicle', e.message);
    run('node scripts/generate_fin_listicle_short.cjs');
  }
} else if (mode === 'quote') {
  env.SHORT_DURATION = env.SHORT_DURATION || '5.0';
  run('node scripts/generate_fin_quote_live_reel.cjs');
} else {
  // skill | trap | income
  try {
    run('node scripts/generate_fin_income_short.cjs');
  } catch (e) {
    console.warn('[Fin] income short failed → listicle', e.message);
    run('node scripts/generate_fin_listicle_short.cjs');
  }
}
