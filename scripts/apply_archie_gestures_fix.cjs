#!/usr/bin/env node
/** Sequential gestures + faster lipsync alternation (talk/talk2 ~5Hz feel). */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const p = path.join(process.cwd(), 'scripts', 'generate_archie_live_reel.cjs');
if (!fs.existsSync(p)) process.exit(0);
let t = fs.readFileSync(p, 'utf8');
if (t.includes('ARCHIE_GESTURE_SEQUENTIAL_V2')) {
  console.log('[archie-gest] already v2');
  process.exit(0);
}
const backup = t;
const markerStart = t.indexOf("  const gestMp4 = path.join(ARTIFACTS, 'pass_gestures.mp4');");
if (markerStart < 0) {
  console.warn('[archie-gest] marker missing');
  process.exit(0);
}
const markerEnd = t.indexOf("  const assPath = path.join(ARTIFACTS, 'archie_caps.ass');");
if (markerEnd < 0) {
  console.warn('[archie-gest] end missing');
  process.exit(0);
}
const block = [
  "  // ARCHIE_GESTURE_SEQUENTIAL_V2 — fast lipsync + clear pose phases",
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
  "      `ffmpeg -y -i \"${inp}\" -loop 1 -t ${total.toFixed(2)} -i \"${img}\" -filter_complex \"[1:v]scale=-1:1050,format=rgba[p];[0:v][p]overlay=x=(W-w)/2:y=H-h-20:${en}[v]\" -map \"[v]\" -map 0:a? -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -shortest -t ${total.toFixed(2)} \"${out}\"`,",
  "      label",
  "    );",
  "  }",
  "  // Faster mouth: alternate talk/talk2 every 0.18s during speech",
  "  function lipsyncPass(inp, out, t0, t1, label) {",
  "    let cur = inp;",
  "    let i = 0;",
  "    for (let s = t0; s < t1 - 0.05; s += 0.18) {",
  "      const e = Math.min(t1, s + 0.18);",
  "      const img = i % 2 === 0 ? talk : talk2;",
  "      const next = path.join(ARTIFACTS, `lip_${label}_${i}.mp4`);",
  "      ov(cur, img, next, s, e, `lip_${label}_${i}`);",
  "      cur = next;",
  "      i++;",
  "      if (i > 80) break;",
  "    }",
  "    if (cur !== inp) fs.copyFileSync(cur, out);",
  "    else ov(inp, talk, out, t0, t1, label);",
  "  }",
  "  ov(sceneMp4, point, gest1, 0, g1, 'gest_point');",
  "  lipsyncPass(gest1, gest2, g1, g2, 'teach');",
  "  lipsyncPass(gest2, gest3, g2, voiceDur, 'close');",
  "  ov(gest3, idle, gestMp4, voiceDur, total + 0.01, 'gest_idle');",
  "",
].join('\n');
t = t.slice(0, markerStart) + block + '\n' + t.slice(markerEnd);
try {
  fs.writeFileSync(p, t);
  execSync(`node --check "${p}"`, { stdio: 'pipe' });
  console.log('[archie-gest] sequential v2 + fast lipsync OK');
} catch (e) {
  fs.writeFileSync(p, backup);
  console.warn('[archie-gest] reverted', e.message);
}
