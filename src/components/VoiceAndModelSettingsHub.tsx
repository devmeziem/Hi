import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Volume2,
  Headphones,
  Sparkles,
  Bot,
  Play,
  Pause,
  Save,
  RotateCcw,
  Check,
  CheckCircle2,
  Film,
  Flame,
  Atom,
  DollarSign,
  BookOpen,
  Info,
  Layers,
  Settings2
} from 'lucide-react';

export interface WorkflowVoiceModelConfig {
  workflowId: string;
  name: string;
  channelKey: string;
  iconType: 'archie' | 'stoic' | 'finance' | 'cinema' | 'teen';
  voiceId: string;
  voiceName: string;
  pitchHz: number; // -20 to +20 Hz
  speechRate: number; // 0.85 to 1.30
  voiceVolumePercent: number; // 80 to 160%
  bgmVolumePercent: number; // 15 to 50%
  bgmStyle: string;
  aiModel: 'gemini-2.5-flash' | 'cloudflare-llama-70b' | 'deepseek-r1-distill' | 'hybrid-active';
  systemPromptPreset: string;
}

const DEFAULT_CONFIGS: Record<string, WorkflowVoiceModelConfig> = {
  archie: {
    workflowId: 'archie',
    name: 'Archie Explains (Tech & Science Cartoon)',
    channelKey: 'ch3',
    iconType: 'archie',
    voiceId: 'en-US-ChristopherNeural',
    voiceName: 'Christopher Neural (Engaging Educator)',
    pitchHz: 0,
    speechRate: 1.0,
    voiceVolumePercent: 120,
    bgmVolumePercent: 32,
    bgmStyle: 'Upbeat Science Groove & Calm Acoustic',
    aiModel: 'gemini-2.5-flash',
    systemPromptPreset: 'In-depth science breakdown with clear real-world physics'
  },
  stoic: {
    workflowId: 'stoic',
    name: 'The Stoic Architect (Daily Fortitude)',
    channelKey: 'ch2',
    iconType: 'stoic',
    voiceId: 'en-US-AndrewNeural',
    voiceName: 'Andrew Neural (Deep Contemplative Baritone)',
    pitchHz: -15,
    speechRate: 0.94,
    voiceVolumePercent: 125,
    bgmVolumePercent: 30,
    bgmStyle: 'Calm Emotional Piano & Ambient Strings',
    aiModel: 'gemini-2.5-flash',
    systemPromptPreset: 'Ancient Stoic reframing of modern burnout & overthinking'
  },
  finance: {
    workflowId: 'finance',
    name: 'Fin Blueprint (Beginner Wealth & Cashflow)',
    channelKey: 'ch1',
    iconType: 'finance',
    voiceId: 'en-US-GuyNeural',
    voiceName: 'Guy Neural (Authoritative Market Anchor)',
    pitchHz: -5,
    speechRate: 1.04,
    voiceVolumePercent: 130,
    bgmVolumePercent: 34,
    bgmStyle: 'Sovereign Capital & Deep Suspense Pulse',
    aiModel: 'gemini-2.5-flash',
    systemPromptPreset: '3 beginner earning traps to stop, small-capital leverage & cashflow survival'
  },
  cinema: {
    workflowId: 'cinema',
    name: 'Cinema Vanguard (Documentaries & Stories)',
    channelKey: 'ch4',
    iconType: 'cinema',
    voiceId: 'en-US-AndrewMultilingualNeural',
    voiceName: 'Andrew Multilingual (Investigative Noir)',
    pitchHz: -10,
    speechRate: 0.96,
    voiceVolumePercent: 125,
    bgmVolumePercent: 32,
    bgmStyle: 'Dark Cello Ostinato & Historical Tension',
    aiModel: 'gemini-2.5-flash',
    systemPromptPreset: 'Episodic mystery & true financial sagas with gripping turning point'
  },
  teen: {
    workflowId: 'teen',
    name: 'MindRush (Youth & Teen Real-Life Motivation)',
    channelKey: 'ch5',
    iconType: 'teen',
    voiceId: 'en-US-ChristopherNeural',
    voiceName: 'Christopher Neural (High-Impact Direct Drive)',
    pitchHz: 4,
    speechRate: 1.08,
    voiceVolumePercent: 135,
    bgmVolumePercent: 35,
    bgmStyle: 'Rising Tension Swell & Cinematic Focus Beats',
    aiModel: 'gemini-2.5-flash',
    systemPromptPreset: '5 steps to build discipline, pause 4 habits for 30 days, dynamic outro'
  }
};

