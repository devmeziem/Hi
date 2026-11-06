#!/usr/bin/env node
/** Reliable Edge TTS: prefer `edge-tts` / `python -m edge_tts`, never broken npx package name. */
const { execSync } = require('child_process');
const fs = require('fs');

function edgeTts(text, outFile, opts = {}) {
  const voice = opts.voice || process.env.FIN_VOICE || process.env.TEEN_VOICE || 'en-US-AndrewNeural';
  const rate = opts.rate || process.env.FIN_RATE || '+0%';
  const pitch = opts.pitch || process.env.FIN_PITCH || '-5Hz';
  const t = String(text || '').trim();
  if (!t) return false;

  const attempts = [
    `edge-tts --voice ${voice} --rate=${rate} --pitch=${pitch} --text ${JSON.stringify(t)} --write-media ${JSON.stringify(outFile)}`,
    `python -m edge_tts --voice ${voice} --rate=${rate} --pitch=${pitch} --text ${JSON.stringify(t)} --write-media ${JSON.stringify(outFile)}`,
    `python3 -m edge_tts --voice ${voice} --rate=${rate} --pitch=${pitch} --text ${JSON.stringify(t)} --write-media ${JSON.stringify(outFile)}`
  ];

  for (const cmd of attempts) {
    try {
      execSync(cmd, { stdio: 'pipe', timeout: 120000 });
      if (fs.existsSync(outFile) && fs.statSync(outFile).size > 1000) return true;
    } catch (e) {
      console.warn('[edge-tts]', (e.message || '').slice(0, 120));
    }
  }
  return false;
}

module.exports = { edgeTts };
