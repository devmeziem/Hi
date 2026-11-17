#!/usr/bin/env node
/**
 * Fin channel pilot — Athletic_man.fbx host + live educational script
 * Requires: assets/characters/Athletic_man.fbx (user-uploaded)
 * Renders Blender poses → Ken Burns scenes → Edge TTS Andrew → final short
 */
const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');
const { callActiveAiForJson } = require('./topic_discovery_engine.cjs');
const { synthesizeSpeechResilient } = require('./tts_resilient_engine.cjs');

const FBX = path.join(process.cwd(), 'assets', 'characters', 'Athletic_man.fbx');
const ART = path.join(process.cwd(), 'test_artifacts', 'fin_character');
const OUT = path.join(process.cwd(), 'rendered_videos');
const isDry = String(process.env.DRY_RUN || 'false') === 'true';

function ensureDirs() {
  for (const d of [ART, OUT]) if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function findBlender() {
  for (const c of ['blender', '/usr/bin/blender', '/snap/bin/blender']) {
    try {
      const r = spawnSync(c, ['--version'], { encoding: 'utf8' });
      if (r.status === 0) return c;
    } catch (_) {}
  }
  return null;
}

async function buildScript() {
  const systemPrompt = `You write a 35-42 second financial education short for students/under-25.
Return STRICT JSON only.
Rules:
- Practical, Nigeria-first when relevant, then global. No get-rich-quick. No guaranteed returns.
- 90-115 spoken words across exactly 5 scenes.
- Firm coach tone. No "take action now" spam.
- Soft CTA only in description (xenvest.name.ng / lanecash.name.ng allowed as backlink).
- Disclaimer line in description.
JSON:
{
  "title": "max 70 chars",
  "description": "2-3 lines + soft CTA + disclaimer",
  "hashtags": ["#FinTok", "#MoneyTips", "#StudentFinance", "#FYP", "#Shorts"],
  "bgmQuery": "soft piano ambient focus no drums",
  "scenes": [
    { "role": "hook", "text": "..." },
    { "role": "explain", "text": "..." },
    { "role": "example", "text": "..." },
    { "role": "steps", "text": "..." },
    { "role": "close", "text": "..." }
  ]
}`;
  const userPrompt = `Topic angle: three cheap or free digital skills that quietly build income for students in 2026. Make it specific and honest. Nonce: ${Date.now()}`;

  for (let i = 1; i <= 4; i++) {
    try {
      const res = await callActiveAiForJson(systemPrompt, userPrompt, null, {
        nicheKey: 'finance',
        temperature: 0.7
      });
      const data = res?.data || res;
      if (data?.scenes?.length >= 5 && data.title) {
        data.scenes = data.scenes.slice(0, 5);
        return data;
      }
    } catch (e) {
      console.warn('[FinPilot AI]', e.message);
    }
  }
  throw new Error('Fin pilot AI failed — no seed script');
}

function buildAss(fullText, duration) {
  const words = String(fullText).replace(/\n/g, ' ').split(/\s+/).filter(Boolean);
  const wordsPerLine = 4;
  const totalMs = Math.round(duration * 1000);
  const msPerWord = words.length ? totalMs / words.length : 320;
  const fmt = (ms) => {
    const s = Math.floor(ms / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    const sec = s % 60;
    const min = Math.floor((s % 3600) / 60);
    const hr = Math.floor(s / 3600);
    return `${hr}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  };
  const lines = [];
  for (let i = 0; i < words.length; i += wordsPerLine) {
    const chunk = words.slice(i, i + wordsPerLine);
    const a = Math.round(i * msPerWord);
    const b = Math.min(totalMs, Math.round((i + chunk.length) * msPerWord + 120));
    let k = '';
    for (const w of chunk) k += `{\kf${Math.max(8, Math.round(msPerWord / 10))}}${String(w).toUpperCase()} `;
    lines.push(`Dialogue: 0,${fmt(a)},${fmt(b)},CenterKaraoke,,0,0,0,,${k.trim()}`);
  }
  return `[Script Info]
Title: Fin Character Pilot
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: CenterKaraoke,Arial Black,50,&H00FFFFFF,&H0000D7FF,&H00000000,&H00000000,1,0,0,0,100,100,0.5,0,1,3.0,0,5,70,70,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${lines.join('\n')}
`;
}

function softPiano(outWav, duration) {
  const d = duration.toFixed(2);
  const filter = `aevalsrc='0.03*sin(2*PI*130.81*t)+0.025*sin(2*PI*164.81*t)':s=44100:d=${d}[p]; anoisesrc=d=${d}:c=pink:a=0.005[n]; [p][n]amix=inputs=2,lowpass=f=800,afade=t=in:st=0:d=1,afade=t=out:st=${Math.max(0, duration - 1.5).toFixed(2)}:d=1.5[out]`;
  execSync(`ffmpeg -y -f lavfi -i "${filter}" -map "[out]" -c:a pcm_s16le -ar 44100 -ac 2 -t ${d} "${outWav}" 2>/dev/null`, {
    stdio: 'pipe'
  });
}

async function main() {
  ensureDirs();
  console.log('\n=== FIN CHARACTER PILOT ===');
  if (!fs.existsSync(FBX) || fs.statSync(FBX).size < 100000) {
    console.error('Missing assets/characters/Athletic_man.fbx');
    console.error('Upload URL: https://github.com/devmeziem/Hi/upload/main/assets/characters');
    process.exit(2);
  }
  console.log('[Fin] FBX OK', (fs.statSync(FBX).size / 1e6).toFixed(2), 'MB');

  const blender = findBlender();
  if (!blender) {
    console.error('Blender not installed on runner');
    process.exit(3);
  }

  const py = path.join(process.cwd(), 'scripts', 'blender_render_athletic_man.py');
  const env = {
    ...process.env,
    FIN_FBX_PATH: FBX,
    FIN_RENDER_DIR: ART,
    FIN_RES_X: '1080',
    FIN_RES_Y: '1920'
  };
  console.log('[Fin] Blender render…');
  const br = spawnSync(blender, ['-b', '-P', py], { env, encoding: 'utf8', timeout: 600000 });
  if (br.stdout) console.log(br.stdout.slice(-2000));
  if (br.status !== 0) {
    console.error(br.stderr || br.stdout || 'blender failed');
    process.exit(4);
  }

  const poses = ['front', 'three_quarter', 'side', 'close', 'low']
    .map((n) => path.join(ART, `pose_${n}.png`))
    .filter((p) => fs.existsSync(p));
  if (poses.length < 3) {
    console.error('Not enough rendered poses');
    process.exit(5);
  }

  const pack = await buildScript();
  console.log('[Fin] title:', pack.title);
  const spoken = pack.scenes.map((s) => s.text).join(' ');
  const voice = path.join(ART, `voice_${Date.now()}.mp3`);
  await synthesizeSpeechResilient(spoken, voice, {
    voice: 'en-US-AndrewNeural',
    rate: '-8%',
    pitch: '-18Hz',
    emotionProfile: 'motivation'
  });

  let voiceDur = 38;
  try {
    voiceDur = parseFloat(
      execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${voice}"`, {
        encoding: 'utf8'
      }).trim()
    );
  } catch (_) {}
  const total = Math.min(Math.max(voiceDur + 0.4, 34), 45);
  const secPer = total / pack.scenes.length;

  const bgm = path.join(ART, `bgm_${Date.now()}.wav`);
  softPiano(bgm, total);
  const ass = path.join(ART, `cap_${Date.now()}.ass`);
  fs.writeFileSync(ass, buildAss(spoken, total));

  const clips = [];
  for (let i = 0; i < pack.scenes.length; i++) {
    const img = poses[i % poses.length];
    const out = path.join(ART, `sc_${i}.mp4`);
    const frames = Math.max(30, Math.ceil(secPer * 30));
    const zoom = i % 2 === 0 ? "min(zoom+0.0014,1.1)" : "if(eq(on,1),1.1,max(zoom-0.0011,1.0))";
    execSync(
      `ffmpeg -y -loop 1 -t ${secPer.toFixed(2)} -i "${img}" -vf "scale=1200:2133:force_original_aspect_ratio=increase,crop=1200:2133,zoompan=z='${zoom}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1080x1920:fps=30,eq=contrast=1.08:saturation=0.95" -c:v libx264 -preset veryfast -crf 19 -pix_fmt yuv420p -t ${secPer.toFixed(2)} "${out}"`,
      { stdio: 'pipe' }
    );
    clips.push(out);
  }

  const list = path.join(ART, 'concat.txt');
  fs.writeFileSync(list, clips.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n'));
  const silent = path.join(ART, 'silent.mp4');
  execSync(`ffmpeg -y -f concat -safe 0 -i "${list}" -c:v libx264 -preset veryfast -crf 19 -pix_fmt yuv420p -r 30 "${silent}"`, {
    stdio: 'pipe'
  });

  const finalMp4 = path.join(OUT, 'fin_character_latest.mp4');
  const esc = ass.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "\\'");
  const filter = `[1:a]volume=1.45[vo];[2:a]volume=0.28,afade=t=in:st=0:d=0.8,afade=t=out:st=${(total - 1.2).toFixed(2)}:d=1[bg];[vo][bg]amix=inputs=2:duration=longest[a];[0:v]subtitles='${esc}'[v]`;
  execSync(
    `ffmpeg -y -i "${silent}" -i "${voice}" -i "${bgm}" -filter_complex "${filter}" -map "[v]" -map "[a]" -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -t ${total.toFixed(2)} "${finalMp4}"`,
    { stdio: 'pipe' }
  );

  const meta = {
    title: pack.title,
    description: pack.description,
    hashtags: pack.hashtags,
    character: 'Athletic_man.fbx',
    duration: total,
    mode: 'fin_character_pilot'
  };
  fs.writeFileSync(path.join(OUT, 'fin_character_meta.json'), JSON.stringify(meta, null, 2));
  console.log(`[Fin] done "${pack.title}" ${total.toFixed(1)}s → ${finalMp4}`);
  if (isDry) console.log('[Fin] dry run');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
