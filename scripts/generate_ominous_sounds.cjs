/**
 * Professional Ominous Audio & Music Synthesizer
 * 
 * Generates dark, suspenseful, cinema-grade ominous audio tracks (44.1kHz Stereo 16-bit PCM WAV & 192k MP3):
 * 1. ominous_dark_suspense: Deep sub-bass pulse (40-55Hz tritone), slow oscillating lowpass filter, psychological dread.
 * 2. ominous_eerie_drone: Cold atmospheric ambient drone with detuned tritone (diminished 5th), ghostly metallic resonance, cinema reverb.
 * 3. ominous_tension_pulse: 60-BPM psychological thriller heartbeat pulse, creeping low-register cello/drone and dark suspense swell.
 * 4. ominous_abyss_resonance: Subterranean abyss rumble with harmonic dissonance, cold tension riser, and psychological pressure.
 * 5. horror_scene_murder_mystery: Chilling mystery music with ominous brass-like drone, sinister chord intervals, and reverb decay.
 * 6. mystery_darkness: Deep nocturnal suspense with slow eerie pulse and sinister harmonic overtone textures.
 * 7. instrumental_mystery: Rich psychological mystery pad with subtle rhythmic tension.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ASSETS_SOUND_DIR = path.join(process.cwd(), 'assets', 'sounds');
const ARTIFACTS_SOUND_DIR = path.join(process.cwd(), 'test_artifacts', 'sounds');

[ASSETS_SOUND_DIR, ARTIFACTS_SOUND_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Definition of ominous sound designs (all 5.5s duration with clean fade-in and fade-out for seamless looping)
const OMINOUS_TRACKS = [
  {
    name: 'ominous_dark_suspense',
    description: 'Deep sub-bass pulse with 43Hz+55Hz tritone dissonance and dark psychological dread',
    duration: 5.5,
    // Complex aevalsrc combining sub-bass fundamental, detuned tritone, slow tremolo modulation, and dark resonant harmonics
    synthExpr: `sin(2*PI*43.65*t)*0.45 + sin(2*PI*55.0*t)*0.35 + sin(2*PI*87.3*t)*0.20*(1+0.4*sin(2*PI*0.8*t)) + sin(2*PI*174.6*t)*0.08*(1+0.6*sin(2*PI*1.6*t)) + sin(2*PI*698.46*t)*0.015*(1+sin(2*PI*0.3*t))`,
    filterChain: `lowpass=f=450,aecho=0.8:0.7:180|360:0.35|0.25,afade=t=in:ss=0:d=0.25,afade=t=out:st=5.2:d=0.3`
  },
  {
    name: 'ominous_eerie_drone',
    description: 'Cold ambient drone with detuned diminished 5th, subtle metallic resonance, and cinema reverb',
    duration: 5.5,
    synthExpr: `sin(2*PI*58.27*t)*0.40 + sin(2*PI*82.41*t)*0.32 + sin(2*PI*116.54*t)*0.22*(1+0.3*sin(2*PI*0.5*t)) + sin(2*PI*233.08*t)*0.10*(1+0.5*cos(2*PI*0.7*t)) + sin(2*PI*1479.98*t)*0.01*(1+sin(2*PI*2.5*t))`,
    filterChain: `bandpass=f=380:w=320,aecho=0.85:0.75:320|640:0.4|0.25,chorus=0.7:0.9:55:0.4:0.25:2,afade=t=in:ss=0:d=0.3,afade=t=out:st=5.1:d=0.4`
  },
  {
    name: 'ominous_tension_pulse',
    description: '60-BPM psychological thriller heartbeat pulse with creeping low strings & tension riser',
    duration: 5.5,
    // Pulse at 1Hz (60 BPM) combined with rising pitch glissando and ominous cello harmonics
    synthExpr: `sin(2*PI*(48 + 3*t)*t)*0.42 + sin(2*PI*61.74*t)*0.28 + sin(2*PI*40*t)*exp(-30*mod(t,1.0))*0.60 + sin(2*PI*293.66*t)*0.05*(1+sin(2*PI*4*t))`,
    filterChain: `lowpass=f=600,aecho=0.75:0.6:200|400:0.3|0.15,afade=t=in:ss=0:d=0.2,afade=t=out:st=5.2:d=0.3`
  },
  {
    name: 'ominous_abyss_resonance',
    description: 'Subterranean abyss rumble with cold dissonant harmonic chime swells',
    duration: 5.5,
    synthExpr: `sin(2*PI*36.7*t)*0.50 + sin(2*PI*51.9*t)*0.35 + sin(2*PI*73.4*t)*0.20*(1+0.5*sin(2*PI*0.4*t)) + sin(2*PI*880*t)*0.012*(1+sin(2*PI*1.2*t)) + sin(2*PI*1244.5*t)*0.008*(1+cos(2*PI*0.9*t))`,
    filterChain: `lowpass=f=520,aecho=0.85:0.8:250|500|750:0.35|0.25|0.15,afade=t=in:ss=0:d=0.3,afade=t=out:st=5.1:d=0.4`
  },
  {
    name: 'horror_scene_murder_mystery',
    description: 'Chilling dark mystery music with ominous brass drone and sinister chord intervals',
    duration: 5.5,
    synthExpr: `sin(2*PI*49.0*t)*0.45 + sin(2*PI*69.3*t)*0.32 + sin(2*PI*98.0*t)*0.22*(1+0.35*sin(2*PI*0.6*t)) + sin(2*PI*587.33*t)*0.02*(1+sin(2*PI*2.0*t)) + sin(2*PI*932.33*t)*0.012*(1+sin(2*PI*0.5*t))`,
    filterChain: `bandpass=f=420:w=380,aecho=0.8:0.7:220|440:0.35|0.2,afade=t=in:ss=0:d=0.25,afade=t=out:st=5.2:d=0.3`
  },
  {
    name: 'mystery_darkness',
    description: 'Nocturnal suspense with slow eerie pulse and sinister harmonic textures',
    duration: 5.5,
    synthExpr: `sin(2*PI*41.2*t)*0.44 + sin(2*PI*61.7*t)*0.30 + sin(2*PI*82.4*t)*0.18*(1+0.4*sin(2*PI*0.5*t)) + sin(2*PI*493.88*t)*0.018*(1+sin(2*PI*1.5*t))`,
    filterChain: `lowpass=f=480,aecho=0.75:0.65:280|560:0.3|0.2,afade=t=in:ss=0:d=0.25,afade=t=out:st=5.2:d=0.3`
  },
  {
    name: 'instrumental_mystery',
    description: 'Rich psychological mystery pad with subtle rhythmic tension',
    duration: 5.5,
    synthExpr: `sin(2*PI*55.0*t)*0.40 + sin(2*PI*77.78*t)*0.30 + sin(2*PI*110.0*t)*0.22*(1+0.3*sin(2*PI*0.7*t)) + sin(2*PI*440.0*t)*0.02*(1+sin(2*PI*3.0*t))`,
    filterChain: `bandpass=f=500:w=400,aecho=0.8:0.7:200|400:0.3|0.2,afade=t=in:ss=0:d=0.25,afade=t=out:st=5.2:d=0.3`
  }
];

function generateAllOminousSounds() {
  console.log('===============================================================');
  console.log('🎵 GENERATING CINEMATIC OMINOUS SOUNDS & MUSIC TRACKS');
  console.log('===============================================================\n');

  for (const track of OMINOUS_TRACKS) {
    const wavAssetPath = path.join(ASSETS_SOUND_DIR, `${track.name}.wav`);
    const mp3AssetPath = path.join(ASSETS_SOUND_DIR, `${track.name}.mp3`);
    const wavArtifactPath = path.join(ARTIFACTS_SOUND_DIR, `${track.name}.wav`);
    const mp3ArtifactPath = path.join(ARTIFACTS_SOUND_DIR, `${track.name}.mp3`);

    console.log(`[Synth] Creating "${track.name}" (${track.duration}s)...`);
    console.log(`        "${track.description}"`);

    const ffmpegWavCmd = `ffmpeg -y -f lavfi -i "aevalsrc='${track.synthExpr}':s=44100:d=${track.duration},${track.filterChain}" -c:a pcm_s16le -ar 44100 -ac 2 "${wavAssetPath}" 2>/dev/null`;
    execSync(ffmpegWavCmd);

    // Also encode 192k MP3 version
    const ffmpegMp3Cmd = `ffmpeg -y -i "${wavAssetPath}" -c:a libmp3lame -b:a 192k "${mp3AssetPath}" 2>/dev/null`;
    execSync(ffmpegMp3Cmd);

    // Sync to test_artifacts/sounds as well
    fs.copyFileSync(wavAssetPath, wavArtifactPath);
    fs.copyFileSync(mp3AssetPath, mp3ArtifactPath);

    const sizeWav = (fs.statSync(wavAssetPath).size / 1024).toFixed(1);
    const sizeMp3 = (fs.statSync(mp3AssetPath).size / 1024).toFixed(1);
    console.log(`        ✅ WAV: ${sizeWav} KB | MP3: ${sizeMp3} KB\n`);
  }

  console.log('🎉 All ominous sound tracks generated and synchronized successfully!\n');
}

if (require.main === module) {
  generateAllOminousSounds();
}

module.exports = {
  generateAllOminousSounds,
  OMINOUS_TRACKS
};
