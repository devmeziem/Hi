#!/usr/bin/env node
/**
 * Reliable GH Actions cinematic storm/ocean pack (no Kaggle required).
 * Makes N vertical clips + one stitched master. Tested filters only.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUT = path.join(process.cwd(), 'rendered_videos');
const ART = path.join(process.cwd(), 'test_artifacts', 'storm_pack');
const N = Math.max(2, Math.min(6, parseInt(process.env.STORM_CLIPS || '4', 10) || 4));
const SEC = Math.max(3, Math.min(8, parseFloat(process.env.STORM_SEC || '5') || 5));

function sh(cmd) {
  execSync(cmd, { stdio: 'pipe' });
}

function ensure() {
  for (const d of [OUT, ART]) if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

const PRESETS = [
  { name: 'deep_storm', color: '0x061018', noise: 28, contrast: 1.28, sat: 0.35, bright: -0.06 },
  { name: 'blue_tempest', color: '0x0a1a30', noise: 24, contrast: 1.2, sat: 0.5, bright: -0.04 },
  { name: 'purple_night', color: '0x120c22', noise: 22, contrast: 1.22, sat: 0.55, bright: -0.05 },
  { name: 'ocean_dark', color: '0x031525', noise: 16, contrast: 1.15, sat: 0.7, bright: -0.02 },
  { name: 'horizon_storm', color: '0x0c1520', noise: 20, contrast: 1.18, sat: 0.45, bright: -0.03 },
  { name: 'flash_sky', color: '0x101828', noise: 30, contrast: 1.35, sat: 0.3, bright: 0.0 },
];

function makeClip(i, preset) {
  const out = path.join(ART, `clip_${String(i).padStart(2, '0')}_${preset.name}.mp4`);
  // Lightning-ish: brief white flash via fade overlays is hard; use noise intensity instead
  const vf = [
    `scale=1080:1920`,
    `noise=alls=${preset.noise}:allf=t`,
    `eq=contrast=${preset.contrast}:brightness=${preset.bright}:saturation=${preset.sat}`,
    `fps=30`,
  ].join(',');
  sh(
    `ffmpeg -y -f lavfi -i "color=c=${preset.color}:s=1080x1920:d=${SEC}" -vf "${vf}" -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -t ${SEC} "${out}"`
  );
  // soft thunder bed
  const wav = path.join(ART, `sfx_${i}.wav`);
  sh(
    `ffmpeg -y -f lavfi -i "anoisesrc=d=${SEC}:c=pink:a=0.04" -af "lowpass=f=200,volume=0.35,afade=t=in:d=0.3,afade=t=out:st=${SEC - 0.4}:d=0.35" -t ${SEC} "${wav}"`
  );
  const withA = path.join(ART, `clip_${String(i).padStart(2, '0')}_a.mp4`);
  sh(
    `ffmpeg -y -i "${out}" -i "${wav}" -c:v copy -c:a aac -b:a 128k -shortest "${withA}"`
  );
  fs.copyFileSync(withA, out);
  const sz = fs.statSync(out).size;
  if (sz < 50000) throw new Error('clip too small ' + out);
  console.log('[Storm]', preset.name, (sz / 1024).toFixed(0) + 'KB');
  return out;
}

function main() {
  ensure();
  console.log('=== CINEMATIC STORM PACK ===', N, 'clips x', SEC, 's');
  const clips = [];
  for (let i = 0; i < N; i++) {
    clips.push(makeClip(i, PRESETS[i % PRESETS.length]));
  }
  const list = path.join(ART, 'concat.txt');
  fs.writeFileSync(
    list,
    clips.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n')
  );
  const master = path.join(OUT, 'storm_pack_stitched.mp4');
  sh(`ffmpeg -y -f concat -safe 0 -i "${list}" -c copy "${master}"`);
  // also re-encode unified for players that hate concat-copy
  const master2 = path.join(OUT, 'storm_pack_master.mp4');
  sh(
    `ffmpeg -y -i "${master}" -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -c:a aac -b:a 128k "${master2}"`
  );
  for (let i = 0; i < clips.length; i++) {
    fs.copyFileSync(clips[i], path.join(OUT, `storm_clip_${String(i).padStart(2, '0')}.mp4`));
  }
  const meta = {
    title: 'Cinematic Storm Pack',
    clips: clips.length,
    secondsEach: SEC,
    totalApprox: N * SEC,
    files: clips.map((_, i) => `storm_clip_${String(i).padStart(2, '0')}.mp4`),
    master: 'storm_pack_master.mp4',
    createdAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(OUT, 'storm_pack_meta.json'), JSON.stringify(meta, null, 2));
  console.log('[Storm] MASTER', master2, (fs.statSync(master2).size / 1e6).toFixed(2) + 'MB');
}

main();