const VOICE_OPTIONS = [
  { id: 'en-US-ChristopherNeural', name: 'Christopher Neural (Natural, Conversational & Expressive)' },
  { id: 'en-US-GuyNeural', name: 'Guy Neural (Confident, Crisp & Clear News Delivery)' },
  { id: 'en-US-AndrewNeural', name: 'Andrew Neural (Deep Baritone, Philosophical & Grounded)' },
  { id: 'en-US-AndrewMultilingualNeural', name: 'Andrew Multilingual (Dramatic Narrative & Noir)' },
  { id: 'en-US-EricNeural', name: 'Eric Neural (Energetic, Youthful & Kinetic Drive)' },
  { id: 'en-US-JennyNeural', name: 'Jenny Neural (Clear, Empathetic & Articulate Female)' },
  { id: 'en-GB-RyanNeural', name: 'Ryan Neural (British Accent, Sophisticated & Academic)' },
  { id: 'cloudflare-workers-tts', name: 'Cloudflare Workers AI TTS (Fast Edge Voice)' }
];

const AI_MODEL_OPTIONS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Recommended - Grounded & High CTR)' },
  { id: 'cloudflare-llama-70b', name: 'Cloudflare Llama 3.3 70B (Edge Open-Weight Core)' },
  { id: 'deepseek-r1-distill', name: 'DeepSeek R1 Distill (Analytical Reasoning Model)' },
  { id: 'hybrid-active', name: 'Dynamic Multi-Tier Synthesizer (Auto-Failover)' }
];

const BGM_STYLE_OPTIONS = [
  'Upbeat Science Groove & Calm Acoustic',
  'Calm Emotional Piano & Ambient Strings',
  'Sovereign Capital & Deep Suspense Pulse',
  'Dark Cello Ostinato & Historical Tension',
  'Rising Tension Swell & Cinematic Focus Beats',
  'Minimalist Sub-Bass Drone & Clock Ticking',
  'Lofi Ambient Warmth & Gentle Rhodes'
];

interface VoiceAndModelSettingsHubProps {
  onToast?: (toast: { text: string; isError: boolean }) => void;
}

