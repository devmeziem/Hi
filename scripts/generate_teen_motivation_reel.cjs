/**
 * Youth & Teen Motivation Generator
 * 
 * High-octane motivational reels tailored specifically for young men and teens.
 * Core Themes:
 * - The 21-Day Dopamine Reset (Breaking Phone & Gaming Addiction)
 * - Exam & Study Lockdown (Deep Work & Focus)
 * - The 5 AM Gym & Fitness Discipline (Building Self-Confidence)
 * - Stop Comparing Chapter 1 to Chapter 20 (Mental Toughness)
 * - The Inner Circle: Brotherhood & Standards
 * 
 * Visuals: Bold kinetic typography, gritty dark slate with high-voltage neon amber accents,
 * dynamic progress bar, punchy brotherly coaching voiceover.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { resolveRealMusicTrack } = require('./audio_asset_manager.cjs');

const ARTIFACTS_DIR = path.join(process.cwd(), 'test_artifacts', 'motivation_reels');
if (!fs.existsSync(ARTIFACTS_DIR)) {
  try { fs.mkdirSync(ARTIFACTS_DIR, { recursive: true }); } catch {}
}

const MANIFEST_PATH = path.join(process.cwd(), 'test_artifacts', 'teen_motivation_manifest.json');

const MOTIVATION_TOPICS = [
  {
    id: "dopamine_reset_21_days",
    title: "Why Your Phone Is Stealing Your Future",
    hook: "You're not lazy. You're just drowning in cheap dopamine.",
    lesson: "Every time you scroll for three hours, you trade your real-world ambitions for someone else's highlight reel. Put the screen down for twenty-one days and watch your focus turn into a superpower.",
    actionChallenge: "RULE 1: NO PHONE IN BED FOR 7 DAYS",
    takeaway: "Discipline is doing what needs to be done, even when you don't feel like it.",
    tags: ['#TeenMotivation', '#YoungMenMotivation', '#Discipline', '#DopamineDetox', '#Grindset', '#Focus', '#SelfImprovement', '#Shorts']
  },
  {
    id: "lock_in_exam_study",
    title: "How To Lock In When Everyone Else Quits",
    hook: "While they are talking about what they're gonna do, you put your head down and work.",
    lesson: "High school and college aren't tests of intelligence. They're tests of stamina. Two hours of undivided deep focus beats eight hours of distracted studying every single day.",
    actionChallenge: "TRY THE 50/10 RULE: 50 MIN FOCUS, 0 NOTIFICATIONS",
    takeaway: "Small daily habits compound into massive unfair advantages.",
    tags: ['#StudyMotivation', '#LockIn', '#AcademicComeback', '#FocusMindset', '#TeenDiscipline', '#Productivity', '#Shorts']
  },
  {
    id: "gym_confidence_rule",
    title: "The Gym Doesn't Build Muscle, It Builds Armor",
    hook: "You can't buy genuine self-respect. You have to earn it under the barbell.",
    lesson: "When you push through that final rep when your lungs are burning, you teach your brain that pain is temporary and you are in control. That confidence transfers to every room you walk into.",
    actionChallenge: "NEVER SKIP MONDAY: SHOW UP REGARDLESS OF MOOD",
    takeaway: "The version of you that wins is waiting on the other side of consistency.",
    tags: ['#GymMotivation', '#TeenFitness', '#MindsetShift', '#HardWork', '#Brotherhood', '#Confidence', '#Shorts']
  }
];

/**
 * Generate High-Impact Teen Motivation SVG Frame
 */
