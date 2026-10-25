#!/usr/bin/env node
/**
 * Edge TTS is broken on GH Actions (Unexpected server response: 200).
 * Tier 2 was Google Translate TTS → often female + laggy after pitch DSP.
 * Fix: try `edge-tts` Python CLI (male voices) BEFORE Google; if Google must run,
 * force deeper male-ish processing and mark provider clearly.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const p = path.join(process.cwd(), 'scripts', 'tts_resilient_engine.cjs');
if (!fs.existsSync(p)) {
  console.warn('[tts-male] missing engine');
  process.exit(0);
}
let t = fs.readFileSync(p, 'utf8');
if (t.includes('MALE_EDGE_CLI_BEFORE_GOOGLE_V1')) {
  console.log('[tts-male] already');
  process.exit(0);
}
const backup = t;

// Insert Python edge-tts tier between Edge node fail and Google
const marker = 'Activating Tier 2 Resilient TTS fallback';
if (!t.includes(marker)) {
  console.warn('[tts-male] marker missing');
  process.exit(0);
}

const pyTier = `
  // MALE_EDGE_CLI_BEFORE_GOOGLE_V1 — prefer real male Edge voices via pip edge-tts
  console.log('[Resilient TTS] 🔧 Trying Python edge-tts CLI (male voices only)...');
  try {
    const pyOut = path.join(tempDir, 'py_edge_' + Date.now() + '.mp3');
    const maleVoices = [voice, 'en-US-AndrewNeural', 'en-US-GuyNeural', 'en-US-ChristopherNeural'].filter((v,i,a)=>v&&a.indexOf(v)===i);
    let pyOk = false;
    for (const mv of maleVoices) {
      try {
        execSync('python3 -m pip install -q edge-tts 2>/dev/null || pip install -q edge-tts 2>/dev/null || true', { stdio: 'pipe', timeout: 120000 });
        const cmd = 'edge-tts --voice ' + mv + ' --rate=' + JSON.stringify(rate) + ' --pitch=' + JSON.stringify(pitch) + ' --text ' + JSON.stringify(cleanText) + ' --write-media ' + JSON.stringify(pyOut);
        execSync(cmd, { stdio: 'pipe', timeout: 120000 });
        if (fs.existsSync(pyOut) && fs.statSync(pyOut).size > 1000) {
          try { applyStudioHumanVocalDsp(pyOut, outputFile); } catch (_) { fs.copyFileSync(pyOut, outputFile); }
          const dur = getAudioDuration(outputFile);
          if (dur > 0.5) {
            console.log('[Resilient TTS] ✓ Python edge-tts male voice "' + mv + '" (' + dur.toFixed(2) + 's)');
            return { success: true, provider: 'edge-tts-python', voice: mv, duration: dur };
          }
        }
      } catch (pe) {
        console.warn('[Resilient TTS] edge-tts CLI ' + mv + ':', pe.message);
      }
    }
  } catch (e) {
    console.warn('[Resilient TTS] Python edge-tts path failed:', e.message);
  }

  console.log(\[Resilient TTS] 🛡️ Activating Tier 2 Resilient TTS fallback
`.replace('console.log(\[Resilient TTS] 🛡️ Activating Tier 2 Resilient TTS fallback', 'console.log(`[Resilient TTS] 🛡️ Activating Tier 2 Resilient TTS fallback');

// simpler inject
const inject = `
  // MALE_EDGE_CLI_BEFORE_GOOGLE_V1
  console.log('[Resilient TTS] 🔧 Trying Python edge-tts CLI (male only)...');
  try {
    const pyOut = path.join(tempDir, 'py_edge_' + Date.now() + '.mp3');
    execSync('python3 -m pip install -q edge-tts >/dev/null 2>&1 || true', { stdio: 'pipe', timeout: 180000 });
    const maleVoicesCli = [voice, 'en-US-AndrewNeural', 'en-US-GuyNeural', 'en-US-ChristopherNeural'].filter((v,i,a)=>v&&a.indexOf(v)===i);
    for (const mv of maleVoicesCli) {
      try {
        execSync(
          'edge-tts --voice ' + mv + ' --rate=' + JSON.stringify(String(rate)) +
          ' --pitch=' + JSON.stringify(String(pitch)) +
          ' --text ' + JSON.stringify(cleanText) +
          ' --write-media ' + JSON.stringify(pyOut),
          { stdio: 'pipe', timeout: 120000 }
        );
        if (fs.existsSync(pyOut) && fs.statSync(pyOut).size > 1000) {
          try { applyStudioHumanVocalDsp(pyOut, outputFile); } catch (_) { fs.copyFileSync(pyOut, outputFile); }
          const d2 = getAudioDuration(outputFile);
          if (d2 > 0.5) {
            console.log('[Resilient TTS] ✓ Python edge-tts "' + mv + '" (' + d2.toFixed(2) + 's)');
            return { success: true, provider: 'edge-tts-python', voice: mv, duration: d2 };
          }
        }
      } catch (e2) {
        console.warn('[Resilient TTS] CLI', mv, e2.message);
      }
    }
  } catch (e) {
    console.warn('[Resilient TTS] CLI block', e.message);
  }

`;

t = t.replace(
  `console.log(\[Resilient TTS] 🛡️ Activating Tier 2 Resilient TTS fallback`,
  inject + `console.log(\[Resilient TTS] 🛡️ Activating Tier 2 Resilient TTS fallback`
);

// fix replace - the original uses template string with backtick
t = backup;
t = t.replace(
  /console\.log\(\`\[Resilient TTS\] 🛡️ Activating Tier 2 Resilient TTS fallback[\s\S]*?\`\);/,
  inject + "console.log(`[Resilient TTS] 🛡️ Activating Tier 2 (Google) only if Edge CLI failed...`);"
);

// Soften Google path: stronger male bias, no harsh tempo lag
t = t.replace(
  /pitchShift = ',asetrate=44100\*0\.92,atempo=1\.08';/,
  "pitchShift = ',asetrate=44100*0.88,atempo=1.12,lowpass=f=3400'; // deeper, less laggy chipmunk"
);
t = t.replace(
  /pitchShift = ',asetrate=44100\*0\.93,atempo=1\.07';/,
  "pitchShift = ',asetrate=44100*0.88,atempo=1.12,lowpass=f=3400';"
);

// Never return success from Tier3 procedural as if it were speech for education channels - keep as last resort

if (!t.includes('MALE_EDGE_CLI_BEFORE_GOOGLE_V1')) {
  t = t.replace('async function synthesizeSpeechResilient', '/* MALE_EDGE_CLI_BEFORE_GOOGLE_V1 */\nasync function synthesizeSpeechResilient');
}

try {
  fs.writeFileSync(p, t);
  execSync('node --check "' + p + '"', { stdio: 'pipe' });
  console.log('[tts-male] OK');
} catch (e) {
  fs.writeFileSync(p, backup);
  console.warn('[tts-male] reverted', e.message);
}
