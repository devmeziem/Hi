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
const https = require('https');
const http = require('http');
const { execSync } = require('child_process');

const AUDIO_EXTENSIONS = /\.(mp3|wav|m4a|aac|ogg|flac)$/i;

const SOUND_DIRECTORIES = {
  mindrush: path.join(process.cwd(), 'sound_assets', 'mindrush'),
  mindrush_15s: path.join(process.cwd(), 'sound_assets', 'mindrush'),
  mindrush_5s: path.join(process.cwd(), 'sound_assets', 'mindrush'),
  cartoon: path.join(process.cwd(), 'sound_assets', 'cartoon'),
  movie_brand: path.join(process.cwd(), 'sound_assets', 'movie_brand'),
  movie: path.join(process.cwd(), 'sound_assets', 'movie_brand'),
  motivation_5s: path.join(process.cwd(), 'sound_assets', 'motivation_5s'),
  motivation_15s: path.join(process.cwd(), 'sound_assets', 'motivation_15s'),
  motivation: path.join(process.cwd(), 'sound_assets', 'motivation'),
  teen_motivation: path.join(process.cwd(), 'sound_assets', 'motivation_15s'),
  teen: path.join(process.cwd(), 'sound_assets', 'motivation_15s'),
  stoic: path.join(process.cwd(), 'sound_assets', 'stoic'),
  finance: path.join(process.cwd(), 'sound_assets', 'finance'),
  fin: path.join(process.cwd(), 'sound_assets', 'finance')
};

// Ensure all sound asset directories exist
for (const dir of Object.values(SOUND_DIRECTORIES)) {
  if (!fs.existsSync(dir)) {
    try { fs.mkdirSync(dir, { recursive: true }); } catch {}
  }
}

/**
 * Download sound from remote URL if provided
 */
async function downloadRemoteAudio(url, destPath) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) return null;
  return new Promise((resolve) => {
    try {
      const client = url.startsWith('https') ? https : http;
      const fileStream = fs.createWriteStream(destPath);
      const req = client.get(url, { timeout: 10000 }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          downloadRemoteAudio(res.headers.location, destPath).then(resolve);
          return;
        }
        if (res.statusCode !== 200) {
          fileStream.close();
          try { fs.unlinkSync(destPath); } catch {}
          resolve(null);
          return;
        }
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          if (fs.existsSync(destPath) && fs.statSync(destPath).size > 1024) {
            resolve(destPath);
          } else {
            resolve(null);
          }
        });
      });
      req.on('error', () => {
        fileStream.close();
        try { fs.unlinkSync(destPath); } catch {}
        resolve(null);
      });
      req.on('timeout', () => {
        req.destroy();
        fileStream.close();
        try { fs.unlinkSync(destPath); } catch {}
        resolve(null);
      });
    } catch {
      resolve(null);
    }
  });
}

/**
 * Scan directory and its subdirectories comprehensively for audio tracks
 */
function findAudioCandidates(primaryDir, fallbackDirs = []) {
  const dirs = [
    primaryDir,
    ...fallbackDirs,
    path.join(process.cwd(), 'src', 'assets', 'sounds'),
    path.join(process.cwd(), 'src', 'assets', 'audio'),
    path.join(process.cwd(), 'src', 'assets', 'music'),
    path.join(process.cwd(), 'assets', 'sounds'),
    path.join(process.cwd(), 'assets', 'audio'),
    path.join(process.cwd(), 'assets', 'music'),
    path.join(process.cwd(), 'sound_assets'),
    path.join(process.cwd(), 'sounds'),
    path.join(process.cwd(), 'audio'),
    path.join(process.cwd(), 'music')
  ].filter(Boolean);

  const found = new Set();

  for (const d of dirs) {
    if (fs.existsSync(d)) {
      try {
        const scan = (currentDir, depth = 0) => {
          if (depth > 4) return;
          const entries = fs.readdirSync(currentDir, { withFileTypes: true });
          for (const ent of entries) {
            if (ent.isDirectory()) {
              if (ent.name !== 'node_modules' && ent.name !== '.git' && ent.name !== 'dist') {
                scan(path.join(currentDir, ent.name), depth + 1);
              }
            } else if (ent.isFile() && AUDIO_EXTENSIONS.test(ent.name)) {
              const fullPath = path.join(currentDir, ent.name);
              try {
                if (fs.statSync(fullPath).size > 1024) {
                  found.add(fullPath);
                }
              } catch {}
            }
          }
        };
        scan(d);
      } catch {}
    }
  }

  // Priority 1: If primaryDir has tracks, prioritize custom uploaded audio first
  if (primaryDir && fs.existsSync(primaryDir)) {
    const primaryTracks = Array.from(found).filter(f => f.startsWith(primaryDir));
    if (primaryTracks.length > 0) {
      const customTracks = primaryTracks.filter(f => {
        const base = path.basename(f).toLowerCase();
        return !base.startsWith('horror_') && !base.startsWith('mystery_') && !base.startsWith('instrumental_');
      });
      if (customTracks.length > 0) return customTracks;
      return primaryTracks;
    }
  }

  // Priority 2: Check all scanned directories for custom uploaded audio
  const allCustomTracks = Array.from(found).filter(f => {
    const base = path.basename(f).toLowerCase();
    return !base.startsWith('horror_') && !base.startsWith('mystery_') && !base.startsWith('instrumental_');
  });
  if (allCustomTracks.length > 0) return allCustomTracks;

  return Array.from(found);
}

