#!/usr/bin/env node
/**
 * Archie gestures + lipsync in ONE FFmpeg pass (not hundreds).
 * Alternating talk/talk2 via enable=mod(floor(t*Hz),2)
 * Pose phases: point → teach → close → idle
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const p = path.join(process.cwd(), 'scripts', 'generate_archie_live_reel.cjs');
if (!fs.existsSync(p)) process.exit(0);
let t = fs.readFileSync(p, 'utf8');
if (t.includes('ARCHIE_GESTURE_SINGLE_PASS_V3')) {
  console.log('[archie-gest] already v3');
  process.exit(0);
}
const backup = t;

const markerStart = t.indexOf("  const gestMp4 = path.join(ARTIFACTS, 'pass_gestures.mp4');");
// Also match if V2 already injected
let start = markerStart;
if (start < 0) start = t.indexOf('ARCHIE_GESTURE_SEQUENTIAL');
if (start < 0) start = t.indexOf("const gestMp4 = path.join(ARTIFACTS, 'pass_gestures.mp4')");
const end = t.indexOf("  const assPath = path.join(ARTIFACTS, 'archie_caps.ass');");
if (start < 0 || end < 0) {
  console.warn('[archie-gest] markers missing', start, end);
  process.exit(0);
}

const block = `
  // ARCHIE_GESTURE_SINGLE_PASS_V3 — one ffmpeg, fast lipsync, clear poses
  const gestMp4 = path.join(ARTIFACTS, 'pass_gestures.mp4');
  // g1=point phase end, g2=teach phase end (already set above)
  // Lipsync Hz ~5: alternate talk/talk2 every 0.2s without N encodes
  const gestCmd = \
    \\`ffmpeg -y -i "\\$\{sceneMp4\}" \\
      -loop 1 -t \\$\{total.toFixed(2)\} -i "\\$\{point\}" \\
      -loop 1 -t \\$\{total.toFixed(2)\} -i "\\$\{talk\}" \\
      -loop 1 -t \\$\{total.toFixed(2)\} -i "\\$\{talk2\}" \\
      -loop 1 -t \\$\{total.toFixed(2)\} -i "\\$\{open\}" \\
      -loop 1 -t \\$\{total.toFixed(2)\} -i "\\$\{idle\}" \\
      -filter_complex "[1:v]scale=-1:1050,format=rgba[point];[2:v]scale=-1:1050,format=rgba[talk];[3:v]scale=-1:1050,format=rgba[talk2];[4:v]scale=-1:1050,format=rgba[open];[5:v]scale=-1:1050,format=rgba[idle];\\n[0:v][point]overlay=x=(W-w)/2:y=H-h-30:enable='lt(t,\\$\\{g1.toFixed(2)\\})*eq(mod(floor(t*5),2),0)'[a];\\n[a][talk]overlay=x=(W-w)/2:y=H-h-30:enable='lt(t,\\$\\{g1.toFixed(2)\\})*eq(mod(floor(t*5),2),1)'[b];\\n[b][talk]overlay=x=(W-w)/2:y=H-h-30:enable='gte(t,\\$\\{g1.toFixed(2)\\})*lt(t,\\$\\{g2.toFixed(2)\\})*eq(mod(floor(t*5),2),0)'[c];\\n[c][talk2]overlay=x=(W-w)/2:y=H-h-30:enable='gte(t,\\$\\{g1.toFixed(2)\\})*lt(t,\\$\\{g2.toFixed(2)\\})*eq(mod(floor(t*5),2),1)'[d];\\n[d][open]overlay=x=(W-w)/2:y=H-h-30:enable='gte(t,\\$\\{g2.toFixed(2)\\})*lt(t,\\$\\{voiceDur.toFixed(2)\\})*eq(mod(floor(t*5),2),0)'[e];\\n[e][talk]overlay=x=(W-w)/2:y=H-h-30:enable='gte(t,\\$\\{g2.toFixed(2)\\})*lt(t,\\$\\{voiceDur.toFixed(2)\\})*eq(mod(floor(t*5),2),1)'[f];\\n[f][idle]overlay=x=(W-w)/2:y=H-h-30:enable='gte(t,\\$\\{voiceDur.toFixed(2)\\})'[v]" \\
      -map "[v]" -map 0:a? -c:v libx264 -preset veryfast -pix_fmt yuv420p -c:a aac -shortest -t \\$\{total.toFixed(2)\} "\\$\{gestMp4\}"\\
    \\`;
  runFfmpeg(gestCmd.replace(/\\n/g, ''), 'gestures_single_pass');

`;

// The above template is messy with escaping. Write a cleaner block as plain JS source:
const cleanBlock = [
  "  // ARCHIE_GESTURE_SINGLE_PASS_V3",
  "  const gestMp4 = path.join(ARTIFACTS, 'pass_gestures.mp4');",
  "  const gestCmd = `ffmpeg -y -i \"${sceneMp4}\" -loop 1 -t ${total.toFixed(2)} -i \"${point}\" -loop 1 -t ${total.toFixed(2)} -i \"${talk}\" -loop 1 -t ${total.toFixed(2)} -i \"${talk2}\" -loop 1 -t ${total.toFixed(2)} -i \"${open}\" -loop 1 -t ${total.toFixed(2)} -i \"${idle}\" -filter_complex \"[1:v]scale=-1:1050,format=rgba[point];[2:v]scale=-1:1050,format=rgba[talk];[3:v]scale=-1:1050,format=rgba[talk2];[4:v]scale=-1:1050,format=rgba[open];[5:v]scale=-1:1050,format=rgba[idle];[0:v][point]overlay=x=(W-w)/2:y=H-h-30:enable='lt(t,${g1.toFixed(2)})*eq(mod(floor(t*5),2),0)'[a];[a][talk]overlay=x=(W-w)/2:y=H-h-30:enable='lt(t,${g1.toFixed(2)})*eq(mod(floor(t*5),2),1)'[b];[b][talk]overlay=x=(W-w)/2:y=H-h-30:enable='gte(t,${g1.toFixed(2)})*lt(t,${g2.toFixed(2)})*eq(mod(floor(t*5),2),0)'[c];[c][talk2]overlay=x=(W-w)/2:y=H-h-30:enable='gte(t,${g1.toFixed(2)})*lt(t,${g2.toFixed(2)})*eq(mod(floor(t*5),2),1)'[d];[d][open]overlay=x=(W-w)/2:y=H-h-30:enable='gte(t,${g2.toFixed(2)})*lt(t,${voiceDur.toFixed(2)})*eq(mod(floor(t*5),2),0)'[e];[e][talk]overlay=x=(W-w)/2:y=H-h-30:enable='gte(t,${g2.toFixed(2)})*lt(t,${voiceDur.toFixed(2)})*eq(mod(floor(t*5),2),1)'[f];[f][idle]overlay=x=(W-w)/2:y=H-h-30:enable='gte(t,${voiceDur.toFixed(2)})'[v]\" -map \"[v]\" -map 0:a? -c:v libx264 -preset veryfast -pix_fmt yuv420p -c:a aac -shortest -t ${total.toFixed(2)} \"${gestMp4}\"`;",
  "  runFfmpeg(gestCmd, 'gestures_single_pass');",
  "",
].join('\n');

t = t.slice(0, start) + cleanBlock + '\n' + t.slice(end);
try {
  fs.writeFileSync(p, t);
  execSync(`node --check "${p}"`, { stdio: 'pipe' });
  console.log('[archie-gest] single-pass v3 OK');
} catch (e) {
  fs.writeFileSync(p, backup);
  console.warn('[archie-gest] reverted', e.message);
}
