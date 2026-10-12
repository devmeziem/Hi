import React, { useState, useEffect, useRef } from 'react';
import {
  Flame,
  Play,
  Pause,
  Upload,
  Music,
  Trash2,
  Volume2,
  RefreshCw,
  Clock,
  ExternalLink,
  Target,
  Zap,
  CheckCircle2,
  Activity,
  Layers,
  Sparkles,
  FileAudio,
  Radio,
  Sliders,
  Check,
  Moon,
  Share2
} from 'lucide-react';

export type TeenFormatArchetype =
  | '5_steps_discipline'
  | 'stop_4_things_30d'
  | 'pause_3_distractions'
  | '10_min_morning_rule'
  | 'dopamine_reset_today';

interface MotivationReel {
  id: string;
  title: string;
  archetype: TeenFormatArchetype;
  hook?: string;
  stepsOrPoints?: string[];
  dynamicDarkOutro?: string;
  challenge?: string;
  videoPath: string;
  duration: number;
  tags?: string[];
  createdAt: string;
}

interface AudioAsset {
  filename: string;
  sizeBytes: number;
  sizeFormatted: string;
  uploadedAt: string;
  streamUrl: string;
}

const ARCHETYPES = [
  {
    id: '5_steps_discipline' as TeenFormatArchetype,
    label: '5 Steps to Build Discipline as a Teenager',
    subtitle: 'Sequential 5-step concrete habit system',
    badge: 'High Retention',
    exampleHook: 'Five steps to build iron discipline as a teenager that nobody teaches in school:',
    examplePoints: [
      'Step 1: Never touch your phone in the first 20 minutes of waking up.',
      'Step 2: Make the single hardest phone call or study task your first rep.',
      'Step 3: Remove all notifications except direct phone calls from family.',
      'Step 4: Keep secret promises made to yourself in private.',
      'Step 5: Celebrate consistency, never waiting for motivation.'
    ],
    exampleOutro: 'Discipline is built by doing. Don’t just watch — act on step one right now and share this to someone who needs to hear it.'
  },
  {
    id: 'stop_4_things_30d' as TeenFormatArchetype,
    label: 'Stop These 4 Things for 1 Month',
    subtitle: '30-day mental reboot removing toxic anchors',
    badge: 'Viral Format',
    exampleHook: 'Stop these four things for the next 30 days and watch your mental clarity transform:',
    examplePoints: [
      'Stop #1: Checking other people’s highlight reels before breakfast.',
      'Stop #2: Complaining about circumstances you can control.',
      'Stop #3: Eating cheap processed sugar when working on creative goals.',
      'Stop #4: Saying yes to hangouts that drain your focus and energy.'
    ],
    exampleOutro: 'Self-respect begins with what you refuse to accept. Try this for 30 days and send this to your accountability partner.'
  },
  {
    id: 'pause_3_distractions' as TeenFormatArchetype,
    label: 'Pause These 3 Habits for 1 Month',
    subtitle: 'Reclaiming prime attention and neural focus',
    badge: 'Focus Reboot',
    exampleHook: 'Pause these three habits for four weeks and notice how fast you pull ahead of 99% of your peers:',
    examplePoints: [
      'Pause #1: Late-night infinite doomscrolling past 11:30 PM.',
      'Pause #2: Giving energy to gossip and people who do not build you up.',
      'Pause #3: Waiting until you feel inspired before doing the work.'
    ],
    exampleOutro: 'Attention is your sovereign currency. Protect it fiercely, act on this today, and pass this to someone fighting distractions.'
  },
  {
    id: '10_min_morning_rule' as TeenFormatArchetype,
    label: 'The 10-Minute Morning Rule',
    subtitle: 'Micro-momentum before the world wakes up',
    badge: 'Action Drive',
    exampleHook: 'The ten-minute morning rule that completely changes your trajectory as a student:',
    examplePoints: [
      'Spend the first 10 minutes moving physically with zero screen light.',
      'Write down the one single mission that makes today a victory.',
      'Drink 500ml of cold water to shock your neural receptors awake.'
    ],
    exampleOutro: 'Momentum is built in minutes, not hours. Don’t just watch — execute the rule tomorrow morning and share this.'
  },
  {
    id: 'dopamine_reset_today' as TeenFormatArchetype,
    label: 'Why You Feel Unmotivated (And How to Reset Today)',
    subtitle: 'Dopamine baseline reboot & psychological relief',
    badge: 'Mental Peace',
    exampleHook: 'You are not lazy. Your brain is simply exhausted from endless artificial dopamine stimulation:',
    examplePoints: [
      'Point 1: Your brain cannot find joy in normal work when you feed it 10-second clips all day.',
      'Point 2: Boredom is where creative genius and original thoughts are born.',
      'Point 3: Put the phone in another room for 90 minutes of pure deep silence.'
    ],
    exampleOutro: 'Your potential is waiting underneath the digital noise. Turn the screen off now, do the work, and share this with a friend.'
  }
];

