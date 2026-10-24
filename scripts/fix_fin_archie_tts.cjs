#!/usr/bin/env node
/** Wire Fin + Archie to scripts/tts_resilient_engine.cjs (same path Teen uses successfully). */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function patchFin() {
  const p = path.join(process.cwd(), 'scripts', 'generate_fin_income_short.cjs');
  if (!fs.existsSync(p)) return console.warn('[fix-tts] fin missing');
  let t = fs.readFileSync(p, 'utf8');
  if (t.includes('synthesizeSpeechResilient') && t.includes('FIN_TTS_RESILIENT_V1')) {
    console.log('[fix-tts] fin already');
    return;
  }
  const backup = t;

  if (!t.includes("require('./tts_resilient_engine.cjs')")) {
    t = t.replace(
      /(const \{ execSync \} = require\('child_process'\);)/,
      "$1\nconst { synthesizeSpeechResilient } = require('./tts_resilient_engine.cjs');"
    );
  }

  const newEdge = `
async function edgeTts(text, outFile) {
  // FIN_TTS_RESILIENT_V1 — no npx edge-tts (broken on Actions)
  try {
    const r = await synthesizeSpeechResilient(String(text || ''), outFile, {
      voice: process.env.FIN_VOICE || 'en-US-AndrewNeural',
      rate: process.env.FIN_RATE || '+0%',
      pitch: process.env.FIN_PITCH || '-5Hz',
      emotionProfile: 'educator'
    });
    return !!(r && fs.existsSync(outFile) && fs.statSync(outFile).size > 800);
  } catch (e) {
    console.warn('[Fin] TTS fail', e.message);
    return false;
  }
}
`;

  if (/function edgeTts\([\s\S]*?\n\}/.test(t)) {
    t = t.replace(/function edgeTts\([\s\S]*?\n\}/, newEdge.trim());
  }

  // main() must await edgeTts
  t = t.replace(
    /if \(!edgeTts\(ai\.spokenScript, voice\)\)/,
    'if (!(await edgeTts(ai.spokenScript, voice)))'
  );
  // ensure main is async
  t = t.replace(/async function main\(\)/, 'async function main()');
  if (!/async function main\(/.test(t)) {
    t = t.replace(/function main\(\)/, 'async function main()');
  }

  t = '/** FIN_TTS_RESILIENT_V1 */\n' + t;
  if (t.indexOf('#!/usr/bin/env node') > 0) {
    t = t.replace('/** FIN_TTS_RESILIENT_V1 */\n', '');
    t = t.replace('#!/usr/bin/env node', '#!/usr/bin/env node\n/** FIN_TTS_RESILIENT_V1 */');
  }

  try {
    fs.writeFileSync(p, t);
    execSync('node --check "' + p + '"', { stdio: 'pipe' });
    console.log('[fix-tts] fin OK');
  } catch (e) {
    fs.writeFileSync(p, backup);
    console.warn('[fix-tts] fin reverted', e.message);
  }
}

function patchArchie() {
  const p = path.join(process.cwd(), 'scripts', 'generate_archie_live_reel.cjs');
  if (!fs.existsSync(p)) return console.warn('[fix-tts] archie missing');
  let t = fs.readFileSync(p, 'utf8');
  if (t.includes('ARCHIE_TTS_RESILIENT_V1') && t.includes('synthesizeSpeechResilient')) {
    console.log('[fix-tts] archie already');
    return;
  }
  const backup = t;

  // Fix shebang if not first line
  t = t.replace(/^\uFEFF?/, '');
  if (t.includes('#!/usr/bin/env node') && !t.startsWith('#!/usr/bin/env node')) {
    t = t.replace(/#!\/usr\/bin\/env node\n?/, '');
    t = '#!/usr/bin/env node\n' + t;
  }

  if (!t.includes("require('./tts_resilient_engine.cjs')")) {
    t = t.replace(
      /const \{ EdgeTTS \} = require\('node-edge-tts'\);/,
      "const { EdgeTTS } = require('node-edge-tts');\nconst { synthesizeSpeechResilient } = require('./tts_resilient_engine.cjs');"
    );
    if (!t.includes('tts_resilient_engine')) {
      t = t.replace(
        /(const fs = require\('fs'\);)/,
        "$1\nconst { synthesizeSpeechResilient } = require('./tts_resilient_engine.cjs');"
      );
    }
  }

  const newTts = `
async function ttsToWav(text, outWav) {
  // ARCHIE_TTS_RESILIENT_V1 — node-edge-tts alone fails with "Unexpected server response: 200" on Actions
  const mp3 = outWav.replace(/\.wav$/i, '.mp3');
  try {
    await synthesizeSpeechResilient(String(text || ''), mp3, {
      voice: process.env.ARCHIE_VOICE || 'en-US-AndrewNeural',
      rate: process.env.ARCHIE_RATE || '-3%',
      pitch: process.env.ARCHIE_PITCH || '-5Hz',
      emotionProfile: 'educator'
    });
    if (fs.existsSync(mp3) && fs.statSync(mp3).size > 800) {
      execSync(\`ffmpeg -y -i "\${mp3}" -ar 44100 -ac 2 "\${outWav}" 2>/dev/null\`);
      return outWav;
    }
  } catch (e) {
    console.warn('[Archie TTS] resilient fail', e.message);
  }
  throw new Error('Edge TTS failed after resilient path');
}
`;

  if (/async function ttsToWav\([\s\S]*?\n\}/.test(t)) {
    t = t.replace(/async function ttsToWav\([\s\S]*?\n\}/, newTts.trim());
  }

  t = t.replace(/\/\*\* ARCHIE_TTS_RESILIENT_V1 \*\/\n?/g, '');
  if (t.startsWith('#!/usr/bin/env node')) {
    t = t.replace('#!/usr/bin/env node', '#!/usr/bin/env node\n/** ARCHIE_TTS_RESILIENT_V1 */');
  } else {
    t = '#!/usr/bin/env node\n/** ARCHIE_TTS_RESILIENT_V1 */\n' + t;
  }

  try {
    fs.writeFileSync(p, t);
    execSync('node --check "' + p + '"', { stdio: 'pipe' });
    console.log('[fix-tts] archie OK');
  } catch (e) {
    fs.writeFileSync(p, backup);
    console.warn('[fix-tts] archie reverted', e.message);
  }
}

function neutralizeBrokenGesturePatch() {
  const p = path.join(process.cwd(), 'scripts', 'apply_archie_gestures_fix.cjs');
  if (!fs.existsSync(p)) return;
  try {
    execSync('node --check "' + p + '"', { stdio: 'pipe' });
    console.log('[fix-tts] gestures patch syntax OK');
  } catch {
    fs.writeFileSync(
      p,
      `#!/usr/bin/env node\n// Disabled: previous version had broken template escapes.\nconsole.log('[gestures-patch] no-op (syntax was broken)');\n`
    );
    console.log('[fix-tts] neutralized broken gestures patch');
  }
}

patchFin();
patchArchie();
neutralizeBrokenGesturePatch();
console.log('[fix-tts] done');
