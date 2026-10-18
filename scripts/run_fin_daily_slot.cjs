#!/usr/bin/env node
/**
 * Fin Blueprint daily slot router (Channel 1 / CH1)
 *
 * Daily mix (UTC):
 *   05:00  → 5s finance quote reel
 *   11:00  → 5s finance quote reel
 *   15:00  → small-income / practical teaching short
 *   20:00  → financial story mini-doc
 *
 * Env:
 *   VIDEO_MODE = auto | quote | income | documentary
 *   DRY_RUN = true|false
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
  // Scheduled auto slots
  if (hour === 20 || hour === 4) return 'documentary';
  if (hour === 15 || hour === 12) return 'income';
  return 'quote'; // 5, 11, and any other
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
  // 5s quote — highest reach format
  env.SHORT_DURATION = env.SHORT_DURATION || '5.0';
  run('node scripts/generate_fin_quote_reel.cjs');
}
