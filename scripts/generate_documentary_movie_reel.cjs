#!/usr/bin/env node
/**
 * DRIFTREEL — LIVE ancient history / folk tales ONLY
 * - No story seed vault, no fallback episode bank
 * - Past titles hard-excluded in AI prompt; regenerate on collision
 * - Visual queries rotated; media source/page rotated so clips do not repeat
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { searchAndFetchImage, searchAndFetchVideo, searchAndFetchAudio } = require('./universal_media_fetcher.cjs');
const { callActiveAiForJson } = require('./topic_discovery_engine.cjs');
const { synthesizeSpeechResilient } = require('./tts_resilient_engine.cjs');

const ARTIFACTS_DIR = path.join(process.cwd(), 'test_artifacts', 'documentary');
const RENDERED_DIR = path.join(process.cwd(), 'rendered_videos');
const TITLE_HIST = path.join(process.cwd(), 'data', 'driftreel_title_history.json');
const VISUAL_HIST = path.join(process.cwd(), 'data', 'driftreel_visual_history.json');
for (const d of [ARTIFACTS_DIR, RENDERED_DIR, path.dirname(TITLE_HIST)]) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function loadJson(p, fb) {
  try {
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (_) {}
  return fb;
}
function saveJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function generateHistoryStory(pastTitles, bannedVisuals) {
  const angles = [
    'a specific lesser-known Ancient Egyptian ritual or tomb discovery',
    'a Greek myth episode that is NOT Icarus or Medusa',
    'a verified Roman historical incident with a twist',
    'a West African folk tale with a clear moral',
    'a Norse or medieval European legend rarely retold',
    'a Japanese or Chinese classical folk tale not about origami cranes',
    'Mesopotamia or Babylon history with a concrete artifact',
    'Phoenician, Carthaginian, or Persian ancient history',
    'an Inca, Maya, or Aztec historical moment',
    'an Indian or Southeast Asian classical legend'
  ];
  const angle = angles[Math.floor(Math.random() * angles.length)];
  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  console.log('[Driftreel] live angle:', angle);

  const systemPrompt = `You are the showrunner for Driftreel.
Generate ONE gripping factual OR classic folk narrative for TikTok (95-130 spoken words, ~40-55 seconds).
ONLY pre-modern history / classical myth / folk tale.
NEVER modern crime, 1800s+ sea mysteries, urban legends, Cinema Vanguard.

HARD BAN — do not reuse or paraphrase these past titles:
${(pastTitles || []).slice(-40).join('\n') || '(none yet)'}

Avoid these overused visual phrases:
${(bannedVisuals || []).slice(-30).join(' | ') || 'none'}

Rules:
- title max 42 chars, must be NEW
- era like "1323 BCE • Valley of the Kings"
- sfxType: projector|wind|clock
- bgmQuery: soft piano ambient historical sparse no drums
- exactly 5 scenes; each text 18-26 words; each query UNIQUE concrete stock search (temples, manuscripts, landscapes, artifacts — not the same ocean ship every time)
- hashtags: #Driftreel #HistoryTok #AncientHistory #FolkTale #Documentary #Shorts #FYP

Return STRICT JSON only with keys title,genre,era,sfxType,bgmQuery,scenes,hashtags.`;

  const userPrompt = `Episode angle: ${angle}
Uniqueness nonce: ${nonce}
Write a story that has NOT been told in the banned title list.`;

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await callActiveAiForJson(systemPrompt, userPrompt, null, {
        nicheKey: 'documentary',
        temperature: 0.82 + attempt * 0.03
      });
      const data = res?.data || res;
      if (data?.title && Array.isArray(data.scenes) && data.scenes.length >= 4) {
        const tLow = String(data.title).toLowerCase().trim();
        const collision = (pastTitles || []).some((pt) => {
          const p = String(pt).toLowerCase();
          return p === tLow || (p.length > 10 && (tLow.includes(p.slice(0, 16)) || p.includes(tLow.slice(0, 16))));
        });
        if (collision) {
          console.warn('[Driftreel] title collision — retry', data.title);
          continue;
        }
        data.genre = 'history';
        data.hashtags = [
          '#Driftreel',
          '#HistoryTok',
          '#AncientHistory',
          '#FolkTale',
          '#Documentary',
          '#Shorts',
          '#FYP'
        ];
        if (!data.bgmQuery || /drum|beat|trap|phonk/i.test(data.bgmQuery)) {
          data.bgmQuery = 'soft piano ambient historical sparse no drums';
        }
        // Force scene visual diversity
        const diversifiers = [
          'ancient stone temple columns desert',
          'weathered manuscript pages close up',
          'bronze age artifact museum display',
          'mountain pass fog historical landscape',
          'clay tablet cuneiform close up',
          'ruined amphitheater golden hour',
          'silk road caravan desert dunes',
          'candlelit library scrolls shelves',
          'river delta aerial historical',
          'carved relief wall hieroglyph'
        ];
        data.scenes = data.scenes.slice(0, 5);
        data.scenes.forEach((s, i) => {
          const q = String(s.query || s.visualQuery || '').toLowerCase();
          if (!q || bannedVisuals.some((b) => q.includes(String(b).toLowerCase().slice(0, 20)))) {
            s.query = diversifiers[(i + attempt + Date.now()) % diversifiers.length];
          }
          if (s.visualQuery && !s.query) s.query = s.visualQuery;
        });
        return data;
      }
    } catch (err) {
      console.warn(`[Driftreel AI] attempt ${attempt}:`, err.message);
    }
  }
  throw new Error('Driftreel history AI failed — no seed fallback');
}

function generateSoundEffectWav(sfxType, outWavPath, duration = 45.0) {
  let filter;
  if (sfxType === 'wind') {
    filter = `anoisesrc=d=${duration.toFixed(2)}:c=brown:a=0.02,lowpass=f=500[sfx]`;
  } else if (sfxType === 'clock') {
    filter = `aevalsrc='0.02*sin(2*PI*900*t)*gte(mod(t*2,1),0.92)':s=44100:d=${duration.toFixed(2)}[sfx]`;
  } else {
    filter = `aevalsrc='0.015*sin(2*PI*48*t)+0.01*sin(2*PI*96*t)':s=44100:d=${duration.toFixed(2)}[motor]; anoisesrc=d=${duration.toFixed(2)}:c=pink:a=0.01[hiss]; [motor][hiss]amix=inputs=2[sfx]`;
  }
  try {
    execSync(
      `ffmpeg -y -f lavfi -i "${filter}" -map "[sfx]" -c:a pcm_s16le -ar 44100 -ac 2 -t ${duration.toFixed(2)} "${outWavPath}" 2>/dev/null`,
      { stdio: 'pipe' }
    );
  } catch {
    execSync(
      `ffmpeg -y -f lavfi -i "anoisesrc=d=${duration.toFixed(2)}:c=pink:a=0.008" -c:a pcm_s16le -ar 44100 -ac 2 -t ${duration.toFixed(2)} "${outWavPath}" 2>/dev/null`,
      { stdio: 'pipe' }
    );
  }
}

function generateSoftPianoBed(outWavPath, duration) {
  const d = duration.toFixed(2);
  const filter = `aevalsrc='0.04*sin(2*PI*110*t)+0.03*sin(2*PI*164.81*t)+0.025*sin(2*PI*220*t)+0.02*sin(2*PI*329.63*t)*gte(mod(t,4),0)*lt(mod(t,4),1.2)':s=44100:d=${d}[p]; anoisesrc=d=${d}:c=pink:a=0.008[n]; [p][n]amix=inputs=2,lowpass=f=900,afade=t=in:st=0:d=1.5,afade=t=out:st=${Math.max(0, duration - 2).toFixed(2)}:d=2[out]`;
  execSync(
    `ffmpeg -y -f lavfi -i "${filter}" -map "[out]" -c:a pcm_s16le -ar 44100 -ac 2 -t ${d} "${outWavPath}" 2>/dev/null`,
    { stdio: 'pipe' }
  );
}

function generateDocumentaryKaraokeAss(wordsWithTimings, totalDuration, outAssPath) {
  const wordsPerLine = 3;
  const rawWords = wordsWithTimings.map((w) => w.word);
  const totalMs = Math.round(totalDuration * 1000);
  const msPerWord = rawWords.length > 0 ? totalMs / rawWords.length : 320;
  const formatAssTime = (ms) => {
    const totalSec = Math.floor(ms / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    const sec = totalSec % 60;
    const min = Math.floor((totalSec % 3600) / 60);
    const hr = Math.floor(totalSec / 3600);
    return `${hr}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  };
  const lines = [];
  for (let i = 0; i < rawWords.length; i += wordsPerLine) {
    const chunk = rawWords.slice(i, i + wordsPerLine);
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
  const assContent = `[Script Info]
Title: Driftreel History Karaoke
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: CenterKaraoke,Arial Black,58,&H00FFFFFF,&H0000D7FF,&H00000000,&H00000000,1,0,0,0,100,100,0.6,0,1,3.5,0,5,70,70,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${lines.join('\n')}
`;
  fs.writeFileSync(outAssPath, assContent, 'utf8');
  return outAssPath;
}

function buildBlackOutroSvg(storyTitle = '', width = 1080, height = 1920) {
  const titleExcerpt = escapeXml(String(storyTitle || 'Ancient Chronicle').slice(0, 40).toUpperCase());
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#000000"/>
  <text x="540" y="880" font-family="Arial Black, DejaVu Sans, sans-serif" font-size="52" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="4">FOLLOW FOR MORE</text>
  <text x="540" y="960" font-family="DejaVu Sans, sans-serif" font-size="22" font-weight="700" fill="#e5e5e5" text-anchor="middle" letter-spacing="2">${titleExcerpt}</text>
  <text x="540" y="1040" font-family="DejaVu Sans, sans-serif" font-size="18" font-weight="600" fill="#a3a3a3" text-anchor="middle" letter-spacing="3">DRIFTREEL</text>
</svg>`;
}

async function fetchVisual(query, index, usedPaths) {
  const sources = ['wikimedia', 'unsplash', 'pexels', 'pixabay'];
  const rot = (index + Math.floor(Date.now() / 60000)) % sources.length;
  const ordered = sources.slice(rot).concat(sources.slice(0, rot));
  const page = 1 + ((index + Date.now()) % 4);

  if (index === 1 || index === 2) {
    for (const src of ordered) {
      try {
        const vid = await searchAndFetchVideo(query, { minDuration: 3, preferredSource: src, page });
        if (vid?.localPath && fs.existsSync(vid.localPath) && !usedPaths.has(vid.localPath)) {
          usedPaths.add(vid.localPath);
          return { path: vid.localPath, isVideo: true };
        }
      } catch (_) {}
    }
  }
  for (const src of ordered) {
    try {
      const img = await searchAndFetchImage(query, { preferredSource: src, page });
      if (img?.localPath && fs.existsSync(img.localPath) && !usedPaths.has(img.localPath)) {
        usedPaths.add(img.localPath);
        return { path: img.localPath, isVideo: false };
      }
    } catch (_) {}
  }
  const colors = ['0x0a0a12', '0x12121a', '0x0f1419', '0x1a1520', '0x101018'];
  const p = path.join(ARTIFACTS_DIR, `fallback_${index}_${Date.now()}.png`);
  execSync(
    `ffmpeg -y -f lavfi -i color=c=${colors[index % colors.length]}:s=1080x1920:d=1 -frames:v 1 "${p}" 2>/dev/null`,
    { stdio: 'pipe' }
  );
  usedPaths.add(p);
  return { path: p, isVideo: false };
}

async function generateDocumentaryVideo() {
  console.log('\n===============================================================');
  console.log('DRIFTREEL — LIVE history/folk (no seed vault)');
  console.log('===============================================================\n');

  const pastTitles = loadJson(TITLE_HIST, []);
  // also merge remote dedup if available
  try {
    const { fetchRemoteHistory } = require('./channel_dedup_service.cjs');
    const past = await fetchRemoteHistory('documentary');
    for (const p of past || []) {
      const t = p.quote || p.topic || p.title;
      if (t && !pastTitles.includes(t)) pastTitles.push(t);
    }
  } catch (_) {}

  const bannedVisuals = loadJson(VISUAL_HIST, []);
  const episode = await generateHistoryStory(pastTitles, bannedVisuals);
  console.log(`[Driftreel] "${episode.title}" | ${episode.era}`);

  const fullNarration = episode.scenes.map((s) => s.text).join(' ');
  const voiceMp3 = path.join(ARTIFACTS_DIR, `doc_voice_${Date.now()}.mp3`);
  await synthesizeSpeechResilient(fullNarration, voiceMp3, {
    voice: 'en-US-AndrewNeural',
    rate: '-8%',
    pitch: '-22Hz',
    emotionProfile: 'narrator'
  });

  let voiceDuration = 40;
  try {
    voiceDuration = parseFloat(
      execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${voiceMp3}"`, {
        encoding: 'utf8'
      }).trim()
    );
  } catch (_) {}
  const totalDuration = Math.max(voiceDuration + 3.5, 42);

  let bgMusicPath = null;
  try {
    const fetched = await searchAndFetchAudio(episode.bgmQuery || 'soft piano ambient historical', {
      preferredSource: 'openverse',
      targetDuration: totalDuration
    });
    if (fetched?.localPath && fs.existsSync(fetched.localPath)) bgMusicPath = fetched.localPath;
  } catch (_) {}
  if (!bgMusicPath) {
    bgMusicPath = path.join(ARTIFACTS_DIR, `doc_bgm_${Date.now()}.wav`);
    generateSoftPianoBed(bgMusicPath, totalDuration);
  }

  const sfxWav = path.join(ARTIFACTS_DIR, `sfx_${Date.now()}.wav`);
  generateSoundEffectWav(episode.sfxType || 'projector', sfxWav, totalDuration);

  const words = fullNarration.split(/\s+/).filter(Boolean);
  const wordsWithTimings = words.map((w, i) => ({
    word: w,
    start: (i * voiceDuration) / words.length,
    end: ((i + 1) * voiceDuration) / words.length
  }));
  const assPath = path.join(ARTIFACTS_DIR, 'doc_karaoke.ass');
  generateDocumentaryKaraokeAss(wordsWithTimings, voiceDuration, assPath);

  const sceneCount = episode.scenes.length;
  const secPerScene = voiceDuration / sceneCount;
  const sceneClips = [];
  const usedPaths = new Set();
  const usedQueries = [];

  for (let i = 0; i < sceneCount; i++) {
    const sc = episode.scenes[i];
    const q = sc.query || sc.visualQuery || 'ancient ruins documentary';
    usedQueries.push(q);
    console.log(`[Scene ${i + 1}/${sceneCount}] ${q}`);
    const { path: visualPath, isVideo } = await fetchVisual(q, i, usedPaths);

    const sceneMp4 = path.join(ARTIFACTS_DIR, `scene_${i}_${Date.now()}.mp4`);
    const dur = secPerScene.toFixed(2);
    const frames = Math.max(30, Math.ceil(secPerScene * 30));
    const zoom =
      i % 2 === 0
        ? "min(zoom+0.0014,1.12)"
        : "if(eq(on,1),1.12,max(zoom-0.0012,1.0))";

    if (isVideo) {
      execSync(
        `ffmpeg -y -stream_loop 2 -t ${dur} -i "${visualPath}" -an -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30,eq=contrast=1.08:saturation=0.85" -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -r 30 -t ${dur} "${sceneMp4}"`,
        { stdio: 'pipe' }
      );
    } else {
      execSync(
        `ffmpeg -y -loop 1 -t ${dur} -i "${visualPath}" -vf "scale=1200:2133:force_original_aspect_ratio=increase,crop=1200:2133,zoompan=z='${zoom}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1080x1920:fps=30,eq=contrast=1.1:saturation=0.8" -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -r 30 -t ${dur} "${sceneMp4}"`,
        { stdio: 'pipe' }
      );
    }
    sceneClips.push(sceneMp4);
  }

  const outroSvg = path.join(ARTIFACTS_DIR, 'outro.svg');
  const outroPng = path.join(ARTIFACTS_DIR, 'outro.png');
  const outroMp4 = path.join(ARTIFACTS_DIR, 'outro.mp4');
  fs.writeFileSync(outroSvg, buildBlackOutroSvg(episode.title));
  execSync(`ffmpeg -y -i "${outroSvg}" -frames:v 1 "${outroPng}" 2>/dev/null`, { stdio: 'pipe' });
  execSync(
    `ffmpeg -y -loop 1 -t 3.2 -i "${outroPng}" -vf "scale=1080:1920,setsar=1,fps=30" -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p -t 3.2 "${outroMp4}"`,
    { stdio: 'pipe' }
  );
  sceneClips.push(outroMp4);

  const listFile = path.join(ARTIFACTS_DIR, 'concat.txt');
  fs.writeFileSync(listFile, sceneClips.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n'));
  const silentVideo = path.join(ARTIFACTS_DIR, 'silent.mp4');
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${listFile}" -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -r 30 "${silentVideo}"`,
    { stdio: 'pipe' }
  );

  const finalMp4 = path.join(RENDERED_DIR, `documentary_movie_${Date.now()}.mp4`);
  const driftreelLatest = path.join(RENDERED_DIR, 'driftreel_documentary_latest.mp4');
  const escapedAss = assPath.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "\\'");
  const filter = [
    `[1:a]volume=1.55,afade=t=in:st=0:d=0.3[vo]`,
    `[2:a]volume=0.28,afade=t=in:st=0:d=1.2,afade=t=out:st=${(totalDuration - 2).toFixed(2)}:d=1.8[bgm]`,
    `[3:a]volume=0.12[sfx]`,
    `[vo][bgm][sfx]amix=inputs=3:duration=longest:dropout_transition=2[aout]`,
    `[0:v]subtitles='${escapedAss}'[vout]`
  ].join(';');

  execSync(
    `ffmpeg -y -i "${silentVideo}" -i "${voiceMp3}" -i "${bgMusicPath}" -i "${sfxWav}" -filter_complex "${filter}" -map "[vout]" -map "[aout]" -c:v libx264 -preset veryfast -crf 19 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -t ${totalDuration.toFixed(2)} "${finalMp4}"`,
    { stdio: 'pipe' }
  );
  fs.copyFileSync(finalMp4, driftreelLatest);

  const manifest = {
    title: episode.title,
    episodeTitle: episode.title,
    era: episode.era,
    genre: 'history',
    excerpt: fullNarration.slice(0, 180),
    description: fullNarration.slice(0, 280),
    story: fullNarration.slice(0, 280),
    hashtags: episode.hashtags,
    channel: 'Driftreel',
    mode: 'live_no_seed'
  };
  fs.writeFileSync(path.join(RENDERED_DIR, 'driftreel_manifest.json'), JSON.stringify(manifest, null, 2));
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'driftreel_manifest.json'), JSON.stringify(manifest, null, 2));

  pastTitles.push(episode.title);
  saveJson(TITLE_HIST, pastTitles.slice(-120));
  saveJson(VISUAL_HIST, bannedVisuals.concat(usedQueries).slice(-120));

  try {
    const { recordPostedCandidate } = require('./channel_dedup_service.cjs');
    await recordPostedCandidate('driftreel', episode.title, episode.era, {
      genre: 'history',
      duration: totalDuration
    });
  } catch (_) {}

  const isDryRun = process.env.DRY_RUN === 'true';
  const ch4Token = process.env.YOUTUBE_REFRESH_TOKEN_CH4 || process.env.YOUTUBE_REFRESH_TOKEN || '';
  if (ch4Token && !isDryRun && process.env.PUBLISH_YOUTUBE !== 'false') {
    try {
      const { uploadYouTubeShort } = require('./youtube_channel_dispatcher.cjs');
      await uploadYouTubeShort({
        videoPath: finalMp4,
        title: `${episode.title} | ${String(episode.era).split('•')[0].trim()} #Shorts`.slice(0, 95),
        description: `${fullNarration}\n\nEra: ${episode.era}\n\nFollow Driftreel for ancient history and folk tales.\n\n#Driftreel #HistoryTok #AncientHistory #FolkTale #Documentary #Shorts #FYP`,
        tags: episode.hashtags.map((h) => String(h).replace(/^#/, '')),
        channelId: 'movie_brand'
      });
    } catch (e) {
      console.warn('[Driftreel] YouTube:', e.message);
    }
  }

  console.log(`[Driftreel] done: "${episode.title}" ${totalDuration.toFixed(1)}s LIVE`);
  return { videoPath: finalMp4, duration: totalDuration, title: episode.title, genre: 'history' };
}

if (require.main === module) {
  generateDocumentaryVideo()
    .then((r) => {
      console.log(`\n✓ Driftreel: "${r.title}" (${r.duration.toFixed(1)}s)`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('\n❌ Driftreel failed:', err);
      process.exit(1);
    });
}

module.exports = { generateDocumentaryVideo, generateDynamicDocumentaryStory: generateHistoryStory };
