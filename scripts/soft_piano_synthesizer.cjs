/**
 * Broadcast-Grade Soft Emotional Piano Synthesizer (Node.js High-Speed JIT)
 * Generates emotionally resonant, melancholic, reflective piano chords & arpeggios
 * using physical acoustic modeling (harmonic overtone series, exponential per-note decay,
 * hammer strike attack envelopes, and room resonance via FFmpeg).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SAMPLE_RATE = 44100;

function createWavHeader(dataLength, sampleRate = 44100, numChannels = 1, bitsPerSample = 16) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size
  header.writeUInt16LE(1, 20);  // AudioFormat (PCM = 1)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28); // ByteRate
  header.writeUInt16LE(numChannels * (bitsPerSample / 8), 32); // BlockAlign
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataLength, 40);
  return header;
}

function generateSoftPianoAudio(outputPath, durationSeconds = 35.0, mood = 'stoic') {
  const totalSamples = Math.ceil(SAMPLE_RATE * durationSeconds);
  const buffer = new Float32Array(totalSamples);

  function addNote(freq, startSec, velocity = 0.6, sustainSec = 4.5) {
    const startIdx = Math.floor(startSec * SAMPLE_RATE);
    const noteSamples = Math.floor(sustainSec * SAMPLE_RATE);
    const damping = 1.35 + (freq / 420.0) * 1.5;

    for (let i = 0; i < noteSamples; i++) {
      const pos = startIdx + i;
      if (pos >= totalSamples) break;
      const t = i / SAMPLE_RATE;

      // Attack: 14ms hammer contact curve
      const attack = t < 0.014 ? (t / 0.014) * velocity : velocity;
      // Sustain / Decay
      const decay = 0.65 * Math.exp(-damping * t) + 0.35 * Math.exp(-damping * 0.32 * t);
      const env = attack * decay;

      // Acoustic string harmonic series
      const val = (
        1.00 * Math.sin(2 * Math.PI * freq * t) +
        0.55 * Math.sin(2 * Math.PI * freq * 2.002 * t) * Math.exp(-t * 2.0) +
        0.28 * Math.sin(2 * Math.PI * freq * 3.006 * t) * Math.exp(-t * 3.2) +
        0.14 * Math.sin(2 * Math.PI * freq * 4.010 * t) * Math.exp(-t * 4.4) +
        0.06 * Math.sin(2 * Math.PI * freq * 5.016 * t) * Math.exp(-t * 5.6)
      );

      buffer[pos] += val * env;
    }
  }

  let chords = [];
  if (mood === 'stoic') {
    // Am -> F -> C -> Em -> Am (Solemn philosophical reflection)
    chords = [
      { bass: [55.0, 110.0], arps: [220.0, 261.63, 329.63, 440.0, 523.25], time: 0.0 },
      { bass: [43.65, 87.31], arps: [174.61, 220.0, 261.63, 349.23, 440.0], time: 7.5 },
      { bass: [65.41, 130.81], arps: [196.00, 261.63, 329.63, 392.00, 523.25], time: 15.0 },
      { bass: [49.00, 98.00], arps: [196.00, 246.94, 293.66, 392.00, 493.88], time: 22.5 },
      { bass: [55.0, 110.0], arps: [220.0, 261.63, 329.63, 440.0], time: 29.5 }
    ];
  } else if (mood === 'teen') {
    // Em -> C -> G -> D -> Em (Determination through heartbreak)
    chords = [
      { bass: [41.20, 82.41], arps: [164.81, 196.00, 246.94, 329.63, 392.00], time: 0.0 },
      { bass: [65.41, 130.81], arps: [164.81, 261.63, 329.63, 523.25], time: 7.5 },
      { bass: [49.00, 98.00], arps: [196.00, 246.94, 293.66, 392.00], time: 15.0 },
      { bass: [73.42, 146.83], arps: [220.00, 293.66, 369.99, 440.00], time: 22.5 },
      { bass: [41.20, 82.41], arps: [164.81, 196.00, 329.63, 493.88], time: 29.5 }
    ];
  } else {
    // Finance: Fmaj7 -> Am9 -> Dm7 -> C (Luxury sovereign clarity)
    chords = [
      { bass: [87.31, 130.81], arps: [174.61, 261.63, 329.63, 349.23, 523.25], time: 0.0 },
      { bass: [55.00, 110.00], arps: [220.00, 261.63, 329.63, 493.88, 587.33], time: 7.5 },
      { bass: [73.42, 146.83], arps: [174.61, 220.00, 261.63, 349.23, 440.00], time: 15.0 },
      { bass: [65.41, 130.81], arps: [196.00, 261.63, 329.63, 392.00, 523.25], time: 22.5 },
      { bass: [87.31, 130.81], arps: [174.61, 261.63, 349.23, 523.25], time: 29.5 }
    ];
  }

  for (const ch of chords) {
    const tBase = ch.time;
    if (tBase >= durationSeconds) break;

    // Heavy gentle sub-bass fundamental
    addNote(ch.bass[0], tBase, 0.72, 7.5);
    if (ch.bass[1]) addNote(ch.bass[1], tBase + 0.04, 0.58, 6.8);

    // Melodic arpeggio pattern
    const arpDelays = [0.65, 1.60, 2.45, 3.40, 4.30, 5.20, 6.10];
    const notes = ch.arps;
    for (let i = 0; i < arpDelays.length; i++) {
      const noteTime = tBase + arpDelays[i];
      if (noteTime < durationSeconds - 0.4) {
        const nFreq = notes[i % notes.length];
        const vel = 0.42 + (i % 2 === 0 ? 0.12 : -0.05);
        addNote(nFreq, noteTime, vel, 4.2);

        if ((i === 2 || i === 5) && nFreq * 2 < 1200) {
          addNote(nFreq * 2, noteTime + 0.1, 0.22, 2.5);
        }
      }
    }
  }

  // Find peak for normalization
  let maxPeak = 0;
  for (let i = 0; i < totalSamples; i++) {
    const abs = Math.abs(buffer[i]);
    if (abs > maxPeak) maxPeak = abs;
  }
  const scale = maxPeak > 0 ? 0.88 / maxPeak : 1.0;

  // Convert to 16-bit PCM Buffer
  const pcmBytes = Buffer.alloc(totalSamples * 2);
  for (let i = 0; i < totalSamples; i++) {
    const s = Math.max(-1.0, Math.min(1.0, buffer[i] * scale));
    const sampleVal = Math.round(s * 32767);
    pcmBytes.writeInt16LE(sampleVal, i * 2);
  }

  const rawWavPath = outputPath + '.raw.wav';
  const header = createWavHeader(pcmBytes.length, SAMPLE_RATE, 1, 16);
  fs.writeFileSync(rawWavPath, Buffer.concat([header, pcmBytes]));

  // Apply acoustic room reverberation, warm stereo width, and gentle lowpass filter via FFmpeg
  const fadeOutSt = Math.max(0.5, durationSeconds - 1.5).toFixed(2);
  const ffmpegCmd = `ffmpeg -y -i "${rawWavPath}" -af "aecho=0.85:0.88:450|900:0.32|0.22,lowpass=f=3200,highpass=f=38,pan=stereo|c0=c0|c1=c0,afade=t=in:ss=0:d=0.4,afade=t=out:st=${fadeOutSt}:d=1.5,volume=1.2" -c:a pcm_s16le -ar 44100 -ac 2 "${outputPath}" 2>/dev/null`;

  try {
    execSync(ffmpegCmd);
    if (fs.existsSync(rawWavPath)) fs.unlinkSync(rawWavPath);
    return outputPath;
  } catch (err) {
    if (fs.existsSync(rawWavPath)) {
      fs.copyFileSync(rawWavPath, outputPath);
      fs.unlinkSync(rawWavPath);
    }
    return outputPath;
  }
}

module.exports = {
  generateSoftPianoAudio
};

if (require.main === module) {
  const dest = process.argv[2] || 'test_piano.wav';
  const dur = parseFloat(process.argv[3] || '35.0');
  const mood = process.argv[4] || 'stoic';
  generateSoftPianoAudio(dest, dur, mood);
  console.log('SUCCESS_PIANO_SYNTH:', dest);
}
