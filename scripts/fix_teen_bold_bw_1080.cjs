#!/usr/bin/env node
/** Teen: bolder voice, center bold captions, B&W stock, 1080p HQ, soft piano BGM */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const p = path.join(process.cwd(), 'scripts', 'generate_teen_situation_reel.cjs');
if (!fs.existsSync(p)) {
  console.warn('[teen-bold] missing generate script');
  process.exit(0);
}
let t = fs.readFileSync(p, 'utf8');
if (t.includes('TEEN_BOLD_BW_1080_V1')) {
  console.log('[teen-bold] already');
  process.exit(0);
}
const backup = t;
t = '/** TEEN_BOLD_BW_1080_V1 */\n' + t;

// Bolder voice defaults in-file
t = t.replace(/en-US-AndrewNeural/g, 'en-US-ChristopherNeural');
t = t.replace(/TEEN_RATE[^\n]*/g, (m) => m);
t = t.replace(/rate:\s*['\"][^'\"]+['\"]/g, "rate: '-8%'");
t = t.replace(/pitch:\s*['\"][^'\"]+['\"]/g, "pitch: '-15Hz'");
t = t.replace(/'-5%'/g, "'-8%'");
t = t.replace(/'-8Hz'/g, "'-15Hz'");

// ASS captions: bigger, bold, centered
t = t.replace(/MarginV:\s*\d+/g, 'MarginV: 360');
t = t.replace(/Fontsize:\s*\d+/g, 'Fontsize: 78');
t = t.replace(/Bold:\s*0/g, 'Bold: 1');
t = t.replace(/PrimaryColour:\s*&H[0-9A-Fa-f]+/g, 'PrimaryColour: &H00FFFFFF');
t = t.replace(/OutlineColour:\s*&H[0-9A-Fa-f]+/g, 'OutlineColour: &H00000000');
t = t.replace(/Outline:\s*\d+/g, 'Outline: 4');
t = t.replace(/Shadow:\s*\d+/g, 'Shadow: 2');

// Force B&W on video filters if scale present
if (!t.includes('hue=s=0')) {
  t = t.replace(
    /scale=1080:1920/g,
    'scale=1080:1920,hue=s=0,eq=contrast=1.08:brightness=-0.02'
  );
  t = t.replace(
    /format=yuv420p/g,
    'hue=s=0,format=yuv420p'
  );
}

// Encode quality 1080p
t = t.replace(/-crf\s*\d+/g, '-crf 17');
t = t.replace(/-preset\s*\w+/g, '-preset slow');
t = t.replace(/libx264/g, 'libx264');
if (!t.includes('-pix_fmt yuv420p')) {
  t = t.replace(/-c:v libx264/g, '-c:v libx264 -pix_fmt yuv420p');
}

// Soft piano BGM query bias
t = t.replace(/lo-?fi ambient/gi, 'soft solo piano ambient emotional');
t = t.replace(/phonk/gi, 'soft piano');
t = t.replace(/beat-heavy|with beats/gi, 'no drums soft piano');
if (t.includes('bgmQuery') || t.includes('musicQuery')) {
  t = t.replace(
    /(bgmQuery|musicQuery)\s*[:=]\s*['\"][^'\"]+['\"]/,
    "$1: 'soft solo piano calm ambient no drums'"
  );
}
// volume floor
t = t.replace(/volume=0\.0\d/g, 'volume=0.40');
t = t.replace(/volume=0\.1\d/g, 'volume=0.42');

try {
  fs.writeFileSync(p, t);
  execSync('node --check "' + p + '"', { stdio: 'pipe' });
  console.log('[teen-bold] OK');
} catch (e) {
  fs.writeFileSync(p, backup);
  console.warn('[teen-bold] reverted', e.message);
}