/**
 * Universal Sound Track Resolver for all workflows (Archie, Movie Brand, Motivation, Stoic, Finance)
 * @param {Object} options
 * @param {string} options.niche - 'cartoon' | 'movie_brand' | 'motivation_5s' | 'motivation_15s' | 'stoic' | 'finance'
 * @param {number} options.duration - Duration in seconds
 * @param {string} [options.soundUrl] - Optional direct audio URL to download and use
 * @param {string} [options.outputPath] - Optional destination file path
 */
async function resolveRealMusicTrack(options = {}, maybeDuration) {
  let niche = 'cartoon';
  let duration = 6.0;
  let soundUrl = undefined;
  let outputPath = undefined;

  if (typeof options === 'string') {
    niche = options;
    duration = Number(maybeDuration) || 6.0;
  } else if (typeof options === 'object' && options !== null) {
    niche = options.niche || 'cartoon';
    duration = Number(options.duration) || 6.0;
    soundUrl = options.soundUrl;
    outputPath = options.outputPath;
  }

  const tempDir = path.join(process.cwd(), 'test_artifacts');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  outputPath = outputPath || path.join(tempDir, `real_music_${niche}_${Date.now()}.wav`);

  // 1. Check if user provided an explicit audio URL (via parameter or environment variable)
  const resolvedSoundUrl = soundUrl || process.env.SOUND_URL || process.env.MUSIC_URL || (niche === 'cartoon' ? process.env.ARCHIE_MUSIC_URL : process.env.MOTIVATION_MUSIC_URL);
  if (resolvedSoundUrl && typeof resolvedSoundUrl === 'string' && resolvedSoundUrl.startsWith('http')) {
    console.log(`[Audio Asset Manager] 🌐 Downloading custom audio from URL for [${niche}]: ${resolvedSoundUrl.slice(0, 70)}...`);
    const downloadedRaw = path.join(tempDir, `downloaded_audio_${Date.now()}.bin`);
    const success = await downloadRemoteAudio(resolvedSoundUrl, downloadedRaw);
    if (success && fs.existsSync(downloadedRaw)) {
      try {
        const dur = duration.toFixed(2);
        execSync(`ffmpeg -y -stream_loop -1 -i "${downloadedRaw}" -t ${dur} -af "loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=in:ss=0:d=0.2,afade=t=out:st=${(duration - 0.3).toFixed(2)}:d=0.3" -c:a pcm_s16le -ar 44100 -ac 2 "${outputPath}" 2>/dev/null`);
        if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 2000) {
          console.log(`[Audio Asset Manager] ✅ Successfully processed custom audio from URL!`);
          try { fs.unlinkSync(downloadedRaw); } catch {}
          return outputPath;
        }
      } catch (err) {
        console.warn(`[Audio Asset Manager] URL processing failed (${err.message}), checking repository folders...`);
      }
    }
  }

  // 2. Scan designated repository folders for uploaded sound files
  const primaryDir = SOUND_DIRECTORIES[niche] || path.join(process.cwd(), 'sound_assets', niche);
  const fallbackDirs = [
    path.join(process.cwd(), 'sound_assets'),
    path.join(process.cwd(), 'assets', 'sounds'),
    path.join(process.cwd(), 'assets', 'audio')
  ];

  if (niche.startsWith('motivation')) {
    fallbackDirs.unshift(path.join(process.cwd(), 'sound_assets', 'motivation'));
  } else if (niche === 'cartoon') {
    fallbackDirs.unshift(path.join(process.cwd(), 'cartoon_character_assets', 'sounds'));
  }

  const candidates = findAudioCandidates(primaryDir, fallbackDirs);

  if (candidates.length > 0) {
    const chosenTrack = candidates[Math.floor(Math.random() * candidates.length)];
    console.log(`[Audio Asset Manager] 🎵 Channel: [${niche}] -> Selected repository track (${candidates.length} available): "${path.basename(chosenTrack)}"`);
    console.log(`[Audio Asset Manager] 🎚️ Normalizing loudness & looping to ${duration.toFixed(1)}s...`);

    const dur = duration.toFixed(2);
    const fadeIn = Math.min(0.25, duration * 0.05).toFixed(2);
    const fadeOut = Math.min(0.4, duration * 0.08).toFixed(2);
    const fadeOutStart = (duration - parseFloat(fadeOut)).toFixed(2);

    const cmd = `ffmpeg -y -stream_loop -1 -i "${chosenTrack}" -t ${dur} -af "loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=in:ss=0:d=${fadeIn},afade=t=out:st=${fadeOutStart}:d=${fadeOut}" -c:a pcm_s16le -ar 44100 -ac 2 "${outputPath}" 2>/dev/null`;

    try {
      execSync(cmd);
      if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 2000) {
        return outputPath;
      }
    } catch (err) {
      console.warn(`[Audio Asset Manager] Processing uploaded track failed (${err.message}). Using procedural fallback.`);
    }
  } else {
    console.log(`[Audio Asset Manager] ℹ️ No custom audio uploaded in sound_assets/${niche}/ yet. Using procedural backing track.`);
  }

  // 3. Clean procedural synthesis tailored specifically to niche
  synthesizeProceduralAudio(niche, duration, outputPath);
  return outputPath;
}

