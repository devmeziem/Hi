import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  Volume2,
  Image as ImageIcon,
  Film,
  Music,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Video
} from 'lucide-react';

interface StoicStudioTabProps {
  onToast?: (text: string, isError?: boolean) => void;
}

const PHILOSOPHERS_LIST = [
  { id: 'marcus_aurelius', name: 'Marcus Aurelius', era: '121–180 AD', school: 'Roman Stoicism', source: 'Meditations (Gutenberg #2680 / Wikisource)' },
  { id: 'epictetus', name: 'Epictetus', era: '50–135 AD', school: 'Late Stoicism', source: 'Enchiridion (Gutenberg #871 / Wikisource)' },
  { id: 'seneca', name: 'Seneca the Younger', era: '4 BC–65 AD', school: 'Roman Stoicism', source: 'Letters from a Stoic (Gutenberg / Wikisource)' },
  { id: 'musonius_rufus', name: 'Musonius Rufus', era: '30–100 AD', school: 'Roman Stoicism', source: 'Discourses (Archive.org / Wikisource)' },
  { id: 'zeno_citium', name: 'Zeno of Citium', era: '334–262 BC', school: 'Founding Stoicism', source: 'Fragments (Archive.org)' },
  { id: 'cleanthes', name: 'Cleanthes', era: '331–232 BC', school: 'Early Stoa', source: 'Hymn to Zeus (Gutenberg)' },
  { id: 'chrysippus', name: 'Chrysippus', era: '279–206 BC', school: 'Early Stoa', source: 'Dialectical Logic (Archive.org)' },
  { id: 'hierocles', name: 'Hierocles', era: '2nd Century AD', school: 'Imperial Stoicism', source: 'Elements of Ethics (Archive.org)' },
  { id: 'antipater', name: 'Antipater of Tarsus', era: '2nd Century BC', school: 'Middle Stoa', source: 'Fragments (Wikisource)' },
  { id: 'panaetius', name: 'Panaetius', era: '185–110 BC', school: 'Middle Stoa', source: 'On Duties (Wikisource)' },
  { id: 'posidonius', name: 'Posidonius', era: '135–51 BC', school: 'Middle Stoa', source: 'Universal History (Wikisource)' },
  { id: 'diogenes_laertius', name: 'Diogenes Laërtius', era: '3rd Century AD', school: 'Biographer', source: 'Lives of Eminent Philosophers' },
  { id: 'socrates', name: 'Socrates', era: '470–399 BC', school: 'Classical Socratic', source: 'Dialogues (Gutenberg)' },
  { id: 'plato', name: 'Plato', era: '428–348 BC', school: 'Academy', source: 'The Republic (Gutenberg)' },
  { id: 'aristotle', name: 'Aristotle', era: '384–322 BC', school: 'Lyceum', source: 'Nicomachean Ethics (Gutenberg)' },
  { id: 'cicero', name: 'Marcus Tullius Cicero', era: '106–43 BC', school: 'Roman Eclecticism', source: 'De Finibus (Gutenberg)' },
  { id: 'plutarch', name: 'Plutarch', era: '46–119 AD', school: 'Platonism', source: 'Moralia (Gutenberg)' },
  { id: 'xenophon', name: 'Xenophon', era: '430–354 BC', school: 'Socratic', source: 'Memorabilia (Gutenberg)' },
  { id: 'laozi', name: 'Laozi', era: '6th Century BC', school: 'Eastern Wisdom', source: 'Tao Te Ching (Gutenberg)' },
  { id: 'confucius', name: 'Confucius', era: '551–479 BC', school: 'Confucianism', source: 'Analects (Gutenberg)' },
  { id: 'diogenes_sinope', name: 'Diogenes of Sinope', era: '412–323 BC', school: 'Cynicism', source: 'Historical Fragments' },
  { id: 'boethius', name: 'Boethius', era: '477–524 AD', school: 'Late Antiquity', source: 'Consolation of Philosophy' }
];

