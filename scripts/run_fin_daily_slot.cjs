#!/usr/bin/env node
/**
 * Fin Blueprint daily slot (CH1)
 * Education-first: skill/trap + Nigeria earning ideas
 * Quotes throttled (rare). Documentary weekly-ish via schedule hour only.
 *
 * auto schedule (UTC):
 *   05 → skill
 *   11 → skill/trap
 *   15 → nigeria earning idea
 *   20 → story/doc (or skill if doc fails)
 */
const { execSync } = require('child_process');

const modeInput = (process.env.VIDEO_MODE || 'auto').toLowerCase();
const hour = parseInt(process.env.FORCE_HOUR || new Date().getUTCHours(), 10);

function resolveMode() {
  if (modeInput && modeInput !== 'auto') {
    if (modeInput.includes('doc') || modeInput.includes('story')) return 'documentary';
    if (modeInput.includes('income') || modeInput.includes('hustle') || modeInput.includes('earn')) return 'income';
    if (modeInput.includes('trap') || modeInput.includes('skill') || modeInput.includes('teach')) return 'skill';
    if (modeInput.includes('quote')) return 'quote'; // manual only
    return modeInput;
  }
  // No auto-quote — education first
  if (hour === 20 || hour === 4) return 'documentary';
  if (hour === 15 || hour === 12) return 'income';
  if (hour === 11 || hour === 17) return 'trap';
  return 'skill';
}

const mode = resolveMode();
console.log(`=== Fin daily slot | UTC hour=${hour} | mode=${mode} ===`);

const env = { ...process.env, FIN_SLOT_MODE: mode };

function run(cmd) {
  console.log('> ' + cmd);
  execSync(cmd, { stdio: 'inherit', env });
}

if (mode === 'documentary') {
  try {
    run('node scripts/generate_financial_story_documentary.cjs');
  } catch (e) {
    console.warn('[Fin] doc failed → skill fallback', e.message);
    env.FIN_SLOT_MODE = 'skill';
    run('node scripts/generate_fin_income_short.cjs');
  }
} else if (mode === 'quote') {
  // Rare manual path only
  env.SHORT_DURATION = env.SHORT_DURATION || '5.0';
  run('node scripts/generate_fin_quote_live_reel.cjs');
} else {
  // skill | trap | income all use the education short generator
  run('node scripts/generate_fin_income_short.cjs');
}
