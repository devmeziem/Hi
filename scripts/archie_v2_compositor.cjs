/**
 * Archie v2 — stable timeline compositor
 * - 3 poses only: idle, talk, point
 * - Studio plate + Ken Burns
 * - Short B-roll PiP (max ~3.5s)
 * - Soft-fail anything missing
 * - Style pack from style_rotation_engine
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { selectStylePack, buildRotatingAss } = require('./style_rotation_engine.cjs');

const ART = path.join(process.cwd(), 'test_artifacts', 'archie_v2');
const OUT = path.join(process.cwd(), 'rendered_videos');

function ensureDirs() {
  for (const d of [ART, OUT]) if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function run(cmd, label) {
  const log = path.join(ART, `ff_${label}.log`);
  try {
    execSync(cmd + ` 2>"${log}"`, { stdio: 'pipe' });
  } catch (e) {
    let err = e.message;
    try {
      err = fs.readFileSync(log, 'utf8').slice(-600);
    } catch (_) {}
    throw new Error(`${label}: ${err}`);
  }
}

function durOf(file) {
  try {
    const o = execSync(
      `ffprobe -v error -show_entries format=duration -of default=nk=1:nw=1 "${file}"`,
      { encoding: 'utf8' }
    );
    return Math.max(0.5, parseFloat(o) || 1);
  } catch {
    return 8;
  }
}

function findPuppet() {
  // Real asset locations in this repo (committed PNGs)
  const roots = [
    path.join(process.cwd(), 'cartoon_character_assets', 'exact_puppet'),
    path.join(process.cwd(), 'cartoon_character_assets', 'comparison_puppet'),
    path.join(process.cwd(), 'assets', 'puppet'),
    path.join(process.cwd(), 'test_artifacts', 'puppet'),
    path.join(process.cwd(), 'src', 'assets', 'puppet'),
    path.join(process.cwd(), 'public', 'puppet')
  ];
  const want = {
    idle: ['puppet_idle.png', 'puppet_talking.png', 'archie_idle.png'],
    talk: [
      'puppet_talking.png',
      'puppet_explain_both_talk.png',
      'puppet_open_palms_talk.png',
      'puppet_idle.png'
    ],
    point: [
      'puppet_point_camera.png',
      'puppet_point_up_right.png',
      'puppet_open_palms.png',
      'puppet_point_right.png'
    ]
  };
  const found = { idle: null, talk: null, point: null };
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const pose of Object.keys(want)) {
      if (found[pose]) continue;
      for (const name of want[pose]) {
        const p = path.join(root, name);
        if (fs.existsSync(p) && fs.statSync(p).size > 1000) {
          found[pose] = p;
          break;
        }
      }
    }
  }
  // fallback: any png in puppet folders
  if (!found.idle) {
    for (const root of roots) {
      if (!fs.existsSync(root)) continue;
      let files = [];
      try {
        files = fs.readdirSync(root).filter((f) => /\.png$/i.test(f));
      } catch (_) {
        continue;
      }
      if (files.length) {
        found.idle = path.join(root, files[0]);
        found.talk = found.talk || found.idle;
        found.point = found.point || found.idle;
        break;
      }
    }
  }
  found.talk = found.talk || found.idle;
  found.point = found.point || found.idle;
  if (found.idle) {
    console.log('[Archie v2] puppets', {
      idle: path.basename(found.idle),
      talk: path.basename(found.talk),
      point: path.basename(found.point),
      dir: path.dirname(found.idle)
    });
  }
  return found;
}

function studioPng(mode, outPng) {
  const bg = mode === 'black' ? '#0b0f14' : '#f4f6f8';
  const accent = mode === 'black' ? '#38bdf8' : '#0ea5e9';
  const svg = path.join(ART, 'studio.svg');
  fs.writeFileSync(
    svg,
    `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="${mode === 'black' ? '#020617' : '#e2e8f0'}"/>
    </linearGradient>
    <radialGradient id="spot" cx="50%" cy="35%" r="45%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1080" height="1920" fill="url(#g)"/>
  <circle cx="540" cy="620" r="420" fill="url(#spot)"/>
  <rect x="80" y="1500" width="920" height="8" rx="4" fill="${accent}" fill-opacity="0.35"/>
</svg>`
  );
  run(`ffmpeg -y -i "${svg}" "${outPng}"`, 'studio');
}

/**
 * Compose Archie v2
 */
