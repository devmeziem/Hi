#!/usr/bin/env python3
"""
Studio-Grade Soft Emotional Piano Synthesizer
Generates emotionally resonant, melancholic, reflective piano chords & arpeggios
using physical modeling (harmonic overtone series, exponential per-note decay,
hammer strike attack envelopes, and room resonance via FFmpeg).

Produces broadcast-ready 44.1kHz 16-bit WAV files for:
- Stoic Channel: Deep reflective, solemn, emotionally gripping piano
- Teenager Channel: Resilient, determined, emotionally intense soft keys
- Finance Channel: Pristine, luxury wealth piano chords with subtle warmth
"""

import sys
import os
import math
import struct
import wave
import subprocess

SAMPLE_RATE = 44100

def create_note_samples(freq, duration, velocity=0.7, note_dur=4.0):
    """
    Simulate acoustic piano string physics:
    - Fundamental + 6 overtones with physically accurate damping
    - Quick hammer strike attack (12ms)
    - Two-stage exponential decay (initial strike decay + warm singing sustain)
    """
    n_samples = int(SAMPLE_RATE * note_dur)
    samples = [0.0] * n_samples
    
    # Damping rate scales with frequency (higher notes die faster)
    damping = 1.4 + (freq / 400.0) * 1.6
    
    for i in range(n_samples):
        t = i / SAMPLE_RATE
        # Attack envelope (hammer contact)
        if t < 0.012:
            env = (t / 0.012) * velocity
        else:
            # Singing sustain decay
            env = velocity * (0.65 * math.exp(-damping * t) + 0.35 * math.exp(-damping * 0.35 * t))
        
        # Harmonic overtone series of acoustic piano string
        val = (
            1.00 * math.sin(2 * math.pi * freq * t) +
            0.55 * math.sin(2 * math.pi * freq * 2.003 * t) * math.exp(-t * 2.2) +
            0.30 * math.sin(2 * math.pi * freq * 3.007 * t) * math.exp(-t * 3.4) +
            0.15 * math.sin(2 * math.pi * freq * 4.012 * t) * math.exp(-t * 4.6) +
            0.08 * math.sin(2 * math.pi * freq * 5.018 * t) * math.exp(-t * 5.8) +
            0.04 * math.sin(2 * math.pi * freq * 6.025 * t) * math.exp(-t * 7.0)
        )
        samples[i] = val * env
        
    return samples