/**
 * Resolve and render normalized audio track for a channel and duration
 * (Backwards compatibility wrapper)
 */
function resolveChannelAudio(channelKey, durationSeconds, outputPath) {
  if (!outputPath) {
    const artDir = path.join(process.cwd(), 'test_artifacts', 'audio_renders');
    if (!fs.existsSync(artDir)) fs.mkdirSync(artDir, { recursive: true });
    outputPath = path.join(artDir, `${channelKey}_audio_${Date.now()}_${Math.random().toString(36).substring(7)}.wav`);
  }
  const primaryDir = SOUND_DIRECTORIES[channelKey] || path.join(process.cwd(), 'sound_assets', channelKey);
  const fallbackDirs = [
    path.join(process.cwd(), 'sound_assets'),
    path.join(process.cwd(), 'assets', 'sounds')
  ];

  if (channelKey.startsWith('motivation')) {
    fallbackDirs.unshift(path.join(process.cwd(), 'sound_assets', 'motivation'));
  }

  const candidates = findAudioCandidates(primaryDir, fallbackDirs);

  if (candidates.length > 0) {
    let matchingCandidates = candidates;
    if (durationSeconds >= 10) {
      const match15 = candidates.filter(c => /15s?/i.test(path.basename(c)));
      if (match15.length > 0) matchingCandidates = match15;
    } else if (durationSeconds <= 7) {
      const match5 = candidates.filter(c => /5s?/i.test(path.basename(c)));
      if (match5.length > 0) matchingCandidates = match5;
    }
    const chosenTrack = matchingCandidates[Math.floor(Math.random() * matchingCandidates.length)];
    console.log(`[Audio Asset Manager] 🎵 Channel: [${channelKey}] -> Selected repository track: "${path.basename(chosenTrack)}"`);
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
    } catch {}
  }

  synthesizeProceduralAudio(channelKey, durationSeconds, outputPath);
  return outputPath;
}

