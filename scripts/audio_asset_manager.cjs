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

const AUDIO_EXTENSIONS = /\.(mp3|wav|wave|m4a|aac|ogg|flac)$/i;

/**
 * Detect audio file by magic header bytes even if file lacks an extension
 */
function isAudioFile(filePath, filename) {
  if (AUDIO_EXTENSIONS.test(filename)) return true;
  try {
    if (!fs.existsSync(filePath)) return false;
    const stat = fs.statSync(filePath);
    if (stat.size < 512) return false;
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(12);
    fs.readSync(fd, buf, 0, 12, 0);
    fs.closeSync(fd);
    // RIFF .... WAVE (WAV audio)
    if (buf.toString('utf8', 0, 4) === 'RIFF' && buf.toString('utf8', 8, 12) === 'WAVE') return true;
    // ID3 (MP3 audio)
    if (buf.toString('utf8', 0, 3) === 'ID3') return true;
    // MP3 sync frame
    if (buf[0] === 0xFF && (buf[1] & 0xE0) === 0xE0) return true;
    // OggS (OGG container)
    if (buf.toString('utf8', 0, 4) === 'OggS') return true;
    // fLaC (FLAC audio)
    if (buf.toString('utf8', 0, 4) === 'fLaC') return true;
  } catch {}
  return false;
}

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

const ROTATION_STATE_FILE = path.join(process.cwd(), 'sound_assets', '.audio_rotation_state.json');

/**
 * Get persistent audio rotation state
 */
function getRotationState() {
  try {
    if (fs.existsSync(ROTATION_STATE_FILE)) {
      return JSON.parse(fs.readFileSync(ROTATION_STATE_FILE, 'utf8'));
    }
  } catch {}
  return { history: {}, counts: {}, lastOffsets: {} };
}

/**
 * Record rotated track selection to prevent repetitive background audio
 */
function recordRotationTrack(niche, trackPath, offsetRatio) {
  try {
    const state = getRotationState();
    if (!state.history) state.history = {};
    if (!state.counts) state.counts = {};
    if (!state.lastOffsets) state.lastOffsets = {};

    state.history[niche] = path.basename(trackPath);
    state.counts[niche] = (state.counts[niche] || 0) + 1;
    if (offsetRatio !== undefined) {
      state.lastOffsets[niche] = offsetRatio;
    }

    const dir = path.dirname(ROTATION_STATE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(ROTATION_STATE_FILE, JSON.stringify(state, null, 2));
  } catch {}
}

/**
 * Stateful Sound Track Rotator: guarantees different sound and slice offset every single run
 */
function pickRotatedTrack(candidates, niche) {
  if (!candidates || candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  const state = getRotationState();
  const lastTrackName = state.history && state.history[niche];

  // Exclude last used track so back-to-back renders never share the same sound
  const filtered = candidates.filter(c => path.basename(c) !== lastTrackName);
  const pool = filtered.length > 0 ? filtered : candidates;

  const count = (state.counts && state.counts[niche]) || 0;
  // Round-robin selection based on channel generation count
  const selected = pool[count % pool.length];
  return selected;
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
            } else if (ent.isFile()) {
              const fullPath = path.join(currentDir, ent.name);
              if (!ent.name.startsWith('.') && !ent.name.startsWith('test_') && !ent.name.startsWith('real_music_') && isAudioFile(fullPath, ent.name)) {
                try {
                  if (fs.statSync(fullPath).size > 1024) {
                    found.add(fullPath);
                  }
                } catch {}
              }
            }
          }
        };
        scan(d);
      } catch {}
    }
  }

  // Priority 1: If primaryDir has tracks, prioritize channel-specific audio first
  if (primaryDir && fs.existsSync(primaryDir)) {
    const primaryTracks = Array.from(found).filter(f => f.startsWith(primaryDir));
    if (primaryTracks.length > 0) {
      return primaryTracks;
    }
  }

  // Priority 2: User uploaded audio in src/assets/sounds, src/assets/audio, or assets/sounds
  const userRepoTracks = Array.from(found).filter(f => {
    const p = f.replace(/\\/g, '/');
    return p.includes('src/assets/sounds') || p.includes('src/assets/audio') || p.includes('assets/sounds');
  });
  if (userRepoTracks.length > 0) {
    return userRepoTracks;
  }

  return Array.from(found);
}

/**
 * Get duration of an audio file in seconds via ffprobe
 */
