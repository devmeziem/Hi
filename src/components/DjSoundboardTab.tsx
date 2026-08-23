import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Music,
  Mic,
  Sliders,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Info,
  Radio,
  CheckCircle,
  Headphones,
  SlidersHorizontal,
  FileText,
  Copy,
  Check,
  Download,
  Flame,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  Terminal
} from 'lucide-react';
import { IntegrationKeys } from '../types';

interface SoundProfile {
  id: string;
  title: string;
  category: 'Stoic Ambient' | 'Lofi Focus' | 'Cinematic Drama' | 'Deep Meditation';
  bpm: number;
  mood: string;
  toneType: 'synth_432hz' | 'synth_lofi' | 'synth_drone' | 'synth_cinematic' | 'synth_theta' | 'synth_sanctuary';
  description: string;
  externalFallbackUrl?: string;
}

const SOUND_PROFILES: SoundProfile[] = [
  // Stoic Ambient (6 profiles)
  {
    id: 'stoic-432',
    title: 'Marcus Fortitude 432Hz Drone',
    category: 'Stoic Ambient',
    bpm: 60,
    mood: 'Deep, Immovable, Grounded Inner Citadel',
    toneType: 'synth_432hz',
    description: 'Subtle 432Hz harmonic fundamental with warm overtone pads for deep Stoic presence.',
  },
  {
    id: 'stoic-citadel',
    title: 'Inner Citadel Reverb Strings',
    category: 'Stoic Ambient',
    bpm: 56,
    mood: 'Sovereignty, Solitude, Roman Marble',
    toneType: 'synth_sanctuary',
    description: 'Slow evolving cathedral reverb pads modeled after ancient Roman temples.',
  },
  {
    id: 'stoic-dichotomy',
    title: 'Dichotomy of Control Pulse',
    category: 'Stoic Ambient',
    bpm: 65,
    mood: 'Epictetus Mental Fortress',
    toneType: 'synth_drone',
    description: 'Continuous low-frequency binaural grounding pad removing anxiety and mental turbulence.',
  },
  {
    id: 'stoic-amor-fati',
    title: 'Amor Fati Harmonic Warmth',
    category: 'Stoic Ambient',
    bpm: 68,
    mood: 'Gratitude & Acceptance of Destiny',
    toneType: 'synth_432hz',
    description: 'Warm analog sawtooth synth filtered through low-pass resonant frequencies.',
  },
  {
    id: 'stoic-seneca',
    title: 'Seneca Solitude Echoes',
    category: 'Stoic Ambient',
    bpm: 52,
    mood: 'Reflective Philosophy on Brevity of Life',
    toneType: 'synth_sanctuary',
    description: 'Spacious monastic atmospheric pad with slow ambient resonance.',
  },
  {
    id: 'stoic-dawn',
    title: 'Roman Dawn Fortitude',
    category: 'Stoic Ambient',
    bpm: 64,
    mood: 'Morning Focus & Steel Will',
    toneType: 'synth_drone',
    description: 'Subtle rhythmic sub-bass drone with calm upper melodic harmonics.',
  },

  // Lofi Focus (6 profiles)
  {
    id: 'lofi-15k',
    title: '15k Naira Micro-SaaS Flow',
    category: 'Lofi Focus',
    bpm: 82,
    mood: 'Relaxed Hustle, Tape Warmth, Smooth Rhodes',
    toneType: 'synth_lofi',
    description: 'Procedural mellow Rhodes chord progression with vinyl tape saturation.',
  },
  {
    id: 'lofi-lagos',
    title: 'Midnight Coding in Lagos',
    category: 'Lofi Focus',
    bpm: 78,
    mood: 'Chill Productivity, Soft Chords',
    toneType: 'synth_lofi',
    description: 'Warm jazz minor 7th chord swells with subtle vinyl flutter.',
  },
  {
    id: 'lofi-fintech',
    title: 'Automated Invoice Protocol',
    category: 'Lofi Focus',
    bpm: 84,
    mood: 'Steady Cashflow Rhythm',
    toneType: 'synth_lofi',
    description: 'Low-fi ambient background with warm electric piano voicing.',
  },
  {
    id: 'lofi-work',
    title: 'Deep Work Autonomous Sprint',
    category: 'Lofi Focus',
    bpm: 80,
    mood: 'Calm Focus & Rapid Execution',
    toneType: 'synth_lofi',
    description: 'Smooth analog filters creating zero-distraction focus state.',
  },
  {
    id: 'lofi-weekend',
    title: 'Sunday Morning Retainer',
    category: 'Lofi Focus',
    bpm: 75,
    mood: 'Peaceful Weekend Passive Revenue',
    toneType: 'synth_lofi',
    description: 'Soft Rhodes organ chords with gentle tape compression.',
  },
  {
    id: 'lofi-terminal',
    title: 'Serverless Terminal Pulse',
    category: 'Lofi Focus',
    bpm: 86,
    mood: 'Modern Cloud Engineer Flow',
    toneType: 'synth_lofi',
    description: 'Mellow electronic chords over gentle rhythmic low-frequency filter.',
  },

  // Cinematic Drama (6 profiles)
  {
    id: 'cine-gladiator',
    title: 'Gladiator Oath Horizon',
    category: 'Cinematic Drama',
    bpm: 88,
    mood: 'Epic Strings, Rising Power',
    toneType: 'synth_cinematic',
    description: 'Rich low brass and dramatic string drone building tension.',
  },
  {
    id: 'cine-empire',
    title: 'Empire in Twilight',
    category: 'Cinematic Drama',
    bpm: 72,
    mood: 'Solemn Royalty, Majestic Climax',
    toneType: 'synth_cinematic',
    description: 'Deep orchestral sub-bass pad with rich polyphonic harmonics.',
  },
  {
    id: 'cine-stoic-march',
    title: 'The Stoic March',
    category: 'Cinematic Drama',
    bpm: 90,
    mood: 'Unstoppable Momentum',
    toneType: 'synth_cinematic',
    description: 'Rhythmic cinematic synth pulse driving narrative urgency.',
  },
  {
    id: 'cine-command',
    title: 'Sovereign Command',
    category: 'Cinematic Drama',
    bpm: 70,
    mood: 'Authoritative Decision Making',
    toneType: 'synth_cinematic',
    description: 'Dramatic low-pass string ensemble with slow dynamic modulation.',
  },
  {
    id: 'cine-storm',
    title: 'Storm Over Athens',
    category: 'Cinematic Drama',
    bpm: 84,
    mood: 'Philosophical Intensity',
    toneType: 'synth_cinematic',
    description: 'Tense atmospheric pad for breaking news and paradigm shifts.',
  },
  {
    id: 'cine-legacy',
    title: 'Legacy of Rome',
    category: 'Cinematic Drama',
    bpm: 65,
    mood: 'Timeless Monumental Weight',
    toneType: 'synth_cinematic',
    description: 'Deep harmonic drone supporting high-impact motivational speeches.',
  },

  // Deep Meditation & Frequencies (6 profiles)
  {
    id: 'med-432',
    title: '432Hz Miraculous Calm',
    category: 'Deep Meditation',
    bpm: 50,
    mood: 'Mathematical Harmony, Zero Stress',
    toneType: 'synth_432hz',
    description: 'Pure 432.0 Hz resonant sine wave with gentle second harmonic.',
  },
  {
    id: 'med-528',
    title: '528Hz Solfeggio Clarity',
    category: 'Deep Meditation',
    bpm: 48,
    mood: 'Cellular Restoration & Focus',
    toneType: 'synth_432hz',
    description: '528.0 Hz Solfeggio frequency tuned for mental transformation.',
  },
  {
    id: 'med-theta',
    title: 'Theta Wave Flow State',
    category: 'Deep Meditation',
    bpm: 45,
    mood: 'Binaural 6Hz Theta Brainwave Synchronization',
    toneType: 'synth_theta',
    description: 'Dual sine waves creating a 6Hz soothing binaural pulsation.',
  },
  {
    id: 'med-sanctuary',
    title: 'Sanctuary of Silence',
    category: 'Deep Meditation',
    bpm: 52,
    mood: 'Pure Space, Infinite Horizon',
    toneType: 'synth_sanctuary',
    description: 'Ultra-wide atmospheric pad with gentle pink noise air modulation.',
  },
  {
    id: 'med-zen',
    title: 'Zen Mountain Solitude',
    category: 'Deep Meditation',
    bpm: 46,
    mood: 'Deep Stillness & Clarity',
    toneType: 'synth_theta',
    description: 'Slow undulating tone designed to keep speech front and center.',
  },
  {
    id: 'med-eternal',
    title: 'Eternal Fortitude Drone',
    category: 'Deep Meditation',
    bpm: 44,
    mood: 'Grounded Sub-Bass Presence',
    toneType: 'synth_drone',
    description: 'Sub-harmonic drone filling low-end without masking vocal articulation.',
  }
];

