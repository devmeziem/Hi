/**
 * Automated Mystery & Tension Sound Generator
 * 
 * Provides robust loopable atmospheric music tracks for:
 * - Fin Blueprint (Channel 1)
 * - The Stoic Architect (Channel 2)
 * - Cartoon Factory & Archie Tech Shorts (Channel 3)
 * 
 * Directly utilizes the user's master audio assets in assets/sounds/:
 * 1. horror_scene_murder_mystery.wav
 * 2. instrumental_mystery.wav
 * 3. mystery_darkness.wav
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PRESETS = [
  'horror_scene_murder_mystery',
  'instrumental_mystery',
  'mystery_darkness'
];

/**
 * Generate or resolve loopable mystery sound track using user's audio assets
 * @param {number} duration - Desired duration in seconds
 * @param {string} outWavPath - Destination WAV file path
 * @param {string} preferredPreset - Optional preset name
 * @returns {string} Final WAV path
 */
function generateFinancialMysterySound(duration = 5.0, outWavPath = null, preferredPreset = null) {
  if (!outWavPath) {
    const tmpDir = path.join(process.cwd(), 'test_artifacts', 'sounds');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    outWavPath = path.join(tmpDir, `mystery_sound_${Date.now()}.wav`);
  }

  const dir = path.dirname(outWavPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const soundDirs = [
    path.join(process.cwd(), 'assets', 'sounds'),
    path.join(process.cwd(), 'src', 'assets', 'sounds'),
    path.join(process.cwd(), 'test_artifacts', 'sounds')
  ];

  const chosenPreset = preferredPreset || process.env.SOUND_PRESET || PRESETS[Math.floor(Date.now() / (1000 * 60 * 15)) % PRESETS.length];

  // 1. Search for user's master audio files
  for (const sDir of soundDirs) {
    if (fs.existsSync(sDir)) {
      const specificFile = path.join(sDir, `${chosenPreset}.wav`);
      const specificMp3 = path.join(sDir, `${chosenPreset}.mp3`);
      const targetLocal = fs.existsSync(specificFile) ? specificFile : (fs.existsSync(specificMp3) ? specificMp3 : null);

      if (targetLocal) {
        console.log(`[Sound Engine] Using master audio track: ${path.basename(targetLocal)}`);
        try {
          execSync(
            `ffmpeg -y -stream_loop -1 -i "${targetLocal}" -t ${duration} -af "afade=t=in:ss=0:d=0.2,afade=t=out:st=${(duration - 0.2).toFixed(2)}:d=0.2" -c:a pcm_s16le -ar 44100 -ac 2 "${outWavPath}" 2>/dev/null`
          );
          if (fs.existsSync(outWavPath) && fs.statSync(outWavPath).size > 5000) {
            return outWavPath;
          }
        } catch (e) {
          // Fall through
        }
      }

      // Check any available audio in folder
      const allAudios = fs.readdirSync(sDir).filter(f => f.match(/\.(mp3|wav|ogg|m4a)$/i));
      if (allAudios.length > 0) {
        const anyAudio = path.join(sDir, allAudios[0]);
        console.log(`[Sound Engine] Using available master audio: ${path.basename(anyAudio)}`);
        try {
          execSync(
            `ffmpeg -y -stream_loop -1 -i "${anyAudio}" -t ${duration} -af "afade=t=in:ss=0:d=0.2,afade=t=out:st=${(duration - 0.2).toFixed(2)}:d=0.2" -c:a pcm_s16le -ar 44100 -ac 2 "${outWavPath}" 2>/dev/null`
          );
          if (fs.existsSync(outWavPath) && fs.statSync(outWavPath).size > 5000) {
            return outWavPath;
          }
        } catch (e) {
          // Fall through
        }
      }
    }
  }

  // 2. High-fidelity procedural acoustic synthesis fallback (if file cannot be read)
  console.log(`[Sound Engine] Synthesizing loopable mystery audio track: "${chosenPreset}" (${duration}s)...`);
  const d = Number(duration).toFixed(2);
  const fadeOutStart = (duration - 0.2).toFixed(2);
  let filterExpr = '';

  if (chosenPreset === 'horror_scene_murder_mystery') {
    filterExpr = [
      `aevalsrc='sin(2*PI*48*t)*0.32 + sin(2*PI*96*t)*0.22 + sin(2*PI*135.76*t)*0.18 + sin(2*PI*192*t)*0.10 + sin(2*PI*1536*t)*(0.025+0.02*sin(2*PI*0.4*t))':s=44100:d=${d}`,
      `lowpass=f=1200`,
      `aecho=0.85:0.75:350|700:0.25|0.15`,
      `afade=t=in:ss=0:d=0.2,afade=t=out:st=${fadeOutStart}:d=0.2`
    ].join(',');
  } else if (chosenPreset === 'instrumental_mystery') {
    filterExpr = [
      `aevalsrc='sin(2*PI*65.4*t)*0.28 + sin(2*PI*98*t)*0.22 + sin(2*PI*155.56*t)*0.18 + sin(2*PI*233.08*t)*0.14 + sin(2*PI*392*t)*(0.04+0.03*sin(2*PI*0.25*t))':s=44100:d=${d}`,
      `bandpass=f=800:w=600`,
      `aecho=0.8:0.7:450|900:0.3|0.2`,
      `afade=t=in:ss=0:d=0.2,afade=t=out:st=${fadeOutStart}:d=0.2`
    ].join(',');
  } else {
    filterExpr = [
      `aevalsrc='sin(2*PI*43.65*t)*0.36 + sin(2*PI*87.3*t)*0.24 + sin(2*PI*130.81*t)*0.16 + sin(2*PI*261.63*t)*0.08':s=44100:d=${d}`,
      `lowpass=f=450`,
      `aecho=0.9:0.8:500|1000:0.35|0.2`,
      `afade=t=in:ss=0:d=0.2,afade=t=out:st=${fadeOutStart}:d=0.2`
    ].join(',');
  }

  try {
    execSync(`ffmpeg -y -f lavfi -i "${filterExpr}" -c:a pcm_s16le -ar 44100 -ac 2 "${outWavPath}" 2>/dev/null`);
    if (fs.existsSync(outWavPath) && fs.statSync(outWavPath).size > 5000) {
      return outWavPath;
    }
  } catch (err) {
    console.warn('[Sound Engine] Procedural synth notice:', err.message);
  }

  return outWavPath;
}

const generateMysterySound = generateFinancialMysterySound;
const generateOminousSound = generateFinancialMysterySound;
const resolveMysteryAudio = generateFinancialMysterySound;

if (require.main === module) {
  const args = process.argv.slice(2);
  const dur = parseFloat(args[0]) || 5.0;
  const out = args[1] || path.join(process.cwd(), 'test_artifacts', 'sounds', 'test_mystery.wav');
  const preset = args[2] || 'instrumental_mystery';
  const res = generateFinancialMysterySound(dur, out, preset);
  console.log(`Generated mystery audio: ${res}`);
}

module.exports = {
  generateFinancialMysterySound,
  generateMysterySound,
  generateOminousSound,
  resolveMysteryAudio,
  PRESETS
};
