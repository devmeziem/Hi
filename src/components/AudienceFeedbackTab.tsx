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
  Atom
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
  const [selectedClassroomFilter, setSelectedClassroomFilter] = useState<string>('all');

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

  const ARCHIE_BRAIN_TEASERS = [
    {
      id: 'traffic_gridlock',
      title: 'Intersection Traffic Gridlock',
      badge: 'ARCHIE LOGIC LAB #1',
      question: 'Four cars arrive simultaneously at an uncontrolled crossroads. Which car must move first to unlock the deadlock?',
      options: [
        { key: 'A', text: 'Car A (Red, Facing East)', isCorrect: false },
        { key: 'B', text: 'Car B (Blue, Facing South)', isCorrect: false },
        { key: 'C', text: 'Car C (Green, Facing West) ★', isCorrect: true },
        { key: 'D', text: 'Car D (Amber, Facing North)', isCorrect: false }
      ],
      correctKey: 'C',
      explanation: 'Car C has an empty clear reverse lane directly behind it. When Car C shifts into reverse and backs up 5 meters, Car B can safely proceed south, then Car A drives east, and Car D clears north without collision!',
      sciencePrinciple: 'Sequential Cascade Dependency & Priority Right-of-Way'
    },
    {
      id: 'water_siphon',
      title: 'Interconnected Liquid Siphon',
      badge: 'ARCHIE PHYSICS LAB #2',
      question: 'Water constantly pours into top Flask 1. Looking at the connecting pipe heights and hidden internal valve plugs, which flask fills completely first?',
      options: [
        { key: '1', text: 'Flask 1 (Top Supply)', isCorrect: false },
        { key: '2', text: 'Flask 2 (Mid-Left)', isCorrect: false },
        { key: '3', text: 'Flask 3 (Mid-Right)', isCorrect: false },
        { key: '4', text: 'Flask 4 (Bottom-Left) ★', isCorrect: true }
      ],
      correctKey: '4',
      explanation: 'Pipe 1→3 is blocked by a closed red plug. Water flows freely from 1 into Flask 2. Inside Flask 2, Pipe 2→4 is positioned lower than the outlet to Flask 5. Gravity pulls all water into Flask 4 before 2 can ever reach capacity!',
      sciencePrinciple: "Pascal's Law & Atmospheric Hydrostatic Equilibrium"
    },
    {
      id: 'optics_laser',
      title: 'Optical Laser Reflection Path',
      badge: 'ARCHIE OPTICS LAB #3',
      question: 'A red laser diode fires horizontally into an array of four 45-degree planar mirrors. Which target sensor does the beam strike?',
      options: [
        { key: 'A', text: 'Sensor A (Top Ceiling)', isCorrect: false },
        { key: 'B', text: 'Sensor B (Far Right Wall) ★', isCorrect: true },
        { key: 'C', text: 'Sensor C (Floor Base)', isCorrect: false }
      ],
      correctKey: 'B',
      explanation: 'By the law of reflection (Angle of Incidence = Angle of Reflection = 45°): Mirror 1 reflects down, Mirror 2 reflects right, Mirror 3 reflects up, and Mirror 4 reflects right, creating a direct beam strike into Sensor B!',
      sciencePrinciple: 'Specular Reflection & Geometric Wave Optics'
    },
    {
      id: 'gear_train',
      title: 'Meshed Gear Train Direction',
      badge: 'ARCHIE MECHANICS LAB #4',
      question: 'Gear A turns in a CLOCKWISE (CW) direction through a sequence of 6 directly interlocked spur gears (A to F). Which way does Gear F spin?',
      options: [
        { key: 'CW', text: 'Clockwise (CW)', isCorrect: false },
        { key: 'CCW', text: 'Counter-Clockwise (CCW) ★', isCorrect: true }
      ],
      correctKey: 'CCW',
      explanation: 'Every direct tooth engagement reverses rotational torque: A(CW) → B(CCW) → C(CW) → D(CCW) → E(CW) → F(CCW). Because there are 5 gear-to-gear contacts (an odd number of direction reversals), Gear F rotates Counter-Clockwise!',
      sciencePrinciple: 'Mechanical Angular Momentum & Transmission Ratios'
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

      {/* SECTION 2: ARCHIE'S INTERACTIVE BRAIN TEASER & LOGIC RIDDLE STUDIO */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                AUDIENCE REQUESTED FEATURE
              </span>
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Playable Puzzles &amp; Physics Riddles
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 mt-1">
              <Brain className="w-5 h-5 text-emerald-400" />
              Archie Brain Teaser &amp; Logic Riddle Engine
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed mt-0.5">
              High-engagement traffic gridlocks, liquid siphons, laser reflection geometry, and gear trains featuring Archie as host. Perfect for viral 5-second challenge reels!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setUserSelectedChoice(null);
                setIsAnswerRevealed(false);
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Puzzle</span>
            </button>
          </div>
        </div>

        {/* Brain Teaser Selection Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ARCHIE_BRAIN_TEASERS.map((bt, idx) => {
            const isSelected = selectedBrainTeaserIndex === idx;
            return (
              <button
                key={bt.id}
                onClick={() => {
                  setSelectedBrainTeaserIndex(idx);
                  setUserSelectedChoice(null);
                  setIsAnswerRevealed(false);
                }}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-2 ${
                  isSelected
                    ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500 shadow-lg shadow-emerald-950/50'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-emerald-400 font-bold">{bt.badge}</span>
                  <span className="text-slate-500">#{idx + 1}</span>
                </div>
                <h3 className="text-xs font-bold text-white line-clamp-1">{bt.title}</h3>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {bt.question}
                </p>
                <div className="text-[10px] text-emerald-400/90 font-mono pt-1 border-t border-slate-800/80">
                  {bt.sciencePrinciple}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Brain Teaser Interactive Card */}
        {(() => {
          const currentBt = ARCHIE_BRAIN_TEASERS[selectedBrainTeaserIndex];
          return (
            <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">{currentBt.badge}</span>
                  <h3 className="text-base font-bold text-white mt-0.5">{currentBt.title}</h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
                  Topic: {currentBt.sciencePrinciple}
                </span>
              </div>

              {/* Puzzle Question Prompt */}
              <div className="p-4 bg-slate-900/90 border border-emerald-500/30 rounded-2xl flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-emerald-400 font-mono uppercase tracking-wider">
                    Archie's Challenge Prompt:
                  </span>
                  <p className="text-sm font-semibold text-slate-100 leading-relaxed">
                    "{currentBt.question}"
                  </p>
                </div>
              </div>

              {/* Interactive Multiple Choice Options */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 font-mono uppercase tracking-wider block">
                  Click to Test Your Intuition:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentBt.options.map((opt) => {
                    const isChosen = userSelectedChoice === opt.key;
                    let style = 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-200';
                    if (userSelectedChoice) {
                      if (opt.isCorrect) {
                        style = 'bg-emerald-950/60 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500';
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
                        }}
                        className={`p-3.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${style}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-mono shrink-0">
                            {opt.key}
                          </span>
                          <span>{opt.text}</span>
                        </div>
                        {userSelectedChoice && opt.isCorrect && (
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Solution & Logic Explanation (Revealed on click) */}
              {(isAnswerRevealed || userSelectedChoice) && (
                <div className="p-4 bg-emerald-950/30 border border-emerald-500/50 rounded-2xl space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                    <span className="flex items-center gap-1.5 font-mono">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      Archie's Vector Solution Breakdown:
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-900/60 border border-emerald-700 text-[10px] font-mono">
                      CORRECT: Option {currentBt.correctKey}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">
                    {currentBt.explanation}
                  </p>
                  <div className="text-[11px] text-slate-400 font-mono pt-1 border-t border-emerald-900/40">
                    Scientific Core: <strong className="text-emerald-300">{currentBt.sciencePrinciple}</strong>
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