const PRESET_SCRIPTS = [
  {
    id: 'stoic-discipline',
    title: '🏛️ Channel 2: The Stoic Architect (Fortitude & Mind Mastery)',
    channelName: 'The Stoic Architect',
    text: `Hello, welcome to The Stoic Architect! Today we are discussing on how ancient Stoicism conquers modern overwhelm.

Marcus Aurelius once wrote in his private journal: "You have power over your mind, not outside events. Realize this, and you will find unbreakable strength."

Most people spend ninety percent of their mental energy reacting to things they cannot control: other people's opinions, algorithms, market crashes, and past mistakes.

The ancient Stoic antidote is the dichotomy of control. When chaos strikes, ask yourself one decisive question: Is this within my direct command, or is it external noise? If it is outside your command, release it immediately.

Master your morning. Eliminate voluntary weakness. Build your sovereign command daily. Link to the fortitude masterclass is in bio!`
  },
  {
    id: 'fin-saas',
    title: '💰 Channel 1: Fin Blueprint (15k Naira Micro-SaaS Retainer)',
    channelName: 'Fin Blueprint',
    text: `Hello, welcome to Fin Blueprint! Today we will be discussing on how to start a high-demand digital automation retainer with zero upfront software coding.

Look at your local commercial streets: pharmacies, supermarkets, and bakery distributors lose thirty percent of repeat orders because they manually write invoices on paper.

With just ₦15,000 for mobile data and basic cloud tools, you can build an automated WhatsApp order catalog and PDF invoice webhook in forty-five minutes.

Charge each local merchant a modest ₦25,000 monthly retainer to manage and backup their digital orders. With just four merchants, you create an effortless ₦100,000 monthly recurring revenue with zero inventory risk.

Start with what you have in your hands today and compound daily. Access the full 15k Naira Micro-SaaS order template in bio!`
  },
  {
    id: 'tech-ai',
    title: '⚡ Channel 3: Godswill Isaac (Multi-Agent GitHub CI/CD)',
    channelName: 'Godswill Isaac',
    text: `Hello, welcome to Tech AI Automation! Today we are exploring how serverless GitHub Actions pipelines generate, render, and deploy media completely hands-free.

By orchestrating Groq ultra-fast LPU inference with Cloudflare Low-Neuron models, we achieve zero-cost storyboard generation with sub-second latency.

The pipeline triggers automatically on cron schedule, queries Firestore state to prevent duplicate topics, synthesizes neural voiceover, composites 9:16 vertical motion graphics via FFmpeg, and pushes live to YouTube Data API v3 with pinned affiliate funnels.

Autonomous infrastructure is the ultimate leverage for solo engineers in 2026. Fork the production multi-agent repo in our description below!`
  }
];