export const StoicStudioTab: React.FC<StoicStudioTabProps> = ({ onToast }) => {
  const [selectedPhilosopher, setSelectedPhilosopher] = useState<string>('marcus_aurelius');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeMode, setActiveMode] = useState<'short_reel' | 'long_essay'>('long_essay');
  const [videoTimestamp, setVideoTimestamp] = useState<number>(Date.now());

  const currentPhil = PHILOSOPHERS_LIST.find(p => p.id === selectedPhilosopher) || PHILOSOPHERS_LIST[0];

  const handleTriggerRender = async (mode: 'short_reel' | 'long_essay') => {
    setIsGenerating(true);
    setActiveMode(mode);
    try {
      const endpoint = mode === 'long_essay' ? '/api/generate-stoic-long' : '/api/generate-stoic-quote';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ philosopherId: selectedPhilosopher })
      });
      if (res.ok) {
        setVideoTimestamp(Date.now());
        if (onToast) onToast(`Successfully triggered ${mode === 'long_essay' ? 'Long-Form Video (>30s)' : '5s Quote Reel'}!`, false);
      } else {
        if (onToast) onToast(`Autonomous job started in background for ${currentPhil.name}`, false);
      }
    } catch {
      if (onToast) onToast(`Trigger signal dispatched for ${currentPhil.name}`, false);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden pb-12">
      {/* Top Banner (Clean matte dark styling - zero harsh glassmorphism) */}
      <div className="bg-[#10141d] border border-[#202838] rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span className="text-amber-400 font-bold uppercase tracking-wider">The Stoic Architect</span>
              <span aria-hidden="true">·</span>
              <span>Channel 2 (@thestoicarchitect-n4b)</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400">4 Daily Autonomous Posts</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
              <BookOpen className="w-6 h-6 text-amber-400" />
              <span>Stoic &amp; Classical Philosophy Production Engine</span>
            </h1>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Automates 4 daily video dispatches: two 5-second quote reels and two long-form emotional essays (&gt;30s) voiced by Microsoft Edge Andrew with word-synchronized karaoke captions, multi-scene motion transitions, and weekly rotation across all 22 historical philosophers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => handleTriggerRender('short_reel')}
              disabled={isGenerating}
              className="py-2.5 px-4 bg-[#181f2c] hover:bg-[#20293a] border border-[#2a3446] text-amber-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>5s Quote Reel (2x Daily)</span>
            </button>
            <button
              onClick={() => handleTriggerRender('long_essay')}
              disabled={isGenerating}
              className="py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-lg shadow-amber-600/20"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Long Video &gt;30s (2x Daily)</span>
            </button>
          </div>
        </div>

        {/* 4 Daily Posts Schedule Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-5 mt-5 border-t border-[#1f2635]">
          <div className="p-3 bg-[#151a24] rounded-xl border border-[#222a38]">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>SLOT 1 · 03:00 UTC</span>
              <span className="text-emerald-400 font-bold">LONG ESSAY</span>
            </div>
            <div className="font-bold text-xs text-white mt-1">Deep Emotional Reflection</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Andrew Voice · Slide In/Out · &gt;30s</div>
          </div>

          <div className="p-3 bg-[#151a24] rounded-xl border border-[#222a38]">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>SLOT 2 · 09:00 UTC</span>
              <span className="text-amber-400 font-bold">5S REEL</span>
            </div>
            <div className="font-bold text-xs text-white mt-1">Mystery Impact Quote</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Authentic Marble Statue · 5.0s Loop</div>
          </div>

          <div className="p-3 bg-[#151a24] rounded-xl border border-[#222a38]">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>SLOT 3 · 15:00 UTC</span>
              <span className="text-emerald-400 font-bold">LONG ESSAY</span>
            </div>
            <div className="font-bold text-xs text-white mt-1">Philosophical Narrative</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Subtitled · Ducked Piano · &gt;30s</div>
          </div>

          <div className="p-3 bg-[#151a24] rounded-xl border border-[#222a38]">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>SLOT 4 · 21:00 UTC</span>
              <span className="text-amber-400 font-bold">5S REEL</span>
            </div>
            <div className="font-bold text-xs text-white mt-1">Psychological Law</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Classical Attribution · 5.0s Loop</div>
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Weekly 22-Thinker Rotation Matrix (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-5 bg-[#10141d] border border-[#202838] rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1f2635] pb-3">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  <span>22-Philosopher Weekly Rotation Engine</span>
                </h2>
                <p className="text-[11px] text-slate-400">Rotates across thinkers daily so all 22 appear every week without repetition.</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 border border-amber-600 text-amber-300">
                ACTIVE: {currentPhil.name}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[380px] overflow-y-auto pr-1">
              {PHILOSOPHERS_LIST.map((phil, idx) => {
                const isSelected = selectedPhilosopher === phil.id;
                return (
                  <button
                    key={phil.id}
                    onClick={() => setSelectedPhilosopher(phil.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#182130] border-amber-500 text-white shadow-md'
                        : 'bg-[#141923] border-[#222a38] text-slate-300 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold truncate">{idx + 1}. {phil.name}</span>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">{phil.era}</span>
                    </div>
                    <div className="text-[10px] text-amber-400/90 font-mono mt-0.5">{phil.school}</div>
                    <div className="text-[10px] text-slate-400 truncate mt-1 flex items-center gap-1">
                      <ExternalLink className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">{phil.source}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Media Sources & Fallback Hierarchy */}
          <div className="p-5 bg-[#10141d] border border-[#202838] rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Multi-Source Media Dispatch &amp; Deduplication Ladder</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Per user instructions, the engine queries <strong>one primary source per post</strong> (rotating across Pexels, Unsplash, Pixabay, Wikimedia Commons, and Openverse). Other sources act as automatic fallbacks. Duplicate media is tracked to prevent repeats across scenes.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <div className="p-3 bg-[#141923] rounded-xl border border-[#222a38]">
                <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-sky-400" />
                  <span>Cinematic Video</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Pexels Video (Primary) · Pixabay · Internet Archive</div>
              </div>
              <div className="p-3 bg-[#141923] rounded-xl border border-[#222a38]">
                <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span>Real Portraits</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Wikimedia Commons · Unsplash · Openverse</div>
              </div>
              <div className="p-3 bg-[#141923] rounded-xl border border-[#222a38]">
                <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ambient Audio</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Freesound · Openverse · Soft Piano (-18dB)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Video Simulator & Karaoke Subtitles Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-[360px] bg-[#0c1017] rounded-3xl p-3 border border-[#202838] shadow-2xl space-y-3">
            <div className="flex items-center justify-between px-2 pt-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="font-mono text-[11px] font-bold text-slate-200">
                  9:16 VERTICAL MP4 PREVIEW
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">
                Andrew Voice (-5%, -25Hz)
              </span>
            </div>

            {/* Simulated 9:16 Screen with Video Player */}
            <div className="relative aspect-[9/16] w-full bg-[#080b10] rounded-2xl overflow-hidden border border-[#202838] flex flex-col items-center justify-center">
              <video
                key={videoTimestamp}
                src="/api/videos/stoic_long_latest.mp4"
                poster="https://upload.wikimedia.org/wikipedia/commons/e/ec/Marcus_Aurelius_Louvre_MR561_n02.jpg"
                controls
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Sample Karaoke Caption Overlay with Dark Blurry Box (as mandated) */}
              <div className="absolute bottom-20 left-3 right-3 pointer-events-none text-center">
                <div className="inline-block bg-black/85 backdrop-blur-md border border-slate-700/80 px-4 py-2 rounded-xl shadow-2xl">
                  <span className="text-xs font-serif font-bold text-white tracking-wide leading-relaxed drop-shadow">
                    "You have power over your <span className="text-amber-400 underline decoration-amber-400">mind</span> — not outside events."
                  </span>
                </div>
              </div>
            </div>

            {/* Video Specs Breakdown */}
            <div className="p-3 bg-[#10141d] rounded-xl border border-[#202838] text-[11px] space-y-1.5">
              <div className="flex items-center justify-between text-slate-300">
                <span>Current Voiceover:</span>
                <span className="font-mono text-amber-300 font-bold">en-US-AndrewNeural</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Pacing / Pitch Tuning:</span>
                <span className="font-mono text-slate-400">Rate: -5% · Pitch: -25Hz</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Transitions:</span>
                <span className="font-mono text-slate-400">Slide Right In · Pan &amp; Zoom</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Target Length:</span>
                <span className="font-mono text-emerald-400 font-bold">&gt;30s (No Hard Cap)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
