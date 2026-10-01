/**
 * Procedural Calm Piano Synthesizer (Web Audio API)
 * 
 * Generates an organic, slow, soothing acoustic piano soundtrack with varying gentle chords.
 * Used exclusively for Archie workflows to fill mute time with warm, non-distracting music.
 * 
 * Progression:
 * Chord 1: Cmaj9    (C3, G3, B3, E4, D5)  - Warm, contemplative opening
 * Chord 2: Am9      (A2, E3, G3, C4, B4)  - Deep, reflective warmth
 * Chord 3: Fmaj7#11 (F2, C3, A3, E4, B4)  - Uplifting, curious wonder
 * Chord 4: Em7      (E2, B2, G3, D4, G4)  - Grounded, steady calm
 * Chord 5: Dm9      (D3, A3, F4, C5, E5)  - Gentle question/mystery
 * Chord 6: G13sus4  (G2, D3, F3, C4, E4)  - Peaceful resolution
 */

export interface CalmPianoPlayer {
  play: () => void;
  stop: () => void;
  isPlaying: () => boolean;
  setVolume: (val: number) => void;
}

class CalmPianoEngine {
  private ctx: AudioContext | null = null;
  private isRunning: boolean = false;
  private masterGain: GainNode | null = null;
  private timerId: number | null = null;
  private currentChordIndex: number = 0;
  private volume: number = 0.18; // Soft background level

  // Frequencies for warm acoustic piano harmonics (Hz)
  private readonly chords: number[][] = [
    // Cmaj9
    [130.81, 196.00, 246.94, 329.63, 587.33],
    // Am9
    [110.00, 164.81, 196.00, 261.63, 493.88],
    // Fmaj7
    [87.31, 130.81, 220.00, 329.63, 493.88],
    // Em7
    [82.41, 123.47, 196.00, 293.66, 392.00],
    // Dm9
    [146.83, 220.00, 349.23, 523.25, 659.25],
    // Gsus4 / G7
    [98.00, 146.83, 174.61, 261.63, 329.63]
  ];

  private getAudioContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Synthesize a single warm acoustic piano note with realistic hammer attack & soft decay
   */
  private playPianoNote(freq: number, startTime: number, velocity: number = 0.7, duration: number = 3.6) {
    if (!this.ctx || !this.masterGain) return;

    // Fundamental + 2nd + 3rd harmonics simulate an acoustic wooden piano string
    const harmonics = [
      { mult: 1.0, gain: 1.0, decay: duration },
      { mult: 2.0, gain: 0.42, decay: duration * 0.75 },
      { mult: 3.0, gain: 0.18, decay: duration * 0.55 },
      { mult: 4.0, gain: 0.07, decay: duration * 0.40 }
    ];

    harmonics.forEach(({ mult, gain: hGain, decay }) => {
      const osc = this.ctx!.createOscillator();
      const noteGain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();

      // Warm low-pass filter to give felt-piano / warm upright acoustic tone
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(Math.min(2200, freq * 3.5), startTime);
      filter.frequency.exponentialRampToValueAtTime(Math.max(400, freq * 1.2), startTime + decay);

      osc.type = mult === 1 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq * mult, startTime);

      // Acoustic piano velocity envelope: instant hammer strike (5ms) followed by exponential decay
      const peakAmp = velocity * hGain * 0.22;
      noteGain.gain.setValueAtTime(0.0001, startTime);
      noteGain.gain.exponentialRampToValueAtTime(peakAmp, startTime + 0.008);
      noteGain.gain.exponentialRampToValueAtTime(peakAmp * 0.35, startTime + 0.5);
      noteGain.gain.exponentialRampToValueAtTime(0.00001, startTime + decay);

      osc.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(this.masterGain!);

      osc.start(startTime);
      osc.stop(startTime + decay + 0.1);
    });
  }

  /**
   * Play an arpeggiated piano chord with humanized micro-timing
   */
  private playChord(chord: number[]) {
    if (!this.ctx || !this.isRunning) return;
    const now = this.ctx.currentTime;

    // Strum notes gently over 180ms like a pianist's hands
    chord.forEach((freq, idx) => {
      const humanDelay = idx * 0.045 + (Math.random() * 0.012);
      const velocity = 0.55 + (idx === 0 ? 0.25 : Math.random() * 0.15); // Bass note slightly firmer
      this.playPianoNote(freq, now + humanDelay, velocity, 4.2);
    });

    // Add a light high-octave piano sparkle on odd chords
    if (this.currentChordIndex % 2 === 1 && Math.random() > 0.3) {
      const highNote = chord[chord.length - 1] * 1.5;
      this.playPianoNote(highNote, now + 1.2, 0.35, 2.5);
    }
  }

  public play() {
    if (this.isRunning) return;
    const ctx = this.getAudioContext();
    this.isRunning = true;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volume, ctx.currentTime);
    this.masterGain.connect(ctx.destination);

    // Initial chord
    this.playChord(this.chords[this.currentChordIndex]);

    // Schedule slow, peaceful chord changes every 3.8 seconds
    const intervalMs = 3800;
    this.timerId = window.setInterval(() => {
      if (!this.isRunning) return;
      this.currentChordIndex = (this.currentChordIndex + 1) % this.chords.length;
      this.playChord(this.chords[this.currentChordIndex]);
    }, intervalMs);
  }

  public stop() {
    this.isRunning = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.ctx.currentTime);
        this.masterGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.4);
      } catch {}
    }
  }

  public isPlaying(): boolean {
    return this.isRunning;
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }
}

export const calmPiano = new CalmPianoEngine();
