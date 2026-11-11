#!/usr/bin/env node
/**
 * Teen Motivation — PD CARTOON LESSON engine (FULL REPLACE for lesson mode)
 * 35–40s. Lesson from public-domain cartoon era stories (Popeye, Private Snafu,
 * Fleischer Superman, Felix, Betty Boop, Oswald, ComiColor, Thrifty Pig, Gertie).
 * B-roll search biased to vintage / archival / early animation look.
 * Straight narration. No "take action now" slogans.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { searchAndFetchImage, searchAndFetchVideo, searchAndFetchAudio } = require('./universal_media_fetcher.cjs');
const { callActiveAiForJson } = require('./topic_discovery_engine.cjs');
const { synthesizeSpeechResilient } = require('./tts_resilient_engine.cjs');

const OUT = path.join(process.cwd(), 'rendered_videos');
const ART = path.join(process.cwd(), 'test_artifacts', 'teen_situation');
const HIST = path.join(process.cwd(), 'data', 'teen_topic_history.json');
const isDry = String(process.env.DRY_RUN || 'false') === 'true';

const PD_CARTOON_LESSON_BANK = [
  {
    cartoon: 'Popeye the Sailor',
    era: '1930s-40s',
    lesson: 'Strength shows up after preparation — the hard work comes before the moment.',
    theme: 'preparation',
    visualQueries: [
      '1930s sailor dock black and white film',
      'vintage harbor ropes ships archival',
      'old spinach farm field grainy',
      '1930s gym training still'
    ]
  },
  {
    cartoon: 'Private Snafu',
    era: '1943-45',
    lesson: 'One careless slip can cost the whole team — discipline protects the people around you.',
    theme: 'discipline',
    visualQueries: [
      '1940s military training archival footage',
      'vintage war office desk papers',
      'old army boots marching film grain',
      '1940s radio headphones desk'
    ]
  },
  {
    cartoon: 'Superman Fleischer',
    era: '1941-43',
    lesson: 'Power without restraint becomes the problem — real strength is knowing when not to use it.',
    theme: 'self-control',
    visualQueries: [
      '1940s city skyline night vintage',
      'art deco skyscraper black and white',
      'old comic book stack table',
      '1940s newsroom typewriter'
    ]
  },
  {
    cartoon: 'Felix the Cat',
    era: '1919-30s',
    lesson: 'When the plan fails, invent a new one with what you already have.',
    theme: 'resourcefulness',
    visualQueries: [
      '1920s silent film silhouette',
      'old film projector beam dust',
      'vintage cartoon still archival',
      '1920s city street night'
    ]
  },
  {
    cartoon: 'Betty Boop',
    era: '1930s',
    lesson: 'Being underestimated is an advantage if you stay sharp.',
    theme: 'quiet confidence',
    visualQueries: [
      '1930s jazz age city night',
      'vintage microphone stage spotlight',
      'old hollywood dressing room mirror',
      '1930s dance hall lights'
    ]
  },
  {
    cartoon: 'Oswald the Lucky Rabbit',
    era: '1927-28',
    lesson: 'Luck favors the one who keeps moving after the fall.',
    theme: 'persistence',
    visualQueries: [
      '1920s farm countryside silent film',
      'old dirt road walking archival',
      'vintage barn morning light',
      '1920s field grainy footage'
    ]
  },
  {
    cartoon: 'ComiColor Jack Frost',
    era: '1930s',
    lesson: 'Seasons change whether you are ready or not — adapt faster than the weather.',
    theme: 'adaptability',
    visualQueries: [
      '1930s winter forest fairy tale illustration',
      'vintage snow village',
      'old frost window pane close up',
      '1930s woodland path snow'
    ]
  },
  {
    cartoon: 'The Thrifty Pig',
    era: '1941',
    lesson: 'Small daily choices compound into safety or ruin.',
    theme: 'daily discipline',
    visualQueries: [
      '1940s savings poster archival',
      'vintage piggy bank coins table',
      'old ledger book handwriting',
      '1940s kitchen table money jar'
    ]
  },
  {
    cartoon: 'Gertie the Dinosaur',
    era: '1914',
    lesson: 'Even the first version of something new looks awkward — ship it anyway.',
    theme: 'start imperfect',
    visualQueries: [
      '1910s early animation sketch desk',
      'vintage dinosaur museum fossil',
      'old drawing desk pencil paper',
      '1910s silent film still'
    ]
  }
];

function ensureDirs() {
  for (const d of [OUT, ART, path.dirname(HIST)]) {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  }
}

function loadHistory() {
  try {
    if (fs.existsSync(HIST)) return JSON.parse(fs.readFileSync(HIST, 'utf8'));
  } catch (_) {}
  return [];
}

function saveHistory(arr) {
  fs.writeFileSync(HIST, JSON.stringify(arr.slice(-80), null, 2));
}

function pickLesson(history) {
  const used = new Set((history || []).map((h) => h.cartoon).filter(Boolean));
  const pool = PD_CARTOON_LESSON_BANK.filter((l) => !used.has(l.cartoon));
  const bank = pool.length ? pool : PD_CARTOON_LESSON_BANK;
  return bank[Math.floor(Math.random() * bank.length)];
}

async function buildScript(lesson) {
  const systemPrompt = `You write 35-40 second teen motivation narration inspired by a classic public-domain cartoon era.
Return STRICT JSON only.

Cartoon: ${lesson.cartoon} (${lesson.era})
Core lesson: ${lesson.lesson}
Theme: ${lesson.theme}

Rules:
- 95-120 spoken words total across exactly 5 scenes
- Straight, firm, teen-relevant (14-19). No cringe. No "take action now". No "stop scrolling".
- Scene 1 hooks with the cartoon world or era in one line, then lands the human lesson
- Scenes 2-4 develop the lesson for real teen life (school, friends, work, self-doubt)
- Scene 5 closes clean without slogan spam
- Each scene needs visualQuery biased to vintage/archival look matching the lesson visuals
- title under 70 chars
- description 2 lines + soft CTA for Mind Rush
- hashtags include #MindRush #TeenMotivation

JSON:
{
  "title": "...",
  "description": "...",
  "hashtags": ["#MindRush", "#TeenMotivation", "#Discipline", "#FYP", "#Shorts"],
  "bgmQuery": "soft piano ambient hopeful no drums",
  "scenes": [
    { "role": "hook", "text": "...", "visualQuery": "..." },
    { "role": "build", "text": "...", "visualQuery": "..." },
    { "role": "truth", "text": "...", "visualQuery": "..." },
    { "role": "apply", "text": "...", "visualQuery": "..." },
    { "role": "close", "text": "...", "visualQuery": "..." }
  ]
}`;

  const userPrompt = `Write the package. Prefer these visual seeds: ${lesson.visualQueries.join(' | ')}`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await callActiveAiForJson(systemPrompt, userPrompt, null, {
        nicheKey: 'teen_motivation',
        temperature: 0.72
      });
      const data = res?.data || res;
      if (data?.scenes?.length >= 5 && data.title) {
        data.scenes = data.scenes.slice(0, 5);
        // Force vintage bias on queries
        data.scenes.forEach((s, i) => {
          const seed = lesson.visualQueries[i % lesson.visualQueries.length];
          if (!s.visualQuery || s.visualQuery.length < 8) s.visualQuery = seed;
          else s.visualQuery = s.visualQuery + ' vintage archival film grain';
        });
        if (!data.bgmQuery || /drum|beat|phonk/i.test(data.bgmQuery)) {
          data.bgmQuery = 'soft piano ambient hopeful sparse no drums';
        }
        data.cartoon = lesson.cartoon;
        data.theme = lesson.theme;
        return data;
      }
    } catch (e) {
      console.warn('[Teen PD] AI attempt', attempt, e.message);
    }
  }
  // Minimal non-seed script from lesson itself if AI fails
  return {
    title: `${lesson.theme} — lesson from ${lesson.cartoon}`,
    description: `A short lesson teens can use today. Inspired by classic public-domain animation history.\n\nFollow Mind Rush.`,
    hashtags: ['#MindRush', '#TeenMotivation', '#Discipline', '#FYP', '#Shorts'],
    bgmQuery: 'soft piano ambient hopeful sparse no drums',
    cartoon: lesson.cartoon,
    theme: lesson.theme,
    scenes: [
      {
        role: 'hook',
        text: `In the ${lesson.era}, ${lesson.cartoon} cartoons kept teaching the same quiet truth.`,
        visualQuery: lesson.visualQueries[0] + ' vintage archival'
      },
      {
        role: 'build',
        text: lesson.lesson,
        visualQuery: lesson.visualQueries[1] + ' vintage archival'
      },
      {
        role: 'truth',
        text: `That idea still hits for school, friends, and pressure that never waits for you to feel ready.`,
        visualQuery: lesson.visualQueries[2] + ' vintage archival'
      },
      {
        role: 'apply',
        text: `You do not need a perfect plan. You need one honest move you can finish before the day ends.`,
        visualQuery: lesson.visualQueries[3 % lesson.visualQueries.length] + ' vintage archival'
      },
      {
        role: 'close',
        text: `Old cartoons said it simply. Your next choice is the only part of the story you control.`,
        visualQuery: lesson.visualQueries[0] + ' vintage archival'
      }
    ]
  };
}

function buildAss(fullText, duration) {
  const words = String(fullText).replace(/\n/g, ' ').split(/\s+/).filter(Boolean);
  const wordsPerLine = 4;
  const totalMs = Math.round(duration * 1000);
  const msPerWord = words.length > 0 ? totalMs / words.length : 320;
  const formatAssTime = (ms) => {
    const totalSec = Math.floor(ms / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    const sec = totalSec % 60;
    const min = Math.floor((totalSec % 3600) / 60);
    const hr = Math.floor(totalSec / 3600);
    return `${hr}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  };
  const lines = [];
  for (let i = 0; i < words.length; i += wordsPerLine) {
    const chunk = words.slice(i, i + wordsPerLine);
    const chunkStartMs = Math.round(i * msPerWord);
    const chunkEndMs = Math.min(totalMs, Math.round((i + chunk.length) * msPerWord + 140));
    let kLine = '';
    for (const w of chunk) {
      const wordCs = Math.max(8, Math.round(msPerWord / 10));
      kLine += `{\kf${wordCs}}${String(w).toUpperCase()} `;
    }
    lines.push(
      `Dialogue: 0,${formatAssTime(chunkStartMs)},${formatAssTime(chunkEndMs)},CenterKaraoke,,0,0,0,,${kLine.trim()}`
    );
  }
  return `[Script Info]
Title: Teen PD Cartoon Karaoke
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: CenterKaraoke,Arial Black,52,&H00FFFFFF,&H0000D7FF,&H00000000,&H00000000,1,0,0,0,100,100,0.5,0,1,3.2,0,5,70,70,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${lines.join('\n')}
`;
}

async function resolveVisual(query, index) {
  try {
    const vid = await searchAndFetchVideo(query, { minDuration: 3, preferredSource: 'pexels' });
    const p = vid && (vid.localPath || vid.path);
    if (p && fs.existsSync(p) && fs.statSync(p).size > 30000) {
      return { type: 'video', path: p };
    }
  } catch (_) {}
  for (const src of ['unsplash', 'pexels', 'pixabay', 'wikimedia']) {
    try {
      const img = await searchAndFetchImage(query, { preferredSource: src });
      const p = img && (img.localPath || img.path);
      if (p && fs.existsSync(p) && fs.statSync(p).size > 8000) {
        return { type: 'image', path: p };
      }
    } catch (_) {}
  }
  const fallback = path.join(ART, `fb_${index}.png`);
  execSync(`ffmpeg -y -f lavfi -i color=c=0x111111:s=1080x1920:d=1 -frames:v 1 "${fallback}" 2>/dev/null`, {
    stdio: 'pipe'
  });
  return { type: 'image', path: fallback };
}

function renderScene(visual, durationSec, outMp4, sceneIndex) {
  const frames = Math.max(30, Math.ceil(durationSec * 30));
  const zoom =
    sceneIndex % 2 === 0
      ? "min(zoom+0.0015,1.12)"
      : "if(eq(on,1),1.12,max(zoom-0.0012,1.0))";
  const bw = 'hue=s=0,eq=contrast=1.15:brightness=0.02';
  if (visual.type === 'video') {
    execSync(
      `ffmpeg -y -stream_loop 2 -t ${durationSec.toFixed(2)} -i "${visual.path}" -an -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30,${bw}" -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -t ${durationSec.toFixed(2)} "${outMp4}"`,
      { stdio: 'pipe' }
    );
  } else {
    execSync(
      `ffmpeg -y -loop 1 -t ${durationSec.toFixed(2)} -i "${visual.path}" -vf "scale=1200:2133:force_original_aspect_ratio=increase,crop=1200:2133,zoompan=z='${zoom}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1080x1920:fps=30,${bw}" -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -t ${durationSec.toFixed(2)} "${outMp4}"`,
      { stdio: 'pipe' }
    );
  }
}

function softPiano(outWav, duration) {
  const d = duration.toFixed(2);
  const filter = `aevalsrc='0.035*sin(2*PI*130.81*t)+0.03*sin(2*PI*164.81*t)+0.025*sin(2*PI*196*t)':s=44100:d=${d}[p]; anoisesrc=d=${d}:c=pink:a=0.006[n]; [p][n]amix=inputs=2,lowpass=f=850,afade=t=in:st=0:d=1,afade=t=out:st=${Math.max(0, duration - 1.5).toFixed(2)}:d=1.5[out]`;
  execSync(
    `ffmpeg -y -f lavfi -i "${filter}" -map "[out]" -c:a pcm_s16le -ar 44100 -ac 2 -t ${d} "${outWav}" 2>/dev/null`,
    { stdio: 'pipe' }
  );
}

async function main() {
  ensureDirs();
  console.log('\n=== TEEN PD CARTOON LESSON ===');
  const history = loadHistory();
  const lesson = pickLesson(history);
  console.log('[Teen] cartoon:', lesson.cartoon, '| theme:', lesson.theme);

  const pack = await buildScript(lesson);
  const spoken = pack.scenes.map((s) => s.text).join(' ');
  const voicePath = path.join(ART, `voice_${Date.now()}.mp3`);
  await synthesizeSpeechResilient(spoken, voicePath, {
    voice: process.env.TEEN_VOICE || 'en-US-AndrewNeural',
    rate: process.env.TEEN_RATE || '-8%',
    pitch: process.env.TEEN_PITCH || '-18Hz',
    emotionProfile: 'motivation'
  });

  let voiceDur = 36;
  try {
    voiceDur = parseFloat(
      execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${voicePath}"`, {
        encoding: 'utf8'
      }).trim()
    );
  } catch (_) {}
  // Cap ~40s
  const totalDuration = Math.min(Math.max(voiceDur + 0.5, 32), 42);
  const sceneCount = 5;
  const secPer = totalDuration / sceneCount;

  let bgmPath = null;
  try {
    const a = await searchAndFetchAudio(pack.bgmQuery, totalDuration, 'teen');
    if (a?.localPath && fs.existsSync(a.localPath)) bgmPath = a.localPath;
  } catch (_) {}
  if (!bgmPath) {
    bgmPath = path.join(ART, `bgm_${Date.now()}.wav`);
    softPiano(bgmPath, totalDuration);
  }

  const assPath = path.join(ART, `cap_${Date.now()}.ass`);
  fs.writeFileSync(assPath, buildAss(spoken, totalDuration));

  const clips = [];
  for (let i = 0; i < sceneCount; i++) {
    const sc = pack.scenes[i];
    console.log(`[Teen] scene ${i + 1}: ${sc.visualQuery}`);
    const visual = await resolveVisual(sc.visualQuery, i);
    const out = path.join(ART, `sc_${i}.mp4`);
    renderScene(visual, secPer, out, i);
    clips.push(out);
  }

  const list = path.join(ART, 'concat.txt');
  fs.writeFileSync(list, clips.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n'));
  const silent = path.join(ART, 'silent.mp4');
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${list}" -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -r 30 "${silent}"`,
    { stdio: 'pipe' }
  );

  const finalMp4 = path.join(OUT, 'teen_motivation_latest.mp4');
  const escapedAss = assPath.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "\\'");
  const filter = `[1:a]volume=1.5[vo];[2:a]volume=0.32,afade=t=in:st=0:d=0.8,afade=t=out:st=${(totalDuration - 1.2).toFixed(2)}:d=1.0[bg];[vo][bg]amix=inputs=2:duration=longest[a];[0:v]subtitles='${escapedAss}'[v]`;
  execSync(
    `ffmpeg -y -i "${silent}" -i "${voicePath}" -i "${bgmPath}" -filter_complex "${filter}" -map "[v]" -map "[a]" -c:v libx264 -preset veryfast -crf 19 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -t ${totalDuration.toFixed(2)} "${finalMp4}"`,
    { stdio: 'pipe' }
  );

  const meta = {
    title: pack.title,
    description: pack.description,
    hashtags: pack.hashtags,
    cartoon: lesson.cartoon,
    theme: lesson.theme,
    duration: totalDuration
  };
  fs.writeFileSync(path.join(OUT, 'teen_motivation_meta.json'), JSON.stringify(meta, null, 2));

  history.push({
    title: pack.title,
    cartoon: lesson.cartoon,
    theme: lesson.theme,
    at: new Date().toISOString()
  });
  saveHistory(history);

  console.log(`[Teen] done "${pack.title}" ${totalDuration.toFixed(1)}s cartoon=${lesson.cartoon}`);
  if (isDry) console.log('[Teen] dry run — no publish');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