/**
 * Procedural Audio Synthesis Fallback
 */
function synthesizeProceduralAudio(channelKey, durationSeconds, outputPath) {
  const dur = durationSeconds.toFixed(2);
  const fadeOutStart = Math.max(0.5, (durationSeconds - 0.3)).toFixed(2);

  let filterExpr = '';
  if (channelKey === 'motivation_15s') {
    filterExpr = [
      `sine=frequency=55:duration=7.0,volume=0.35,afade=t=out:st=6.6:d=0.4[drone1]`,
      `sine=frequency=110:duration=7.0,volume=0.15,afade=t=out:st=6.6:d=0.4[pad1]`,
      `anullsrc=r=44100:cl=stereo:d=1.0[silence]`,
      `sine=frequency=42:duration=7.0,volume=0.45,afade=t=in:ss=0:d=0.08,afade=t=out:st=6.7:d=0.3[slamSub]`,
      `sine=frequency=880:duration=7.0,volume=0.04[tick]`,
      `[drone1][pad1]amix=inputs=2[p1]`,
      `[slamSub][tick]amix=inputs=2[p3]`,
      `[p1][silence][p3]concat=n=3:v=0:a=1[concatted]`,
      `[concatted]afade=t=in:ss=0:d=0.2,afade=t=out:st=${fadeOutStart}:d=0.25[out]`
    ].join(';');
  } else if (channelKey === 'motivation_5s' || channelKey === 'motivation') {
    filterExpr = [
      `sine=frequency=48:duration=${dur},volume=0.4[sub]`,
      `sine=frequency=120:duration=${dur},volume=0.2[body]`,
      `sine=frequency=880:duration=${dur},volume=0.03[tick]`,
      `[sub][body][tick]amix=inputs=3[mixed]`,
      `[mixed]afade=t=in:ss=0:d=0.15,afade=t=out:st=${fadeOutStart}:d=0.2[out]`
    ].join(';');
  } else if (channelKey === 'cartoon' || channelKey === 'tech') {
    // Playful, uplifting science lo-fi chord progression
    filterExpr = [
      `sine=frequency=261.63:duration=${dur},volume=0.12[c4]`,
      `sine=frequency=329.63:duration=${dur},volume=0.10[e4]`,
      `sine=frequency=392.00:duration=${dur},volume=0.09[g4]`,
      `sine=frequency=523.25:duration=${dur},volume=0.06[c5]`,
      `[c4][e4][g4][c5]amix=inputs=4[chord]`,
      `[chord]afade=t=in:ss=0:d=0.3,afade=t=out:st=${fadeOutStart}:d=0.3[out]`
    ].join(';');
  } else if (channelKey === 'movie_brand' || channelKey === 'movie') {
    // Deep cinematic braam / sub drone
    filterExpr = [
      `sine=frequency=36:duration=${dur},volume=0.45[sub]`,
      `sine=frequency=72:duration=${dur},volume=0.25[bass]`,
      `sine=frequency=144:duration=${dur},volume=0.12[overtone]`,
      `[sub][bass][overtone]amix=inputs=3[mixed]`,
      `[mixed]afade=t=in:ss=0:d=0.3,afade=t=out:st=${fadeOutStart}:d=0.4[out]`
    ].join(';');
  } else if (channelKey === 'stoic') {
    filterExpr = [
      `sine=frequency=43:duration=${dur},volume=0.35[abyss]`,
      `sine=frequency=108:duration=${dur},volume=0.2[minor]`,
      `sine=frequency=216:duration=${dur},volume=0.1[overtone]`,
      `[abyss][minor][overtone]amix=inputs=3[mixed]`,
      `[mixed]afade=t=in:ss=0:d=0.2,afade=t=out:st=${fadeOutStart}:d=0.2[out]`
    ].join(';');
  } else {
    // Finance
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
    execSync(`ffmpeg -y -f lavfi -i "sine=frequency=80:duration=${dur}" -c:a pcm_s16le -ar 44100 -ac 2 "${outputPath}" 2>/dev/null`);
  }
  return outputPath;
}

module.exports = {
  resolveRealMusicTrack,
  resolveChannelAudio,
  AUDIO_EXTENSIONS,
  SOUND_DIRECTORIES
};

