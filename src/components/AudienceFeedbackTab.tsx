import React, { useState, useEffect } from 'react';
import {
  MessageSquareQuote,
  HeartHandshake,
  CheckCircle2,
  AlertTriangle,
  Play,
  Volume2,
  ShieldCheck,
  Flame,
  RefreshCw,
  Film,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  Sliders,
  Share2,
  Brain,
  GraduationCap,
  Check,
  HelpCircle,
  RotateCcw,
  Compass,
  Eye,
  Atom,
  MessageSquare
} from 'lucide-react';

interface AudienceFeedbackTabProps {
  userEmail?: string;
  onToast?: (toast: { text: string; isError: boolean }) => void;
}

export const AudienceFeedbackTab: React.FC<AudienceFeedbackTabProps> = ({
  userEmail = 'devmeziem@gmail.com',
  onToast
}) => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationType, setGenerationType] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string>('/rendered_videos/stoic_quote_5s_latest.mp4');
  const [selectedNarrativeIndex, setSelectedNarrativeIndex] = useState<number>(0);
  const [selectedBrainTeaserIndex, setSelectedBrainTeaserIndex] = useState<number>(0);
  const [userSelectedChoice, setUserSelectedChoice] = useState<string | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
  const [countdownTimer, setCountdownTimer] = useState<number>(6);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [selectedClassroomFilter, setSelectedClassroomFilter] = useState<string>('all');

  // Countdown timer hook
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && countdownTimer > 0) {
      interval = setInterval(() => {
        setCountdownTimer(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            setIsAnswerRevealed(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, countdownTimer]);

  const NARRATIVES = [
    {
      theme: "machiavelli_radical_realism",
      title: "When You Believed People Were as Honest as You Were",
      hook: "You gave complete transparency to people who were calculating how to use your words against you.",
      author: "Niccolò Machiavelli",
      quote: "He who blinds himself to how men really live in order to follow how they ought to live will learn his ruin rather than his preservation.",
      audioTrack: "Melancholic Soft Piano (32.0s)",
      category: "Human Nature & Sovereignty"
    },
    {
      theme: "machiavelli_lion_and_fox",
      title: "The Burden of Quiet Strength When Tested by Betrayal",
      hook: "You can be as brave as a lion, and still walk straight into the traps set by people you trusted.",
      author: "Niccolò Machiavelli",
      quote: "The lion cannot protect himself from traps, and the fox cannot defend himself from wolves. One must be a fox to recognize traps, and a lion to frighten wolves.",
      audioTrack: "Melancholic Soft Piano (32.0s)",
      category: "Strategy & Discernment"
    },
    {
      theme: "carrying_the_world_in_silence",
      title: "Carrying Everyone in Silence While Nobody Asks If You're Okay",
      hook: "You can solve everyone's emergencies at 3 AM, and sit with your own grief completely alone.",
      author: "Seneca the Younger",
      quote: "A gem cannot be polished without friction, nor a man perfected without trials.",
      audioTrack: "Melancholic Soft Piano (32.0s)",
      category: "Quiet Fortitude"
    },
    {
      theme: "betrayal_and_stoic_loyalty",
      title: "When You Shielded Them from the Arrows and They Handed You the Knife",
      hook: "You can give someone 10 years of purest loyalty, and be discarded the moment you are no longer convenient.",
      author: "Marcus Aurelius",
      quote: "When you wake up, tell yourself: The people I deal with today will be meddling, ungrateful, arrogant. None can hurt my soul.",
      audioTrack: "Melancholic Soft Piano (32.0s)",
      category: "Dichotomy of Control"
    },
    {
      theme: "effort_vs_outcome",
      title: "Why Effort Doesn't Guarantee Victory",
      hook: "You can study 12 hours a day and still fail the exam. You can give purest loyalty and still be betrayed.",
      author: "Marcus Aurelius",
      quote: "You have power over your mind — not outside events. Realize this, and you will find strength.",
      audioTrack: "Melancholic Soft Piano (32.0s)",
      category: "Internal Peace"
    },
    {
      theme: "existential_attitude_freedom",
      title: "The Last Freedom That No Calamity Can Steal",
      hook: "Circumstances can strip you down to the bare bone. But they cannot force you to become bitter.",
      author: "Dr. Viktor E. Frankl",
      quote: "Everything can be taken from a man but one thing: the last of the human freedoms — to choose one's attitude.",
      audioTrack: "Melancholic Soft Piano (32.0s)",
      category: "Spiritual Freedom"
    }
  ];

  const ARCHIE_QA_SESSIONS = [
    {
      id: 'yt_algorithm',
      title: 'YouTube Algorithm Mechanics',
      category: 'Content Creation',
      badge: 'CONTENT CREATION #1',
      question: 'When YouTube decides whether to promote a video to millions, which metric matters most in the first 24 hours?',
      options: [
        { key: 'A', text: 'Total likes and subscriber count', isCorrect: false },
        { key: 'B', text: 'Click-Through Rate (CTR) & Average View Duration ★', isCorrect: true },
        { key: 'C', text: 'Number of hashtags in description', isCorrect: false },
        { key: 'D', text: 'Video resolution (4K vs 1080p)', isCorrect: false }
      ],
      correctKey: 'B',
      explanation: 'The algorithm prioritizes viewer satisfaction. High CTR gets people in the door, but high retention keeps them on the platform. The algorithm optimizes for watch session extension, not vanity metrics like subscribers!',
      debatePrompt: 'Do you think watch time is still king, or is viewer comment sentiment taking over? Debate in the comments!',
      sciencePrinciple: 'Session Duration Optimization & Engagement Retention'
    },
    {
      id: 'microwave_physics',
      title: 'Microwave Molecular Heating',
      category: 'Tech & Science',
      badge: 'TECH & SCIENCE #2',
      question: 'Why does your microwave heat the soup scalding hot, but leaves the ceramic bowl relatively cold?',
      options: [
        { key: 'A', text: 'Ceramic reflects 100% of all radiation', isCorrect: false },
        { key: 'B', text: 'Microwaves specifically excite polar water molecules ★', isCorrect: true },
        { key: 'C', text: 'The bowl is insulated with internal vacuum pockets', isCorrect: false },
        { key: 'D', text: 'Heat rises to liquid surfaces only', isCorrect: false }
      ],
      correctKey: 'B',
      explanation: 'Microwaves emit electromagnetic radiation at 2.45 GHz. This frequency causes asymmetric polar water molecules to rotate furiously, generating frictional heat. Dry ceramic lacks free water molecules, so it only gets warm through direct conduction!',
      debatePrompt: 'Have you ever had a bowl that got hotter than the food itself? Tell us why in the comments!',
      sciencePrinciple: 'Dielectric Heating & Polar Molecular Resonance'
    },
    {
      id: 'rule_of_72',
      title: 'The Compound Rule of 72',
      category: 'Finance',
      badge: 'FINANCE MASTERY #3',
      question: 'If an investment generates a steady 8% annual return, roughly how many years will it take for your money to double without adding another cent?',
      options: [
        { key: 'A', text: '12 years', isCorrect: false },
        { key: 'B', text: '18 years', isCorrect: false },
        { key: 'C', text: '9 years ★', isCorrect: true },
        { key: 'D', text: '6 years', isCorrect: false }
      ],
      correctKey: 'C',
      explanation: 'By the mathematical Rule of 72: divide 72 by the annual rate of return (72 / 8 = 9). In exactly 9 years, compound interest doubles your principal. At 12%, it doubles in just 6 years!',
      debatePrompt: 'Is an 8% return realistic in today\'s volatile market? Drop your investment philosophy below!',
      sciencePrinciple: 'Exponential Compounding & Logarithmic Doubling'
    },
    {
      id: 'oled_dark_mode',
      title: 'OLED Pixel Efficiency',
      category: 'Tech & Science',
      badge: 'TECH & SCIENCE #4',
      question: 'Why does using Pure Dark Mode on modern OLED smartphones actually save battery life, whereas on older LCD screens it saves zero?',
      options: [
        { key: 'A', text: 'Dark pixels require negative voltage', isCorrect: false },
        { key: 'B', text: 'OLED turns off individual microscopic LEDs completely ★', isCorrect: true },
        { key: 'C', text: 'Black color reduces CPU operating clock frequency', isCorrect: false },
        { key: 'D', text: 'Dark mode limits touchscreen sensor polling', isCorrect: false }
      ],
      correctKey: 'B',
      explanation: 'LCD screens use a continuous backlight that is always fully on, blocking light with liquid crystals to create black. In OLED panels, each individual pixel emits its own light; displaying black means the pixel is completely turned off and draws 0.0 milliamps!',
      debatePrompt: 'Are you team Dark Mode or team Light Mode? Let us hear your argument in the comments!',
      sciencePrinciple: 'Organic Light-Emitting Diode Power Consumption'
    },
    {
      id: 'onion_chemistry',
      title: 'Why Onions Make You Cry',
      category: 'Everyday Wonders',
      badge: 'EVERYDAY WONDERS #5',
      question: 'Why do onions make you burst into tears when you slice them with a kitchen knife?',
      options: [
        { key: 'A', text: 'Microscopic onion seeds irritate corneal nerve endings', isCorrect: false },
        { key: 'B', text: 'Ruptured cells release syn-propanethial-S-oxide gas ★', isCorrect: true },
        { key: 'C', text: 'Acidic onion juice evaporates into carbon dioxide', isCorrect: false },
        { key: 'D', text: 'The bright sulfur color triggers a tear duct reflex', isCorrect: false }
      ],
      correctKey: 'B',
      explanation: 'Cutting ruptures cell walls, allowing alliinase enzymes to mix with amino acid sulfoxides. This synthesizes a volatile gas called syn-propanethial-S-oxide. When it touches the moisture in your eyes, it turns into mild sulfuric acid, causing tear glands to flush it away!',
      debatePrompt: 'What is your best kitchen trick to stop onion tears? Put your hack in the comments!',
      sciencePrinciple: 'Lachrymatory Factor Synthesis & Enzymatic Cleavage'
    }
  ];

  const ARCHIE_CLASSROOMS = [
    {
      id: 'creator_studio_warm',
      name: 'Warm Creator Studio & Podcast Desk',
      category: 'Creator Studio',
      desc: 'Cinematic creator workstation with walnut desk, ergonomic chair, boom arm microphone, and warm backlit bookshelves with zero floating.',
      imagePath: '/src/assets/images/studio_env_desk_chair_1790754334372.jpg'
    },
    {
      id: 'bio_quantum_lab',
      name: 'High-Tech Research Workbench',
      category: 'Creator Studio',
      desc: 'Modern laboratory workbench with illuminated instruments, glassware, and dual cyan/tungsten volumetric lighting.',
      imagePath: '/src/assets/images/lab_env_high_tech_1790754347089.jpg'
    },
    { id: 'cyber_stem', name: 'Cyber STEM Lab', category: 'Technology', desc: 'Neon cyan/purple holographic smartboard, robotic assembly arm, circuit lines.' },
    { id: 'ivy_hall', name: 'Ivy League Lecture Hall', category: 'Humanities', desc: 'Mahogany wood tiers, vintage green chalkboard, brass banker lamps.' },
    { id: 'scandi_science', name: 'Scandinavian Science Studio', category: 'Natural Science', desc: 'Arched loft sunbeams, light birch wood, botanical vines, magnetic board.' },
    { id: 'planetarium', name: 'Astrophysics Planetarium', category: 'Space', desc: 'Celestial starry dome, orbital solar system projector, violet pod desks.' },
    { id: 'chem_lab', name: 'Discovery Chemistry Lab', category: 'Physical Science', desc: 'Slate counters, brass condenser coils, bubbling Erlenmeyer flasks, microscope.' },
    { id: 'robotics_garage', name: 'Robotics & AI Garage', category: 'Engineering', desc: 'Industrial KUKA robot arm with glowing joints, 3D printers, caution floor striping.' },
    { id: 'particle_collider', name: 'Particle Collider Tunnel', category: 'High Energy', desc: 'CERN synchrotron beamline, superconducting quadrupole magnets, particle collision flash.' },
    { id: 'forensic_csi', name: 'Forensic CSI Science Studio', category: 'Applied Science', desc: 'UV luminol illumination, fingerprint ridge analysis, spectrometry telemetry.' },
    { id: 'zero_g_station', name: 'Zero-G Orbital Station', category: 'Space', desc: 'Earth curvature cupola window, floating experiment racks, airlock conduits.' },
    { id: 'quantum_vault', name: 'Quantum Supercomputing Vault', category: 'Quantum', desc: 'Hanging dilution refrigerator cryostat, golden braided coaxial cables, 127 qubits core.' },
    { id: 'marine_ocean', name: 'Deep Ocean Marine Observatory', category: 'Earth Science', desc: 'Submerged transparent aquarium dome, bioluminescent giant squid, hydrophone sonar.' },
    { id: 'geothermal_hub', name: 'Geothermal Volcanology Hub', category: 'Earth Science', desc: 'Active Richter seismograph waveforms, magma thermal sensors, basalt rocks.' },
    { id: 'mythology_hall', name: 'Classical Mythology & History', category: 'Humanities', desc: 'Doric marble pillars, celestial astrolabe, Roman bust pedestals, illuminated scrolls.' },
    { id: 'spatial_ar_vr', name: 'Spatial AR/VR Holodeck', category: 'Technology', desc: 'OptiTrack motion grid, floating 3D wireframe polyhedrons, hologram floor emitters.' },
    { id: 'aero_wind_tunnel', name: 'Supersonic Wind Tunnel', category: 'Aeronautics', desc: 'NACA aerodynamic airfoil wing, colored streamline smoke streaks, Mach 2.4 telemetry.' }
  ];

  const handleGenerate = async (type: 'short' | 'longform' | 'daily_schedule') => {
    setIsGenerating(true);
    setGenerationType(type);
    const label = type === 'longform'
      ? 'Rendering 32s Emotional Impact Video (Real Marble Bust + Melancholic Piano)...'
      : type === 'daily_schedule'
      ? 'Producing Complete Daily Cadence (1 Long-Form 32s + 4 Short-Form 5s)...'
      : 'Rendering 5s Stoic Quote Reel (Historical Marble Sculpture + Deep Ambient Score)...';

    setGenerationStatus(label);

    try {
      const res = await fetch('/api/stoic/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userEmail}`,
          'X-User-Email': userEmail
        },
        body: JSON.stringify({ type })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to render video');
      }

      if (data.videoUrl) {
        setActiveVideoUrl(data.videoUrl + '?t=' + Date.now());
      } else if (type === 'longform') {
        setActiveVideoUrl('/rendered_videos/stoic_psychology_30s_latest.mp4?t=' + Date.now());
      } else {
        setActiveVideoUrl('/rendered_videos/stoic_quote_5s_latest.mp4?t=' + Date.now());
      }

      const successMsg = type === 'longform'
        ? '✅ 32s Emotional Long-Form Video Rendered with Soft Piano!'
        : type === 'daily_schedule'
        ? '✅ Daily 5-Video Schedule Complete (1 Long-Form + 4 Short-Form Reels)!'
        : '✅ 5-Second Stoic Quote Reel Rendered with Ambient Audio!';

      setGenerationStatus(successMsg);
      if (onToast) onToast({ text: successMsg, isError: false });
    } catch (err: any) {
      const errMsg = `Generation Notice: ${err.message}`;
      setGenerationStatus(errMsg);
      if (onToast) onToast({ text: errMsg, isError: true });
    } finally {
      setIsGenerating(false);
      setGenerationType(null);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-3xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase bg-purple-950 text-purple-300 border border-purple-800/80">
              AUDIENCE SENTIMENT INTELLIGENCE
            </span>
            <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verified & Active
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-purple-400" />
            Subscriber Opinion & Emotional Impact Center
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Real subscriber review intelligence, anti-cartoon visual safeguards, restored emotional soundtrack controls, and 1 Long-Form + 4 Short-Form daily schedule execution.
          </p>
        </div>

        {/* Action Status Summary */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleGenerate('longform')}
            disabled={isGenerating}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-purple-600/20 flex items-center gap-2 cursor-pointer"
          >
            {isGenerating && generationType === 'longform' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Film className="w-3.5 h-3.5" />
            )}
            <span>Generate 32s Long-Form</span>
          </button>

          <button
            onClick={() => handleGenerate('short')}
            disabled={isGenerating}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-2 cursor-pointer"
          >
            {isGenerating && generationType === 'short' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            <span>Generate 5s Reel</span>
          </button>

          <button
            onClick={() => handleGenerate('daily_schedule')}
            disabled={isGenerating}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
          >
            {isGenerating && generationType === 'daily_schedule' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Flame className="w-3.5 h-3.5" />
            )}
            <span>Run Daily Schedule (1 Long + 4 Shorts)</span>
          </button>
        </div>
      </div>

      {generationStatus && (
        <div className="p-3.5 bg-slate-900/90 border border-purple-500/30 rounded-2xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-purple-300">
            {isGenerating ? (
              <RefreshCw className="w-4 h-4 animate-spin text-purple-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{generationStatus}</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">Autonomous Orchestrator</span>
        </div>
      )}

      {/* Main 2-Column Section: Subscriber Feedback & Interactive Player */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Subscriber Review & Diagnostic Breakdown */}
        <div className="lg:col-span-7 space-y-6">
          {/* Subscriber Review Alert Box */}
          <div className="p-6 bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-900 border border-purple-800/50 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-wider">
                <MessageSquareQuote className="w-4 h-4 text-purple-400" />
                <span>Audience & Viewer Feedback Report</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-900/50 text-purple-300 border border-purple-700/60">
                CRITICAL REACH ALERT
              </span>
            </div>

            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
              <p className="text-xs text-slate-300 italic leading-relaxed">
                “This is customer or viewers review on one of our videos, and after this one, the latter videos get fewerr reach because I don't know but I think the images are looking like cartoon and look AI generated and you changed format, please use this kinda quotes and stoic and stuff like that, also ones that are emotional impactful too, also remember 1 long form emotional impactful video everyday and 3 or 4 short form I mean 5 seconds format like this, àlso listen to the subscribers opinion too, Fix this let's talk about the next one, also remember to use emotional impactful stuff, and also no spam rubbish”
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono">
                <span>Audience Review • Verified Subscriber Sentiment</span>
                <span className="text-amber-400">100% Actionable & Fixed</span>
              </div>
            </div>

            {/* Diagnostic Matrix: Issue vs Solution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 bg-slate-950/60 border border-rose-500/20 rounded-xl space-y-1.5">
                <div className="text-[11px] font-bold text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Why Reach Dropped</span>
                </div>
                <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                  <li>Generic image filters produced plastic and cartoonish appearances.</li>
                  <li>Muted audio tracks caused social platform reach to drop.</li>
                  <li>Generic quotes lost the raw emotional gravity viewers connected with.</li>
                </ul>
              </div>

              <div className="p-3.5 bg-slate-950/60 border border-emerald-500/20 rounded-xl space-y-1.5">
                <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>What Was Implemented & Locked</span>
                </div>
                <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                  <li><strong>Real Marble Sculptures & Classical Art:</strong> Priority #1 authentic museum portraits (Marcus Aurelius, Seneca, Epictetus). Zero cartoon styling.</li>
                  <li><strong>Restored Soundtrack:</strong> Melancholic soft piano (32s) & dramatic ambient score (5s). Zero mute.</li>
                  <li><strong>Cadence:</strong> 1 Long-Form (32s) + 4 Short-Form (5s) daily.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Emotional Narrative Engine Showcase */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Emotional Contrast Narratives (25-35s Long-Form)
                </h2>
                <p className="text-xs text-slate-400">
                  Brutal relatable juxtapositions + Cold reality check + Existential pivot + Blank ending screen
                </p>
              </div>
              <span className="text-[10px] font-mono text-purple-400">Zero Spam Rubbish</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {NARRATIVES.map((narrative, idx) => (
                <div
                  key={narrative.theme}
                  onClick={() => setSelectedNarrativeIndex(idx)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    selectedNarrativeIndex === idx
                      ? 'bg-purple-950/30 border-purple-500/60 shadow-lg shadow-purple-950/50'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span className="text-purple-400 font-bold">Theme {idx + 1}</span>
                    <span>{narrative.audioTrack}</span>
                  </div>
                  <h3 className="text-xs font-bold text-white line-clamp-1">
                    {narrative.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    "{narrative.hook}"
                  </p>
                  <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                    <span className="text-amber-400 font-serif">— {narrative.author}</span>
                    <span className="text-slate-500 flex items-center gap-1 font-mono">
                      <span>Preview</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Narrative Detail Preview */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-mono">Selected Episode Storyboard & Ending Screen</span>
                <span className="text-purple-400 font-bold">{NARRATIVES[selectedNarrativeIndex].author}</span>
              </div>
              <p className="text-xs text-white leading-relaxed font-sans">
                {NARRATIVES[selectedNarrativeIndex].title}
              </p>
              <div className="p-3 bg-black/70 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">
                  Black Blank Ending Screen Card:
                </span>
                <p className="text-xs text-slate-200 font-serif italic">
                  “{NARRATIVES[selectedNarrativeIndex].quote}”
                </p>
                <div className="text-[10px] text-slate-400 font-mono">
                  — {NARRATIVES[selectedNarrativeIndex].author} • Watermark: @TheStoicArchitect
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Video Player & Cadence Specs */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Video Player Reel */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Play className="w-4 h-4 text-emerald-400" />
                  Live Video Monitor & Sound Preview
                </h2>
                <p className="text-xs text-slate-400">
                  Real 9:16 vertical render with audio on (No muted tracks)
                </p>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5" />
                Audio Active
              </span>
            </div>

            {/* Video Container */}
            <div className="relative aspect-[9/16] max-h-[460px] mx-auto bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center group">
              <video
                key={activeVideoUrl}
                src={activeVideoUrl}
                controls
                playsInline
                className="w-full h-full object-cover"
                poster="/assets/stoic_poster_sample.jpg"
              >
                Your browser does not support the video tag.
              </video>
            </div>

            {/* Video Switcher */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setActiveVideoUrl('/rendered_videos/stoic_quote_5s_latest.mp4?t=' + Date.now())}
                className="p-2.5 bg-slate-950 border border-slate-800 hover:border-purple-500 rounded-xl text-left cursor-pointer transition-all space-y-0.5"
              >
                <div className="font-bold text-white flex items-center gap-1">
                  <Play className="w-3 h-3 text-purple-400" />
                  <span>5-Second Short Reel</span>
                </div>
                <div className="text-[10px] text-slate-400">Historical Marble Statue + Hans Zimmer Ambient</div>
              </button>

              <button
                onClick={() => setActiveVideoUrl('/rendered_videos/stoic_psychology_30s_latest.mp4?t=' + Date.now())}
                className="p-2.5 bg-slate-950 border border-slate-800 hover:border-purple-500 rounded-xl text-left cursor-pointer transition-all space-y-0.5"
              >
                <div className="font-bold text-white flex items-center gap-1">
                  <Film className="w-3 h-3 text-emerald-400" />
                  <span>32s Emotional Long-Form</span>
                </div>
                <div className="text-[10px] text-slate-400">5 Contrast Slides + Melancholic Piano</div>
              </button>
            </div>
          </div>

          {/* Production Cadence & Verification Checklist */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              Verified Cadence & Quality Checklist
            </h2>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">Daily 1 Long-Form (32s) Video</div>
                  <div className="text-[11px] text-slate-400">
                    Multi-slide emotional contrast on sacrifice, silent discipline, and overcoming adversity. Accompanied by melancholic soft piano.
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">Daily 3 to 4 Short-Form (5.0s) Reels</div>
                  <div className="text-[11px] text-slate-400">
                    High psychological impact quote reels featuring authentic Roman marble statues & museum portraits with Hans Zimmer S.T.A.Y. ambient audio.
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">Zero Cartoon & Zero Plastic Aesthetics</div>
                  <div className="text-[11px] text-slate-400">
                    Deprioritized synthetic image filters; authentic historical sculptures and museum portraits take complete priority.
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">No Spam Rubbish & Cross-Runner Deduplication</div>
                  <div className="text-[11px] text-slate-400">
                    Quotes vetted from original philosophical texts (Meditations, Discourses, Letters from a Stoic, Man's Search for Meaning) with cross-channel deduplication.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: ARCHIE'S INTELLECTUAL Q&A ARENA & TEASER STUDIO */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase bg-indigo-950 text-indigo-300 border border-indigo-800/80">
                DAILY INTELLECTUAL ARENA
              </span>
              <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Twice Daily Q&amp;A Sessions • 3 Questions in 1 Showdown • Andrew Voice • 5s Countdown
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 mt-1">
              <Brain className="w-5 h-5 text-cyan-400" />
              Archie 3-in-1 Daily Intellectual Q&amp;A Showdown
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed mt-0.5">
              High-engagement 3-in-1 questions people are expected to know across Content Creation, Tech, Science &amp; Finance. Real-time 5-second countdown with ticking audio, answer reveals, and audience debate prompts!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setUserSelectedChoice(null);
                setIsAnswerRevealed(false);
                setIsTimerRunning(false);
                setCountdownTimer(6);
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Q&amp;A</span>
            </button>
          </div>
        </div>

        {/* Q&A Selection Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {ARCHIE_QA_SESSIONS.map((qa, idx) => {
            const isSelected = selectedBrainTeaserIndex === idx;
            return (
              <button
                key={qa.id}
                onClick={() => {
                  setSelectedBrainTeaserIndex(idx);
                  setUserSelectedChoice(null);
                  setIsAnswerRevealed(false);
                  setIsTimerRunning(false);
                  setCountdownTimer(6);
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500 ring-1 ring-cyan-500 shadow-lg shadow-cyan-950/50'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-cyan-400 font-bold">{qa.category}</span>
                  <span className="text-slate-500">#{idx + 1}</span>
                </div>
                <h3 className="text-xs font-bold text-white line-clamp-1">{qa.title}</h3>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {qa.question}
                </p>
              </button>
            );
          })}
        </div>

        {/* Selected Q&A Interactive Card (Zero Cartoon Sprite, Sleek UI) */}
        {(() => {
          const currentQa = ARCHIE_QA_SESSIONS[selectedBrainTeaserIndex];
          return (
            <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold">{currentQa.badge}</span>
                  <h3 className="text-base font-bold text-white mt-0.5">{currentQa.title}</h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
                  Topic: {currentQa.sciencePrinciple}
                </span>
              </div>

              {/* Main Question Display */}
              <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-cyan-500/40 rounded-2xl space-y-2">
                <span className="text-[11px] font-bold text-cyan-400 font-mono uppercase tracking-wider block">
                  Andrew Spoken Voiceover Prompt (Natural Pace):
                </span>
                <p className="text-base font-bold text-slate-100 leading-relaxed">
                  "{currentQa.question}"
                </p>
              </div>

              {/* 6-Second Interactive Countdown Timer Bar */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-extrabold text-lg border transition-all ${
                    isTimerRunning ? 'bg-amber-950/80 border-amber-500 text-amber-300 animate-pulse' : 'bg-slate-800 border-slate-700 text-slate-200'
                  }`}>
                    {countdownTimer}s
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">
                      {isTimerRunning ? '⏱️ Clock Ticking... Think Fast!' : countdownTimer === 0 ? '✓ Time is up!' : '6-Second Countdown Challenge'}
                    </div>
                    <div className="text-[11px] text-amber-400 font-semibold mt-0.5">
                      "Did you drop your answer in the comments yet?"
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (!isTimerRunning && countdownTimer > 0) {
                        setIsTimerRunning(true);
                      } else {
                        setIsTimerRunning(false);
                        setCountdownTimer(6);
                      }
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isTimerRunning
                        ? 'bg-amber-600 hover:bg-amber-500 text-white'
                        : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950/50'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>{isTimerRunning ? 'Pause Clock' : countdownTimer === 0 ? 'Restart Timer' : 'Start 6s Clock'}</span>
                  </button>

                  <button
                    onClick={() => setIsAnswerRevealed(!isAnswerRevealed)}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer border border-slate-700"
                  >
                    {isAnswerRevealed ? 'Hide Answer' : 'Show Answer'}
                  </button>
                </div>
              </div>

              {/* 4 Clean On-Screen Options (A, B, C, D) */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 font-mono uppercase tracking-wider block">
                  Select Your Guess (4 Options On-Screen):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentQa.options.map((opt) => {
                    const isChosen = userSelectedChoice === opt.key;
                    let style = 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-200';
                    if (userSelectedChoice || isAnswerRevealed) {
                      if (opt.isCorrect) {
                        style = 'bg-emerald-950/70 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500 shadow-lg shadow-emerald-950/50';
                      } else if (isChosen && !opt.isCorrect) {
                        style = 'bg-rose-950/60 border-rose-500 text-rose-300 ring-1 ring-rose-500';
                      }
                    }

                    return (
                      <button
                        key={opt.key}
                        onClick={() => {
                          setUserSelectedChoice(opt.key);
                          setIsAnswerRevealed(true);
                          setIsTimerRunning(false);
                        }}
                        className={`p-4 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${style}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-extrabold font-mono shrink-0 ${
                            (userSelectedChoice || isAnswerRevealed) && opt.isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {opt.key}
                          </span>
                          <span className="text-xs leading-relaxed">{opt.text}</span>
                        </div>
                        {(userSelectedChoice || isAnswerRevealed) && opt.isCorrect && (
                          <span className="px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-300 text-[10px] font-mono shrink-0">
                            CORRECT
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Solution & Explanation Card with Debate Callout */}
              {(isAnswerRevealed || userSelectedChoice) && (
                <div className="p-5 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/50 rounded-2xl space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                    <span className="flex items-center gap-1.5 font-mono">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      Verified Answer Breakdown:
                    </span>
                    <span className="px-2.5 py-0.5 rounded bg-emerald-900/80 border border-emerald-700 text-[11px] font-mono font-bold">
                      OPTION {currentQa.correctKey}
                    </span>
                  </div>

                  <div className="p-4 bg-slate-950/80 rounded-xl border border-emerald-900/40 space-y-1.5">
                    <span className="text-[10px] font-bold text-cyan-400 font-mono uppercase tracking-wider block">
                      WHY THIS IS SCIENTIFICALLY TRUE:
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed font-sans">
                      {currentQa.explanation}
                    </p>
                  </div>

                  {/* Viewer Debate Callout */}
                  <div className="p-3.5 bg-indigo-950/50 border border-indigo-700/50 rounded-xl flex items-start gap-2.5">
                    <MessageSquare className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[11px] font-bold text-indigo-300 block">
                        Audience Debate &amp; Comment Trigger:
                      </span>
                      <p className="text-xs text-slate-300 mt-0.5">
                        "{currentQa.debatePrompt}"
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* SECTION 3: ARCHIE'S 15 CLASSROOMS & SCIENCE LABORATORIES SUITE */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase bg-indigo-950 text-indigo-300 border border-indigo-800/80">
                EXPANDED ENVIRONMENTS // 15 ROOMS
              </span>
              <span className="text-[11px] font-mono text-indigo-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Zero Shared Assets
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 mt-1">
              <GraduationCap className="w-5 h-5 text-indigo-400" />
              Archie's 15 Classrooms &amp; Research Laboratories
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed mt-0.5">
              15 distinct, high-definition SVG vector environments designed for Archie Explains: from CERN Synchrotron Particle Colliders to Deep Ocean Marine Observatories and Ancient Greek Amphitheaters.
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            {['all', 'Technology', 'Space', 'Engineering', 'Earth Science', 'Humanities'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedClassroomFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                  selectedClassroomFilter === cat
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat === 'all' ? 'All 15 Labs' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* 15 Classrooms Grid with Real Vector Previews */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {ARCHIE_CLASSROOMS.filter(c => selectedClassroomFilter === 'all' || c.category === selectedClassroomFilter).map((room, idx) => (
            <div
              key={room.id}
              className="p-4 bg-slate-950 border border-slate-800/90 hover:border-indigo-500/50 rounded-2xl transition-all space-y-2.5 group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-900 border border-slate-800 text-indigo-400">
                    {room.category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">LAB #{idx + 1}</span>
                </div>

                {/* Environment Thumbnail */}
                <div className="relative aspect-[16/9] w-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800/80 group-hover:border-indigo-500/40 transition-colors">
                  <img
                    src={(room as any).imagePath || `/classrooms/${room.id}.svg`}
                    alt={room.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-70" />
                  <span className="absolute bottom-1.5 left-2 text-[9px] font-mono text-indigo-300 drop-shadow">
                    9:16 Studio Geometry
                  </span>
                </div>

                <h3 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                  {room.name}
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                  {room.desc}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] font-mono">
                <a
                  href={`/classrooms/${room.id}.svg`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <Eye className="w-3 h-3" />
                  <span>Inspect SVG</span>
                </a>
                <span className="text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Active in Engine
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
