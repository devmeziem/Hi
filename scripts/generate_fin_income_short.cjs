#!/usr/bin/env node
/**
 * Fin Blueprint education short — HIGH QUALITY path
 * TTS uses edge_tts_helper (pip edge-tts), not npx.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { edgeTts: edgeTtsHelper } = require('./edge_tts_helper.cjs');

const OUT = path.join(process.cwd(), 'rendered_videos');
const ART = path.join(process.cwd(), 'test_artifacts', 'fin_edu');
const DEDUP = path.join(process.cwd(), 'data', 'fin_income_dedup.json');
const isDry = String(process.env.DRY_RUN || 'false') === 'true';
let slotMode = String(process.env.FIN_SLOT_MODE || process.env.VIDEO_MODE || 'auto').toLowerCase();

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(ART, { recursive: true });

const DISCLAIMER =
  'Educational content only — not financial advice. Markets and income can go up or down. Never send money to strangers promising guaranteed returns. Verify everything yourself.';

const LESSONS = [
  { id: 'concept_what_is_crypto', type: 'concept', title: 'What is crypto? Simple definition students actually need', keyword: 'cryptocurrency', seed: 'Define cryptocurrency simply, real-life ledger analogy, types (Bitcoin, stablecoins, other coins), minimum to start is learning not buying, scam pressure warning', tags: ['CryptoBasics', 'Students', 'FinancialLiteracy', 'Nigeria', 'Shorts'], needDisclaimer: true, link: 'xenvest', mediaHints: ['blockchain abstract', 'digital currency phone', 'student studying laptop'] },
  { id: 'concept_what_is_budget', type: 'concept', title: 'What a budget really is (not a punishment)', keyword: 'budget', seed: 'Budget is a written plan before the month spends for you; real example data food transport; types zero-based and 50-30-20; start with phone notes three categories', tags: ['Budget', 'Students', 'MoneySkills', 'Shorts'], needDisclaimer: false, link: null, mediaHints: ['notebook planning', 'phone notes', 'student cafe money'] },
  { id: 'concept_interest', type: 'concept', title: 'Interest explained: why debt grows and savings can grow', keyword: 'interest', seed: 'Interest is price of borrowed money or reward for saving; loan cost vs savings reward; simple vs compound; read rate and fees before signing; high pressure interest is a warning', tags: ['Interest', 'Debt', 'Savings', 'Students', 'Shorts'], needDisclaimer: true, link: null, mediaHints: ['bank building', 'calculator desk', 'savings jar'] },
  { id: 'concept_inflation', type: 'concept', title: 'Inflation in plain English: why prices feel heavier', keyword: 'inflation', seed: 'Inflation means same money buys less; food transport example; track two recurring costs; awareness beats panic', tags: ['Inflation', 'Nigeria', 'Students', 'FinancialLiteracy', 'Shorts'], needDisclaimer: false, link: null, mediaHints: ['market food stall', 'city traffic', 'grocery prices'] },
  { id: 'plan_5_moves_student', type: 'plan', title: 'If I were a student with little money: 5 moves this week', keyword: 'student money plan', seed: 'Five moves: list income and must-pay costs; cut one optional spend into buffer; pick one free campus skill; refuse upfront fee guaranteed profit; Sunday ten minute review', tags: ['StudentMoney', 'MoneyPlan', 'Nigeria', 'Shorts'], needDisclaimer: true, link: 'lanecash', mediaHints: ['university campus', 'student walking', 'writing checklist'] },
  { id: 'skill_track_3days', type: 'skill', title: 'Free money skill: track every spend for 3 days', keyword: 'spending tracker', seed: 'No capital needed; write every spend three days; circle one painless cut; move that amount to savings pocket same day', tags: ['MoneySkills', 'Budget', 'Students', 'Shorts'], needDisclaimer: false, link: null, mediaHints: ['phone typing', 'receipt paper', 'coffee small spend'] },
  { id: 'trap_guaranteed_returns', type: 'trap', title: 'Trap: guaranteed returns and urgent WhatsApp investments', keyword: 'investment scam', seed: 'Real markets do not guarantee smooth private profits to strangers; urgency secrecy upfront payment pattern; slow questions written terms walk away', tags: ['ScamAwareness', 'Nigeria', 'Students', 'MoneySafety', 'Shorts'], needDisclaimer: true, link: null, mediaHints: ['warning phone scam', 'handshake money', 'locked padlock'] },
  { id: 'earn_campus_skill', type: 'income', title: 'Nigeria-first: sell a campus skill with near-zero capital', keyword: 'campus hustle', seed: 'Start where trust exists; skill you already do typing phone setup tutoring; fixed small price clear delivery; five honest deliveries beat empty plans', tags: ['Nigeria', 'CampusHustle', 'Students', 'SideIncome', 'Shorts'], needDisclaimer: true, link: 'lanecash', mediaHints: ['african university students', 'phone repair desk', 'tutoring books'] }
];

function loadDedup() {
  try { return JSON.parse(fs.readFileSync(DEDUP, 'utf8')); } catch { return { used: [] }; }
}
function saveDedup(d) {
  d.used = (d.used || []).slice(-80);
  fs.writeFileSync(DEDUP, JSON.stringify(d, null, 2));
}
function pickLesson() {
  const d = loadDedup();
  const recent = new Set((d.used || []).map((x) => x.id));
  let pool = LESSONS.filter((x) => !recent.has(x.id));
  if (!pool.length) pool = LESSONS.slice();
  const mode = slotMode === 'auto' || !slotMode ? null : slotMode;
  if (mode === 'skill' || mode === 'teach') {
    const t = pool.filter((x) => ['skill', 'plan', 'concept'].includes(x.type));
    if (t.length) pool = t;
  } else if (mode === 'trap') {
    const t = pool.filter((x) => x.type === 'trap');
    if (t.length) pool = t;
  } else if (mode === 'income') {
    const t = pool.filter((x) => x.type === 'income');
    if (t.length) pool = t;
  }
  const item = pool[Math.floor(Math.random() * pool.length)];
  d.used.push({ id: item.id, at: new Date().toISOString(), type: item.type });
  saveDedup(d);
  return item;
}
function linkLine(link) {
  if (link === 'xenvest') return 'When you want longer-term learning tools: xenvest.name.ng — still verify everything yourself.';
  if (link === 'lanecash') return 'Practical hustle structure ideas: lanecash.name.ng — still verify everything yourself.';
  return '';
}
async function aiExpand(lesson) {
  const system = `You write short educational finance scripts for Nigerian/global students under 25.
Return STRICT JSON only:
{\n  "spokenScript": "90-140 words, natural spoken English, teaching arc.",\n  "scenes": [{"onScreen": "max 6 words", "visualQuery": "3-5 word stock search query", "seconds": 6}],\n  "description": "YouTube description 400-800 chars"\n}
Rules: 4 to 6 scenes. Each visualQuery must be DIFFERENT.`;
  const user = `Title: ${lesson.title}\nKeyword: ${lesson.keyword}\nSeed: ${lesson.seed}\nType: ${lesson.type}`;
  try {
    const { callActiveAiForJson } = require('./topic_discovery_engine.cjs');
    const res = await callActiveAiForJson(system, user, null, { nicheKey: 'finance', temperature: 0.55 });
    if (res && res.spokenScript && Array.isArray(res.scenes) && res.scenes.length >= 3) return res;
    if (res && res.data && res.data.spokenScript) return res.data;
  } catch (e) {
    console.warn('[Fin] AI soft-fail', e.message);
  }
  const hints = lesson.mediaHints || ['finance education', 'student money', 'planning desk'];
  return {
    spokenScript: lesson.seed + ' Take one small action today. ' + (lesson.needDisclaimer ? 'This is education, not advice.' : ''),
    scenes: hints.slice(0, 5).map((h) => ({ onScreen: lesson.title.split(/[:–-]/)[0].trim().slice(0, 28), visualQuery: h, seconds: 6 })),
    description: `${lesson.title}\n\nKeyword: ${lesson.keyword}\n\n${lesson.seed}\n\n${DISCLAIMER}`
  };
}
function edgeTts(text, outFile) {
  return edgeTtsHelper(text, outFile, {
    voice: process.env.FIN_VOICE || 'en-US-AndrewNeural',
    rate: process.env.FIN_RATE || '+0%',
    pitch: process.env.FIN_PITCH || '-5Hz'
  });
}
function probeDuration(file) {
  try {
    return parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${file}"`, { encoding: 'utf8' })) || 0;
  } catch { return 0; }
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
  const draw = `drawbox=x=0:y=1550:w=1080:h=280:color=black@0.55:t=fill,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='${text}':fontsize=40:fontcolor=white:x=(w-text_w)/2:y=1650`;
  if (media.type === 'video') {
    execSync(`ffmpeg -y -stream_loop -1 -i "${media.path}" -t ${seconds.toFixed(2)} -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,${draw}" -an -c:v libx264 -pix_fmt yuv420p -preset fast "${out}"`, { stdio: 'pipe' });
  } else {
    execSync(`ffmpeg -y -loop 1 -i "${media.path}" -t ${seconds.toFixed(2)} -vf "scale=1200:2100:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(zoom+0.0015,1.12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30,${draw}" -an -c:v libx264 -pix_fmt yuv420p -preset fast "${out}"`, { stdio: 'pipe' });
  }
  return out;
}
function concatScenes(sceneFiles, voicePath, outMp4) {
  const list = path.join(ART, 'concat.txt');
  fs.writeFileSync(list, sceneFiles.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'));
  const silent = path.join(ART, 'visual_silent.mp4');
  execSync(`ffmpeg -y -f concat -safe 0 -i "${list}" -c:v libx264 -pix_fmt yuv420p -r 30 "${silent}"`, { stdio: 'pipe' });
  const bed = path.join(ART, 'bed.wav');
  const vDur = probeDuration(voicePath) || probeDuration(silent) || 30;
  execSync(`ffmpeg -y -f lavfi -i "sine=f=220:d=${vDur.toFixed(2)}" -af "volume=0.03" "${bed}"`, { stdio: 'pipe' });
  execSync(`ffmpeg -y -i "${silent}" -i "${voicePath}" -i "${bed}" -filter_complex "[1:a]volume=1.0[a1];[2:a]volume=0.35[a2];[a1][a2]amix=inputs=2:duration=first:dropout_transition=2[a]" -map 0:v -map "[a]" -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest -t ${vDur.toFixed(2)} "${outMp4}"`, { stdio: 'pipe' });
}
function buildDescription(lesson, ai) {
  return [lesson.title, '', `Keyword focus: ${lesson.keyword}`, '', ai.description || lesson.seed, '', linkLine(lesson.link), '', lesson.needDisclaimer !== false ? DISCLAIMER : '', '', (lesson.tags || []).map((t) => (t.startsWith('#') ? t : '#' + t)).join(' '), '', 'Subscribe for practical money education for students and young adults.'].filter(Boolean).join('\n').slice(0, 4800);
}
async function main() {
  const lesson = pickLesson();
  console.log('[Fin] lesson', lesson.type, lesson.title);
  const ai = await aiExpand(lesson);
  const voice = path.join(ART, 'voice.mp3');
  if (!edgeTts(ai.spokenScript, voice)) throw new Error('TTS failed — refusing silent low-quality output');
  const voiceDur = probeDuration(voice) || 30;
  const scenes = (ai.scenes || []).slice(0, 6);
  const per = Math.max(4.5, Math.min(8, voiceDur / Math.max(3, scenes.length)));
  const sceneFiles = [];
  for (let i = 0; i < scenes.length; i++) {
    const sc = scenes[i];
    const q = sc.visualQuery || lesson.mediaHints[i % lesson.mediaHints.length];
    console.log('[Fin] media', i, q);
    const media = await fetchSceneMedia(q, i);
    sceneFiles.push(renderSceneClip(media, sc.onScreen || lesson.keyword, sc.seconds && sc.seconds > 3 ? Math.min(8, sc.seconds) : per, i));
  }
  const mp4 = path.join(OUT, 'fin_education_latest.mp4');
  concatScenes(sceneFiles, voice, mp4);
  const meta = { title: lesson.title.slice(0, 95), description: buildDescription(lesson, ai), tags: lesson.tags, type: lesson.type, keyword: lesson.keyword, videoPath: mp4, duration: probeDuration(mp4), scenes: scenes.length, pipeline: 'ai-script+multi-scene-media', generatedAt: new Date().toISOString() };
  fs.writeFileSync(path.join(OUT, 'fin_education_latest_meta.json'), JSON.stringify(meta, null, 2));
  fs.writeFileSync(path.join(OUT, 'fin_latest_meta.json'), JSON.stringify(meta, null, 2));
  console.log('[Fin] OK multi-scene', meta.scenes, 'dur', meta.duration);
  if (!isDry && process.env.SKIP_YT !== '1') {
    try {
      const yt = require('./youtube_channel_dispatcher.cjs');
      if (typeof yt.uploadYouTubeShort === 'function') {
        console.log('[Fin] YT', await yt.uploadYouTubeShort({ videoPath: mp4, title: meta.title, description: meta.description, tags: meta.tags, channelId: 'finance_saas' }));
      }
    } catch (e) { console.warn('[Fin] YT soft-fail', e.message); }
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
