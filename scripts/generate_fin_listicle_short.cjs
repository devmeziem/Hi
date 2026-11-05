#!/usr/bin/env node
/**
 * Fin listicle shorts (<60s): 3/5/7 ways, behaviors, digital skills.
 * Keyword research → AI (or structured fallback) script → multi-scene media → Edge TTS → YT
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { researchFinKeyword } = require('./keyword_research_engine.cjs');

const OUT = path.join(process.cwd(), 'rendered_videos');
const ART = path.join(process.cwd(), 'test_artifacts', 'fin_listicle');
const DEDUP = path.join(process.cwd(), 'data', 'fin_listicle_dedup.json');
const isDry = String(process.env.DRY_RUN || 'false') === 'true';

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(ART, { recursive: true });
fs.mkdirSync(path.dirname(DEDUP), { recursive: true });

const DISCLAIMER =
  'Educational content only — not financial advice. Income and markets can go up or down. Never pay upfront fees for guaranteed returns. Verify everything yourself.';

function loadDedup() {
  try {
    return JSON.parse(fs.readFileSync(DEDUP, 'utf8'));
  } catch {
    return { usedTitles: [], usedKeywords: [] };
  }
}
function saveDedup(d) {
  d.usedTitles = (d.usedTitles || []).slice(-60);
  d.usedKeywords = (d.usedKeywords || []).slice(-60);
  fs.writeFileSync(DEDUP, JSON.stringify(d, null, 2));
}

function structuredScript(research) {
  const n = research.count || 5;
  const items = [];
  const banks = {
    behaviors: [
      'Spending every small win the same day it arrives',
      'Borrowing for lifestyle instead of production',
      'Ignoring fees because the number looks small',
      'Chasing hype before learning definitions',
      'Keeping zero buffer for emergencies',
      'Treating “later” as a savings plan',
      'Mixing friends, urgency, and money decisions'
    ],
    save: [
      'Write three must-pay costs before discretionary spend',
      'Move a fixed tiny amount the day money arrives',
      'Cut one optional habit for seven days and track it',
      'Use a separate pocket for buffer, not the main balance',
      'Review spends once a week for ten quiet minutes',
      'Buy skills before tools you will not use',
      'Delay non-urgent purchases by 48 hours'
    ],
    skills: [
      'Clear written communication for clients',
      'Simple research and summary for busy people',
      'Phone or laptop setup help for campus peers',
      'Basic spreadsheet tracking for small sellers',
      'Short tutorial recording of a skill you already know',
      'Customer support tone and ticket clarity',
      'Prompting tools carefully without leaking private data'
    ]
  };
  const titleL = (research.title || '').toLowerCase();
  let pool = banks.behaviors;
  if (titleL.includes('save')) pool = banks.save;
  else if (titleL.includes('skill') || titleL.includes('digital')) pool = banks.skills;
  const shuffled = pool.slice().sort(() => Math.random() - 0.5);
  for (let i = 0; i < n; i++) items.push(shuffled[i % shuffled.length]);

  const spoken =
    `${research.title}. Here is the short version. ` +
    items.map((it, i) => `Number ${i + 1}. ${it}.`).join(' ') +
    ` Pick one item and act on it today. Motivation is not the result — your next action is. ` +
    `This is education, not financial advice.`;

  const scenes = items.slice(0, Math.min(6, items.length)).map((it, i) => ({
    onScreen: `0${i + 1} · ${it.split(' ').slice(0, 5).join(' ')}`.slice(0, 36),
    visualQuery: research.mediaHints[i % research.mediaHints.length],
    seconds: 7
  }));

  return {
    spokenScript: spoken.slice(0, 900),
    scenes,
    description: `${research.title}\n\nFocus keyword: ${research.primaryKeyword}\n\n${items.map((x, i) => `${i + 1}. ${x}`).join('\n')}\n\nSoft tools: xenvest.name.ng · lanecash.name.ng — still verify yourself.\n\n${DISCLAIMER}\n\n#FinancialLiteracy #Students #MoneySkills #Shorts #Nigeria`
  };
}

async function aiExpand(research) {
  const system = `You write under-60-second finance education listicles for students and people under 25 (Nigeria-first, global OK).
Return STRICT JSON only:
{
  "spokenScript": "120-180 words. Numbered list delivery. Natural male narrator. No guaranteed returns. End with one action + education disclaimer.",
  "scenes": [{"onScreen": "max 7 words", "visualQuery": "3-5 word stock query", "seconds": 6}],
  "description": "YouTube description 500-900 chars with keyword and disclaimer"
}
Rules: 4-7 scenes matching the list. Different visualQuery each scene. Title angle: ${research.title}`;
  const user = `Primary keyword: ${research.primaryKeyword}\nAngle: ${research.angle}\nCount target: ${research.count}`;
  try {
    const { callActiveAiForJson } = require('./topic_discovery_engine.cjs');
    const res = await callActiveAiForJson(system, user, null, { nicheKey: 'finance', temperature: 0.5 });
    if (res && res.spokenScript && Array.isArray(res.scenes) && res.scenes.length >= 3) {
      console.log('[FinList] AI OK', res.scenes.length);
      return res;
    }
  } catch (e) {
    console.warn('[FinList] AI soft-fail → structured', e.message);
  }
  return structuredScript(research);
}

function edgeTts(text, outFile) {
  const voice = process.env.FIN_VOICE || 'en-US-AndrewNeural';
  const rate = process.env.FIN_RATE || '+0%';
  const pitch = process.env.FIN_PITCH || '-8Hz';
  try {
    execSync(
      `npx --yes edge-tts --voice ${voice} --rate=${rate} --pitch=${pitch} --text ${JSON.stringify(text)} --write-media ${JSON.stringify(outFile)}`,
      { stdio: 'pipe', timeout: 120000 }
    );
    return fs.existsSync(outFile) && fs.statSync(outFile).size > 1000;
  } catch (e) {
    console.warn('[FinList] TTS fail', e.message);
    return false;
  }
}

function probeDuration(file) {
  try {
    return parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${file}"`, { encoding: 'utf8' })) || 0;
  } catch {
    return 0;
  }
}

async function fetchSceneMedia(query, idx) {
  try {
    const { searchAndFetchImage, searchAndFetchVideo } = require('./universal_media_fetcher.cjs');
    if (idx % 2 === 0) {
      const v = await searchAndFetchVideo(query, { orientation: 'portrait', minDuration: 4 });
      if (v && v.localPath && fs.existsSync(v.localPath)) return { type: 'video', path: v.localPath };
    }
    const im = await searchAndFetchImage(query, { orientation: 'portrait' });
    if (im && im.localPath && fs.existsSync(im.localPath)) return { type: 'image', path: im.localPath };
  } catch {}
  const colors = ['0x0f172a', '0x111827', '0x1e293b', '0x0b1220', '0x172554'];
  const p = path.join(ART, `fallback_${idx}.png`);
  execSync(`ffmpeg -y -f lavfi -i color=c=${colors[idx % colors.length]}:s=1080x1920:d=1 -frames:v 1 "${p}"`, { stdio: 'pipe' });
  return { type: 'image', path: p };
}

function renderSceneClip(media, onScreen, seconds, idx) {
  const out = path.join(ART, `scene_${idx}.mp4`);
  const text = String(onScreen || '').slice(0, 40).replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "'\\''");
  const draw =
    `drawbox=x=40:y=780:w=1000:h=320:color=black@0.35:t=fill,` +
    `drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='${text}':fontsize=42:fontcolor=white:x=(w-text_w)/2:y=900`;
  if (media.type === 'video') {
    execSync(
      `ffmpeg -y -stream_loop -1 -i "${media.path}" -t ${seconds.toFixed(2)} -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,${draw}" -an -c:v libx264 -pix_fmt yuv420p -preset fast "${out}"`,
      { stdio: 'pipe' }
    );
  } else {
    execSync(
      `ffmpeg -y -loop 1 -i "${media.path}" -t ${seconds.toFixed(2)} -vf "scale=1200:2100:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(zoom+0.0012,1.1)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30,${draw}" -an -c:v libx264 -pix_fmt yuv420p -preset fast "${out}"`,
      { stdio: 'pipe' }
    );
  }
  return out;
}

function concatScenes(sceneFiles, voicePath, outMp4) {
  const list = path.join(ART, 'concat.txt');
  fs.writeFileSync(list, sceneFiles.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'));
  const silent = path.join(ART, 'visual_silent.mp4');
  execSync(`ffmpeg -y -f concat -safe 0 -i "${list}" -c:v libx264 -pix_fmt yuv420p -r 30 "${silent}"`, { stdio: 'pipe' });
  const bed = path.join(ART, 'bed.wav');
  const vDur = Math.min(58, probeDuration(voicePath) || probeDuration(silent) || 40);
  execSync(`ffmpeg -y -f lavfi -i "sine=f=196:d=${vDur.toFixed(2)}" -af "volume=0.025" "${bed}"`, { stdio: 'pipe' });
  execSync(
    `ffmpeg -y -i "${silent}" -i "${voicePath}" -i "${bed}" -filter_complex "[1:a]volume=1.0[a1];[2:a]volume=0.4[a2];[a1][a2]amix=inputs=2:duration=first:dropout_transition=2[a]" -map 0:v -map "[a]" -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest -t ${vDur.toFixed(2)} "${outMp4}"`,
    { stdio: 'pipe' }
  );
}

async function main() {
  const dedup = loadDedup();
  const research = await researchFinKeyword({ exclude: dedup.usedKeywords || [] });
  console.log('[FinList] keyword', research.primaryKeyword, 'title', research.title, 'src', research.source);
  const ai = await aiExpand(research);
  const voice = path.join(ART, 'voice.mp3');
  if (!edgeTts(ai.spokenScript, voice)) throw new Error('TTS failed');
  const voiceDur = probeDuration(voice) || 40;
  const scenes = (ai.scenes || []).slice(0, 7);
  const per = Math.max(5, Math.min(8, Math.min(55, voiceDur) / Math.max(3, scenes.length)));
  const sceneFiles = [];
  for (let i = 0; i < scenes.length; i++) {
    const sc = scenes[i];
    const q = sc.visualQuery || research.mediaHints[i % research.mediaHints.length];
    console.log('[FinList] media', i, q);
    const media = await fetchSceneMedia(q, i);
    sceneFiles.push(renderSceneClip(media, sc.onScreen || research.primaryKeyword, sc.seconds > 3 ? Math.min(8, sc.seconds) : per, i));
  }
  const mp4 = path.join(OUT, 'fin_education_latest.mp4');
  concatScenes(sceneFiles, voice, mp4);
  const dur = probeDuration(mp4);
  const meta = {
    title: research.title.slice(0, 95),
    description: ai.description || structuredScript(research).description,
    tags: ['FinancialLiteracy', 'Students', 'MoneySkills', 'Shorts', 'Nigeria', 'Budget', 'SideHustle'],
    type: 'listicle',
    keyword: research.primaryKeyword,
    videoPath: mp4,
    duration: dur,
    scenes: scenes.length,
    under60: dur > 0 && dur < 60,
    pipeline: 'listicle+keyword+multi-scene',
    generatedAt: new Date().toISOString()
  };
  fs.writeFileSync(path.join(OUT, 'fin_education_latest_meta.json'), JSON.stringify(meta, null, 2));
  fs.writeFileSync(path.join(OUT, 'fin_latest_meta.json'), JSON.stringify(meta, null, 2));
  dedup.usedTitles.push(research.title);
  dedup.usedKeywords.push(research.primaryKeyword);
  saveDedup(dedup);
  console.log('[FinList] OK dur', meta.duration, 'scenes', meta.scenes);

  if (!isDry && process.env.SKIP_YT !== '1') {
    try {
      const yt = require('./youtube_channel_dispatcher.cjs');
      if (typeof yt.uploadYouTubeShort === 'function') {
        const r = await yt.uploadYouTubeShort({
          videoPath: mp4,
          title: meta.title,
          description: meta.description,
          tags: meta.tags,
          channelId: 'finance_saas'
        });
        console.log('[FinList] YT', r);
      }
    } catch (e) {
      console.warn('[FinList] YT soft-fail', e.message);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
