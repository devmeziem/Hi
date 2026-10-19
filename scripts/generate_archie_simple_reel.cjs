#!/usr/bin/env node
/**
 * Archie — reliable simple reel
 * Public Wikipedia seeds + optional AI polish + Edge TTS + audible BGM + multi-beat captions
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { VOLUMES, VOICES, loadHistory, saveHistory, isDuplicate } = require('./content_system_shared.cjs');
const { ARCHIE_TOPIC_SEEDS, fetchWikipediaSummary } = require('./public_sources.cjs');
const { ARCHIE_SCRIPT } = require('./prompts_library.cjs');

const OUT = path.join(process.cwd(), 'rendered_videos');
const ART = path.join(process.cwd(), 'test_artifacts', 'archie_simple');
const HIST = path.join(process.cwd(), 'data', 'archie_topic_history.json');
const isDry = String(process.env.DRY_RUN || 'false') === 'true';
const BGM = VOLUMES.archie.bgm;
const VOICE = VOICES.archie;

async function buildTopic() {
  const history = loadHistory(HIST);
  const seeds = [...ARCHIE_TOPIC_SEEDS].sort(() => Math.random() - 0.5);
  for (const seed of seeds) {
    if (isDuplicate({ title: seed.title }, history, { overlapMax: 0.35, authorWindow: 0 })) continue;
    let explanation = '';
    try {
      const sum = await fetchWikipediaSummary(seed.wiki);
      if (sum?.extract) explanation = sum.extract.split('. ').slice(0, 3).join('. ') + '.';
    } catch (_) {}
    if (!explanation) {
      explanation = 'Here is the simple idea: everyday physics and biology explain what you feel, without magic.';
    }
    // Optional AI polish
    try {
      const { callActiveAiForJson } = require('./topic_discovery_engine.cjs');
      if (typeof callActiveAiForJson === 'function') {
        const polished = await callActiveAiForJson(
          ARCHIE_SCRIPT + `\nTopic: ${seed.title}\nWiki extract: ${explanation.slice(0, 500)}`
        );
        if (polished?.hook && polished?.explanation) {
          const topic = {
            title: polished.title || seed.title,
            hook: polished.hook,
            body: polished.explanation,
            cta: polished.cta || 'What should we explain next?',
            visual: polished.visual_query || seed.visual
          };
          saveHistory(HIST, { title: topic.title, text: topic.hook });
          return topic;
        }
      }
    } catch (e) {
      console.warn('[Archie] AI polish skip:', e.message);
    }
    const topic = {
      title: seed.title,
      hook: seed.title.replace('?', '.') + ' Here is why.',
      body: explanation,
      cta: 'Comment the everyday science question you want next.',
      visual: seed.visual
    };
    saveHistory(HIST, { title: topic.title, text: topic.hook });
    return topic;
  }
  throw new Error('No unique Archie topic');
}

async function edgeVoice(text, outFile) {
  const { synthesizeSpeechResilient } = require('./tts_resilient_engine.cjs');
  await synthesizeSpeechResilient(text, outFile, {
    voice: VOICE.id,
    rate: VOICE.rate,
    pitch: VOICE.pitch,
    emotionProfile: 'educator',
    timeout: 25000
  });
  if (!fs.existsSync(outFile) || fs.statSync(outFile).size < 1000) throw new Error('TTS empty');
}

function buildAss(lines, duration) {
  const slot = duration / lines.length;
  const fmt = (t) => {
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = Math.floor(t % 60);
    const cs = Math.floor((t % 1) * 100);
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  };
  let body = '';
  lines.forEach((line, i) => {
    const t0 = i * slot;
    const t1 = Math.min(duration, (i + 1) * slot);
    body += `Dialogue: 0,${fmt(t0)},${fmt(t1)},Default,,0,0,0,,{\\an2\\fs40\\b1\\c&H00FFFFFF&\\3c&H000000&\\bord3}${String(line).replace(/\n/g, '\\N')}\n`;
  });
  return `[Script Info]\nScriptType: v4.00+\nPlayResX: 1080\nPlayResY: 1920\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,Arial,40,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,3,2,2,50,50,100,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n${body}`;
}

async function main() {
  for (const d of [OUT, ART, path.dirname(HIST)]) if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  const topic = await buildTopic();
  console.log('[Archie Simple]', topic.title);

  const narration = [topic.hook, topic.body, topic.cta].join(' ');
  const voicePath = path.join(ART, `v_${Date.now()}.mp3`);
  const bgmPath = path.join(ART, `b_${Date.now()}.wav`);
  const assPath = path.join(ART, `c_${Date.now()}.ass`);
  const outPath = path.join(OUT, `archie_simple_${Date.now()}.mp4`);

  await edgeVoice(narration, voicePath);
  let duration = 22;
  try {
    duration = Math.max(16, Math.min(48, parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${voicePath}"`, { encoding: 'utf8' }).trim()) + 0.5));
  } catch (_) {}

  execSync(
    `ffmpeg -y -f lavfi -i "sine=frequency=130:duration=${duration}" -f lavfi -i "sine=frequency=196:duration=${duration}" -filter_complex "[0:a][1:a]amix=inputs=2:duration=first,lowpass=f=900,volume=${BGM}" "${bgmPath}"`,
    { stdio: 'pipe' }
  );

  const capLines = [topic.hook, topic.body.slice(0, 100), topic.body.slice(100, 200) || topic.cta, topic.cta].filter(Boolean);
  fs.writeFileSync(assPath, buildAss(capLines, duration));

  const studioBg = path.join(process.cwd(), 'test_artifacts', 'archie_5s_reels', 'archie_studio_bg.png');
  const puppet =
    path.join(process.cwd(), 'cartoon_character_assets', 'exact_puppet', 'puppet_explain_both.png');
  const idle = path.join(process.cwd(), 'cartoon_character_assets', 'exact_puppet', 'puppet_idle.png');
  const bg = fs.existsSync(studioBg) ? studioBg : null;
  const pup = fs.existsSync(puppet) ? puppet : fs.existsSync(idle) ? idle : null;

  let cmd;
  if (bg && pup) {
    cmd = `ffmpeg -y -loop 1 -t ${duration} -i "${bg}" -loop 1 -t ${duration} -i "${pup}" -i "${voicePath}" -i "${bgmPath}" -filter_complex "[0:v]scale=1080:1920[bg];[1:v]scale=-1:1050[pup];[bg][pup]overlay=x=(W-w)/2:y=H-h-60[base];[base]ass='${assPath.replace(/'/g, "'\\''")}'[vout];[2:a]volume=1.35[a0];[3:a]volume=1.0[a1];[a0][a1]amix=inputs=2:duration=first:dropout_transition=2[aout]" -map "[vout]" -map "[aout]" -c:v libx264 -preset veryfast -crf 20 -c:a aac -b:a 160k -t ${duration} -pix_fmt yuv420p "${outPath}"`;
  } else {
    cmd = `ffmpeg -y -f lavfi -i color=c=0x0b1220:s=1080x1920:d=${duration} -i "${voicePath}" -i "${bgmPath}" -filter_complex "[0:v]ass='${assPath.replace(/'/g, "'\\''")}'[vout];[1:a]volume=1.35[a0];[2:a]volume=1.0[a1];[a0][a1]amix=inputs=2:duration=first[aout]" -map "[vout]" -map "[aout]" -c:v libx264 -preset veryfast -crf 20 -c:a aac -b:a 160k -t ${duration} -pix_fmt yuv420p "${outPath}"`;
  }
  execSync(cmd, { stdio: 'inherit' });
  console.log('[Archie Simple] OK', outPath);

  if (!isDry) {
    try {
      const { uploadYouTubeShort } = require('./youtube_channel_dispatcher.cjs');
      await uploadYouTubeShort({
        videoPath: outPath,
        title: `${topic.title} #Shorts`,
        description: `${topic.hook}\n\n${topic.body}\n\n${topic.cta}\n\n#ArchieExplains #ScienceFacts #Shorts`,
        tags: ['#ArchieExplains', '#ScienceFacts', '#Shorts'],
        channelId: 'cartoon_factory'
      });
    } catch (e) {
      console.warn('[Archie] upload', e.message);
    }
  } else console.log('[Archie Simple] DRY_RUN');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
