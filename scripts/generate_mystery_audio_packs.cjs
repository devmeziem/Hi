/**
 * Automated Mystery & Horror Sound Pack Generator
 * Synthesizes the 3 master ambient audio tracks requested by user:
 * 1. horror_scene_murder_mystery.wav
 * 2. instrumental_mystery.wav
 * 3. mystery_darkness.wav
 */

const fs = require('fs');
const path = require('path');

function generateWavFile(filePath, durationSeconds, synthFunction) {
  const sampleRate = 44100;
  const numChannels = 2;
  const bitsPerSample = 16;
  const totalSamples = Math.floor(sampleRate * durationSeconds);
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataByteLength = totalSamples * blockAlign;

  const buffer = Buffer.alloc(44 + dataByteLength);

  // RIFF Chunk
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataByteLength, 4);
  buffer.write('WAVE', 8);

  // fmt sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // subchunk1 size
  buffer.writeUInt16LE(1, 20);  // PCM format
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data sub-chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataByteLength, 40);

  let offset = 44;
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    // Fade in and out to ensure seamless looping
    let envelope = 1.0;
    if (t < 0.3) envelope = t / 0.3;
    else if (t > durationSeconds - 0.3) envelope = (durationSeconds - t) / 0.3;

    const { left, right } = synthFunction(t, durationSeconds);

    const sL = Math.max(-1, Math.min(1, left * envelope));
    const sR = Math.max(-1, Math.min(1, right * envelope));

    const valL = sL < 0 ? sL * 0x8000 : sL * 0x7FFF;
    const valR = sR < 0 ? sR * 0x8000 : sR * 0x7FFF;

    buffer.writeInt16LE(Math.floor(valL), offset);
    buffer.writeInt16LE(Math.floor(valR), offset + 2);
    offset += 4;
  }

  fs.writeFileSync(filePath, buffer);
  console.log(`✅ Generated Sound: ${path.basename(filePath)} (${(fs.statSync(filePath).size / 1024).toFixed(1)} KB)`);
}

// 1. Horror Scene Murder Mystery: Deep dissonant drone, suspense pulse, eerie high overtone
function synthHorrorScene(t, dur) {
  // Low cello drone (D1 ~ 36.7Hz + Eb1 ~ 38.9Hz tension minor second)
  const d1 = Math.sin(2 * Math.PI * 36.7 * t) * 0.35;
  const eb1 = Math.sin(2 * Math.PI * 38.9 * t) * 0.30;
  
  // Heartbeat / suspense throb at 1.2 Hz
  const pulse = Math.pow(Math.max(0, Math.sin(2 * Math.PI * 1.15 * t)), 4) * 0.3 * Math.sin(2 * Math.PI * 55.0 * t);
  
  // High eerie metallic bow shimmer with panning
  const shimmerL = Math.sin(2 * Math.PI * 622.25 * t) * 0.04 * (1 + 0.5 * Math.sin(2 * Math.PI * 0.8 * t));
  const shimmerR = Math.sin(2 * Math.PI * 659.25 * t) * 0.04 * (1 + 0.5 * Math.cos(2 * Math.PI * 0.8 * t));

  // Sub bass foundation
  const sub = Math.sin(2 * Math.PI * 73.4 * t) * 0.20;

  return {
    left: (d1 + eb1 + pulse + sub + shimmerL) * 0.85,
    right: (d1 + eb1 + pulse + sub + shimmerR) * 0.85
  };
}

// 2. Instrumental Mystery: Ambient pad, curious harmonic intervals, crystal texture
function synthInstrumentalMystery(t, dur) {
  // A minor root & fifth (A1 55Hz + E2 82.4Hz)
  const baseA = Math.sin(2 * Math.PI * 55.0 * t) * 0.30;
  const fifthE = Math.sin(2 * Math.PI * 82.41 * t) * 0.25;

  // Mystery modal pad (C3 130.8Hz + F#3 185.0Hz diminished tritone curiosity)
  const padC = Math.sin(2 * Math.PI * 130.81 * t) * 0.18;
  const padFsharp = Math.sin(2 * Math.PI * 184.99 * t) * 0.12 * (1 + 0.4 * Math.sin(2 * Math.PI * 0.5 * t));

  // Ambient chime movement
  const chimeL = Math.sin(2 * Math.PI * 523.25 * t) * 0.03 * (1 + 0.8 * Math.sin(2 * Math.PI * 1.5 * t));
  const chimeR = Math.sin(2 * Math.PI * 659.25 * t) * 0.03 * (1 + 0.8 * Math.cos(2 * Math.PI * 1.5 * t));

  return {
    left: (baseA + fifthE + padC + padFsharp + chimeL) * 0.85,
    right: (baseA + fifthE + padC + padFsharp + chimeR) * 0.85
  };
}

// 3. Mystery Darkness: Deep cinematic tech drone, sub-harmonic resonance, cyber suspense
function synthMysteryDarkness(t, dur) {
  // Deep C1 32.7Hz sub-harmonic drone
  const subC = Math.sin(2 * Math.PI * 32.7 * t) * 0.45;
  const subG = Math.sin(2 * Math.PI * 49.0 * t) * 0.30;

  // Slow dark filter sweep
  const sweep = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.25 * t);
  const midTone = Math.sin(2 * Math.PI * 98.0 * t) * 0.15 * sweep;

  // High dark tension harmonic (Eb4 ~ 311Hz)
  const tensionL = Math.sin(2 * Math.PI * 311.13 * t) * 0.025 * (1 + 0.6 * Math.sin(2 * Math.PI * 0.4 * t));
  const tensionR = Math.sin(2 * Math.PI * 329.63 * t) * 0.025 * (1 + 0.6 * Math.cos(2 * Math.PI * 0.4 * t));

  return {
    left: (subC + subG + midTone + tensionL) * 0.85,
    right: (subC + subG + midTone + tensionR) * 0.85
  };
}

function buildAllMysteryPacks() {
  const dirs = [
    path.join(process.cwd(), 'assets', 'sounds'),
    path.join(process.cwd(), 'test_artifacts', 'sounds'),
    path.join(process.cwd(), 'src', 'assets', 'sounds')
  ];

  dirs.forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });

  const duration = 15.0; // 15s master loops

  const tracks = [
    { name: 'horror_scene_murder_mystery.wav', synth: synthHorrorScene },
    { name: 'instrumental_mystery.wav', synth: synthInstrumentalMystery },
    { name: 'mystery_darkness.wav', synth: synthMysteryDarkness }
  ];

  tracks.forEach(tr => {
    const primaryPath = path.join(dirs[0], tr.name);
    generateWavFile(primaryPath, duration, tr.synth);

    // Sync to other sound dirs
    dirs.slice(1).forEach(destDir => {
      fs.copyFileSync(primaryPath, path.join(destDir, tr.name));
    });
  });

  console.log('🎵 All 3 Master Mystery Soundtracks synthesized and deployed!');
}

if (require.main === module) {
  buildAllMysteryPacks();
}

module.exports = { buildAllMysteryPacks };