export const VoiceAndModelSettingsHub: React.FC<VoiceAndModelSettingsHubProps> = ({ onToast }) => {
  const [configs, setConfigs] = useState<Record<string, WorkflowVoiceModelConfig>>(DEFAULT_CONFIGS);
  const [selectedWorkflowKey, setSelectedWorkflowKey] = useState<string>('archie');
  const [isTestingSpeech, setIsTestingSpeech] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('voxam_workflow_voice_models');
      if (saved) {
        const parsed = JSON.parse(saved);
        setConfigs(prev => ({ ...prev, ...parsed }));
      }
    } catch {}
  }, []);

  const activeConfig = configs[selectedWorkflowKey] || DEFAULT_CONFIGS.archie;

  const updateActiveConfig = (patch: Partial<WorkflowVoiceModelConfig>) => {
    setConfigs(prev => ({
      ...prev,
      [selectedWorkflowKey]: {
        ...prev[selectedWorkflowKey],
        ...patch
      }
    }));
  };

  const handleSaveAll = () => {
    localStorage.setItem('voxam_workflow_voice_models', JSON.stringify(configs));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    if (onToast) onToast({ text: 'All voice, audio, and model settings saved across pipelines!', isError: false });
  };

  const handleResetToDefault = () => {
    setConfigs(DEFAULT_CONFIGS);
    localStorage.setItem('voxam_workflow_voice_models', JSON.stringify(DEFAULT_CONFIGS));
    if (onToast) onToast({ text: 'Reset voice and model settings to factory defaults', isError: false });
  };

  // Live in-browser speech test
  const handleTestSpeech = () => {
    if (!('speechSynthesis' in window)) {
      if (onToast) onToast({ text: 'Speech synthesis not supported in this browser', isError: true });
      return;
    }

    window.speechSynthesis.cancel();
    if (isTestingSpeech) {
      setIsTestingSpeech(false);
      return;
    }

    const testPhrases: Record<string, string> = {
      archie: "Did you know why phone batteries charge fast up to eighty percent, but the last twenty percent slows down? The underlying physics is fascinating.",
      stoic: "You have power over your mind, not outside events. Realize this, and you will find inner strength.",
      finance: "Three things to stop as a beginner in earning: stop buying courses before you sell a skill, stop spending your first profit, and execute in silence.",
      cinema: "In the freezing winter of nineteen ninety-two, one currency speculator took a high-stakes position that shook a two-hundred-year empire.",
      teen: "Five steps to build real discipline as a teenager: do not wait for motivation. Show up today regardless of your mood."
    };

    const text = testPhrases[selectedWorkflowKey] || "Testing audio configuration and vocal modulation parameters.";
    const utterance = new SpeechSynthesisUtterance(text);

    utterance.rate = activeConfig.speechRate;
    // Map pitch Hz (-20 to +20) into browser pitch range (0.8 to 1.2)
    utterance.pitch = Math.max(0.6, Math.min(1.4, 1.0 + (activeConfig.pitchHz / 50)));
    utterance.volume = Math.min(1.0, activeConfig.voiceVolumePercent / 100);

    const voices = window.speechSynthesis.getVoices();
    const match = voices.find(v => v.lang.startsWith('en')) || null;
    if (match) utterance.voice = match;

    utterance.onstart = () => setIsTestingSpeech(true);
    utterance.onend = () => setIsTestingSpeech(false);
    utterance.onerror = () => setIsTestingSpeech(false);

    window.speechSynthesis.speak(utterance);
    if (onToast) onToast({ text: `Playing vocal test for ${activeConfig.name}`, isError: false });
  };

  return (
    <div className="p-4 sm:p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
              AUDIO &amp; MODEL ENGINE
            </span>
            <span className="text-xs text-slate-400 font-mono">5 Independent Production Workflows</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white mt-1">
            Voice Pitch, Rate, Audio Ducking &amp; Model Configuration Suite
          </h2>
          <p className="text-xs text-slate-400">
            Customize pitch, speed rate, vocal gain, background music mix, and AI models per channel. Applied directly during video synthesis and rendering.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetToDefault}
            className="py-2 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Defaults</span>
          </button>
          <button
            onClick={handleSaveAll}
            className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            {saveSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saveSuccess ? 'Saved All Settings!' : 'Save All Settings'}</span>
          </button>
        </div>
      </div>

      {/* Workflow Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {Object.entries(configs).map(([key, cfg]) => {
          const isSelected = selectedWorkflowKey === key;
          const icons = {
            archie: Atom,
            stoic: BookOpen,
            finance: DollarSign,
            cinema: Film,
            teen: Flame
          };
          const IconComponent = icons[cfg.iconType] || Settings2;

          return (
            <button
              key={key}
              onClick={() => setSelectedWorkflowKey(key)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                isSelected
                  ? 'bg-slate-950 border-indigo-500 ring-1 ring-indigo-500 shadow-lg'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <IconComponent className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                {isSelected && <span className="text-[9px] font-mono font-bold text-indigo-400">ACTIVE</span>}
              </div>
              <div className="text-xs font-bold text-white truncate">
                {cfg.name.split(' (')[0]}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {cfg.channelKey.toUpperCase()} · {cfg.speechRate}x · {cfg.pitchHz}Hz
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Workflow Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6 bg-slate-950 border border-slate-800 rounded-2xl">
        {/* Left Column: Voice Synthesis Parameters (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-indigo-400" />
              <span>Voice Actor &amp; Pitch Controls</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">{activeConfig.channelKey.toUpperCase()}</span>
          </div>

          {/* Voice Model Selector */}
          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">Voice Model / Persona</label>
            <select
              value={activeConfig.voiceId}
              onChange={(e) => {
                const opt = VOICE_OPTIONS.find(v => v.id === e.target.value);
                updateActiveConfig({
                  voiceId: e.target.value,
                  voiceName: opt ? opt.name : e.target.value
                });
              }}
              className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {VOICE_OPTIONS.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Voice Pitch (Hz Offset) */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Vocal Pitch Adjustment</span>
              <span className="text-white font-mono font-bold">
                {activeConfig.pitchHz > 0 ? `+${activeConfig.pitchHz} Hz (Higher)` : activeConfig.pitchHz < 0 ? `${activeConfig.pitchHz} Hz (Deeper)` : '0 Hz (Natural)'}
              </span>
            </div>
            <input
              type="range"
              min="-25"
              max="25"
              step="1"
              value={activeConfig.pitchHz}
              onChange={(e) => updateActiveConfig({ pitchHz: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>-25 Hz (Deep Baritone)</span>
              <span>0 Hz (Original)</span>
              <span>+25 Hz (Bright Youth)</span>
            </div>
          </div>

          {/* Speaking Rate / Speed */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Speaking Cadence &amp; Speed</span>
              <span className="text-white font-mono font-bold">{activeConfig.speechRate.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.80"
              max="1.30"
              step="0.02"
              value={activeConfig.speechRate}
              onChange={(e) => updateActiveConfig({ speechRate: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>0.80x (Measured/Slow)</span>
              <span>1.00x (Standard)</span>
              <span>1.30x (Rapid/Energetic)</span>
            </div>
          </div>

          {/* Voice Volume Gain */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Voice Output Volume Gain</span>
              <span className="text-white font-mono font-bold">{activeConfig.voiceVolumePercent}%</span>
            </div>
            <input
              type="range"
              min="80"
              max="160"
              step="5"
              value={activeConfig.voiceVolumePercent}
              onChange={(e) => updateActiveConfig({ voiceVolumePercent: Number(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Voice Test Button */}
          <div className="pt-2">
            <button
              onClick={handleTestSpeech}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isTestingSpeech
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : 'bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300'
              }`}
            >
              {isTestingSpeech ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isTestingSpeech ? 'Stop Voice Test' : 'Test Speech Pitch & Cadence Live'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Background Music Ducking & AI Synthesis Model (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <Headphones className="w-4 h-4 text-emerald-400" />
              <span>Background Music Mix &amp; AI Script Engine</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Audible Level Guaranteed</span>
          </div>

          {/* Background Music Volume */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Background Music Level (Ducked)</span>
              <span className="text-emerald-400 font-mono font-bold">{activeConfig.bgmVolumePercent}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="50"
              step="1"
              value={activeConfig.bgmVolumePercent}
              onChange={(e) => updateActiveConfig({ bgmVolumePercent: Number(e.target.value) })}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Maintains audible presence (typically 28-35%) so phones and TikTok listeners hear high-production soundscapes without masking speech.
            </p>
          </div>

          {/* Background Music Style */}
          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">Soundtrack Theme Preset</label>
            <select
              value={activeConfig.bgmStyle}
              onChange={(e) => updateActiveConfig({ bgmStyle: e.target.value })}
              className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {BGM_STYLE_OPTIONS.map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>
          </div>

          {/* AI Model Selector */}
          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase font-bold flex items-center gap-1">
              <Bot className="w-3.5 h-3.5 text-indigo-400" />
              <span>Topic &amp; Script Generation AI Model</span>
            </label>
            <select
              value={activeConfig.aiModel}
              onChange={(e) => updateActiveConfig({ aiModel: e.target.value as any })}
              className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {AI_MODEL_OPTIONS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* System Prompt Angle */}
          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">Creative Angle &amp; Topic Directive</label>
            <input
              type="text"
              value={activeConfig.systemPromptPreset}
              onChange={(e) => updateActiveConfig({ systemPromptPreset: e.target.value })}
              className="w-full mt-1 bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              placeholder="Custom direction for this workflow"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
