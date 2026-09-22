/**
 * Universal Audio Asset Manager for Automated Content Channels
 *
 * Supports dedicated sound upload folders:
 * - sound_assets/motivation_5s/  (5-second teen/youth motivation reels)
 * - sound_assets/motivation_15s/ (15-second teen public opinion vs reality reels)
 * - sound_assets/stoic/          (Stoic & World Scholars quote reels)
 * - sound_assets/finance/        (Financial Blueprint quote reels)
 *
 * Behavior:
 * - Scans designated folder for audio files (.mp3, .wav, .m4a, .aac, .ogg)
 * - Randomly selects an uploaded sound track if multiple exist
 * - Applies FFmpeg loudness normalization, seamless looping, and fades
 * - Provides procedural synthesis fallback if no custom audio is uploaded yet
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const AUDIO_EXTENSIONS = /\.(mp3|wav|m4a|aac|ogg|flac)$/i;

/**
 * Resolve and render normalized audio track for a channel and duration
 * @param {string} channelKey - 'motivation_5s' | 'motivation_15s' | 'stoic' | 'finance'
 * @param {number} durationSeconds - Target duration in seconds
 * @param {string} outputPath - Path to write the output WAV/AAC audio file
 */
function resolveChannelAudio(channelKey, durationSeconds, outputPath) {
  if (!fs.existsSync(path.dirname(outputPath))) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  }

  const primaryDir = path.join(process.cwd(), 'sound_assets', channelKey);
  const fallbackDirs = [
    path.join(process.cwd(), 'sound_assets'),
    path.join(process.cwd(), 'assets', 'sounds'),
    path.join(process.cwd(), 'assets', 'audio')
  ];

  if (channelKey.startsWith('motivation')) {
    fallbackDirs.unshift(path.join(process.cwd(), 'sound_assets', 'motivation'));
  }

  // Check designated directory first
  let candidates = [];
  if (fs.existsSync(primaryDir)) {
    try {
      const files = fs.readdirSync(primaryDir)
        .filter(f => AUDIO_EXTENSIONS.test(f))
        .map(f => path.join(primaryDir, f))
        .filter(f => {
          try { return fs.statSync(f).size > 1024; } catch { return false; }
        });
      candidates.push(...files);
    } catch (e) {
      console.warn(`[Audio Asset Manager] Warning reading ${primaryDir}:`, e.message);
    }
  }

  // Fallback to secondary directories if designated folder has no audio
  if (candidates.length === 0) {
    for (const dir of fallbackDirs) {
      if (fs.existsSync(dir)) {
        try {
          const files = fs.readdirSync(dir)
            .filter(f => AUDIO_EXTENSIONS.test(f))
            .map(f => path.join(dir, f))
            .filter(f => {
              try { return fs.statSync(f).size > 1024; } catch { return false; }
            });
          candidates.push(...files);
          if (candidates.length > 0) break;
        } catch {}
      }
    }
  }

  // If uploaded sound file(s) found: pick randomly!
  if (candidates.length > 0) {
    const chosenTrack = candidates[Math.floor(Math.random() * candidates.length)];
    console.log(`[Audio Asset Manager] 🎵 Channel: [${channelKey}] -> Randomly selected track (${candidates.length} available): "${path.basename(chosenTrack)}"`);
    console.log(`[Audio Asset Manager] 🎚️ Normalizing loudness & formatting to ${durationSeconds.toFixed(1)}s loop...`);

    const dur = durationSeconds.toFixed(2);
    const fadeIn = Math.min(0.2, durationSeconds * 0.05).toFixed(2);
    const fadeOut = Math.min(0.3, durationSeconds * 0.06).toFixed(2);
    const fadeOutStart = (durationSeconds - parseFloat(fadeOut)).toFixed(2);

    const cmd = `ffmpeg -y -stream_loop -1 -i "${chosenTrack}" -t ${dur} -af "loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=in:ss=0:d=${fadeIn},afade=t=out:st=${fadeOutStart}:d=${fadeOut}" -c:a pcm_s16le -ar 44100 -ac 2 "${outputPath}" 2>/dev/null`;

    try {
      execSync(cmd);
      if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 2000) {
        return outputPath;
      }
    } catch (err) {
      console.warn(`[Audio Asset Manager] Processing uploaded track failed (${err.message}). Using procedural synth.`);
    }
  } else {
    console.log(`[Audio Asset Manager] ℹ️ No uploaded audio files found in sound_assets/${channelKey}/. Using procedural cinematic synthesis.`);
  }

  // Procedural Synthesis Fallback tailored to channel aesthetics
  synthesizeProceduralAudio(channelKey, durationSeconds, outputPath);
  return outputPath;
}

