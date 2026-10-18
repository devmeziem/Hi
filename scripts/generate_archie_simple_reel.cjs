#!/usr/bin/env node
/**
 * Archie Explains — SIMPLE reliable reel (CH3)
 * Used when complex multi-puppet FFmpeg fails.
 * - Live topic discovery if available, else clear science hook
 * - Edge TTS via tts_resilient_engine
 * - Audible BGM under voice
 * - Studio bg + idle/explain puppet + multi-beat captions
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUT = path.join(process.cwd(), 'rendered_videos');
const ART = path.join(process.cwd(), 'test_artifacts', 'archie_simple');
const isDry = String(process.env.DRY_RUN || 'false') === 'true';

const FALLBACK_TOPICS = [
  {
    title: 'Why do your ears pop on a plane?',
    hook: 'Your ears pop on planes for one simple reason.',
    body: 'Outside air pressure drops as the plane climbs. The air trapped in your middle ear is still at ground pressure. That pressure difference stretches your eardrum until the Eustachian tube opens and equalizes it.',
    cta: 'Did your ears pop on your last flight? Comment yes or no.'
  },
  {
    title: 'Why is the sky blue?',
    hook: 'The sky is blue because of how sunlight hits the air.',
    body: 'Sunlight is made of many colors. Air molecules scatter blue light more than red. That scattered blue light reaches your eyes from every direction, so the sky looks blue.',
    cta: 'What other everyday science question should we explain next?'
  },
  {
    title: 'Why does ice float on water?',
    hook: 'Ice floats because it is less dense than liquid water.',
    body: 'When water freezes, its molecules lock into a crystal that takes more space. Same mass, bigger volume, lower density — so ice sits on top of the liquid.',
    cta: 'Save this if you learned something new.'
  }
];

function ensureDirs() {
  for (const d of [OUT, ART]) if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

async function pickTopic() {
  try {
    const disc = require('./topic_discovery_engine.cjs');
    if (typeof disc.discoverWinningTopic === 'function') {
      const t = await disc.discoverWinningTopic('cartoon');
      if (t?.title) {
        return {
          title: t.title,
          hook: t.hook || t.title,
          body: t.angle || t.rationale || 'Here is the simple science behind it.',
          cta: 'Follow for more everyday science.'
        };
      }
    }
  } catch (e) {
    console.warn('[Archie Simple] discovery notice:', e.message);
  }
  return FALLBACK_TOPICS[Math.floor(Math.random() * FALLBACK_TOPICS.length)];
}

async function edgeVoice(text, outFile) {
  const { synthesizeSpeechResilient } = require('./tts_resilient_engine.cjs');
  await synthesizeSpeechResilient(text, outFile, {
    voice: 'en-US-AndrewNeural',
    rate: '-3%',
    pitch: '-5Hz',
    emotionProfile: 'educator',
    timeout: 25000
  });
  if (!fs.existsSync(outFile) || fs.statSync(outFile).size < 1000) {
    throw new Error('Edge TTS empty output');
  }
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
    const safe = String(line).replace(/\n/g, '\\N');
    body += `Dialogue: 0,${fmt(t0)},${fmt(t1)},Default,,0,0,0,,{\\an2\\fs42\\b1\\c&H00FFFFFF&\\3c&H000000&\\bord3\\shad2}${safe}\n`;
  });
  return `[Script Info]\nScriptType: v4.00+\nPlayResX: 1080\nPlayResY: 1920\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,Arial,42,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,3,2,2,50,50,100,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n${body}`;
}

async function main() {
  ensureDirs();
  const topic = await pickTopic();
  console.log('[Archie Simple]', topic.title);

  const narration = [topic.hook, topic.body, topic.cta].join(' ');
  const voicePath = path.join(ART, `voice_${Date.now()}.mp3`);
  const bgmPath = path.join(ART, `bgm_${Date.now()}.wav`);
  const assPath = path.join(ART, `caps_${Date.now()}.ass`);
  const outPath = path.join(OUT, `archie_simple_${Date.now()}.mp4`);
  const latestPath = path.join(OUT, 'archie_simple_latest.mp4');

  await edgeVoice(narration, voicePath);
  let duration = 22;
  try {
    duration = Math.max(15, Math.min(50, parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${voicePath}"`, { encoding: 'utf8' }).trim()) + 0.6));
  } catch (_) {}

  // Audible warm BGM under voice
  execSync(
    `ffmpeg -y -f lavfi -i "sine=frequency=130:duration=${duration}" -f lavfi -i "sine=frequency=196:duration=${duration}" -filter_complex "[0:a][1:a]amix=inputs=2:duration=first,lowpass=f=900,volume=0.11" "${bgmPath}"`,
    { stdio: 'pipe' }
  );

  fs.writeFileSync(assPath, buildAss([topic.hook, topic.body.slice(0, 90), topic.body.slice(90, 180) || topic.cta, topic.cta], duration));

  const studioBg = path.join(process.cwd(), 'test_artifacts', 'archie_5s_reels', 'archie_studio_bg.png');
  const idle = path.join(process.cwd(), 'cartoon_character_assets', 'exact_puppet', 'puppet_idle.png');
  const explain = path.join(process.cwd(), 'cartoon_character_assets', 'exact_puppet', 'puppet_explain_both.png');
  const bg = fs.existsSync(studioBg)
    ? studioBg
    : null;
  const puppet = fs.existsSync(explain) ? explain : (fs.existsSync(idle) ? idle : null);

  // Build inputs
  let inputs = '';
  let filter = '';
  if (bg && puppet) {
    inputs = `-loop 1 -t ${duration} -i "${bg}" -loop 1 -t ${duration} -i "${puppet}" -i "${voicePath}" -i "${bgmPath}"`;
    filter = `[0:v]scale=1080:1920,eq=brightness=-0.02[bg];[1:v]scale=-1:1050[pup];[bg][pup]overlay=x=(W-w)/2:y=H-h-60[base];[base]ass='${assPath.replace(/'/g, "'\\''")}'[vout];[2:a]volume=1.2[a0];[3:a]volume=1.0[a1];[a0][a1]amix=inputs=2:duration=first:dropout_transition=2[aout]`;
  } else if (puppet) {
    inputs = `-loop 1 -t ${duration} -i "${puppet}" -i "${voicePath}" -i "${bgmPath}"`;
    filter = `[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,ass='${assPath.replace(/'/g, "'\\''")}'[vout];[1:a]volume=1.2[a0];[2:a]volume=1.0[a1];[a0][a1]amix=inputs=2:duration=first[aout]`;
  } else {
    inputs = `-f lavfi -i color=c=0x0b1220:s=1080x1920:d=${duration} -i "${voicePath}" -i "${bgmPath}"`;
    filter = `[0:v]ass='${assPath.replace(/'/g, "'\\''")}'[vout];[1:a]volume=1.2[a0];[2:a]volume=1.0[a1];[a0][a1]amix=inputs=2:duration=first[aout]`;
  }

  const cmd = `ffmpeg -y ${inputs} -filter_complex "${filter}" -map "[vout]" -map "[aout]" -c:v libx264 -preset veryfast -crf 20 -c:a aac -b:a 160k -t ${duration} -pix_fmt yuv420p "${outPath}"`;
  console.log('[Archie Simple] Rendering...');
  execSync(cmd, { stdio: 'inherit' });
  fs.copyFileSync(outPath, latestPath);
  console.log('[Archie Simple] OK', outPath);

  if (!isDry) {
    try {
      const { uploadYouTubeShort } = require('./youtube_channel_dispatcher.cjs');
      await uploadYouTubeShort({
        videoPath: outPath,
        title: `${topic.hook.replace(/[?!.]+$/, '')} #Shorts`,
        description: `${topic.hook}\n\n${topic.body}\n\n${topic.cta}\n\n#ArchieExplains #ScienceFacts #Shorts`,
        tags: ['#ArchieExplains', '#ScienceFacts', '#Shorts'],
        channelId: 'cartoon_factory'
      });
    } catch (e) {
      console.warn('[Archie Simple] upload notice:', e.message);
    }
  } else {
    console.log('[Archie Simple] DRY_RUN');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