interface DjSoundboardTabProps {
  keys: IntegrationKeys;
}

export const DjSoundboardTab: React.FC<DjSoundboardTabProps> = ({ keys }) => {
  // Voice Synthesis State
  const [scriptText, setScriptText] = useState<string>(PRESET_SCRIPTS[0].text);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('default');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speechRate, setSpeechRate] = useState<number>(0.95);
  const [speechPitch, setSpeechPitch] = useState<number>(0.92);
  const [ttsVolume, setTtsVolume] = useState<number>(0.95);
  const [isPlayingVoice, setIsPlayingVoice] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [copiedFfmpeg, setCopiedFfmpeg] = useState<boolean>(false);

  // Background Synth Soundboard State
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedProfile, setSelectedProfile] = useState<SoundProfile>(SOUND_PROFILES[0]);
  const [isPlayingMusic, setIsPlayingMusic] = useState<boolean>(false);
  const [bgVolume, setBgVolume] = useState<number>(0.22); // Ideal 22% background level
  const [autoDucking, setAutoDucking] = useState<boolean>(true);
  const [masterPlaying, setMasterPlaying] = useState<boolean>(false);

  // Web Audio Synth Nodes Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const synthNodesRef = useRef<{
    oscillators: OscillatorNode[];
    gainNode: GainNode | null;
    filterNode: BiquadFilterNode | null;
    intervalId?: any;
  }>({
    oscillators: [],
    gainNode: null,
    filterNode: null
  });

  // Load Browser Voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const v = window.speechSynthesis.getVoices();
        setAvailableVoices(v);
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Filtered sound profiles
  const filteredProfiles = selectedCategory === 'All'
    ? SOUND_PROFILES
    : SOUND_PROFILES.filter(p => p.category === selectedCategory);

  // Web Audio Context Synthesizer Engine
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Stop All Active Synthesizer Nodes
  const stopSynthNodes = useCallback(() => {
    if (synthNodesRef.current.intervalId) {
      clearInterval(synthNodesRef.current.intervalId);
      synthNodesRef.current.intervalId = undefined;
    }
    synthNodesRef.current.oscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    });
    synthNodesRef.current.oscillators = [];
    if (synthNodesRef.current.gainNode) {
      try {
        synthNodesRef.current.gainNode.disconnect();
      } catch {}
      synthNodesRef.current.gainNode = null;
    }
  }, []);

  // Calculate current effective background volume with auto-ducking
  const getEffectiveBgVolume = useCallback(() => {
    if (autoDucking && isPlayingVoice) {
      return bgVolume * 0.35; // Duck down by 65% when voice is talking
    }
    return bgVolume;
  }, [autoDucking, isPlayingVoice, bgVolume]);

  // Update Synth Gain when volume or ducking changes
  useEffect(() => {
    if (synthNodesRef.current.gainNode && audioCtxRef.current) {
      const targetVol = getEffectiveBgVolume();
      synthNodesRef.current.gainNode.gain.setTargetAtTime(
        targetVol,
        audioCtxRef.current.currentTime,
        0.1
      );
    }
  }, [bgVolume, isPlayingVoice, autoDucking, getEffectiveBgVolume]);

  // Start Real-Time Web Audio Synthesizer for selected profile
  const startSynthSound = useCallback((profile: SoundProfile) => {
    stopSynthNodes();
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    const targetVol = getEffectiveBgVolume();
    masterGain.gain.setValueAtTime(0.01, now);
    masterGain.gain.exponentialRampToValueAtTime(Math.max(0.01, targetVol), now + 0.8);
    masterGain.connect(ctx.destination);
    synthNodesRef.current.gainNode = masterGain;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(850, now);
    filter.Q.setValueAtTime(1.5, now);
    filter.connect(masterGain);
    synthNodesRef.current.filterNode = filter;

    const oscs: OscillatorNode[] = [];

    if (profile.toneType === 'synth_432hz') {
      // 432Hz Sacred Resonance with sub-octave & 5th harmonic
      const baseFreq = 432.0;
      const freqs = [baseFreq / 4, baseFreq / 2, baseFreq, baseFreq * 1.5]; // 108Hz, 216Hz, 432Hz, 648Hz
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        osc.type = idx === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(f, now);
        
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.25 / (idx + 1), now);
        osc.connect(oscGain);
        oscGain.connect(filter);
        osc.start();
        oscs.push(osc);
      });
    } else if (profile.toneType === 'synth_lofi') {
      // Lofi Rhodes Chord Generator (Slow shifting jazz chords: Dm9 -> G13 -> Cmaj9 -> Am7)
      const chordProgressions = [
        [146.83, 220.00, 261.63, 329.63], // Dm9
        [196.00, 246.94, 293.66, 370.00], // G13
        [130.81, 196.00, 246.94, 329.63], // Cmaj9
        [110.00, 164.81, 220.00, 261.63]  // Am7
      ];
      let chordIndex = 0;

      // 4 voices
      const voiceOscs: OscillatorNode[] = [];
      chordProgressions[0].forEach((freq) => {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        const voiceGain = ctx.createGain();
        voiceGain.gain.setValueAtTime(0.18, now);
        osc.connect(voiceGain);
        voiceGain.connect(filter);
        osc.start();
        voiceOscs.push(osc);
        oscs.push(osc);
      });

      // Chord progression interval
      const interval = setInterval(() => {
        chordIndex = (chordIndex + 1) % chordProgressions.length;
        const nextChord = chordProgressions[chordIndex];
        const changeTime = ctx.currentTime;
        voiceOscs.forEach((osc, i) => {
          if (nextChord[i]) {
            osc.frequency.setTargetAtTime(nextChord[i], changeTime, 0.4);
          }
        });
      }, 4000);
      synthNodesRef.current.intervalId = interval;

    } else if (profile.toneType === 'synth_cinematic') {
      // Epic Low Brass & Cello Pad (Low D fundamental + octave + major 3rd + fifth)
      const root = 73.42; // Low D2
      const chord = [root, root * 2, root * 3, root * 4, root * 5];
      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = idx < 2 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        const subGain = ctx.createGain();
        subGain.gain.setValueAtTime(0.2 / (idx + 1), now);
        osc.connect(subGain);
        subGain.connect(filter);
        osc.start();
        oscs.push(osc);
      });
      // Slow sweep of lowpass filter
      filter.frequency.setTargetAtTime(1400, now, 3.0);
    } else if (profile.toneType === 'synth_theta') {
      // Binaural Theta Beat (100Hz Left, 106Hz Right = 6Hz Theta Brainwave)
      const base = 108.0;
      const beatFreq = 6.0;
      
      const oscL = ctx.createOscillator();
      oscL.type = 'sine';
      oscL.frequency.setValueAtTime(base, now);

      const oscR = ctx.createOscillator();
      oscR.type = 'sine';
      oscR.frequency.setValueAtTime(base + beatFreq, now);

      const pannerL = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      if (pannerL) pannerL.pan.setValueAtTime(-0.8, now);

      const pannerR = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      if (pannerR) pannerR.pan.setValueAtTime(0.8, now);

      if (pannerL && pannerR) {
        oscL.connect(pannerL);
        pannerL.connect(filter);
        oscR.connect(pannerR);
        pannerR.connect(filter);
      } else {
        oscL.connect(filter);
        oscR.connect(filter);
      }
      oscL.start();
      oscR.start();
      oscs.push(oscL, oscR);
    } else {
      // Sanctuary / Drone
      const f = 110.0; // A2
      [f, f * 1.5, f * 2, f * 3].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.22 / (idx + 1), now);
        osc.connect(g);
        g.connect(filter);
        osc.start();
        oscs.push(osc);
      });
    }

    synthNodesRef.current.oscillators = oscs;
  }, [getAudioContext, stopSynthNodes, getEffectiveBgVolume]);

  // Clean up synth on unmount
  useEffect(() => {
    return () => {
      stopSynthNodes();
    };
  }, [stopSynthNodes]);

  // Select Sound Profile
  const handleSelectProfile = (profile: SoundProfile) => {
    setSelectedProfile(profile);
    if (isPlayingMusic || masterPlaying) {
      startSynthSound(profile);
      setIsPlayingMusic(true);
    }
  };

  // Toggle Background Music Solo
  const togglePlayMusic = () => {
    if (isPlayingMusic) {
      stopSynthNodes();
      setIsPlayingMusic(false);
    } else {
      startSynthSound(selectedProfile);
      setIsPlayingMusic(true);
    }
  };

  // Speak Script via Web Speech API
  const handleSpeakVoice = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech Synthesis API is not available in this environment. Please use Google Chrome or Safari.');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(scriptText);
    utterance.rate = speechRate;
    utterance.pitch = speechPitch;
    utterance.volume = ttsVolume;

    // Pick chosen or best matching voice
    if (selectedVoiceName !== 'default') {
      const v = availableVoices.find(x => x.name === selectedVoiceName);
      if (v) utterance.voice = v;
    } else {
      // Auto-find deepest, most natural male voice
      const preferred = availableVoices.find(v =>
        v.name.includes('Natural') ||
        v.name.includes('Guy') ||
        v.name.includes('Christopher') ||
        v.name.includes('Google UK English Male') ||
        v.name.includes('Daniel')
      ) || availableVoices[0];
      if (preferred) utterance.voice = preferred;
    }

    utterance.onstart = () => {
      setIsPlayingVoice(true);
      // If master play is active and music isn't on, start music
      if (masterPlaying && !isPlayingMusic) {
        startSynthSound(selectedProfile);
        setIsPlayingMusic(true);
      }
    };

    utterance.onend = () => {
      setIsPlayingVoice(false);
      if (masterPlaying) {
        setMasterPlaying(false);
      }
    };

    utterance.onerror = () => {
      setIsPlayingVoice(false);
      if (masterPlaying) setMasterPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleStopVoice = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingVoice(false);
  };

  // Master Synchronized Mixer (Play Voice + Background Sound Together)
  const handleToggleMasterMixer = () => {
    if (masterPlaying || isPlayingVoice) {
      handleStopVoice();
      stopSynthNodes();
      setIsPlayingMusic(false);
      setMasterPlaying(false);
    } else {
      setMasterPlaying(true);
      startSynthSound(selectedProfile);
      setIsPlayingMusic(true);
      handleSpeakVoice();
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(scriptText);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const ffmpegCommand = `ffmpeg -y -i voiceover.mp3 -i backing_track.mp3 -filter_complex "[1:a]volume=${bgVolume.toFixed(2)}[bg];[0:a][bg]amix=inputs=2:duration=first:dropout_transition=2" -c:a aac -b:a 192k final_mixed_audio.mp3`;

  const handleCopyFfmpeg = () => {
    navigator.clipboard.writeText(ffmpegCommand);
    setCopiedFfmpeg(true);
    setTimeout(() => setCopiedFfmpeg(false), 2000);
  };

  const wordCount = scriptText.trim().split(/\s+/).filter(Boolean).length;
  const estimatedDuration = Math.round((wordCount / 135) * 60);

  return (
    <div className="space-y-6">
      {/* HEADER HERO */}
      <div className="p-6 bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border border-purple-500/40 rounded-3xl space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/30 border border-purple-400/30 flex items-center justify-center text-purple-300 shadow-inner">
              <Radio className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-950 border border-purple-800 text-purple-300 text-[10px] font-mono font-bold">
                  VOXAM DJ AUDIO LAB
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1">
                  <Activity className="w-3 h-3" /> Web Audio Synth Active
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
                Real-Time Voiceover & Ambient Sound Mixer
              </h1>
              <p className="text-xs text-slate-300">
                Audition live speech narration dynamically ducked over mathematical 432Hz ambient drones, lofi chord generators, and cinematic soundscapes.
              </p>
            </div>
          </div>

          {/* MASTER MIXER BUTTON */}
          <div className="flex items-center gap-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-800 shrink-0">
            <button
              onClick={handleToggleMasterMixer}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                masterPlaying || isPlayingVoice
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 animate-pulse'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30'
              }`}
            >
              {masterPlaying || isPlayingVoice ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Stop Master Mix</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 ml-0.5" />
                  <span>Play Synchronized Master Mix</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* DUAL REAL-TIME VOLUME CONTROLS & AUTO-DUCKING INDICATOR */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80">
          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold text-slate-200">Voice Volume</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={ttsVolume}
                onChange={(e) => setTtsVolume(parseFloat(e.target.value))}
                className="w-20 accent-purple-500 cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-purple-400 w-8 text-right">
                {Math.round(ttsVolume * 100)}%
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-200">Music Level</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="0.8"
                step="0.02"
                value={bgVolume}
                onChange={(e) => setBgVolume(parseFloat(e.target.value))}
                className="w-20 accent-emerald-500 cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-emerald-400 w-8 text-right">
                {Math.round(bgVolume * 100)}%
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold text-slate-200">Auto-Ducking</span>
            </div>
            <button
              onClick={() => setAutoDucking(!autoDucking)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                autoDucking
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {autoDucking ? 'Active (-65%)' : 'Disabled'}
            </button>
          </div>
        </div>
      </div>

      {/* 2-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: SPEECH SYNTHESIS & SCRIPT PROMPTER (7 COLS) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Voice Engine & Script Prompter Card */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Mic className="w-4 h-4 text-purple-400" />
                Speech Synthesis Voiceover
              </h2>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                isPlayingVoice
                  ? 'bg-purple-950 text-purple-300 border border-purple-700 animate-pulse'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {isPlayingVoice ? '🎙️ Speaking Voice Live' : 'Voice Idle'}
              </span>
            </div>

            {/* Voice & Pitch Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 mb-1 block">Voice Persona</label>
                <select
                  value={selectedVoiceName}
                  onChange={(e) => setSelectedVoiceName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="default">Auto Best Deep/Male Voice</option>
                  {availableVoices.map((v, i) => (
                    <option key={i} value={v.name}>
                      {v.name.length > 25 ? v.name.slice(0, 25) + '...' : v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 mb-1 block">
                  Speed: <span className="font-mono text-purple-400 font-bold">{speechRate}x</span>
                </label>
                <input
                  type="range"
                  min="0.75"
                  max="1.25"
                  step="0.05"
                  value={speechRate}
                  onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer mt-1"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 mb-1 block">
                  Pitch / Tone: <span className="font-mono text-purple-400 font-bold">{speechPitch}</span>
                </label>
                <input
                  type="range"
                  min="0.8"
                  max="1.2"
                  step="0.02"
                  value={speechPitch}
                  onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer mt-1"
                />
              </div>
            </div>

            {/* Script Presets Selector */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 mb-1.5 block">
                Load Full Niche Script:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {PRESET_SCRIPTS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setScriptText(p.text)}
                    className="p-2 bg-slate-950/70 hover:bg-slate-800 border border-slate-800 rounded-xl text-left text-xs text-slate-300 hover:text-white transition-all cursor-pointer truncate"
                  >
                    <div className="font-bold truncate text-white">{p.channelName}</div>
                    <div className="text-[10px] text-slate-400 truncate">{p.title.split(':')[1] || p.title}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Script Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Script Prompter</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-slate-400">
                    {wordCount} words (~{estimatedDuration}s audio)
                  </span>
                  <button
                    onClick={handleCopyScript}
                    className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedScript ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedScript ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
              <textarea
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                rows={9}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 leading-relaxed font-sans"
                placeholder="Type or paste custom voiceover script..."
              />
            </div>

            {/* Voice Control Buttons */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSpeakVoice}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-purple-600/20"
                >
                  <Play className="w-3.5 h-3.5 ml-0.5" />
                  <span>{isPlayingVoice ? 'Restart Voice Narration' : 'Audition Voice Solo'}</span>
                </button>

                {isPlayingVoice && (
                  <button
                    onClick={handleStopVoice}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Stop Voice</span>
                  </button>
                )}
              </div>

              <span className="text-[10px] text-slate-400 font-mono">
                {isPlayingVoice ? 'Voice Active -> Music Ducked' : 'Ready'}
              </span>
            </div>
          </div>

          {/* Production FFmpeg Audio Multiplexing Blueprint */}
          <div className="p-5 bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-500/30 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <span>Production FFmpeg Audio Ducking Command</span>
              </div>
              <button
                onClick={handleCopyFfmpeg}
                className="text-[10px] font-mono px-2 py-1 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-lg hover:bg-indigo-900 cursor-pointer flex items-center gap-1"
              >
                {copiedFfmpeg ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedFfmpeg ? 'Copied Command' : 'Copy CLI'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              This exact FFmpeg filter graph is used inside our GitHub Actions workflow runners to composite synthesized speech with royalty-free backing audio:
            </p>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto">
              {ffmpegCommand}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SYNTHESIZER SOUNDBOARD (5 COLS) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Headphones className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white">Backing Soundboard</h2>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                {filteredProfiles.length} Presets
              </span>
            </div>

            {/* Currently Active Sound Profile */}
            <div className="p-3.5 bg-slate-950 border border-emerald-500/40 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-bold">
                  Active Atmospheric Pad
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {selectedProfile.bpm} BPM • {selectedProfile.category}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-white">{selectedProfile.title}</h3>
                  <p className="text-[11px] text-slate-400">{selectedProfile.mood}</p>
                </div>
                <button
                  onClick={togglePlayMusic}
                  className={`p-2.5 rounded-xl text-white font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                    isPlayingMusic
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  {isPlayingMusic ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              {['All', 'Stoic Ambient', 'Lofi Focus', 'Cinematic Drama', 'Deep Meditation'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Scrollable Preset List */}
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {filteredProfiles.map((p) => {
                const isSelected = selectedProfile.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProfile(p)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500 text-white'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected && isPlayingMusic
                            ? 'bg-emerald-600 text-white animate-pulse'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isSelected && isPlayingMusic ? (
                          <Volume2 className="w-3.5 h-3.5" />
                        ) : (
                          <Music className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-white truncate">{p.title}</div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">
                          {p.category} • {p.bpm} BPM
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono shrink-0">
                      {p.category.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
