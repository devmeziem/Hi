#!/usr/bin/env node
/** Replace fragile single-graph Archie gestures with sequential overlays. */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const p = path.join(process.cwd(), 'scripts', 'generate_archie_live_reel.cjs');
if (!fs.existsSync(p)) process.exit(0);
let t = fs.readFileSync(p, 'utf8');
if (t.includes('ARCHIE_GESTURE_SEQUENTIAL_V1')) {
  console.log('[archie-gest] already');
  process.exit(0);
}
const backup = t;
const markerStart = t.indexOf('  const gestMp4 = path.join(ARTIFACTS, \'pass_gestures.mp4\');');
if (markerStart < 0) {
  console.warn('[archie-gest] marker missing');
  process.exit(0);
}
const markerEnd = t.indexOf('  const assPath = path.join(ARTIFACTS, \'archie_caps.ass\');');
if (markerEnd < 0) {
  console.warn('[archie-gest] end marker missing');
  process.exit(0);
}
const block = `  // ARCHIE_GESTURE_SEQUENTIAL_V1 — one overlay per pass (stable on GHA ffmpeg)
  const gest1 = path.join(ARTIFACTS, 'pass_g1.mp4');
  const gest2a = path.join(ARTIFACTS, 'pass_g2a.mp4');
  const gest2 = path.join(ARTIFACTS, 'pass_g2.mp4');
  const gest3 = path.join(ARTIFACTS, 'pass_g3.mp4');
  const gestMp4 = path.join(ARTIFACTS, 'pass_gestures.mp4');
  const ov = (inp, img, out, t0, t1, label) => {
    const en =
      t1 > t0
        ? \"enable='between(t,\" + t0.toFixed(2) + \",\" + t1.toFixed(2) + \")'\"
        : \"enable='gte(t,\" + t0.toFixed(2) + \")'\";
    runFfmpeg(
      'ffmpeg -y -i \"' +
        inp +
        '\" -loop 1 -t ' +
        total.toFixed(2) +
        ' -i \"' +
        img +
        '\" -filter_complex \"[1:v]scale=-1:1100,format=rgba[p];[0:v][p]overlay=x=(W-w)/2:y=H-h-40:' +
        en +
        '[v]\" -map \"[v]\" -map 0:a? -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -shortest -t ' +
        total.toFixed(2) +
        ' \"' +
        out +
        '\"',
      label
    );
  };
  const mid = (g1 + g2) / 2;
  ov(sceneMp4, point, gest1, 0, g1, 'gest_point');
  ov(gest1, talk, gest2a, g1, mid, 'gest_talk_a');
  ov(gest2a, talk2, gest2, mid, g2, 'gest_talk_b');
  ov(gest2, open, gest3, g2, voiceDur, 'gest_open');
  ov(gest3, idle, gestMp4, voiceDur, total + 0.01, 'gest_idle');

`;
// Simpler: write block without broken escaping - use template carefully
const block2 = [
  "  // ARCHIE_GESTURE_SEQUENTIAL_V1",
  "  const gest1 = path.join(ARTIFACTS, 'pass_g1.mp4');",
  "  const gest2a = path.join(ARTIFACTS, 'pass_g2a.mp4');",
  "  const gest2 = path.join(ARTIFACTS, 'pass_g2.mp4');",
  "  const gest3 = path.join(ARTIFACTS, 'pass_g3.mp4');",
  "  const gestMp4 = path.join(ARTIFACTS, 'pass_gestures.mp4');",
  "  function ov(inp, img, out, t0, t1, label) {",
  "    const en = t1 > t0",
  "      ? `enable='between(t,${t0.toFixed(2)},${t1.toFixed(2)})'`",
  "      : `enable='gte(t,${t0.toFixed(2)})'`;",
  "    runFfmpeg(",
  "      `ffmpeg -y -i \"${inp}\" -loop 1 -t ${total.toFixed(2)} -i \"${img}\" -filter_complex \"[1:v]scale=-1:1100,format=rgba[p];[0:v][p]overlay=x=(W-w)/2:y=H-h-40:${en}[v]\" -map \"[v]\" -map 0:a? -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -shortest -t ${total.toFixed(2)} \"${out}\"`,",
  "      label",
  "    );",
  "  }",
  "  const mid = (g1 + g2) / 2;",
  "  ov(sceneMp4, point, gest1, 0, g1, 'gest_point');",
  "  ov(gest1, talk, gest2a, g1, mid, 'gest_talk_a');",
  "  ov(gest2a, talk2, gest2, mid, g2, 'gest_talk_b');",
  "  ov(gest2, open, gest3, g2, voiceDur, 'gest_open');",
  "  ov(gest3, idle, gestMp4, voiceDur, total + 0.01, 'gest_idle');",
  "",
].join('\n');
t = t.slice(0, markerStart) + block2 + '\n' + t.slice(markerEnd);
try {
  fs.writeFileSync(p, t);
  execSync(`node --check "${p}"`, { stdio: 'pipe' });
  console.log('[archie-gest] sequential OK');
} catch (e) {
  fs.writeFileSync(p, backup);
  console.warn('[archie-gest] reverted', e.message);
}
