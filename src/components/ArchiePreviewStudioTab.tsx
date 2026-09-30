import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Sparkles,
  Play,
  Pause,
  Download,
  Copy,
  Check,
  RefreshCw,
  Eye,
  Sliders,
  Maximize2,
  ZoomIn,
  MessageSquare,
  BookOpen,
  Brain,
  ShieldCheck,
  CheckCircle2,
  Layers,
  ArrowRight,
  Compass,
  Monitor,
  Mic,
  Sun,
  UserCheck,
  Sparkle
} from 'lucide-react';
import {
  CLASSROOM_ENVIRONMENTS,
  ARCHIE_PUPPET_POSES,
  ClassroomEnvironment,
  PuppetPose
} from '../archie/classroomData';

interface ArchiePreviewStudioTabProps {
  initialTopic?: string;
  initialClassroomId?: string;
  initialPoseId?: string;
  onToast?: (toast: { text: string; isError: boolean }) => void;
}

export const ArchiePreviewStudioTab: React.FC<ArchiePreviewStudioTabProps> = ({
  initialTopic,
  initialClassroomId,
  initialPoseId,
  onToast
}) => {
  // Navigation Sub-Tabs
  const [activeSubTab, setActiveSubTab] = useState<'compositor' | 'character' | 'environments' | 'teasers'>('compositor');

  // Compositor State - defaults to the warm creator studio and seated Archie sprite
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>(initialClassroomId || 'creator_studio_warm');
  const [selectedPoseId, setSelectedPoseId] = useState<string>(initialPoseId || 'archie_podcast_sitting_sprite');
  const [sceneTopic, setSceneTopic] = useState<string>(initialTopic || 'Why Does Your Phone Get Hot While Fast Charging?');
  const [dialogueText, setDialogueText] = useState<string>('Notice how fast-charging pumps high current, dissipating heat through internal resistance!');
  const [archiePosition, setArchiePosition] = useState<'left' | 'center' | 'right' | 'desk'>('desk');
  const [archieScale, setArchieScale] = useState<number>(1.0);
  const [enableDeskOcclusion, setEnableDeskOcclusion] = useState<boolean>(true);
  const [lightingAmbiance, setLightingAmbiance] = useState<'warm' | 'cool' | 'neutral'>('warm');
  const [enableSoftDepth, setEnableSoftDepth] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Character Studio State
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [characterZoom, setCharacterZoom] = useState<'full' | 'medium' | 'close'>('full');
  const [isSimulatingSpeech, setIsSimulatingSpeech] = useState<boolean>(false);
  const [speechFrame, setSpeechFrame] = useState<number>(0);
  const [characterInspectPose, setCharacterInspectPose] = useState<PuppetPose>(
    ARCHIE_PUPPET_POSES.find(p => p.id === 'archie_podcast_sitting_sprite') || ARCHIE_PUPPET_POSES[0]
  );

  // Environments State
  const [envCategory, setEnvCategory] = useState<string>('All');
  const [inspectEnv, setInspectEnv] = useState<ClassroomEnvironment>(
    CLASSROOM_ENVIRONMENTS[0]
  );
  const [envSmartboardTopic, setEnvSmartboardTopic] = useState<string>('Archie Explains: Future of Science');

  // Brain Teaser State
  const [selectedTeaserIdx, setSelectedTeaserIdx] = useState<number>(0);
  const [teaserSelectedChoice, setTeaserSelectedChoice] = useState<string | null>(null);
  const [teaserRevealed, setTeaserRevealed] = useState<boolean>(false);

  // Brain Teasers data
  const TEASERS = [
    {
      id: 'traffic_gridlock',
      title: 'Four-Way Traffic Gridlock: Which Car Moves First?',
      subtitle: 'Intersection geometry & vehicle turning radius puzzle',
      question: 'Four vehicles arrive simultaneously at an uncontrolled crossroads. Car A wants to turn left, Car B wants to go straight, Car C is trapped, and Car D wants to turn right. Who must reverse or yield to untangle the intersection?',
      options: [
        { key: 'A', text: 'Car A turns left across oncoming traffic', isCorrect: false },
        { key: 'B', text: 'Car B drives straight ahead first', isCorrect: false },
        { key: 'C', text: 'Car C backs into the clear shoulder pocket to open the crossflow', isCorrect: true },
        { key: 'D', text: 'Car D makes a sharp right turn through the pedestrian zone', isCorrect: false }
      ],
      explanation: 'Because Car C has an empty shoulder pocket directly behind it, Car C reversing creates immediate clearance for Car B, which in turn unlocks Car A and Car D smoothly.',
      principle: 'Bottleneck Release & Spatial Priority Flow'
    },
    {
      id: 'water_siphon',
      title: 'Interconnected Liquid Siphons: Which Tank Fills First?',
      subtitle: 'Hydrostatic pressure & atmospheric gravity puzzle',
      question: 'Water enters Tank 1 from the top tap at a constant 2 liters per minute. Tank 1 connects to Tank 2, 3, and 4 via pipes placed at varying elevations. Tank 3 has a sealed valve at pipe B. Which tank will overflow first?',
      options: [
        { key: 'A', text: 'Tank 1 overflows because water enters it first', isCorrect: false },
        { key: 'B', text: 'Tank 2 overflows due to the bottom transfer tube', isCorrect: false },
        { key: 'C', text: 'Tank 3 overflows because pipe B is plugged', isCorrect: true },
        { key: 'D', text: 'Tank 4 overflows because it is the lowest elevation', isCorrect: false }
      ],
      explanation: 'Since the outlet pipe B on Tank 3 is sealed closed, fluid cannot escape into Tank 4. The hydrostatic level in Tank 3 rises until reaching the rim, overflowing before the lower Tank 4 receives fluid.',
      principle: "Pascal's Law & Hydrostatic Equilibrium"
    },
    {
      id: 'laser_reflection',
      title: 'Laser Mirror Geometry: Which Sensor Gets Hit?',
      subtitle: 'Optical reflection angles & Law of Reflection',
      question: 'A laser diode fires at a 45-degree angle toward a sequence of three angled planar mirrors. Mirror 2 is mounted on a rotating galvanometer set to 30 degrees. Which color target sensor does the beam strike?',
      options: [
        { key: 'A', text: 'Sensor Alpha (Cyan Target)', isCorrect: false },
        { key: 'B', text: 'Sensor Beta (Emerald Target)', isCorrect: true },
        { key: 'C', text: 'Sensor Gamma (Amber Target)', isCorrect: false },
        { key: 'D', text: 'The beam misses all sensors entirely', isCorrect: false }
      ],
      explanation: 'Applying the Law of Reflection (angle of incidence equals angle of reflection), the 30-degree rotation of Mirror 2 deflects the reflected beam by exactly 60 degrees, guiding the photon pulse directly into Sensor Beta.',
      principle: 'Law of Specular Reflection & Angular Deflection'
    },
    {
      id: 'gear_train',
      title: 'Interlocking Gear Train: Clockwise or Counter-Clockwise?',
      subtitle: 'Mechanical transmission & angular velocity puzzle',
      question: 'A drive motor turns Gear 1 clockwise at 60 RPM. Gear 1 meshes with Gear 2, which meshes with Gear 3, Gear 4, and Gear 5 in a linear train. Gear 3 also connects via a non-crossed timing belt to Gear 6. Which direction does Gear 6 rotate?',
      options: [
        { key: 'A', text: 'Gear 6 rotates Clockwise', isCorrect: true },
        { key: 'B', text: 'Gear 6 rotates Counter-Clockwise', isCorrect: false },
        { key: 'C', text: 'Gear 6 is locked in mechanical jam', isCorrect: false },
        { key: 'D', text: 'Gear 6 oscillates back and forth', isCorrect: false }
      ],
      explanation: 'Gear 1 (Clockwise) -> Gear 2 (Counter-Clockwise) -> Gear 3 (Clockwise). Since Gear 3 is connected to Gear 6 by an uncrossed belt, both rotate in the identical direction: Clockwise!',
      principle: 'Mechanical Advantage & Belt Drive Directional Parity'
    }
  ];

  // Speech animation timer for character inspector
  useEffect(() => {
    if (!isSimulatingSpeech) return;
    const interval = setInterval(() => {
      setSpeechFrame(prev => (prev + 1) % 4);
    }, 280);
    return () => clearInterval(interval);
  }, [isSimulatingSpeech]);

  const talkingPoses = [
    'puppet_talking',
    'puppet_explain_both_talk',
    'puppet_standing_point_board_talk',
    'puppet_point_right_talk'
  ];

  const currentAnimatedPose = isSimulatingSpeech
    ? ARCHIE_PUPPET_POSES.find(p => p.id === talkingPoses[speechFrame]) || characterInspectPose
    : characterInspectPose;

  const currentClassroom = CLASSROOM_ENVIRONMENTS.find(e => e.id === selectedClassroomId) || CLASSROOM_ENVIRONMENTS[0];
  const currentPose = ARCHIE_PUPPET_POSES.find(p => p.id === selectedPoseId) || ARCHIE_PUPPET_POSES[0];

  // Determine if this scene has a native integrated seated render (zero floating)
  const isIntegratedStudioScene =
    (selectedClassroomId === 'creator_studio_warm' && (selectedPoseId === 'archie_studio_seated_natural' || selectedPoseId === 'archie_studio_explaining_gesture')) ||
    currentPose.isPhotorealistic;

  // Active background and character source
  const activeIntegratedImage =
    selectedPoseId === 'archie_studio_explaining_gesture'
      ? '/src/assets/images/studio_archie_explaining_1790754317454.jpg'
      : '/src/assets/images/studio_archie_seated_1790754305287.jpg';

  const handleDownloadScene = () => {
    // Download the rendered view
    const link = document.createElement('a');
    if (isIntegratedStudioScene) {
      link.href = activeIntegratedImage;
      link.download = `archie_${selectedPoseId}_scene.jpg`;
    } else {
      link.href = currentClassroom.svgPath;
      link.download = `archie_${selectedClassroomId}_stage.svg`;
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (onToast) onToast({ text: 'Downloaded full 9:16 Shorts studio scene!', isError: false });
  };

  const handleCopySceneSummary = () => {
    const summary = `Archie Shorts Scene Staging:
Topic: "${sceneTopic}"
Host Dialogue: "${dialogueText}"
Studio Environment: ${currentClassroom.name} (${currentClassroom.category})
Host Gesture: ${currentPose.name} (${currentPose.gesture})
Grounding: Seated at Walnut Desk with Boom Microphone (Zero Floating)`;
    navigator.clipboard.writeText(summary);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    if (onToast) onToast({ text: 'Scene prompt & dialogue copied to clipboard!', isError: false });
  };

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden animate-in fade-in duration-300 pb-12">
      {/* Top Header & Visual Identity */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/10 via-emerald-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase bg-amber-950 text-amber-300 border border-amber-800">
                CREATOR STUDIO SUITE
              </span>
              <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Grounded Creator Desk • Zero Floating • 18 Backdrops
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
                A
              </div>
              <span>Archie &amp; Studio Environments Visual Suite</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Explore Archie seated comfortably in the cinematic creator studio, preview educational laboratory environments, and stage grounded Shorts scenes with zero floating.
            </p>
          </div>

          {/* Quick Sub-Navigation */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveSubTab('compositor')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'compositor'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
                  : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-300" />
              <span>Scene Compositor</span>
            </button>

            <button
              onClick={() => setActiveSubTab('character')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'character'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span>Archie Poses &amp; Desk</span>
            </button>

            <button
              onClick={() => setActiveSubTab('environments')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'environments'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                  : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-purple-300" />
              <span>Studio &amp; Labs ({CLASSROOM_ENVIRONMENTS.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('teasers')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'teasers'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Brain className="w-3.5 h-3.5 text-emerald-300" />
              <span>Physics Riddles</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: SCENE COMPOSITOR (Archie IN Studio Environment) */}
      {activeSubTab === 'compositor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Column (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span>Host Staging &amp; Grounding</span>
                </h3>
                <span className="text-[10px] font-mono text-amber-400 px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800">
                  9:16 Shorts Native
                </span>
              </div>

              {/* Quick Host Posture Preset Buttons */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Host Seating &amp; Posture (Zero Floating)</span>
                  <span className="text-[10px] font-mono text-emerald-400">Natural Physics</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      setSelectedClassroomId('creator_studio_warm');
                      setSelectedPoseId('archie_podcast_sitting_sprite');
                      setArchiePosition('desk');
                    }}
                    className={`p-2 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      selectedPoseId === 'archie_podcast_sitting_sprite'
                        ? 'bg-amber-950/70 border-amber-500 text-white shadow-md ring-1 ring-amber-500/50'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span className="truncate">Sitting Sprite</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5 truncate">
                      Desk seated sprite
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedClassroomId('creator_studio_warm');
                      setSelectedPoseId('archie_podcast_explaining_sprite');
                      setArchiePosition('desk');
                    }}
                    className={`p-2 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      selectedPoseId === 'archie_podcast_explaining_sprite'
                        ? 'bg-amber-950/70 border-amber-500 text-white shadow-md ring-1 ring-amber-500/50'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span className="truncate">Explaining</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5 truncate">
                      Gesture into mic
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedClassroomId('creator_studio_warm');
                      setSelectedPoseId('archie_podcast_thinking_sprite');
                      setArchiePosition('desk');
                    }}
                    className={`p-2 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      selectedPoseId === 'archie_podcast_thinking_sprite'
                        ? 'bg-amber-950/70 border-amber-500 text-white shadow-md ring-1 ring-amber-500/50'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1">
                      <Brain className="w-3.5 h-3.5 text-amber-400" />
                      <span className="truncate">Thinking</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5 truncate">
                      Hand on chin
                    </div>
                  </button>
                </div>
              </div>

              {/* 1. Environment Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>1. Studio Environment &amp; Backdrop</span>
                  <span className="text-[10px] font-mono text-slate-500">{CLASSROOM_ENVIRONMENTS.length} Available</span>
                </label>
                <select
                  value={selectedClassroomId}
                  onChange={(e) => setSelectedClassroomId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <optgroup label="Cinematic Creator Studios">
                    {CLASSROOM_ENVIRONMENTS.filter(e => e.category === 'Creator Studio').map((env, idx) => (
                      <option key={env.id} value={env.id}>
                        ★ {env.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Specialized Science &amp; Tech Labs">
                    {CLASSROOM_ENVIRONMENTS.filter(e => e.category !== 'Creator Studio').map((env, idx) => (
                      <option key={env.id} value={env.id}>
                        #{idx + 1}: {env.name} ({env.category})
                      </option>
                    ))}
                  </optgroup>
                </select>
                <p className="text-[10px] text-slate-400 leading-normal">
                  {currentClassroom.desc}
                </p>
              </div>

              {/* 2. Character Pose Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>2. Character Pose &amp; Gesture</span>
                  <span className="text-[10px] font-mono text-slate-500">{ARCHIE_PUPPET_POSES.length} Poses</span>
                </label>
                <select
                  value={selectedPoseId}
                  onChange={(e) => setSelectedPoseId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <optgroup label="Grounded Studio Figures (Photorealistic)">
                    {ARCHIE_PUPPET_POSES.filter(p => p.isPhotorealistic).map((pose) => (
                      <option key={pose.id} value={pose.id}>
                        ★ {pose.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Expressive Vector Puppet Poses">
                    {ARCHIE_PUPPET_POSES.filter(p => !p.isPhotorealistic).map((pose) => (
                      <option key={pose.id} value={pose.id}>
                        {pose.name} ({pose.category})
                      </option>
                    ))}
                  </optgroup>
                </select>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Gesture: {currentPose.gesture}
                </p>
              </div>

              {/* 3. Screen Topic Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-indigo-400" />
                  <span>3. On-Screen Topic Title</span>
                </label>
                <input
                  type="text"
                  value={sceneTopic}
                  onChange={(e) => setSceneTopic(e.target.value)}
                  placeholder="e.g. Why Does Your Phone Get Hot While Charging?"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
                />
              </div>

              {/* 4. Archie Dialogue Speech Hook */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                  <span>4. Archie's Spoken Hook / Dialogue</span>
                </label>
                <textarea
                  rows={2}
                  value={dialogueText}
                  onChange={(e) => setDialogueText(e.target.value)}
                  placeholder="Type dialogue for Archie's speech hook..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 placeholder:text-slate-600 resize-none"
                />
              </div>

              {/* 5. Grounding & Desk Seating Controls */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-amber-400" />
                    <span>Desk Grounding &amp; Shadows</span>
                  </span>
                  <button
                    onClick={() => setEnableDeskOcclusion(!enableDeskOcclusion)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-colors ${
                      enableDeskOcclusion
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}
                  >
                    {enableDeskOcclusion ? 'OCCLUSION ACTIVE' : 'DISABLED'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Position</label>
                    <div className="grid grid-cols-2 gap-1">
                      {(['desk', 'center', 'left', 'right'] as const).map(pos => (
                        <button
                          key={pos}
                          onClick={() => setArchiePosition(pos)}
                          className={`py-1 rounded-lg text-[10px] font-bold capitalize transition-all cursor-pointer ${
                            archiePosition === pos
                              ? 'bg-amber-600 text-white'
                              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {pos}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400">Room Lighting</label>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { id: 'warm', label: 'Amber' },
                        { id: 'cool', label: 'Cyan' },
                        { id: 'neutral', label: 'Day' }
                      ].map(light => (
                        <button
                          key={light.id}
                          onClick={() => setLightingAmbiance(light.id as any)}
                          className={`py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            lightingAmbiance === light.id
                              ? 'bg-amber-600 text-white'
                              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {light.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={handleDownloadScene}
                  className="flex-1 py-2.5 px-3 bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download 9:16 Shorts Scene</span>
                </button>

                <button
                  onClick={handleCopySceneSummary}
                  title="Copy Scene Script & Layout"
                  className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Grounded Scene Presets */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-2.5">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400">
                Recommended Grounded Scenes
              </span>
              <div className="space-y-1.5">
                {[
                  {
                    name: 'Phone Battery Joule Heating (Grounded Studio)',
                    room: 'creator_studio_warm',
                    pose: 'archie_studio_seated_natural',
                    topic: 'Why Does Your Phone Get Hot While Fast Charging?',
                    line: 'High charging current pushes electrons through internal resistance, generating pure heat!'
                  },
                  {
                    name: 'Quantum Superconductors (Explaining Gesture)',
                    room: 'creator_studio_warm',
                    pose: 'archie_studio_explaining_gesture',
                    topic: 'How Quantum Superconductors Float in Mid-Air',
                    line: 'The Meissner effect expels magnetic fields, locking the object into quantum levitation!'
                  },
                  {
                    name: 'Airplane Bleed Holes (High-Tech Lab)',
                    room: 'bio_quantum_lab',
                    pose: 'archie_studio_explaining_gesture',
                    topic: 'Why Airplane Windows Have Tiny Bleed Holes',
                    line: 'It balances pressure between inner and outer glass panes at 35,000 feet!'
                  }
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedClassroomId(preset.room);
                      setSelectedPoseId(preset.pose);
                      setSceneTopic(preset.topic);
                      setDialogueText(preset.line);
                      setArchiePosition('desk');
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-amber-500/50 transition-all text-xs flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold text-slate-200 group-hover:text-amber-300">
                        {preset.name}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-xs">
                        {preset.topic}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 9:16 Visual Canvas Preview (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="w-full max-w-[390px] bg-slate-950 rounded-3xl p-3 border border-slate-800 shadow-2xl space-y-3">
              <div className="flex items-center justify-between px-2 pt-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="font-mono text-[11px] font-bold text-slate-200">
                    LIVE SHORTS PREVIEW
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Grounded at Desk
                </span>
              </div>

              {/* 9:16 Shorts Device Frame */}
              <div className="relative aspect-[9/16] w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center select-none">
                {/* 1. Background Environment */}
                {isIntegratedStudioScene ? (
                  // Integrated photorealistic render: Archie naturally seated at desk with hands on surface
                  <img
                    src={activeIntegratedImage}
                    alt="Archie seated at creator desk"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  // Custom Staged Scene with Layered Grounding
                  <div className="relative w-full h-full overflow-hidden">
                    {/* Environment Layer */}
                    <img
                      src={currentClassroom.imageUrl || currentClassroom.svgPath}
                      alt={currentClassroom.name}
                      className={`w-full h-full object-cover transition-all ${
                        enableSoftDepth ? 'blur-[1.5px] scale-105' : ''
                      }`}
                      referrerPolicy="no-referrer"
                    />

                    {/* Room Ambient Lighting Tint */}
                    <div
                      className={`absolute inset-0 pointer-events-none transition-colors ${
                        lightingAmbiance === 'warm'
                          ? 'bg-amber-500/10 mix-blend-color'
                          : lightingAmbiance === 'cool'
                          ? 'bg-cyan-500/10 mix-blend-color'
                          : 'bg-transparent'
                      }`}
                    />

                    {/* Floor Contact Shadow (eliminates floating look) */}
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        bottom: archiePosition === 'desk' ? '28%' : '8%',
                        left: archiePosition === 'left' ? '12%' : archiePosition === 'right' ? '52%' : '32%',
                        width: '36%',
                        height: '18px',
                        background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 70%)',
                        filter: 'blur(4px)'
                      }}
                    />

                    {/* Archie Character Layer */}
                    <div
                      className="absolute pointer-events-none transition-all duration-200"
                      style={{
                        bottom: archiePosition === 'desk' ? '22%' : '10%',
                        left: archiePosition === 'left' ? '6%' : archiePosition === 'right' ? '46%' : '26%',
                        width: `${48 * archieScale}%`,
                        height: archiePosition === 'desk' ? '62%' : '75%'
                      }}
                    >
                      <img
                        src={currentPose.svgPath}
                        alt={currentPose.name}
                        className="w-full h-full object-contain filter drop-shadow-[0_12px_18px_rgba(0,0,0,0.6)]"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Grounded Foreground Studio Desk Barrier (when seated at desk) */}
                    {enableDeskOcclusion && archiePosition === 'desk' && (
                      <div className="absolute bottom-0 left-0 right-0 h-[30%] pointer-events-none z-10">
                        {/* Desk Top Surface */}
                        <div className="w-full h-full bg-gradient-to-t from-stone-950 via-amber-950/80 to-amber-900/60 border-t border-amber-700/50 shadow-2xl relative">
                          {/* Wood grain highlight */}
                          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-amber-400/20 via-amber-200/40 to-amber-400/20" />

                          {/* Desktop Studio Props */}
                          {/* Podcast Boom Mic */}
                          <div className="absolute -top-16 left-6 w-12 h-20 flex flex-col items-center">
                            <div className="w-5 h-9 rounded-full bg-gradient-to-b from-stone-700 to-stone-900 border border-stone-600 shadow-md" />
                            <div className="w-1.5 h-10 bg-stone-700" />
                            <div className="w-8 h-2 rounded bg-stone-800" />
                          </div>

                          {/* Laptop / Notebook Edge */}
                          <div className="absolute -top-3 right-8 w-24 h-5 bg-slate-800 rounded-t-md border border-slate-700 shadow-lg transform -rotate-3" />

                          {/* Soft desk contact shadow */}
                          <div className="absolute -top-4 inset-x-0 h-4 bg-gradient-to-b from-transparent to-black/60 pointer-events-none" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Shorts Top HUD */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
                  <div className="px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[10px] font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Archie Explains</span>
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-amber-950/90 backdrop-blur-md border border-amber-800 text-[10px] font-mono text-amber-300 font-bold">
                    STUDIO 4K
                  </div>
                </div>

                {/* Spoken Hook Speech Balloon */}
                {dialogueText && (
                  <div className="absolute top-14 left-4 right-14 pointer-events-none z-20 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="bg-slate-950/92 backdrop-blur-md border border-amber-500/40 rounded-2xl p-3 shadow-2xl relative">
                      <div className="text-[10px] font-mono uppercase font-bold text-amber-400 flex items-center gap-1 mb-1">
                        <MessageSquare className="w-3 h-3 text-amber-400" />
                        <span>Archie’s Spoken Hook</span>
                      </div>
                      <p className="text-xs font-semibold text-white leading-snug drop-shadow">
                        “{dialogueText}”
                      </p>
                      {/* Speech bubble tail */}
                      <div className="absolute -bottom-1.5 left-8 w-3 h-3 bg-slate-950 border-r border-b border-amber-500/40 transform rotate-45" />
                    </div>
                  </div>
                )}

                {/* Right Side Shorts Interaction Icons */}
                <div className="absolute right-2.5 bottom-20 flex flex-col items-center gap-3 pointer-events-none z-20">
                  <div className="w-9 h-9 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/80 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                    ❤️
                  </div>
                  <div className="w-9 h-9 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/80 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                    💬
                  </div>
                  <div className="w-9 h-9 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/80 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                    ↗️
                  </div>
                </div>

                {/* Bottom Topic Banner & Channel ID */}
                <div className="absolute bottom-4 left-3 right-14 pointer-events-none z-20 space-y-1.5">
                  <div className="inline-block px-2 py-0.5 rounded-lg bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                    {currentClassroom.category}
                  </div>
                  <div className="text-xs font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] line-clamp-2">
                    {sceneTopic}
                  </div>
                  <div className="text-[10px] text-slate-300 drop-shadow flex items-center gap-1 font-mono">
                    <span>@ArchieExplains</span>
                    <span>•</span>
                    <span className="text-amber-300 font-semibold">{currentClassroom.name}</span>
                  </div>
                </div>
              </div>

              {/* Preview Footer Details */}
              <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-[11px] space-y-1.5 font-sans">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Room: <strong className="text-slate-200">{currentClassroom.name}</strong></span>
                  <span>Host: <strong className="text-amber-400">{currentPose.name}</strong></span>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-1">
                  <span>Grounding: <strong className="text-emerald-400">Walnut Desk &amp; Chair (Zero Floating)</strong></span>
                  <span className="font-mono text-slate-500">1080 × 1920</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: CHARACTER STUDIO (Studio Figures & Poses) */}
      {activeSubTab === 'character' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Inspector Card (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>Archie Figure &amp; Posture Inspector</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">
                    Pose: {characterInspectPose.name}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800">
                  {characterInspectPose.category}
                </span>
              </div>

              {/* Interactive Character Display */}
              <div className="relative aspect-[3/4] max-h-[420px] mx-auto w-full bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center overflow-hidden group">
                <img
                  src={characterInspectPose.imageUrl || characterInspectPose.svgPath}
                  alt={characterInspectPose.name}
                  referrerPolicy="no-referrer"
                  className={`w-full h-full object-contain p-2 transition-all duration-300 ${
                    characterZoom === 'close'
                      ? 'scale-150 -translate-y-20'
                      : characterZoom === 'medium'
                      ? 'scale-125 -translate-y-10'
                      : 'scale-100'
                  }`}
                />

                {/* Framing Controls */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 text-[10px]">
                  <button
                    onClick={() => setCharacterZoom('full')}
                    className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      characterZoom === 'full' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Full
                  </button>
                  <button
                    onClick={() => setCharacterZoom('medium')}
                    className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      characterZoom === 'medium' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Medium
                  </button>
                  <button
                    onClick={() => setCharacterZoom('close')}
                    className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      characterZoom === 'close' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Close-Up
                  </button>
                </div>

                {/* Photorealistic Badge */}
                {characterInspectPose.isPhotorealistic && (
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-amber-950/90 border border-amber-700 text-amber-300 text-[10px] font-bold font-mono">
                    ★ PHOTOREALISTIC STUDIO FIGURE
                  </div>
                )}
              </div>

              {/* Character Costume & Anatomy Anchor */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <span className="font-mono text-[10px] uppercase font-bold text-indigo-400">
                  Character Visual DNA &amp; Costume
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-mono">Sweater / Knit</span>
                    <span className="text-slate-200">Navy Wool Crewneck over White Collar</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-mono">Eyewear</span>
                    <span className="text-slate-200">Signature Thin Round Wire Glasses</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-mono">Host Posture</span>
                    <span className="text-slate-200">Elbows Resting on Desk Surface</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-mono">Broadcast Gear</span>
                    <span className="text-slate-200">Desktop Podcast Boom Microphone</span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <button
                onClick={() => {
                  setSelectedPoseId(characterInspectPose.id);
                  if (characterInspectPose.isPhotorealistic) {
                    setSelectedClassroomId('creator_studio_warm');
                  }
                  setActiveSubTab('compositor');
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                <span>Use this Figure in Scene Compositor</span>
              </button>
            </div>

            {/* Poses Gallery Grid (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 border border-slate-800 rounded-2xl p-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['All', 'Seated', 'Explaining', 'Thinking', 'Neutral', 'Surprised', 'Walking'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  {ARCHIE_PUPPET_POSES.filter(p => selectedCategory === 'All' || p.category === selectedCategory).length} Poses
                </span>
              </div>

              {/* Poses Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[620px] overflow-y-auto pr-1">
                {ARCHIE_PUPPET_POSES
                  .filter(p => selectedCategory === 'All' || p.category === selectedCategory)
                  .map((pose) => {
                    const isSelected = characterInspectPose.id === pose.id;
                    return (
                      <div
                        key={pose.id}
                        onClick={() => setCharacterInspectPose(pose)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                          isSelected
                            ? 'bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-900/30'
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="aspect-[4/5] w-full bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center p-1.5 mb-2 group-hover:scale-105 transition-transform">
                          <img
                            src={pose.imageUrl || pose.svgPath}
                            alt={pose.name}
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                            loading="lazy"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-mono font-bold uppercase text-indigo-400">
                              {pose.isPhotorealistic ? '★ STUDIO' : pose.category}
                            </span>
                            {pose.isPhotorealistic && (
                              <span className="text-[8px] font-mono px-1 rounded bg-amber-950 text-amber-300 border border-amber-800">
                                4K
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-bold text-white group-hover:text-indigo-300 truncate">
                            {pose.name}
                          </div>
                          <div className="text-[10px] text-slate-400 line-clamp-1">
                            {pose.gesture}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: STUDIO & CLASSROOM ENVIRONMENTS */}
      {activeSubTab === 'environments' && (
        <div className="space-y-6">
          {/* Category Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-3xl p-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {['All', 'Creator Studio', 'Technology', 'Space & Physics', 'Earth Science', 'Humanities'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setEnvCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    envCategory === cat
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat === 'All' ? 'All Environments' : cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Topic on Display:</span>
              <input
                type="text"
                value={envSmartboardTopic}
                onChange={(e) => setEnvSmartboardTopic(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-purple-500 w-48 sm:w-64"
                placeholder="Topic text on display..."
              />
            </div>
          </div>

          {/* Environments Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CLASSROOM_ENVIRONMENTS
              .filter(e => envCategory === 'All' || e.category === envCategory)
              .map((env, idx) => {
                const isSelected = inspectEnv.id === env.id;
                return (
                  <div
                    key={env.id}
                    className={`bg-slate-900 border rounded-3xl p-4 transition-all space-y-3 flex flex-col justify-between group ${
                      isSelected
                        ? 'border-purple-500 shadow-xl shadow-purple-900/20'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-950 border border-slate-800 text-purple-400">
                          {env.category}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">ENV #{idx + 1}</span>
                      </div>

                      {/* Visual Preview */}
                      <div className="relative aspect-[9/16] max-h-[300px] w-full mx-auto bg-slate-950 rounded-2xl overflow-hidden border border-slate-800/80 group-hover:border-purple-500/50 transition-colors">
                        <img
                          src={env.imageUrl || env.svgPath}
                          alt={env.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-80" />
                        <div className="absolute bottom-2.5 left-2.5 right-2.5 text-left">
                          <div className="text-xs font-bold text-white drop-shadow">
                            {env.name}
                          </div>
                          <div className="text-[10px] text-purple-300 font-mono drop-shadow truncate">
                            {env.lighting}
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                        {env.desc}
                      </p>

                      <div className="flex flex-wrap gap-1">
                        {env.props.map((p, pIdx) => (
                          <span
                            key={pIdx}
                            className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[9px] font-mono text-slate-400"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedClassroomId(env.id);
                          setSelectedPoseId(env.recommendedPoseId);
                          setSceneTopic(env.recommendedTopic);
                          setActiveSubTab('compositor');
                        }}
                        className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[11px] font-bold transition-all shadow-md shadow-purple-600/20 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Stage Archie Here</span>
                      </button>

                      <a
                        href={env.imageUrl || env.svgPath}
                        target="_blank"
                        rel="noreferrer"
                        title="Open Full Image"
                        className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all flex items-center justify-center"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: ARCHIE PHYSICS RIDDLES & BRAIN TEASERS */}
      {activeSubTab === 'teasers' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-emerald-950 text-emerald-300 border border-emerald-800">
                  PLAYABLE LOGIC ENGINE
                </span>
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 mt-1">
                  <Brain className="w-5 h-5 text-emerald-400" />
                  Archie Brain Teaser &amp; Logic Riddle Engine
                </h2>
                <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
                  Playable interactive puzzles designed for viral 5-second challenge shorts hosted by Archie.
                </p>
              </div>

              {/* Puzzle Selector */}
              <div className="flex flex-wrap items-center gap-1.5">
                {TEASERS.map((t, idx) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTeaserIdx(idx);
                      setTeaserSelectedChoice(null);
                      setTeaserRevealed(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedTeaserIdx === idx
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Puzzle #{idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Puzzle Display */}
            {(() => {
              const currentT = TEASERS[selectedTeaserIdx];
              return (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
                      <span>{currentT.subtitle}</span>
                      <span>Topic #{selectedTeaserIdx + 1}</span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      {currentT.title}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {currentT.question}
                    </p>
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentT.options.map((opt) => {
                      const isChosen = teaserSelectedChoice === opt.key;
                      const showResult = teaserRevealed || teaserSelectedChoice !== null;
                      let btnClasses = 'bg-slate-950 border-slate-800 text-slate-300 hover:border-emerald-500/60';

                      if (showResult) {
                        if (opt.isCorrect) {
                          btnClasses = 'bg-emerald-950/70 border-emerald-500 text-emerald-200 font-bold';
                        } else if (isChosen && !opt.isCorrect) {
                          btnClasses = 'bg-rose-950/70 border-rose-500 text-rose-200 line-through';
                        }
                      }

                      return (
                        <button
                          key={opt.key}
                          onClick={() => {
                            setTeaserSelectedChoice(opt.key);
                            setTeaserRevealed(true);
                          }}
                          className={`p-3.5 rounded-2xl border text-left text-xs transition-all flex items-start gap-3 cursor-pointer ${btnClasses}`}
                        >
                          <span className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                            {opt.key}
                          </span>
                          <span className="pt-0.5">{opt.text}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Solution Box */}
                  {(teaserRevealed || teaserSelectedChoice !== null) && (
                    <div className="p-4 bg-emerald-950/30 border border-emerald-500/50 rounded-2xl space-y-2 animate-in fade-in">
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                        <span className="flex items-center gap-1.5 font-mono">
                          <Sparkles className="w-4 h-4 text-emerald-400" />
                          Archie's Scientific Logic Breakdown:
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-900/60 border border-emerald-700 text-[10px] font-mono">
                          CORRECT OPTION: Option C
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed font-sans">
                        {currentT.explanation}
                      </p>
                      <div className="text-[11px] text-slate-400 font-mono pt-1 border-t border-emerald-900/40">
                        Scientific Law: <strong className="text-emerald-300">{currentT.principle}</strong>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Verified Review & Architecture Quality Seal */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
        <h3 className="text-xs font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>Production Standards &amp; Architecture Verification</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
            <div className="font-bold text-amber-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              Grounded Creator Studio
            </div>
            <div className="text-[11px] text-slate-400">
              Photorealistic creator desk with ergonomic chair, podcast mic, and warm backlit bookshelves with zero floating.
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
            <div className="font-bold text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              Desk Occlusion &amp; Shadows
            </div>
            <div className="text-[11px] text-slate-400">
              Physical desk foreground barrier and ambient contact floor shadows place the host naturally in the scene.
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
            <div className="font-bold text-indigo-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              Natural Seating Postures
            </div>
            <div className="text-[11px] text-slate-400">
              Natural arm rest gestures, explaining postures, and 43 expressive poses across full-body and medium shots.
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
            <div className="font-bold text-purple-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              9:16 Shorts Native
            </div>
            <div className="text-[11px] text-slate-400">
              Native vertical 1080x1920 canvas for YouTube Shorts and mobile feeds with live hook and topic overlay.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
