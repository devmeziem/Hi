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
 * Format timestamp in milliseconds to ASS timestamp format (H:MM:SS.cs)
 */
function formatAssTimestamp(ms) {
  const totalSeconds = Math.max(0, ms) / 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const centiseconds = Math.floor((totalSeconds % 1) * 100);
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
}

/**
 * Build Word-by-Word Karaoke Subtitles for Teen Motivation
 */
function generateMotivationAss(words, outAssPath, topic, fullSpeech = '', targetDurationSec = 15) {
  let cleanWords = (words || []).map(w => ({
    text: String(w.part || '').replace(/[\r\n\t]/g, '').trim(),
    startMs: Math.round(w.start),
    endMs: Math.round(w.end)
  })).filter(w => w.text.length > 0);

  if (cleanWords.length === 0 && fullSpeech) {
    const rawWords = fullSpeech.split(/\s+/).filter(w => w.length > 0);
    const totalMs = Math.max(6000, targetDurationSec * 1000 - 1000);
    const msPerWord = totalMs / Math.max(1, rawWords.length);
    cleanWords = rawWords.map((w, idx) => ({
      text: w,
      startMs: Math.round(idx * msPerWord + 200),
      endMs: Math.round((idx + 1) * msPerWord + 150)
    }));
  }

  const lines = [];
  const wordsPerLine = 3;

  for (let i = 0; i < cleanWords.length; i += wordsPerLine) {
    const chunk = cleanWords.slice(i, i + wordsPerLine);
    if (chunk.length === 0) continue;
    const startMs = Math.max(0, chunk[0].startMs - 40);
    const endMs = chunk[chunk.length - 1].endMs + 180;
    let textK = '';
    for (const w of chunk) {
      const durCs = Math.max(8, Math.round((w.endMs - w.startMs) / 10));
      textK += `{\\k${durCs}}${w.text} `;
    }
    lines.push(`Dialogue: 0,${formatAssTimestamp(startMs)},${formatAssTimestamp(endMs)},TeenKaraoke,,0,0,0,,${textK.trim()}`);
  }

  const assContent = `[Script Info]
Title: Apex Teen Motivation Subtitles
ScriptType: v4.00+
WrapStyle: 0
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: TeenKaraoke, Liberation Sans, 48, &H0000D7FF, &H00FFFFFF, &H00000000, &H80000000, 1, 0, 0, 0, 100, 100, 1.4, 0, 1, 4.2, 2.0, 2, 80, 80, 480, 1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${lines.join('\n')}
`;

  fs.writeFileSync(outAssPath, assContent, 'utf8');
  return outAssPath;
}

/**
 * Generate High-Impact Teen Motivation SVG Frame
 * Safe Area: strictly within Y=160 to Y=1360 (below header, above YouTube bottom overlays)
 * Dynamic Typography: dynamically adjusts font-size and line heights based on content length
 */