async function composeArchieV2(opts = {}) {
  ensureDirs();
  const voiceWav = opts.voiceWav;
  if (!voiceWav || !fs.existsSync(voiceWav)) throw new Error('Archie v2 needs voiceWav');

  const puppets = findPuppet();
  if (!puppets.idle) throw new Error('Archie v2: no puppet assets found');

  const voiceDur = durOf(voiceWav);
  const total = voiceDur + 0.55;
  const pack = selectStylePack('archie', opts.seed || opts.scriptText || Date.now());
  console.log('[Archie v2] style:', pack.summary);

  const studioMode = opts.studio === 'white' ? 'white' : 'black';
  const studio = path.join(ART, 'studio.png');
  studioPng(studioMode, studio);

  // Mix VO + BGM
  const mixed = path.join(ART, 'mixed.wav');
  const bgm = opts.bgmPath && fs.existsSync(opts.bgmPath) ? opts.bgmPath : null;
  if (bgm) {
    run(
      `ffmpeg -y -i "${voiceWav}" -stream_loop -1 -i "${bgm}" -filter_complex "[0:a]volume=1.5[v];[1:a]volume=0.42,atrim=0:${total.toFixed(2)},afade=t=in:d=0.3,afade=t=out:st=${Math.max(0.2, total - 0.7).toFixed(2)}:d=0.55[b];[v][b]amix=inputs=2:duration=first:dropout_transition=2[a]" -map "[a]" -t ${total.toFixed(2)} "${mixed}"`,
      'mix'
    );
  } else {
    run(`ffmpeg -y -i "${voiceWav}" -t ${total.toFixed(2)} "${mixed}"`, 'mix_vo');
  }

  // Base studio plate with light Ken Burns
  const frames = Math.ceil(total * 30);
  const base = path.join(ART, 'base.mp4');
  run(
    `ffmpeg -y -loop 1 -t ${total.toFixed(2)} -i "${studio}" -vf "scale=1200:2133:force_original_aspect_ratio=increase,crop=1200:2133,zoompan=z='min(1.08,1+0.0002*on)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1080x1920:fps=30" -c:v libx264 -pix_fmt yuv420p -t ${total.toFixed(2)} "${base}"`,
    'base'
  );

  // Character overlays: point → talk/idle lipsync alternate → idle
  const tPoint = Math.max(1.4, voiceDur * 0.16);
  const char = path.join(ART, 'char.mp4');
  try {
    run(
      `ffmpeg -y -i "${base}" -loop 1 -t ${total.toFixed(2)} -i "${puppets.point}" -loop 1 -t ${total.toFixed(2)} -i "${puppets.talk}" -loop 1 -t ${total.toFixed(2)} -i "${puppets.idle}" -filter_complex "[1:v]scale=-1:1000,format=rgba[p];[2:v]scale=-1:1000,format=rgba[t];[3:v]scale=-1:1000,format=rgba[i];[0:v][p]overlay=x=(W-w)/2:y=H-h-60:enable='lt(t,${tPoint.toFixed(2)})'[a];[a][t]overlay=x=(W-w)/2:y=H-h-60:enable='gte(t,${tPoint.toFixed(2)})*lt(t,${voiceDur.toFixed(2)})*eq(mod(floor(t*5),2),0)'[b];[b][i]overlay=x=(W-w)/2:y=H-h-60:enable='gte(t,${tPoint.toFixed(2)})*lt(t,${voiceDur.toFixed(2)})*eq(mod(floor(t*5),2),1)'[c];[c][i]overlay=x=(W-w)/2:y=H-h-60:enable='gte(t,${voiceDur.toFixed(2)})'[v]" -map "[v]" -map 0:a? -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest -t ${total.toFixed(2)} "${char}"`,
      'char'
    );
  } catch (e) {
    console.warn('[Archie v2] char overlay soft-fail:', e.message.slice(0, 160));
    fs.copyFileSync(base, char);
  }

  // Optional short B-roll PiP mid-VO
  let withBroll = char;
  if (opts.brollPath && fs.existsSync(opts.brollPath)) {
    const br = path.join(ART, 'broll.mp4');
    const brStart = Math.max(2, voiceDur * 0.35);
    const brDur = Math.min(3.2, Math.max(1.5, voiceDur * 0.2));
    try {
      run(
        `ffmpeg -y -i "${char}" -i "${opts.brollPath}" -filter_complex "[1:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,fps=30,setpts=PTS-STARTPTS[br];[0:v][br]overlay=x=(W-w)/2:y=180:enable='between(t,${brStart.toFixed(2)},${(brStart + brDur).toFixed(2)})'[v]" -map "[v]" -map 0:a? -c:v libx264 -pix_fmt yuv420p -c:a aac -t ${total.toFixed(2)} "${br}"`,
        'broll'
      );
      withBroll = br;
    } catch (e) {
      console.warn('[Archie v2] broll skip:', e.message.slice(0, 120));
    }
  }

  // Captions via rotating ASS
  const assPath = path.join(ART, 'captions.ass');
  fs.writeFileSync(assPath, buildRotatingAss(opts.scriptText || '', voiceDur, pack));
  const capped = path.join(ART, 'capped.mp4');
  try {
    const assForVf = assPath.replace(/\\/g, '/').replace(/:/g, '\\:');
    run(
      `ffmpeg -y -i "${withBroll}" -vf "ass='${assForVf}'" -c:v libx264 -pix_fmt yuv420p -c:a copy -t ${total.toFixed(2)} "${capped}"`,
      'ass'
    );
  } catch {
    fs.copyFileSync(withBroll, capped);
  }

  const outPath = opts.outPath || path.join(OUT, 'archie_latest.mp4');
  run(
    `ffmpeg -y -i "${capped}" -i "${mixed}" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -t ${total.toFixed(2)} "${outPath}"`,
    'mux'
  );

  console.log('[Archie v2] OK', outPath, (fs.statSync(outPath).size / 1024 / 1024).toFixed(2) + 'MB');
  return { outPath, pack, duration: total };
}

module.exports = { composeArchieV2, findPuppet, selectStylePack };