def generate_soft_piano_track(output_wav_path, duration_seconds=35.0, mood='stoic'):
    """
    Generate an emotionally impactful soft piano piece.
    Moods:
    - 'stoic': Melancholic, deep philosophical progression in A Minor / D Minor
    - 'teen': Resilient, determined, emotional progression in E Minor / C Major
    - 'finance': Clean, elegant, luxurious high-status keys in F Major / D Minor
    """
    total_samples = int(SAMPLE_RATE * duration_seconds)
    audio_buffer = [0.0] * total_samples
    
    def add_note(freq, start_sec, velocity=0.6, sustain=5.0):
        start_idx = int(start_sec * SAMPLE_RATE)
        note_samples = create_note_samples(freq, duration_seconds, velocity, sustain)
        for idx, s in enumerate(note_samples):
            pos = start_idx + idx
            if pos < total_samples:
                audio_buffer[pos] += s

    if mood == 'stoic':
        # Progression: Am -> F -> C -> Em (The classic existential reflection)
        # Deep bass notes + delicate contemplative high notes
        chords = [
            # Am
            {'bass': [55.0, 110.0], 'arps': [220.0, 261.63, 329.63, 440.0, 523.25], 'time': 0.0},
            # F
            {'bass': [43.65, 87.31], 'arps': [174.61, 220.0, 261.63, 349.23, 440.0], 'time': 8.0},
            # C
            {'bass': [65.41, 130.81], 'arps': [196.00, 261.63, 329.63, 392.00, 523.25], 'time': 16.0},
            # Em / G
            {'bass': [49.00, 98.00], 'arps': [196.00, 246.94, 293.66, 392.00, 493.88], 'time': 24.0},
            # Final resolving Am with sustained emotional depth
            {'bass': [55.0, 110.0], 'arps': [220.0, 261.63, 329.63, 440.0], 'time': 31.0}
        ]
    elif mood == 'teen':
        # Progression: Em -> C -> G -> D (Determination through heartbreak)
        chords = [
            # Em
            {'bass': [41.20, 82.41], 'arps': [164.81, 196.00, 246.94, 329.63, 392.00], 'time': 0.0},
            # C
            {'bass': [65.41, 130.81], 'arps': [164.81, 261.63, 329.63, 523.25], 'time': 7.5},
            # G
            {'bass': [49.00, 98.00], 'arps': [196.00, 246.94, 293.66, 392.00], 'time': 15.0},
            # D
            {'bass': [73.42, 146.83], 'arps': [220.00, 293.66, 369.99, 440.00], 'time': 22.5},
            # Resolution Em
            {'bass': [41.20, 82.41], 'arps': [164.81, 196.00, 329.63, 493.88], 'time': 29.5}
        ]
    else: # Finance
        # Progression: Fmaj7 -> Am9 -> Dm7 -> C (Luxury, sovereign clarity)
        chords = [
            {'bass': [87.31, 130.81], 'arps': [174.61, 261.63, 329.63, 349.23, 523.25], 'time': 0.0},
            {'bass': [55.00, 110.00], 'arps': [220.00, 261.63, 329.63, 493.88, 587.33], 'time': 8.0},
            {'bass': [73.42, 146.83], 'arps': [174.61, 220.00, 261.63, 349.23, 440.00], 'time': 16.0},
            {'bass': [65.41, 130.81], 'arps': [196.00, 261.63, 329.63, 392.00, 523.25], 'time': 24.0},
            {'bass': [87.31, 130.81], 'arps': [174.61, 261.63, 349.23, 523.25], 'time': 31.0}
        ]

    for ch in chords:
        t_base = ch['time']
        if t_base >= duration_seconds:
            break
        
        # Heavy, gentle sub-bass fundamental
        add_note(ch['bass'][0], t_base, velocity=0.72, sustain=7.5)
        if len(ch['bass']) > 1:
            add_note(ch['bass'][1], t_base + 0.04, velocity=0.58, sustain=6.8)
        
        # Melodic arpeggio pattern (pensive, spaced rhythm)
        arp_delays = [0.65, 1.65, 2.50, 3.45, 4.40, 5.35, 6.20]
        notes = ch['arps']
        for i, delay in enumerate(arp_delays):
            note_time = t_base + delay
            if note_time < duration_seconds - 0.5:
                n_freq = notes[i % len(notes)]
                vel = 0.42 + (0.12 if i % 2 == 0 else -0.05)
                add_note(n_freq, note_time, velocity=vel, sustain=4.2)
                
                # Subtle delicate octave sparkle on key emotional beats
                if i in (2, 5) and n_freq * 2.0 < 1200:
                    add_note(n_freq * 2.0, note_time + 0.12, velocity=0.22, sustain=2.5)

    # Normalize audio
    max_peak = max(abs(x) for x in audio_buffer) if audio_buffer else 1.0
    if max_peak > 0:
        scale = 0.88 / max_peak
        audio_buffer = [x * scale for x in audio_buffer]

    # Convert to 16-bit PCM
    raw_wav = output_wav_path + '.raw.wav'
    with wave.open(raw_wav, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        packed = struct.pack('<' + 'h'*len(audio_buffer), *[int(max(-32767, min(32767, s * 32767))) for s in audio_buffer])
        wf.writeframes(packed)

    # Process through FFmpeg for rich acoustic room reverberation, warm stereo width, and gentle lowpass
    fade_out_st = max(0.5, duration_seconds - 1.5)
    ffmpeg_cmd = (
        f'ffmpeg -y -i "{raw_wav}" -af '
        f'"aecho=0.85:0.88:450|900:0.32|0.22,lowpass=f=3200,highpass=f=38,pan=stereo|c0=c0|c1=c0,afade=t=in:ss=0:d=0.4,afade=t=out:st={fade_out_st:.2f}:d=1.5,volume=1.2" '
        f'-c:a pcm_s16le -ar 44100 -ac 2 "{output_wav_path}" 2>/dev/null'
    )
    
    try:
        subprocess.run(ffmpeg_cmd, shell=True, check=True)
        if os.path.exists(raw_wav):
            os.remove(raw_wav)
        return output_wav_path
    except Exception as e:
        print(f"[Piano Synth] FFmpeg reverb notice: {e}, falling back to raw wav", file=sys.stderr)
        if os.path.exists(raw_wav):
            os.replace(raw_wav, output_wav_path)
        return output_wav_path

if __name__ == '__main__':
    dest = sys.argv[1] if len(sys.argv) > 1 else 'test_piano.wav'
    dur = float(sys.argv[2]) if len(sys.argv) > 2 else 35.0
    mood = sys.argv[3] if len(sys.argv) > 3 else 'stoic'
    out = generate_soft_piano_track(dest, dur, mood)
    print(f"PIANO_GENERATED:{out}")