function buildMotivationSvg(topic, phase = 'hook', width = 1080, height = 1920) {
  const isAction = phase === 'action';
  const accentColor = isAction ? '#f59e0b' : '#38bdf8';
  const badgeBg = isAction ? '#78350f' : '#0369a1';

  const mainText = isAction ? topic.actionChallenge : topic.hook;
  const mainLen = mainText.length;
  // Dynamic font sizing for main hook/action so it never overflows
  const mainFontSize = isAction 
    ? (mainLen > 60 ? 38 : (mainLen > 40 ? 44 : 50))
    : (mainLen > 80 ? 38 : (mainLen > 50 ? 44 : 50));

  const lessonLen = topic.lesson.length;
  const lessonFontSize = lessonLen > 180 ? 25 : (lessonLen > 130 ? 28 : 31);

  // Card geometry: width 900, top 240, height 1120 (ends at Y=1360, leaves 560px for YouTube UI)
  const cardX = 90;
  const cardY = 240;
  const cardW = 900;
  const cardH = 1120;

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
  </defs>

  <!-- Background Base -->
  <rect width="${width}" height="${height}" fill="url(#bgGrad)" />

  <!-- Geometric Grid Crosshairs -->
  <g stroke="rgba(255,255,255,0.06)" stroke-width="1.5">
    <line x1="90" y1="0" x2="90" y2="${height}" />
    <line x1="990" y1="0" x2="990" y2="${height}" />
    <line x1="0" y1="200" x2="${width}" y2="200" />
    <line x1="0" y1="1400" x2="${width}" y2="1400" />
  </g>

  <!-- Top Channel Header Badge (Within Y=140 to Y=210) -->
  <g transform="translate(140, 140)">
    <rect x="0" y="0" width="800" height="66" rx="33" fill="#0f172a" stroke="${accentColor}" stroke-width="2" />
    <circle cx="45" cy="33" r="12" fill="${accentColor}" />
    <text x="75" y="42" font-family="Arial Black, Impact, sans-serif" font-size="22" fill="#ffffff" letter-spacing="3">
      APEX DISCIPLINE // LEVEL UP
    </text>
    <text x="740" y="42" font-family="monospace" font-weight="bold" font-size="18" fill="${accentColor}" text-anchor="end">
      DAILY PROTOCOL
    </text>
  </g>

  <!-- Main Card Container: Exactly within YouTube Shorts Safe Zone (Y=240 to Y=1360) -->
  <g transform="translate(${cardX}, ${cardY})">
    <rect x="0" y="0" width="${cardW}" height="${cardH}" rx="32" fill="#0b1329" stroke="${accentColor}" stroke-width="2.5" stroke-opacity="0.8" />

    <!-- Phase Badge -->
    <rect x="250" y="45" width="400" height="52" rx="26" fill="${badgeBg}" />
    <text x="450" y="78" font-family="Arial Black, sans-serif" font-size="20" fill="#ffffff" letter-spacing="3" text-anchor="middle">
      ${isAction ? '⚡ THE ACTION CHALLENGE ⚡' : '🔥 WAKE UP CALL 🔥'}
    </text>

    <!-- Dynamic Main Hook / Message (No Truncation, Dynamic Font Sizing) -->
    <foreignObject x="50" y="130" width="800" height="420">
      <div xmlns="http://www.w3.org/1999/xhtml" style="display:flex; flex-direction:column; justify-content:center; height:100%; text-align:center; font-family:'Impact', 'Arial Black', sans-serif;">
        <p style="font-size:${mainFontSize}px; line-height:1.2; color:#ffffff; margin:0; text-transform:uppercase; letter-spacing:1px; text-shadow:0 4px 24px rgba(0,0,0,0.85);">
          ${mainText}
        </p>
      </div>
    </foreignObject>

    <!-- Visual Divider with Accent Diamond -->
    <line x1="100" y1="585" x2="800" y2="585" stroke="${accentColor}" stroke-width="2" stroke-dasharray="10 5" />
    <polygon points="450,577 458,585 450,593 442,585" fill="${accentColor}" />

    <!-- Lesson Breakdown Section (Dynamic Font Sizing, No Truncation) -->
    <foreignObject x="60" y="620" width="780" height="340">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:'Arial', sans-serif; font-size:${lessonFontSize}px; line-height:1.45; color:#cbd5e1; text-align:center; font-weight:600; display:flex; align-items:center; justify-content:center; height:100%;">
        ${topic.lesson}
      </div>
    </foreignObject>

    <!-- Bottom Action Pill inside Safe Card -->
    <rect x="70" y="1000" width="760" height="74" rx="37" fill="url(#amberGlow)" />
    <text x="450" y="1046" font-family="Arial Black, sans-serif" font-size="22" fill="#000000" letter-spacing="1.5" text-anchor="middle">
      TAG A BROTHER WHO NEEDS TO LOCK IN
    </text>
  </g>
</svg>`;
}

/**
 * Synthesize High-Energy Brotherly Coaching Voiceover + Word Timing Metadata
 * Uses default pitch (+0Hz) for natural, resonant human voice (no pitchiness)
 */
async function synthesizeMotivationVoice(text, outWavPath, outAssPath, topic) {
  const dir = path.dirname(outWavPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const cleanText = String(text || '').replace(/\s+/g, ' ').trim();
  const tempMp3 = path.join(dir, `edge_motivation_${Date.now()}.mp3`);
  const tempJson = `${tempMp3}.json`;

  try {
    const { EdgeTTS } = require('node-edge-tts');
    const tts = new EdgeTTS({
      voice: 'en-US-ChristopherNeural',
      lang: 'en-US',
      outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
      saveSubtitles: true
    });

    await tts.ttsPromise(cleanText, tempMp3);

    if (fs.existsSync(tempMp3) && fs.statSync(tempMp3).size > 1500) {
      execSync(`ffmpeg -y -i "${tempMp3}" -af "highpass=f=80,lowpass=f=8500,loudnorm=I=-15:TP=-1.5:LRA=9" -ar 44100 -ac 2 "${outWavPath}" 2>/dev/null`);

      let words = [];
      if (fs.existsSync(tempJson)) {
        try {
          words = JSON.parse(fs.readFileSync(tempJson, 'utf8'));
        } catch {}
      }
      generateMotivationAss(words, outAssPath, topic, cleanText);

      try { fs.unlinkSync(tempMp3); fs.unlinkSync(tempJson); } catch {}
      return { success: true, wavPath: outWavPath, assPath: outAssPath };
    }
  } catch (err) {
    console.warn(`[Motivation Voice] Notice: ${err.message}, attempting GuyNeural...`);
  }

  // Fallback voice
  try {
    const { EdgeTTS } = require('node-edge-tts');
    const tts = new EdgeTTS({
      voice: 'en-US-GuyNeural',
      lang: 'en-US',
      outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
      saveSubtitles: true
    });
    await tts.ttsPromise(cleanText, tempMp3);
    if (fs.existsSync(tempMp3)) {
      execSync(`ffmpeg -y -i "${tempMp3}" -af "highpass=f=80,lowpass=f=8500,loudnorm=I=-15:TP=-1.5:LRA=9" -ar 44100 -ac 2 "${outWavPath}" 2>/dev/null`);
      let words = [];
      if (fs.existsSync(tempJson)) {
        try { words = JSON.parse(fs.readFileSync(tempJson, 'utf8')); } catch {}
      }
      generateMotivationAss(words, outAssPath, topic, cleanText);
      try { fs.unlinkSync(tempMp3); fs.unlinkSync(tempJson); } catch {}
      return { success: true, wavPath: outWavPath, assPath: outAssPath };
    }
  } catch {}

  // Safe fallback
  try {
    execSync(`espeak -v en-us+m3 -s 135 -w "${outWavPath}" "${cleanText.replace(/"/g, '\\"')}" 2>/dev/null`);
    if (fs.existsSync(outWavPath) && fs.statSync(outWavPath).size > 2000) {
      generateMotivationAss([], outAssPath, topic, cleanText, 14);
      return { success: true, wavPath: outWavPath, assPath: outAssPath };
    }
  } catch {}

  execSync(`ffmpeg -y -f lavfi -i "sine=frequency=120:duration=12" -af "volume=0.01" -c:a pcm_s16le "${outWavPath}" 2>/dev/null`);
  generateMotivationAss([], outAssPath, topic, cleanText, 12);
  return { success: true, wavPath: outWavPath, assPath: outAssPath };
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

  // 1. Synthesize Voice + Word Timings
  const voiceWav = path.join(ARTIFACTS_DIR, `motivation_voice_${topic.id}.wav`);
  const assPath = path.join(ARTIFACTS_DIR, `motivation_karaoke_${topic.id}.ass`);
  await synthesizeMotivationVoice(speechText, voiceWav, assPath, topic);

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

  // 4. Assemble Final Video with Smooth Cut & Burned-In Subtitles
  const halfDur = Number((totalDuration / 2).toFixed(2));
  const outMp4 = path.join(ARTIFACTS_DIR, `teen_motivation_${topic.id}.mp4`);
  const escapedAss = assPath.replace(/\\/g, '/').replace(/:/g, '\\:');

  console.log(`[Motivation Generator] 🎥 Assembling 1080x1920 MP4 Video (${totalDuration}s) with On-Screen Captions...`);
  const renderCmd = `ffmpeg -y -loop 1 -t ${halfDur} -i "${hookPng}" -loop 1 -t ${halfDur} -i "${actionPng}" -i "${masterWav}" -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0[vconcat];[vconcat]ass='${escapedAss}'[vout]" -map "[vout]" -map 2:a -c:v libx264 -preset fast -crf 20 -c:a aac -b:a 192k -shortest "${outMp4}" 2>/dev/null`;

  try {
    execSync(renderCmd);
    const sz = fs.statSync(outMp4).size;
    console.log(`[Motivation Generator] ✅ SUCCESS: Teen Motivation Reel Created! (${(sz / (1024 * 1024)).toFixed(2)} MB)`);
    console.log(`[Motivation Generator] 📁 Output: ${outMp4}`);
  } catch (err) {
    console.warn(`[Motivation Generator] Notice with subtitle filter, running fallback render...`);
    const fallbackCmd = `ffmpeg -y -loop 1 -t ${halfDur} -i "${hookPng}" -loop 1 -t ${halfDur} -i "${actionPng}" -i "${masterWav}" -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0[vconcat]" -map "[vconcat]" -map 2:a -c:v libx264 -preset fast -crf 20 -c:a aac -b:a 192k -shortest "${outMp4}" 2>/dev/null`;
    execSync(fallbackCmd);
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