function buildMotivationSvg(topic, phase = 'hook', width = 1080, height = 1920) {
  const isAction = phase === 'action';
  const accentColor = isAction ? '#f59e0b' : '#38bdf8';
  const badgeBg = isAction ? '#78350f' : '#0369a1';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#020617" />
      <stop offset="40%" stop-color="#0b1120" />
      <stop offset="100%" stop-color="#02040a" />
    </linearGradient>
    <linearGradient id="amberGlow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#ef4444" />
    </linearGradient>
    <filter id="neonPulse">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="${width}" height="${height}" fill="url(#bgGrad)" />

  <!-- High-Energy Geometric Crosshairs & Halftone Dots -->
  <g stroke="rgba(255,255,255,0.06)" stroke-width="1.5">
    <line x1="80" y1="0" x2="80" y2="${height}" />
    <line x1="1000" y1="0" x2="1000" y2="${height}" />
    <line x1="0" y1="240" x2="${width}" y2="240" />
    <line x1="0" y1="1680" x2="${width}" y2="1680" />
  </g>

  <!-- Top Channel Header Badge -->
  <g transform="translate(140, 140)">
    <rect x="0" y="0" width="800" height="70" rx="35" fill="#0f172a" stroke="${accentColor}" stroke-width="2" />
    <circle cx="50" cy="35" r="14" fill="${accentColor}" />
    <text x="80" y="44" font-family="Arial Black, Impact, sans-serif" font-size="24" fill="#ffffff" letter-spacing="3">
      APEX DISCIPLINE // LEVEL UP
    </text>
    <text x="730" y="44" font-family="monospace" font-weight="bold" font-size="20" fill="${accentColor}" text-anchor="end">
      DAILY PROTOCOL
    </text>
  </g>

  <!-- Main Card Container -->
  <g transform="translate(100, 320)">
    <rect x="0" y="0" width="880" height="1280" rx="36" fill="#0b1329" stroke="${accentColor}" stroke-width="3" stroke-opacity="0.7" />

    <!-- Phase Badge -->
    <rect x="240" y="60" width="400" height="56" rx="28" fill="${badgeBg}" />
    <text x="440" y="96" font-family="Arial Black, sans-serif" font-size="22" fill="#ffffff" letter-spacing="3" text-anchor="middle">
      ${isAction ? '⚡ THE ACTION CHALLENGE ⚡' : '🔥 WAKE UP CALL 🔥'}
    </text>

    <!-- Punchy Main Hook / Message -->
    <foreignObject x="60" y="180" width="760" height="520">
      <div xmlns="http://www.w3.org/1999/xhtml" style="display:flex; flex-direction:column; justify-content:center; height:100%; text-align:center; font-family:'Impact', 'Arial Black', sans-serif;">
        <p style="font-size:52px; line-height:1.15; color:#ffffff; margin:0; text-transform:uppercase; letter-spacing:1px; text-shadow:0 4px 20px rgba(0,0,0,0.8);">
          ${isAction ? topic.actionChallenge : topic.hook}
        </p>
      </div>
    </foreignObject>

    <!-- Visual Divider with Accent Diamond -->
    <line x1="120" y1="740" x2="760" y2="740" stroke="${accentColor}" stroke-width="2" stroke-dasharray="12 6" />
    <polygon points="440,730 450,740 440,750 430,740" fill="${accentColor}" />

    <!-- Lesson Breakdown Section -->
    <foreignObject x="70" y="790" width="740" height="320">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:'Arial', sans-serif; font-size:32px; line-height:1.45; color:#cbd5e1; text-align:center; font-weight:600;">
        ${topic.lesson}
      </div>
    </foreignObject>

    <!-- Bottom Takeaway Pill -->
    <rect x="80" y="1150" width="720" height="80" rx="40" fill="url(#amberGlow)" />
    <text x="440" y="1200" font-family="Arial Black, sans-serif" font-size="24" fill="#000000" letter-spacing="1.5" text-anchor="middle">
      TAG A BROTHER WHO NEEDS TO LOCK IN
    </text>
  </g>

  <!-- Bottom CTA Footer -->
  <text x="540" y="1780" font-family="Arial Black, sans-serif" font-size="34" fill="#ffffff" letter-spacing="4" text-anchor="middle">
    HIT SUBSCRIBE TO LEVEL UP TODAY
  </text>
  <text x="540" y="1830" font-family="monospace" font-size="20" fill="#64748b" letter-spacing="2" text-anchor="middle">
    NO EXCUSES // 1% BETTER EVERY SINGLE DAY
  </text>
</svg>`;
}

/**
 * Synthesize High-Energy Brotherly Coaching Voiceover
 */
async function synthesizeMotivationVoice(text, outWavPath) {
  const dir = path.dirname(outWavPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const cleanText = String(text || '').replace(/\s+/g, ' ').trim();

  try {
    const { EdgeTTS } = require('node-edge-tts');
    const tempMp3 = path.join(dir, `edge_motivation_${Date.now()}.mp3`);
    // RyanNeural / GuyNeural gives confident, brotherly mentor delivery
    const tts = new EdgeTTS({
      voice: 'en-US-GuyNeural',
      lang: 'en-US',
      outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
      pitch: '+1Hz',
      rate: '+8%' // punchy high-energy cadence
    });

    await tts.ttsPromise(cleanText, tempMp3);

    if (fs.existsSync(tempMp3) && fs.statSync(tempMp3).size > 1500) {
      execSync(`ffmpeg -y -i "${tempMp3}" -af "equalizer=f=2800:t=q:w=1:g=2.5,bass=g=3:f=140" -ar 44100 -ac 2 "${outWavPath}" 2>/dev/null`);
      try { fs.unlinkSync(tempMp3); } catch {}
      if (fs.existsSync(outWavPath) && fs.statSync(outWavPath).size > 2000) {
        return outWavPath;
      }
    }
  } catch {}

  execSync(`ffmpeg -y -f lavfi -i "anullsrc=r=44100:cl=stereo" -t 8 -c:a pcm_s16le "${outWavPath}" 2>/dev/null`);
  return outWavPath;
}

/**
 * Main Teen Motivation Reel Generator
 */
async function generateTeenMotivationReel(topicIndex = 0) {
  console.log('\n======================================================');
  console.log('⚡ APEX DISCIPLINE: TEEN & YOUTH MOTIVATION GENERATOR');
  console.log('======================================================\n');

  const topic = MOTIVATION_TOPICS[topicIndex % MOTIVATION_TOPICS.length];
  console.log(`[Motivation Generator] 🎯 Topic: "${topic.title}"`);
  console.log(`[Motivation Generator] 💡 Hook: "${topic.hook}"`);

  const speechText = `${topic.hook} ${topic.lesson} Here is your challenge: ${topic.actionChallenge}. ${topic.takeaway}`;

  // 1. Synthesize Voice
  const voiceWav = path.join(ARTIFACTS_DIR, `motivation_voice_${topic.id}.wav`);
  await synthesizeMotivationVoice(speechText, voiceWav);

  let voiceDuration = 10.0;
  try {
    const durStr = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${voiceWav}" 2>/dev/null`).toString().trim();
    const parsed = parseFloat(durStr);
    if (!isNaN(parsed) && parsed > 2.0) voiceDuration = parsed;
  } catch {}

  const totalDuration = Math.max(8.0, Number((voiceDuration + 1.5).toFixed(2)));
  console.log(`[Motivation Generator] ⏱️ Voice: ${voiceDuration.toFixed(2)}s -> Target Reel: ${totalDuration}s`);

  // 2. Resolve Real Music Track
  const masterWav = path.join(ARTIFACTS_DIR, `motivation_master_audio_${topic.id}.wav`);
  const realTrack = await resolveRealMusicTrack({
    niche: 'motivation',
    duration: totalDuration,
    soundUrl: process.env.MOTIVATION_MUSIC_URL || process.env.SOUND_URL
  });

  if (realTrack && fs.existsSync(realTrack)) {
    console.log(`[Motivation Generator] 🎶 Ducking real high-octane background track under voiceover...`);
    const mixCmd = `ffmpeg -y -i "${voiceWav}" -i "${realTrack}" -filter_complex "[0:a]volume=1.4[v];[1:a]volume=0.15,atrim=0:${totalDuration}[m];[v][m]amix=inputs=2:duration=longest,loudnorm=I=-16:TP=-1.5:LRA=11[out]" -map "[out]" -c:a pcm_s16le -ar 44100 -ac 2 "${masterWav}" 2>/dev/null`;
    try { execSync(mixCmd); } catch { fs.copyFileSync(voiceWav, masterWav); }
  } else {
    fs.copyFileSync(voiceWav, masterWav);
  }

  // 3. Render 2 Frames (Hook -> Action Challenge)
  const hookSvg = buildMotivationSvg(topic, 'hook');
  const actionSvg = buildMotivationSvg(topic, 'action');
  const hookPng = path.join(ARTIFACTS_DIR, `${topic.id}_hook.png`);
  const actionPng = path.join(ARTIFACTS_DIR, `${topic.id}_action.png`);

  const hookSvgPath = path.join(ARTIFACTS_DIR, `${topic.id}_hook.svg`);
  const actionSvgPath = path.join(ARTIFACTS_DIR, `${topic.id}_action.svg`);
  fs.writeFileSync(hookSvgPath, hookSvg);
  fs.writeFileSync(actionSvgPath, actionSvg);

  execSync(`ffmpeg -y -i "${hookSvgPath}" -vf "scale=1080:1920" "${hookPng}" 2>/dev/null`);
  execSync(`ffmpeg -y -i "${actionSvgPath}" -vf "scale=1080:1920" "${actionPng}" 2>/dev/null`);

  // 4. Assemble Final Video with Smooth Crossfade
  const halfDur = Number((totalDuration / 2).toFixed(2));
  const outMp4 = path.join(ARTIFACTS_DIR, `teen_motivation_${topic.id}.mp4`);

  console.log(`[Motivation Generator] 🎥 Assembling 1080x1920 MP4 Video (${totalDuration}s)...`);
  const renderCmd = `ffmpeg -y -loop 1 -t ${halfDur} -i "${hookPng}" -loop 1 -t ${halfDur} -i "${actionPng}" -i "${masterWav}" -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0[vconcat]" -map "[vconcat]" -map 2:a -c:v libx264 -preset fast -crf 20 -c:a aac -b:a 192k -shortest "${outMp4}" 2>/dev/null`;

  try {
    execSync(renderCmd);
    const sz = fs.statSync(outMp4).size;
    console.log(`[Motivation Generator] ✅ SUCCESS: Teen Motivation Reel Created! (${(sz / (1024 * 1024)).toFixed(2)} MB)`);
    console.log(`[Motivation Generator] 📁 Output: ${outMp4}`);
  } catch (err) {
    console.error(`[Motivation Generator] Video assembly error: ${err.message}`);
  }

  // 5. Update Manifest
  const manifestEntry = {
    id: `motivation_${topic.id}_${Date.now()}`,
    title: topic.title,
    hook: topic.hook,
    challenge: topic.actionChallenge,
    videoPath: outMp4,
    duration: totalDuration,
    tags: topic.tags,
    youtubeUploadStatus: "PENDING_REVIEW (Upload hold enabled)",
    createdAt: new Date().toISOString()
  };

  let manifest = [];
  try {
    if (fs.existsSync(MANIFEST_PATH)) {
      manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    }
  } catch {}
  manifest.unshift(manifestEntry);
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');

  console.log(`[Motivation Generator] 📝 Manifest updated: ${MANIFEST_PATH}\n`);
  return manifestEntry;
}

if (require.main === module) {
  generateTeenMotivationReel(0).catch(console.error);
}

module.exports = {
  generateTeenMotivationReel,
  MOTIVATION_TOPICS
};
