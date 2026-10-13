// Royalty-free ambient background music & sound atmospheres for video shorts
export interface BackgroundMusicTrack {
  id: string;
  name: string;
  category: 'motivation_stoic' | 'mystic_ambient' | 'tech_cyber' | 'none';
  description: string;
  url: string;
}

export const BACKGROUND_MUSIC_TRACKS: BackgroundMusicTrack[] = [
  {
    id: 'mystic_deep',
    name: '🌌 Deep Mystic Cosmos',
    category: 'mystic_ambient',
    description: 'Ethereal ambient drone & contemplative atmospheric resonance. Perfect for stoic philosophy & deep reflection.',
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=deep-meditation-ambient-112349.mp3'
  },
  {
    id: 'stoic_drive',
    name: '⚔️ Stoic Discipline & Focus',
    category: 'motivation_stoic',
    description: 'Subtle rhythmic pulse with warm analog synth warmth. Perfect for high-demand business & daily discipline.',
    url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=cinematic-time-lapse-115672.mp3'
  },
  {
    id: 'tech_wealth',
    name: '💎 Modern Wealth & SaaS Tech',
    category: 'tech_cyber',
    description: 'Crisp lo-fi chill synth-wave vibe with forward financial momentum.',
    url: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f77c30.mp3?filename=lofi-study-112191.mp3'
  },
  {
    id: 'none',
    name: '🔇 No Background Music',
    category: 'none',
    description: 'Voiceover only (pure clean narration).',
    url: ''
  }
];

export interface TtsVoiceOption {
  id: string;
  speaker: string;
  name: string;
  gender: 'male' | 'female';
  tone: string;
  description: string;
  emotionStyle?: string;
}

export interface EmotionSyncProfile {
  id: string;
  name: string;
  description: string;
  pacing: string;
  targetChannels: string[];
}

export const EMOTION_SYNC_PROFILES: EmotionSyncProfile[] = [
  {
    id: 'curious_educator',
    name: '🧠 Curious Educator (Archie Sync)',
    description: 'Inquisitive question hook, direct camera gestures, discovery reveals, and warm outro questions.',
    pacing: 'Conversational 1.0x with thought-pauses & gesture cues',
    targetChannels: ['Archie Explains (Ch 3)']
  },
  {
    id: 'contemplative_wisdom',
    name: '🏛️ Contemplative Wisdom (Stoic Fortitude)',
    description: 'Measured baritone, deliberate silence, deep chest resonance, and calm emotional reflection.',
    pacing: 'Measured 0.94x with dramatic pauses',
    targetChannels: ['The Stoic Architect (Ch 2)']
  },
  {
    id: 'authoritative_clear',
    name: '💼 Authoritative Blueprint (Financial)',
    description: 'Crisp executive cadence, punchy numbers emphasis, and high-retention structured pacing.',
    pacing: 'Dynamic 1.02x with punchy clarity',
    targetChannels: ['Fin Blueprint (Ch 1)']
  },
  {
    id: 'dramatic_cinematic',
    name: '🎬 Dramatic Cinematic (Cinema Vanguard)',
    description: 'Narrative suspense, historical weight, dynamic vocal range, and immersive storytelling.',
    pacing: 'Cinematic 0.96x with tension swells',
    targetChannels: ['Cinema Vanguard (Ch 4)']
  }
];

export const TTS_VOICE_OPTIONS: TtsVoiceOption[] = [
  {
    id: 'archie_educator',
    speaker: 'en-US-ChristopherNeural',
    name: '🎓 Archie (Curious Human Educator)',
    gender: 'male',
    tone: 'Lively, Smart & Engaging',
    description: 'Expressive human educator with gesture-synchronized emotion inflection.',
    emotionStyle: 'curious_educator'
  },
  {
    id: 'zeus',
    speaker: 'zeus',
    name: '⚡ Zeus (Deep Authoritative Bass)',
    gender: 'male',
    tone: 'Wise & Commanding',
    description: 'Deep resonant voice ideal for Marcus Aurelius stoicism, finance blueprints & motivation.',
    emotionStyle: 'contemplative_wisdom'
  },
  {
    id: 'orpheus',
    speaker: 'orpheus',
    name: '🎙️ Orpheus (Smooth Storyteller)',
    gender: 'male',
    tone: 'Engaging & Clear',
    description: 'Dynamic cadence great for tech tutorials, business breakdowns & side hustles.',
    emotionStyle: 'authoritative_clear'
  },
  {
    id: 'athena',
    speaker: 'athena',
    name: '✨ Athena (Crisp & Intelligent)',
    gender: 'female',
    tone: 'Sophisticated & Articulate',
    description: 'Sharp, executive delivery for AI news, investment strategies & educational Shorts.',
    emotionStyle: 'authoritative_clear'
  },
  {
    id: 'hera',
    speaker: 'hera',
    name: '👑 Hera (Warm & Inspiring)',
    gender: 'female',
    tone: 'Empathetic & Resonant',
    description: 'Warm, powerful delivery suited for personal development and life lessons.',
    emotionStyle: 'curious_educator'
  }
];
