#!/usr/bin/env node
/**
 * Fin Blueprint daily slot router (Channel 1 / CH1)
 * 05:00 quote | 11:00 quote | 15:00 income | 20:00 doc
 * Quotes: LIVE Wikiquote only (no hardcoded catalog)
 */
const { execSync } = require('child_process');

const modeInput = (process.env.VIDEO_MODE || 'auto').toLowerCase();
const hour = parseInt(process.env.FORCE_HOUR || new Date().getUTCHours(), 10);

function resolveMode() {
  if (modeInput && modeInput !== 'auto') {
    if (modeInput.includes('doc')) return 'documentary';
    if (modeInput.includes('income') || modeInput.includes('hustle') || modeInput.includes('teach')) return 'income';
    if (modeInput.includes('quote') || modeInput.includes('5s') || modeInput.includes('3s')) return 'quote';
    return modeInput;
  }
  if (hour === 20 || hour === 4) return 'documentary';
  if (hour === 15 || hour === 12) return 'income';
  return 'quote';
}

const mode = resolveMode();
console.log(`=== Fin daily slot | UTC hour=${hour} | mode=${mode} ===`);

const env = { ...process.env, FIN_SLOT_MODE: mode };

function run(cmd) {
  console.log('> ' + cmd);
  execSync(cmd, { stdio: 'inherit', env });
}

if (mode === 'documentary') {
  run('node scripts/generate_financial_story_documentary.cjs');
} else if (mode === 'income') {
  run('node scripts/generate_fin_income_short.cjs');
} else {
  // LIVE public quotes — never the old FINANCE_TITANS catalog generator
  env.SHORT_DURATION = env.SHORT_DURATION || '5.0';
  run('node scripts/generate_fin_quote_live_reel.cjs');
}