function getAudioDurationSeconds(filePath) {
  try {
    const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`;
    const out = execSync(cmd, { encoding: 'utf8' }).trim();
    const dur = parseFloat(out);
    return isNaN(dur) ? 0 : dur;
  } catch {
    return 0;
  }
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
    const chosenTrack = pickRotatedTrack(candidates, niche);
    const totalTrackDur = getAudioDurationSeconds(chosenTrack);
    console.log(`[Audio Asset Manager] 🎵 Channel: [${niche}] -> Selected rotated track (${candidates.length} available): "${path.basename(chosenTrack)}" (${totalTrackDur.toFixed(1)}s total)`);

    // In-between sweet spot rotation: systematically vary the start slice offset
    // so repeated songs sound completely different on each video
    let startOffset = 0;
    const rotState = getRotationState();
    const channelGenCount = (rotState.counts && rotState.counts[niche]) || 0;
    const sliceRatios = [0.18, 0.36, 0.52, 0.25, 0.44];
    const chosenRatio = sliceRatios[channelGenCount % sliceRatios.length];

    if (totalTrackDur > duration + 3.0) {
      const maxStart = Math.max(0, totalTrackDur - duration - 0.8);
      const sweetSpot = Math.min(maxStart, Math.max(3.0, totalTrackDur * chosenRatio));
      startOffset = Math.max(0, sweetSpot);
      console.log(`[Audio Asset Manager] 🎚️ Smart In-Between Selection: Slicing from ${startOffset.toFixed(1)}s to ${(startOffset + duration).toFixed(1)}s (Offset ratio: ${(chosenRatio * 100).toFixed(0)}%)`);
    } else {
      console.log(`[Audio Asset Manager] 🎚️ Normalizing loudness & looping to ${duration.toFixed(1)}s...`);
    }

    recordRotationTrack(niche, chosenTrack, chosenRatio);

    const dur = duration.toFixed(2);
    const fadeIn = (startOffset > 0 ? 0.35 : Math.min(0.25, duration * 0.05)).toFixed(2);
    const fadeOut = Math.min(0.4, duration * 0.08).toFixed(2);
    const fadeOutStart = (duration - parseFloat(fadeOut)).toFixed(2);

    const seekPrefix = startOffset > 0 ? `-ss ${startOffset.toFixed(2)}` : '';
    const cmd = `ffmpeg -y ${seekPrefix} -i "${chosenTrack}" -t ${dur} -af "loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=in:ss=0:d=${fadeIn},afade=t=out:st=${fadeOutStart}:d=${fadeOut}" -c:a pcm_s16le -ar 44100 -ac 2 "${outputPath}" 2>/dev/null`;

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
    outputPath = path.join(artDir, `${channelKey}_audio_${Date.now()}_${Math.random().toString(36).substring(7)}.wav`);
  }
  const targetDir = path.dirname(outputPath);
  if (!fs.existsSync(targetDir)) {
    try { fs.mkdirSync(targetDir, { recursive: true }); } catch {}
  }
  const primaryDir = SOUND_DIRECTORIES[channelKey] || path.join(process.cwd(), 'sound_assets', channelKey);
  const fallbackDirs = [
    path.join(process.cwd(), 'sound_assets'),
    path.join(process.cwd(), 'assets', 'sounds')
  ];

  if (channelKey.startsWith('motivation') || channelKey.startsWith('mindrush') || channelKey === 'teen') {
    fallbackDirs.unshift(path.join(process.cwd(), 'sound_assets', 'mindrush'));
    fallbackDirs.unshift(path.join(process.cwd(), 'sound_assets', 'motivation_15s'));
    fallbackDirs.unshift(path.join(process.cwd(), 'sound_assets', 'motivation_5s'));
  }

  let candidates = findAudioCandidates(primaryDir, fallbackDirs);

  // If piano audio is explicitly requested, generate/resolve soft piano directly
  if (channelKey === 'piano' || channelKey.includes('piano')) {
    const pianoFiles = findAudioCandidates(primaryDir, fallbackDirs).filter(f => /piano/i.test(path.basename(f)));
    if (pianoFiles.length > 0) {
      candidates = pianoFiles;
    } else {
      console.log(`[Audio Asset Manager] 🎹 Synthesizing Studio-Grade Soft Piano Track (${durationSeconds.toFixed(1)}s)...`);
      const { generateSoftPianoAudio } = require('./soft_piano_synthesizer.cjs');
      generateSoftPianoAudio(outputPath, durationSeconds, 'stoic');
      if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 2000) {
        return outputPath;
      }
    }
  }

  // If no candidates found, run production audio vault auto-fetcher
  if (candidates.length === 0) {
    try {
      console.log(`[Audio Asset Manager] ⚠️ No local audio found for [${channelKey}]. Running auto-fetcher...`);
      const { fetchAllProductionAudios } = require('./fetch_production_audio_vault.cjs');
      fetchAllProductionAudios();
      candidates = findAudioCandidates(primaryDir, fallbackDirs);
    } catch (e) {
      console.warn(`[Audio Asset Manager] Auto-fetcher notice: ${e.message}`);
    }
  }

  if (candidates.length > 0) {
    const chosenTrack = pickRotatedTrack(candidates, channelKey);
    const totalTrackDur = getAudioDurationSeconds(chosenTrack);
    console.log(`[Audio Asset Manager] 🎵 Channel: [${channelKey}] -> Selected rotated track (${candidates.length} available): "${path.basename(chosenTrack)}" (${totalTrackDur.toFixed(1)}s total)`);

    // In-between sweet spot rotation: vary start slice offset systematically
    let startOffset = 0;
    const rotState = getRotationState();
    const channelGenCount = (rotState.counts && rotState.counts[channelKey]) || 0;
    const sliceRatios = [0.18, 0.36, 0.52, 0.25, 0.44];
    const chosenRatio = sliceRatios[channelGenCount % sliceRatios.length];

    if (totalTrackDur > durationSeconds + 3.0) {
      const maxStart = Math.max(0, totalTrackDur - durationSeconds - 0.8);
      const sweetSpot = Math.min(maxStart, Math.max(3.0, totalTrackDur * chosenRatio));
      startOffset = Math.max(0, sweetSpot);
      console.log(`[Audio Asset Manager] 🎚️ Smart In-Between Selection: Slicing from ${startOffset.toFixed(1)}s to ${(startOffset + durationSeconds).toFixed(1)}s (Offset ratio: ${(chosenRatio * 100).toFixed(0)}%)`);
    }

    recordRotationTrack(channelKey, chosenTrack, chosenRatio);

    const dur = durationSeconds.toFixed(2);
    const fadeIn = (startOffset > 0 ? 0.35 : Math.min(0.12, durationSeconds * 0.03)).toFixed(2);
    const fadeOut = Math.min(0.25, durationSeconds * 0.05).toFixed(2);
    const fadeOutStart = (durationSeconds - parseFloat(fadeOut)).toFixed(2);

    const isPhonk = channelKey.includes('mindrush') || channelKey.includes('motivation') || /phonk|drift/i.test(chosenTrack);
    const filter = isPhonk
      ? `afade=t=in:ss=0:d=${fadeIn},afade=t=out:st=${fadeOutStart}:d=${fadeOut},volume=1.35`
      : `loudnorm=I=-15:TP=-1.0:LRA=10,afade=t=in:ss=0:d=${fadeIn},afade=t=out:st=${fadeOutStart}:d=${fadeOut},volume=1.40`;

    const loopPrefix = (totalTrackDur < durationSeconds) ? '-stream_loop -1 ' : '';
    const seekPrefix = startOffset > 0 ? `-ss ${startOffset.toFixed(2)} ` : '';
    const cmd = `ffmpeg -y ${loopPrefix}${seekPrefix}-i "${chosenTrack}" -t ${dur} -af "${filter}" -c:a pcm_s16le -ar 44100 -ac 2 "${outputPath}" 2>/dev/null`;
    try {
      execSync(cmd);
      if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 2000) {
        return outputPath;
      }
    } catch (err) {
      console.warn(`[Audio Asset Manager] FFmpeg normalize notice: ${err.message}`);
    }
  }

  synthesizeProceduralAudio(channelKey, durationSeconds, outputPath);
  return outputPath;
}

/**
 * Procedural Audio Synthesis Fallback
 */
function synthesizeProceduralAudio(channelKey, durationSeconds, outputPath) {
  // Check if any real audio file exists across user directories before generating tones
  const allUserDirs = [
    path.join(process.cwd(), 'src', 'assets', 'sounds'),
    path.join(process.cwd(), 'sound_assets', channelKey),
    path.join(process.cwd(), 'sound_assets')
  ];
  for (const uDir of allUserDirs) {
    if (fs.existsSync(uDir)) {
      try {
        const files = fs.readdirSync(uDir).filter(f => AUDIO_EXTENSIONS.test(f) || isAudioFile(path.join(uDir, f), f));
        if (files.length > 0) {
          const selected = path.join(uDir, files[Math.floor(Math.random() * files.length)]);
          const dur = durationSeconds.toFixed(2);
          const fadeIn = Math.min(0.15, durationSeconds * 0.04).toFixed(2);
          const fadeOut = Math.min(0.3, durationSeconds * 0.06).toFixed(2);
          const fadeOutStart = (durationSeconds - parseFloat(fadeOut)).toFixed(2);
          execSync(`ffmpeg -y -stream_loop -1 -i "${selected}" -t ${dur} -af "loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=in:ss=0:d=${fadeIn},afade=t=out:st=${fadeOutStart}:d=${fadeOut}" -c:a pcm_s16le -ar 44100 -ac 2 "${outputPath}" 2>/dev/null`);
          if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 2000) {
            console.log(`[Audio Asset Manager] ✅ Successfully utilized user uploaded audio: "${files[0]}"`);
            return outputPath;
          }
        }
      } catch {}
    }
  }

  // High-Grade Procedural Audio Generation via Soft Piano Synthesizer
  const { generateSoftPianoAudio } = require('./soft_piano_synthesizer.cjs');

  try {
    if (channelKey === 'piano' || channelKey.includes('piano') || channelKey === 'stoic') {
      generateSoftPianoAudio(outputPath, durationSeconds, 'stoic');
      if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 2000) {
        return outputPath;
      }
    } else if ((channelKey.includes('mindrush') || channelKey.includes('motivation') || channelKey === 'teen') && durationSeconds >= 20.0) {
      // Long-form teen emotional video: soft piano instrument
      generateSoftPianoAudio(outputPath, durationSeconds, 'teen');
      if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 2000) {
        return outputPath;
      }
    } else if (channelKey === 'finance' || channelKey === 'fin') {
      // High-status sovereign wealth piano chords (not muddy drone)
      generateSoftPianoAudio(outputPath, durationSeconds, 'finance');
      if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 2000) {
        return outputPath;
      }
    }
  } catch (err) {
    console.warn(`[Audio Asset Manager] Piano synth notice (${err.message}), falling back to harmonic filters...`);
  }

  const dur = durationSeconds.toFixed(2);
  const fadeOutStart = Math.max(0.5, (durationSeconds - 0.5)).toFixed(2);

  // User mandate: "stop using same sound for multiple videos and channels please"
  // "and add different background music that has effects too"
  // Generate dynamic randomized chord progressions with spatial delay (aecho), analog tremolo, and harmonic overtone filters
  const SCALES = [
    { root: 220.00, third: 261.63, fifth: 329.63, sub: 55.0, name: 'A Minor' },
    { root: 146.83, third: 174.61, fifth: 220.00, sub: 36.7, name: 'D Minor' },
    { root: 164.81, third: 196.00, fifth: 246.94, sub: 41.2, name: 'E Minor' },
    { root: 185.00, third: 220.00, fifth: 277.18, sub: 46.2, name: 'F# Minor' },
    { root: 130.81, third: 164.81, fifth: 196.00, sub: 32.7, name: 'C Major / Ambient' }
  ];
  const rotState = getRotationState();
  const procCount = (rotState.counts && rotState.counts[channelKey]) || 0;
  const chosenScale = SCALES[procCount % SCALES.length];
  const tremoloFreq = (2.6 + ((procCount * 0.7) % 2.5)).toFixed(2);
  const echoDelay = (40 + ((procCount * 17) % 55));

  let filterExpr = '';
  if (channelKey === 'motivation_15s' || channelKey === 'mindrush' || channelKey === 'mindrush_15s' || channelKey === 'teen') {
    // Energetic tension pulse with rising resonance and sub drops
    filterExpr = [
      `sine=frequency=${chosenScale.sub}:duration=${dur},volume=0.45,lowpass=f=120[sub]`,
      `sine=frequency=${chosenScale.root}:duration=${dur},volume=0.25,tremolo=f=${tremoloFreq}:d=0.75[pulse]`,
      `anoisesrc=d=${dur}:c=pink:r=44100:a=0.06,bandpass=f=2400:w=300,volume=0.15,tremolo=f=8.0:d=0.9[hats]`,
      `[sub][pulse][hats]amix=inputs=3[mix]`,
      `[mix]aecho=0.8:0.88:${echoDelay}:0.35,afade=t=in:ss=0:d=0.35,afade=t=out:st=${fadeOutStart}:d=0.45[out]`
    ].join(';');
  } else if (channelKey === 'motivation_5s' || channelKey === 'motivation' || channelKey === 'mindrush_5s') {
    // Punchy short-burst impact with resonant low end
    filterExpr = [
      `sine=frequency=${chosenScale.sub}:duration=${dur},volume=0.55,lowpass=f=140[sub]`,
      `sine=frequency=${chosenScale.third}:duration=${dur},volume=0.25,tremolo=f=4.0:d=0.8[mid]`,
      `[sub][mid]amix=inputs=2[mix]`,
      `[mix]aecho=0.7:0.75:50:0.3,afade=t=in:ss=0:d=0.15,afade=t=out:st=${fadeOutStart}:d=0.35[out]`
    ].join(';');
  } else if (channelKey === 'cartoon' || channelKey === 'tech') {
    // Playful, uplifting science lo-fi chord progression with gentle acoustic stereo shimmer
    filterExpr = [
      `sine=frequency=${chosenScale.root}:duration=${dur},volume=0.18[c1]`,
      `sine=frequency=${chosenScale.third}:duration=${dur},volume=0.14[c2]`,
      `sine=frequency=${chosenScale.fifth}:duration=${dur},volume=0.12[c3]`,
      `sine=frequency=${(chosenScale.root * 2).toFixed(2)}:duration=${dur},volume=0.08[c4]`,
      `[c1][c2][c3][c4]amix=inputs=4[chord]`,
      `[chord]aecho=0.8:0.85:70:0.4,tremolo=f=3.2:d=0.5,afade=t=in:ss=0:d=0.3,afade=t=out:st=${fadeOutStart}:d=0.4[out]`
    ].join(';');
  } else if (channelKey === 'movie_brand' || channelKey === 'movie' || channelKey === 'documentary' || channelKey === 'cinema') {
    // Deep cinematic cello ostinato & suspense pulse with haunting atmospheric reverb
    filterExpr = [
      `sine=frequency=${chosenScale.sub}:duration=${dur},volume=0.50,lowpass=f=95[sub]`,
      `sine=frequency=${chosenScale.root}:duration=${dur},volume=0.30,bandpass=f=${chosenScale.root}:w=40,tremolo=f=2.2:d=0.85[cello]`,
      `sine=frequency=${chosenScale.fifth}:duration=${dur},volume=0.16,highpass=f=200[overtone]`,
      `[sub][cello][overtone]amix=inputs=3[mix]`,
      `[mix]aecho=0.85:0.88:85:0.45,afade=t=in:ss=0:d=0.5,afade=t=out:st=${fadeOutStart}:d=0.6[out]`
    ].join(';');
  } else if (channelKey === 'stoic') {
    // Meditative Interstellar-style ambient chords with deep analog filter
    filterExpr = [
      `sine=frequency=${chosenScale.sub}:duration=${dur},volume=0.45,lowpass=f=80[drone]`,
      `sine=frequency=${chosenScale.root}:duration=${dur},volume=0.25[chord1]`,
      `sine=frequency=${chosenScale.third}:duration=${dur},volume=0.20[chord2]`,
      `[drone][chord1][chord2]amix=inputs=3[mix]`,
      `[mix]aecho=0.85:0.90:90:0.45,tremolo=f=1.8:d=0.6,afade=t=in:ss=0:d=0.6,afade=t=out:st=${fadeOutStart}:d=0.6[out]`
    ].join(';');
  } else {
    // Sovereign Capital / Financial Blueprint: Deep suspense pulse + subtle tick
    filterExpr = [
      `sine=frequency=${chosenScale.sub}:duration=${dur},volume=0.45,lowpass=f=100[sub]`,
      `sine=frequency=${chosenScale.root}:duration=${dur},volume=0.25,tremolo=f=3.0:d=0.7[pulse]`,
      `[sub][pulse]amix=inputs=2[mix]`,
      `[mix]aecho=0.75:0.80:55:0.35,afade=t=in:ss=0:d=0.4,afade=t=out:st=${fadeOutStart}:d=0.45[out]`
    ].join(';');
  }

  const cmd = `ffmpeg -y -f lavfi -i "${filterExpr}" -map "[out]" -c:a pcm_s16le -ar 44100 -ac 2 "${outputPath}" 2>/dev/null`;
  try {
    execSync(cmd);
  } catch (e) {
    execSync(`ffmpeg -y -f lavfi -i "sine=frequency=75:duration=${dur}" -c:a pcm_s16le -ar 44100 -ac 2 "${outputPath}" 2>/dev/null`);
  }
  return outputPath;
}

module.exports = {
  resolveRealMusicTrack,
  resolveChannelAudio,
  AUDIO_EXTENSIONS,
  SOUND_DIRECTORIES,
  getRotationState,
  recordRotationTrack,
  pickRotatedTrack
};