/**
 * Procedural Audio Synthesis Fallback
 */
function synthesizeProceduralAudio(channelKey, durationSeconds, outputPath) {
  const dur = durationSeconds.toFixed(2);
  const fadeOutStart = (durationSeconds - 0.25).toFixed(2);

  let filterExpr = '';
  if (channelKey === 'motivation_15s') {
    // 15-second cinematic arc:
    // 0-7s: Eerie suspense drone + atmospheric frequency riser
    // 7-8s: Silence during the black screen
    // 8-15s: Explosive 808 sub-bass slam impact + driving focus pulse
    filterExpr = [
      // Part 1: Suspense drone (0-7s)
      `sine=frequency=55:duration=7.0,volume=0.35,afade=t=out:st=6.6:d=0.4[drone1]`,
      `sine=frequency=110:duration=7.0,volume=0.15,afade=t=out:st=6.6:d=0.4[pad1]`,
      // Part 2: Dead silence (7-8s)
      `anullsrc=r=44100:cl=stereo:d=1.0[silence]`,
      // Part 3: Slam impact at 8s (sub-drop + driving power beat)
      `sine=frequency=42:duration=7.0,volume=0.45,afade=t=in:ss=0:d=0.08,afade=t=out:st=6.7:d=0.3[slamSub]`,
      `sine=frequency=880:duration=7.0,volume=0.04[tick]`,
      `[drone1][pad1]amix=inputs=2[p1]`,
      `[slamSub][tick]amix=inputs=2[p3]`,
      `[p1][silence][p3]concat=n=3:v=0:a=1[concatted]`,
      `[concatted]afade=t=in:ss=0:d=0.2,afade=t=out:st=${fadeOutStart}:d=0.25[out]`
    ].join(';');
  } else if (channelKey === 'motivation_5s') {
    // 5-second intense focus sub-bass pulse + metallic tick
    filterExpr = [
      `sine=frequency=48:duration=${dur},volume=0.4[sub]`,
      `sine=frequency=120:duration=${dur},volume=0.2[body]`,
      `sine=frequency=880:duration=${dur},volume=0.03[tick]`,
      `[sub][body][tick]amix=inputs=3[mixed]`,
      `[mixed]afade=t=in:ss=0:d=0.15,afade=t=out:st=${fadeOutStart}:d=0.2[out]`
    ].join(';');
  } else if (channelKey === 'stoic') {
    // Ancient cavernous mystery drone
    filterExpr = [
      `sine=frequency=43:duration=${dur},volume=0.35[abyss]`,
      `sine=frequency=108:duration=${dur},volume=0.2[minor]`,
      `sine=frequency=216:duration=${dur},volume=0.1[overtone]`,
      `[abyss][minor][overtone]amix=inputs=3[mixed]`,
      `[mixed]afade=t=in:ss=0:d=0.2,afade=t=out:st=${fadeOutStart}:d=0.2[out]`
    ].join(';');
  } else {
    // Finance: low-frequency institutional pulse
    filterExpr = [
      `sine=frequency=52:duration=${dur},volume=0.4[sub]`,
      `sine=frequency=156:duration=${dur},volume=0.18[mid]`,
      `[sub][mid]amix=inputs=2[mixed]`,
      `[mixed]afade=t=in:ss=0:d=0.15,afade=t=out:st=${fadeOutStart}:d=0.2[out]`
    ].join(';');
  }

  const cmd = `ffmpeg -y -f lavfi -i "${filterExpr}" -map "[out]" -c:a pcm_s16le -ar 44100 -ac 2 "${outputPath}" 2>/dev/null`;
  try {
    execSync(cmd);
  } catch (e) {
    // Fallback simple sine
    execSync(`ffmpeg -y -f lavfi -i "sine=frequency=80:duration=${dur}" -c:a pcm_s16le -ar 44100 -ac 2 "${outputPath}" 2>/dev/null`);
  }
  return outputPath;
}

module.exports = {
  resolveChannelAudio,
  AUDIO_EXTENSIONS
};