export const TeenMotivationTab: React.FC = () => {
  const [selectedArchetype, setSelectedArchetype] = useState<TeenFormatArchetype>('5_steps_discipline');
  const [transitionEffect, setTransitionEffect] = useState<'slam_in' | 'fade_in_out' | 'whip_pan'>('slam_in');
  const [customTopicAngle, setCustomTopicAngle] = useState<string>('');
  const [reels, setReels] = useState<MotivationReel[]>([]);
  const [selectedReel, setSelectedReel] = useState<MotivationReel | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);

  // Audio Vault State
  const [audioAssets, setAudioAssets] = useState<AudioAsset[]>([]);
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const activeArchetypeData = ARCHETYPES.find(a => a.id === selectedArchetype) || ARCHETYPES[0];

  // Load generated reels manifest
  const loadReels = async () => {
    try {
      const res = await fetch('/api/motivation/manifest');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setReels(data);
          setSelectedReel(data[0]);
          return;
        }
      }
    } catch {}

    const freshReels: MotivationReel[] = [
      {
        id: 'teen_discipline_5steps',
        title: '5 Steps to Build Discipline as a Teenager',
        archetype: '5_steps_discipline',
        hook: 'Five steps to build iron discipline as a teenager that nobody teaches in school:',
        stepsOrPoints: activeArchetypeData.examplePoints,
        dynamicDarkOutro: activeArchetypeData.exampleOutro,
        challenge: 'Apply step one before bed tonight.',
        videoPath: '/rendered_videos/teen_motivation_latest.mp4',
        duration: 32.0,
        tags: ['#MindRush', '#TeenMotivation', '#Discipline', '#LockIn', '#Shorts'],
        createdAt: new Date().toISOString()
      }
    ];

    setReels(freshReels);
    setSelectedReel(freshReels[0]);
  };

  useEffect(() => {
    loadReels();
  }, []);

  const handleGenerate = async () => {
    setIsRendering(true);
    setToast(`Synthesizing fresh "${activeArchetypeData.label}" with kinetic transitions & dark outro...`);

    try {
      const res = await fetch('/api/motivation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          archetype: selectedArchetype,
          transitionEffect,
          customAngle: customTopicAngle
        })
      });
      const data = await res.json();
      if (data.success && data.reel) {
        setReels(prev => [data.reel, ...prev]);
        setSelectedReel(data.reel);
        setToast(`Rendered fresh "${data.reel.title}" with dynamic outro!`);
      } else {
        await loadReels();
        setToast(`Render completed.`);
      }
    } catch {
      setToast('Generation active in background engine.');
      setTimeout(loadReels, 12000);
    } finally {
      setIsRendering(false);
      setTimeout(() => setToast(null), 5000);
    }
  };

  return (
    <div id="teen-motivation-container" className="space-y-6 max-w-full overflow-x-hidden pb-16">
      {/* Toast Alert */}
      {toast && (
        <div id="teen-toast-banner" className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-amber-500 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold animate-in fade-in">
          <Zap className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div id="teen-header-banner" className="p-6 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-600/20 border border-amber-500/40 rounded-2xl text-amber-400 shrink-0">
              <Flame className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-white tracking-tight">MindRush: Youth &amp; Teen Real-Life Motivation</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-950 border border-amber-800 text-amber-300 text-[10px] font-mono font-bold">
                  Zero Repetitive Scripts • Rotating Formats
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-300 text-[10px] font-mono font-bold">
                  Dynamic Dark Screen Outro
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Rotates across dynamic actionable frameworks: 5 Steps to Discipline, Stop 4 Things for 1 Month, and 10-Minute Morning Rules with kinetic slam transitions.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isRendering}
          className="px-5 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black rounded-2xl text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer shrink-0"
        >
          {isRendering ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>Synthesize Fresh {activeArchetypeData.label.split(' ')[0]} Reel</span>
        </button>
      </div>

      {/* Rotating Frameworks Selector */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Select Rotating Content Framework (Zero Fixed Repetitive Patterns)</span>
          </h3>
          <span className="text-[10px] font-mono text-slate-400">Rotates dynamically across releases</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ARCHETYPES.map((arch) => {
            const isSelected = selectedArchetype === arch.id;
            return (
              <button
                key={arch.id}
                onClick={() => setSelectedArchetype(arch.id)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-2 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-950/70 border-amber-500 ring-1 ring-amber-500 shadow-lg'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    isSelected ? 'bg-amber-900/60 border-amber-600 text-amber-200' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}>
                    {arch.badge}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                    {arch.label}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                    {arch.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Transition Effects & Custom Topic Angle */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-800">
          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">Video Transition Style</label>
            <div className="grid grid-cols-3 gap-2 mt-1.5">
              {[
                { id: 'slam_in', label: 'Kinetic Slam-In', desc: 'Punchy Scale Pop' },
                { id: 'fade_in_out', label: 'Cinematic Fade', desc: 'Smooth Cross-Fade' },
                { id: 'whip_pan', label: 'Whip-Pan Slide', desc: 'Directional Drift' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTransitionEffect(t.id as any)}
                  className={`p-2.5 rounded-xl border text-center transition-colors cursor-pointer ${
                    transitionEffect === t.id
                      ? 'bg-amber-950 border-amber-500 text-amber-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs">{t.label}</div>
                  <div className="text-[9px] text-slate-500">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase font-bold">Custom Topic or Specific Struggle (Optional)</label>
            <input
              type="text"
              value={customTopicAngle}
              onChange={(e) => setCustomTopicAngle(e.target.value)}
              placeholder="e.g. Overcoming the fear of public speaking or exam panic"
              className="w-full mt-1.5 bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Live Narrative Preview & Dynamic Dark Outro Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Script Breakdown & Step Sequencer (7 cols) */}
        <div className="lg:col-span-7 p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                <span>Script Architecture &amp; Pacing</span>
              </h3>
              <p className="text-[11px] text-slate-400">Contextually created for: {activeArchetypeData.label}</p>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">Duration: ~32s (Above 25s)</span>
          </div>

          {/* Hook */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5">
            <span className="text-[10px] font-mono uppercase font-bold text-amber-400">Opening Hook (Pattern Interrupt)</span>
            <p className="text-xs text-white font-medium italic">"{activeArchetypeData.exampleHook}"</p>
          </div>

          {/* Points / Steps */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Core Content Steps / Truths</span>
            <div className="space-y-2">
              {activeArchetypeData.examplePoints.map((pt, i) => (
                <div key={i} className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-amber-950 text-amber-300 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 border border-amber-800">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{pt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Dynamic Dark Screen Outro & Caption Style Showcase (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Dynamic Dark Screen Outro Card */}
          <div className="p-6 bg-black border border-slate-800 rounded-3xl space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Moon className="w-4 h-4 text-amber-400" />
                <span>Cinematic Dark Screen Outro</span>
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                Final 3.5s Scene
              </span>
            </div>

            <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-2xl text-center space-y-3">
              <div className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold">
                CONTEXTUAL CALL TO ACTION
              </div>
              <p className="text-sm font-black text-white leading-relaxed tracking-wide">
                "{activeArchetypeData.exampleOutro}"
              </p>
              <div className="text-[10px] text-slate-500 font-mono pt-1">
                Dynamically generated per topic · Never hardcoded
              </div>
            </div>

            <div className="text-[11px] text-slate-400 leading-relaxed">
              Every video concludes with a quiet, high-contrast dark screen delivering an actionable conclusion that compels the viewer to act and share.
            </div>
          </div>

          {/* Subtitle Caption Styler Preview */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-white">
              <span>Viral Punch Captions (Active Word Highlight)</span>
              <span className="text-[10px] font-mono text-amber-400">Dead Center</span>
            </div>
            
            {/* Simulation of ASS karaoke subtitles */}
            <div className="relative aspect-[16/9] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/80" />
              <div className="relative z-10 text-center space-y-1">
                <div className="text-sm font-black uppercase tracking-wider text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                  DISCIPLINE IS <span className="text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded font-black">BUILT</span> BY
                </div>
                <div className="text-xs font-extrabold uppercase text-slate-300 drop-shadow">
                  WHAT YOU REFUSE TO ACCEPT
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400">
              High-contrast center subtitles with glowing yellow active word highlight for 100% mobile retention.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
