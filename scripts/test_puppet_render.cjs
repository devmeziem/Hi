/**
 * Test script for 3D Comparison Puppet Compositor in FFmpeg
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PUPPET_DIR = path.join(process.cwd(), 'cartoon_character_assets', 'comparison_puppet');
const OUTPUT_DIR = path.join(process.cwd(), 'rendered_videos');
const TEST_MP4 = path.join(OUTPUT_DIR, 'test_puppet_scene.mp4');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Create test 4-second audio tone or use existing audio
const testWav = path.join(process.cwd(), 'test_artifacts', 'test_audio.wav');
if (!fs.existsSync(testWav)) {
  execSync(`ffmpeg -y -f lavfi -i "aevalsrc=sin(2*PI*440*t)*0.1:s=44100:d=4.0" -c:a pcm_s16le "${testWav}" 2>/dev/null`);
}

// Create comparison studio background
const bgSvg = path.join(process.cwd(), 'test_artifacts', 'comparison_bg.svg');
const bgSvgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
  <defs>
    <linearGradient id="studio" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="40%" stop-color="#1e1b4b" />
      <stop offset="100%" stop-color="#090d16" />
    </linearGradient>
    <radialGradient id="glowL" cx="25%" cy="25%" r="40%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="glowR" cx="75%" cy="25%" r="40%">
      <stop offset="0%" stop-color="#f43f5e" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="1080" height="1920" fill="url(#studio)" />
  <rect width="1080" height="1920" fill="url(#glowL)" />
  <rect width="1080" height="1920" fill="url(#glowR)" />

  <!-- Comparison Card Left (Option A) -->
  <rect x="70" y="240" width="430" height="480" rx="24" fill="#1e293b" fill-opacity="0.85" stroke="#38bdf8" stroke-width="4" />
  <text x="285" y="320" font-family="Arial, sans-serif" font-size="34" font-weight="900" fill="#38bdf8" text-anchor="middle">OPTION A</text>
  <text x="285" y="390" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#ffffff" text-anchor="middle">Fast &amp; Cheap</text>
  <text x="285" y="470" font-family="Arial, sans-serif" font-size="48" font-weight="900" fill="#38bdf8" text-anchor="middle">$10</text>
  <text x="285" y="550" font-family="Arial, sans-serif" font-size="22" fill="#94a3b8" text-anchor="middle">Instant Results</text>

  <!-- Comparison Card Right (Option B) -->
  <rect x="580" y="240" width="430" height="480" rx="24" fill="#1e293b" fill-opacity="0.85" stroke="#f43f5e" stroke-width="4" />
  <text x="795" y="320" font-family="Arial, sans-serif" font-size="34" font-weight="900" fill="#f43f5e" text-anchor="middle">OPTION B</text>
  <text x="795" y="390" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#ffffff" text-anchor="middle">High Quality</text>
  <text x="795" y="470" font-family="Arial, sans-serif" font-size="48" font-weight="900" fill="#f43f5e" text-anchor="middle">$100</text>
  <text x="795" y="550" font-family="Arial, sans-serif" font-size="22" fill="#94a3b8" text-anchor="middle">Long-Term Value</text>

  <!-- VS Badge -->
  <circle cx="540" cy="480" r="55" fill="#0f172a" stroke="#fbbf24" stroke-width="4" />
  <text x="540" y="492" font-family="Arial, sans-serif" font-size="32" font-weight="900" fill="#fbbf24" text-anchor="middle">VS</text>
</svg>`;
fs.writeFileSync(bgSvg, bgSvgContent, 'utf8');

const bgPng = path.join(process.cwd(), 'test_artifacts', 'comparison_bg.png');
execSync(`ffmpeg -y -i "${bgSvg}" "${bgPng}" 2>/dev/null`);

console.log('[Puppet Test] Testing walking, pointing, and eye-closing puppet compositing...');

// Animate puppet walking in, pointing right, and blinking
const puppetWalk = path.join(PUPPET_DIR, 'puppet_walking.png');
const puppetPoint = path.join(PUPPET_DIR, 'puppet_point_right.png');
const puppetEyesClosed = path.join(PUPPET_DIR, 'puppet_eyes_closed.png');

const duration = 4.0;

// Filter complex:
// 1. Walk in from t=0 to 1.2s: moves from -300 to 280 with step bounce
// 2. Switch to point_right from 1.2s to 4.0s
// 3. At 2.4s-2.55s, eyes blink!
const filterComplex = [
  // Background
  `[0:v]scale=1080:1920[bg]`,
  
  // Walking puppet (scaled to height 1000)
  `[1:v]scale=-1:1000[walk]`,
  
  // Pointing puppet (scaled to height 1000)
  `[2:v]scale=-1:1000[point]`,
  
  // Eyes closed puppet (scaled to height 1000)
  `[3:v]scale=-1:1000[eyes]`,

  // Composite walk during t=0 to 1.2
  `[bg][walk]overlay=x='if(lte(t,1.2), -300 + t*480, -9999)':y='820 + 10*abs(sin(t*12))':enable='lte(t,1.2)'[s1]`,

  // Composite point during t=1.2 to 4.0 (except during blink 2.5-2.65)
  `[s1][point]overlay=x=276:y='820 + 4*sin(t*3)':enable='between(t,1.2,2.5)+between(t,2.65,4.0)'[s2]`,

  // Composite blink at 2.5-2.65
  `[s2][eyes]overlay=x=320:y='820 + 4*sin(t*3)':enable='between(t,2.5,2.65)'[v]`
].join(';');

const cmd = `ffmpeg -y -loop 1 -t ${duration} -i "${bgPng}" -loop 1 -t ${duration} -i "${puppetWalk}" -loop 1 -t ${duration} -i "${puppetPoint}" -loop 1 -t ${duration} -i "${puppetEyesClosed}" -i "${testWav}" -filter_complex "${filterComplex}" -map "[v]" -map 4:a -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k -t ${duration} "${TEST_MP4}"`;

execSync(cmd);

console.log('✅ Test scene rendered successfully:', TEST_MP4, fs.statSync(TEST_MP4).size, 'bytes');
