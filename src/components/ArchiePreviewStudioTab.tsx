import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Play,
  Pause,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  MessageSquare,
  BookOpen,
  ShieldCheck,
  CheckCircle2,
  Tv,
  ExternalLink,
  Zap,
  HelpCircle,
  Volume2,
  VolumeX,
  Music,
  UserCheck,
  Search,
  Monitor
} from 'lucide-react';
import {
  CLASSROOM_ENVIRONMENTS,
  ARCHIE_PUPPET_POSES,
  ClassroomEnvironment,
  PuppetPose
} from '../archie/classroomData';
import {
  fetchLiveTrends,
  deduplicateTopics,
  elaborateTopicWithWikiAndDuckDuckGo,
  buildContentCreator5ToolReel,
  TrendingTopicItem,
  ElaboratedTopicReport,
  CreatorToolItem,
  Creator5ToolReelScript
} from '../archie/research/googleTrendsYouTubeProvider';
import { calmPiano } from '../utils/calmPianoSynthesizer';

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
  const [activeSubTab, setActiveSubTab] = useState<'creator-tools' | 'problem-remedy' | 'compositor' | 'character' | 'environments'>('creator-tools');

  // ==========================================
  // 1. Content Creator 5-Tool Countdown State
  // ==========================================
  const [creatorScript, setCreatorScript] = useState<Creator5ToolReelScript>(buildContentCreator5ToolReel());
  const [activeToolStep, setActiveToolStep] = useState<number>(1); // 0=Hook, 1=Tool1, 2=Tool2, 3=Tool3, 4=Tool4, 5=Tool5, 6=CTA
  const [showToolSlamScreen, setShowToolSlamScreen] = useState<boolean>(true);
  const [isAutoPlayingSequence, setIsAutoPlayingSequence] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  // Presenter Sizing: Archie must NOT dominate the whole screen (user requested)
  const [hostScale, setHostScale] = useState<'compact' | 'natural' | 'focus'>('natural'); // compact=38%, natural=44%, focus=50%

  // ==========================================
  // 2. Slow Calm Piano & Adult Voice State
  // ==========================================
  const [isPianoPlaying, setIsPianoPlaying] = useState<boolean>(false);
  const [pianoVolume, setPianoVolume] = useState<number>(0.16);
  const [isSpeakingAdultVoice, setIsSpeakingAdultVoice] = useState<boolean>(false);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      calmPiano.stop();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  const handleTogglePiano = () => {
    if (calmPiano.isPlaying()) {
      calmPiano.stop();
      setIsPianoPlaying(false);
    } else {
      calmPiano.setVolume(pianoVolume);
      calmPiano.play();
      setIsPianoPlaying(true);
      if (onToast) onToast({ text: 'Calm varying piano soundtrack playing (Slow acoustic chords)', isError: false });
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setPianoVolume(newVol);
    calmPiano.setVolume(newVol);
  };

  /**
   * Adult Educator Voice Playback (Measured, confident adult baritone, NOT childish)
   */
  const handleSpeakAdultVoice = (textToSpeak: string) => {
    if (!('speechSynthesis' in window)) {
      if (onToast) onToast({ text: 'Speech synthesis not supported in this browser', isError: true });
      return;
    }

    window.speechSynthesis.cancel();

    if (isSpeakingAdultVoice) {
      setIsSpeakingAdultVoice(false);
      return;
    }

    // Softly start calm piano in background if not already playing
    if (!calmPiano.isPlaying()) {
      calmPiano.setVolume(pianoVolume * 0.7); // duck slightly under speech
      calmPiano.play();
      setIsPianoPlaying(true);
    }

    const clean = textToSpeak.replace(/["“”]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(clean);

    // Adult male educator parameters: measured pace (0.94), lower pitch (0.91)
    utterance.rate = 0.94;
    utterance.pitch = 0.91;

    // Pick mature adult male voice if available
    const voices = window.speechSynthesis.getVoices();
    const adultMaleVoice = voices.find(v => 
      (v.name.includes('Guy') || v.name.includes('Christopher') || v.name.includes('Brian') || v.name.includes('Daniel') || v.name.includes('Male')) &&
      !v.name.includes('Child') && !v.name.includes('Junior')
    ) || voices.find(v => v.lang.startsWith('en')) || null;

    if (adultMaleVoice) utterance.voice = adultMaleVoice;

    utterance.onstart = () => setIsSpeakingAdultVoice(true);
    utterance.onend = () => setIsSpeakingAdultVoice(false);
    utterance.onerror = () => setIsSpeakingAdultVoice(false);

    window.speechSynthesis.speak(utterance);
  };

  // ==========================================
  // 3. Google Trends & YouTube Discovery State
  // ==========================================
  const [isFetchingTrends, setIsFetchingTrends] = useState<boolean>(false);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopicItem[]>([
    {
      id: 'trend-creator-1',
      topic: '5 Free Tools Every Content Creator Needs in 2026',
      source: 'creator_trend',
      searchQuery: 'free tools content creators',
      category: 'creator_tools',
      isDuplicate: false,
      similarityScore: 0
    },
    {
      id: 'trend-yt-2',
      topic: 'Why Phone Charges to 80% Fast, but the Last 20% Takes Forever',
      source: 'youtube_suggest',
      searchQuery: 'why phone battery charges slow after 80',
      category: 'everyday_science',
      isDuplicate: false,
      similarityScore: 4
    },
    {
      id: 'trend-yt-3',
      topic: 'How to Remove 100% of Room Echo & Fan Noise From Phone Audio Free',
      source: 'software_remedy',
      searchQuery: 'remove audio room echo background noise free',
      category: 'software_remedy',
      isDuplicate: false,
      similarityScore: 6
    },
    {
      id: 'trend-yt-4',
      topic: 'Stop Paying $20/Month for Photoshop: Secret In-Browser Tool',
      source: 'software_remedy',
      searchQuery: 'free photoshop alternative browser photopea',
      category: 'software_remedy',
      isDuplicate: false,
      similarityScore: 3
    },
    {
      id: 'trend-yt-5',
      topic: 'Why Airplane Windows Have a Tiny Hole at the Bottom',
      source: 'everyday_science',
      searchQuery: 'why airplane windows have tiny holes',
      category: 'everyday_science',
      isDuplicate: false,
      similarityScore: 2
    },
    {
      id: 'trend-yt-6',
      topic: "What Actually Happens When You Click 'Delete Photo'?",
      source: 'everyday_science',
      searchQuery: 'what happens when you delete photo flash storage',
      category: 'everyday_science',
      isDuplicate: false,
      similarityScore: 5
    }
  ]);
  const [selectedTrendTopic, setSelectedTrendTopic] = useState<string>('5 Free Tools Every Content Creator Needs in 2026');

  // ==========================================
  // 4. Problem -> Plain English -> Free Remedy State
  // ==========================================
  const [problemQuery, setProblemQuery] = useState<string>('Why Phone Charges to 80% Fast, but the Last 20% Takes Forever');
  const [isElaborating, setIsElaborating] = useState<boolean>(false);
  const [elaboratedReport, setElaboratedReport] = useState<ElaboratedTopicReport | null>({
    topic: 'Why Phone Charges to 80% Fast, but the Last 20% Takes Forever',
    sourceQuery: 'Why Phone Charges to 80% Fast, but the Last 20% Takes Forever',
    problemStatement: 'Your phone rockets from 0% to 80% in 20 minutes, but the last 20% takes forever—and leaving it plugged in overnight cooks the chemical cells.',
    plainEnglishExplanation: 'Think of charging like parking cars in a massive empty lot. At first, cars zoom straight into open spots at 60mph. But once 80% of spots are taken, cars must crawl at 5mph to avoid crashing into each other. Pushing high current into a full battery creates internal friction (Joule heating), which permanently degrades lithium capacity.',
    freeRemedyTool: {
      name: '80% Battery Protection Limit (Built-In OS Feature)',
      description: 'Built-in battery health limiter found in both iOS and Android settings.',
      freeTier: '100% Free Built-In Setting',
      directUrl: 'https://support.google.com/android/answer/7664692',
      pros: ['Cuts peak charging heat by 60%', 'Doubles battery lifespan from 2 to 4 years', 'Zero app download required'],
      actionableUsage: 'Go to Settings -> Battery -> Battery Health / Protection, and turn on the 80% Charge Limit ceiling.'
    },
    wikipediaSummary: 'Joule heating, also known as ohmic heating, is the process by which the passage of an electric current through a conductor produces heat.',
    duckDuckGoAbstract: 'Fast charging systems employ higher current rates which inevitably increase resistive thermal loss.',
    hashtags: ['#ArchieExplains', '#STEM', '#BatteryHacks', '#EverydayScience', '#Shorts'],
    trendingKeywords: ['why phone gets hot', 'joule heating', 'fast charging fix', 'battery health']
  });

  // ==========================================
  // 5. Compositor & Grounded Studio State
  // ==========================================
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>(initialClassroomId || 'creator_studio_warm');
  const [selectedPoseId, setSelectedPoseId] = useState<string>(initialPoseId || 'archie_studio_seated_natural');
  const [sceneTopic, setSceneTopic] = useState<string>(initialTopic || 'Why Phone Charges to 80% Fast, but the Last 20% Takes Forever');
  const [dialogueText, setDialogueText] = useState<string>('Stop scrolling! If you are a content creator, wait—this video will literally save your channel. Here are 5 free tools you will thank me for later.');

  // Character Inspector State
  const [characterInspectPose, setCharacterInspectPose] = useState<PuppetPose>(
    ARCHIE_PUPPET_POSES.find(p => p.id === 'archie_studio_seated_natural') || ARCHIE_PUPPET_POSES[0]
  );
  const [inspectEnv, setInspectEnv] = useState<ClassroomEnvironment>(CLASSROOM_ENVIRONMENTS[0]);

  const currentClassroom = CLASSROOM_ENVIRONMENTS.find(e => e.id === selectedClassroomId) || CLASSROOM_ENVIRONMENTS[0];
  const currentPose = ARCHIE_PUPPET_POSES.find(p => p.id === selectedPoseId) || ARCHIE_PUPPET_POSES[0];

  // Active Tool from Creator Catalog
  const activeTool: CreatorToolItem = creatorScript.tools[Math.max(0, Math.min(activeToolStep - 1, 4))] || creatorScript.tools[0];

  // Auto-play timer for 5-tool sequence preview
  useEffect(() => {
    if (!isAutoPlayingSequence) return;
    const interval = setInterval(() => {
      setActiveToolStep(prev => (prev >= 6 ? 0 : prev + 1));
    }, 4500);
    return () => clearInterval(interval);
  }, [isAutoPlayingSequence]);

  // Fetch Live Trends (Google Search Trends + YouTube Autocomplete)
  const handleFetchLiveTrends = async () => {
    setIsFetchingTrends(true);
    try {
      const trends = await fetchLiveTrends('creator');
      const savedTopicsHistory = [
        'How to make bread rise faster',
        'Why leaves turn orange in autumn',
        'Why do mirrors reverse horizontally'
      ];
      const deduped = deduplicateTopics(trends, savedTopicsHistory, 0.55);
      setTrendingTopics(deduped);
      if (deduped.length > 0) {
        setSelectedTrendTopic(deduped[0].topic);
      }
      if (onToast) onToast({ text: 'Discovered live Google Trends & YouTube inquiries (Zero API key needed)', isError: false });
    } catch (err) {
      console.warn('[Archie Studio] Live trends error:', err);
    } finally {
      setIsFetchingTrends(false);
    }
  };

  // Run Wikipedia + DuckDuckGo Elaboration
  const handleRunElaboration = async (topicTitle?: string) => {
    const target = topicTitle || problemQuery;
    setIsElaborating(true);
    try {
      const report = await elaborateTopicWithWikiAndDuckDuckGo(target);
      setElaboratedReport(report);
      setSceneTopic(report.topic);
      setDialogueText(`Notice how ${report.topic.toLowerCase().replace(/^(why|how|what)\b/gi, '').trim()} happens? Here is the exact plain English truth...`);
      if (onToast) onToast({ text: 'Elaborated with Wikipedia & DuckDuckGo: Problem & Free Remedy ready!', isError: false });
    } catch (err) {
      console.warn('[Archie Studio] Elaboration error:', err);
    } finally {
      setIsElaborating(false);
    }
  };

  const handleCopyCreatorScript = () => {
    const text = `CONTENT CREATOR 5-TOOL COUNTDOWN REEL (@ArchieExplains)
-----------------------------------------------------------
VIRAL HOOK:
"${creatorScript.hook}"
"${creatorScript.subHook}"

TOOL BREAKDOWN:
${creatorScript.tools.map(t => `
TOOL ${t.number}: ${t.name} (${t.category})
Free Tier: ${t.freeTier}
Pros: ${t.pros.join(' • ')}
Spoken Usage (10-15s): "${t.usageSummary}"
Direct Link: ${t.directUrl}
`).join('\n')}

OUTRO CTA:
"${creatorScript.outroCta}"

HASHTAGS: ${creatorScript.hashtags.join(' ')}`;

    navigator.clipboard.writeText(text);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
    if (onToast) onToast({ text: 'Complete 5-Tool Reel script copied to clipboard!', isError: false });
  };

  // Current narration text based on step
  const currentNarrationText = activeToolStep === 0
    ? `${creatorScript.hook} ${creatorScript.subHook}`
    : activeToolStep === 6
    ? creatorScript.outroCta
    : activeTool.usageSummary;

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden pb-12">
      {/* Top Banner & Mode Identity (Clean matte studio aesthetic - zero garish gradients) */}
      <div className="bg-[#12161f] border border-[#222a38] rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span className="text-amber-400 font-bold uppercase tracking-wider">Archie Creator Studio</span>
              <span aria-hidden="true">·</span>
              <span>Adult Science Host</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400">100% Free Live Discovery</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
              <GraduationCap className="w-6 h-6 text-amber-400" />
              <span>Archie Content Creator Studio &amp; Trend Engine</span>
            </h1>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Discovers topics from Google Search Trends &amp; YouTube suggestions with automated deduplication, elaborates in plain English via Wikipedia &amp; DuckDuckGo, and produces viral 5-tool reels with glowing neon tool slams.
            </p>
          </div>

          {/* Audio & Script Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Calm Piano Soundtrack Player Toggle */}
            <button
              onClick={handleTogglePiano}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer border ${
                isPianoPlaying
                  ? 'bg-amber-500/20 border-amber-400/80 text-amber-300'
                  : 'bg-[#181f2c] border-[#2a3446] text-slate-300 hover:text-white hover:border-slate-600'
              }`}
              title="Toggle slow calm acoustic piano background music"
            >
              <Music className={`w-3.5 h-3.5 ${isPianoPlaying ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
              <span>{isPianoPlaying ? 'Piano Playing' : 'Calm Piano Audio'}</span>
            </button>

            {/* Adult Voice Narration Preview */}
            <button
              onClick={() => handleSpeakAdultVoice(currentNarrationText)}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer border ${
                isSpeakingAdultVoice
                  ? 'bg-emerald-500/20 border-emerald-400/80 text-emerald-300'
                  : 'bg-[#181f2c] border-[#2a3446] text-slate-300 hover:text-white hover:border-slate-600'
              }`}
              title="Listen to Archie speak in adult educator voice"
            >
              <Volume2 className={`w-3.5 h-3.5 ${isSpeakingAdultVoice ? 'text-emerald-400 animate-bounce' : 'text-slate-400'}`} />
              <span>{isSpeakingAdultVoice ? 'Speaking...' : 'Play Adult Voice'}</span>
            </button>

            {/* Copy Script */}
            <button
              onClick={handleCopyCreatorScript}
              className="py-2 px-3 bg-[#181f2c] hover:bg-[#20293a] border border-[#2a3446] text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-2"
            >
              {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedScript ? 'Copied!' : 'Copy Script'}</span>
            </button>
          </div>
        </div>

        {/* Sub-Tab Navigation Bar (Clean segmented controls) */}
        <div className="flex items-center gap-1.5 pt-4 mt-4 border-t border-[#202735] overflow-x-auto max-w-full">
          {[
            { id: 'creator-tools', label: '1. Content Creator 5-Tool Reel', icon: Zap },
            { id: 'problem-remedy', label: '2. Problem -> Plain English -> Free Remedy', icon: HelpCircle },
            { id: 'compositor', label: '3. Studio Staging & Desk Occlusion', icon: Sliders },
            { id: 'character', label: '4. Archie Poses & Sprites', icon: UserCheck },
            { id: 'environments', label: '5. Creator Studios & Labs', icon: Monitor }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`py-2 px-3.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-[#181f2c] text-slate-400 hover:text-slate-200 hover:bg-[#20293a]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* SUBTAB 1: CONTENT CREATOR 5-TOOL COUNTDOWN REEL (FLAGSHIP) */}
      {/* ========================================================= */}
      {activeSubTab === 'creator-tools' && (
        <div className="space-y-6">
          {/* Live Discovery & Curated High-Retention Inquiries */}
          <div className="p-5 bg-[#12161f] border border-[#222a38] rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#202735] pb-3">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                  <span className="text-amber-400 font-bold uppercase">Topic Discovery &amp; Deduplication</span>
                  <span aria-hidden="true">·</span>
                  <span>Google Trends RSS &amp; YouTube Autocomplete</span>
                </div>
                <h2 className="text-sm sm:text-base font-bold text-white mt-1 flex items-center gap-2">
                  <Search className="w-4 h-4 text-amber-400" />
                  Trending Content Angles (Zero Repeat within 14 Days)
                </h2>
              </div>

              <button
                onClick={handleFetchLiveTrends}
                disabled={isFetchingTrends}
                className="py-1.5 px-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-2 cursor-pointer transition-colors shadow-sm shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetchingTrends ? 'animate-spin' : ''}`} />
                <span>{isFetchingTrends ? 'Searching...' : 'Refresh Trends'}</span>
              </button>
            </div>

            {/* Trending Inquiries Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {trendingTopics.map((t, idx) => (
                <div
                  key={t.id || idx}
                  onClick={() => {
                    setSelectedTrendTopic(t.topic);
                    handleRunElaboration(t.topic);
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 flex flex-col justify-between ${
                    selectedTrendTopic === t.topic
                      ? 'bg-[#182030] border-amber-500/80 ring-1 ring-amber-500'
                      : 'bg-[#161c28] border-[#232b3a] hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="text-amber-400 font-bold uppercase text-[10px] font-mono">{t.source.replace('_', ' ')}</span>
                    <span className="text-emerald-400 flex items-center gap-1 font-semibold text-[10px]">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      {t.isDuplicate ? 'Overlap' : 'Unique Angle'}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white line-clamp-2 leading-snug">
                    "{t.topic}"
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-[#222a38]">
                    <span>Target: Curious Viewers</span>
                    <span className="text-amber-300 font-mono">Click to Elaborate</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sequence Controller & 9:16 Shorts Canvas Simulator */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Controls: Sequence Navigator (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 bg-[#12161f] border border-[#222a38] rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Tv className="w-4 h-4 text-amber-400" />
                      5-Tool Reel Timeline Sequence
                    </h3>
                    <p className="text-[11px] text-slate-400">Viral countdown structure with Tool Slam mode</p>
                  </div>

                  <button
                    onClick={() => setIsAutoPlayingSequence(!isAutoPlayingSequence)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isAutoPlayingSequence ? 'bg-amber-600 text-white' : 'bg-[#181f2c] border border-[#2a3446] text-slate-300 hover:text-white'
                    }`}
                  >
                    {isAutoPlayingSequence ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isAutoPlayingSequence ? 'Pause' : 'Auto Play'}</span>
                  </button>
                </div>

                {/* Sequence Step Buttons */}
                <div className="grid grid-cols-1 gap-1.5">
                  {[
                    { step: 0, label: '0. Viral Hook ("Stop scrolling! If you\'re a creator...")', type: 'hook' },
                    { step: 1, label: '1. Tool 1: CapCut Desktop (Auto-Captions in 15s)', toolIdx: 0 },
                    { step: 2, label: '2. Tool 2: Adobe Podcast AI (Echo & Noise Eliminator)', toolIdx: 1 },
                    { step: 3, label: '3. Tool 3: Photopea Online (Free Photoshop Alternative)', toolIdx: 2 },
                    { step: 4, label: '4. Tool 4: TinyPNG Web (70% Compression Zero Loss)', toolIdx: 3 },
                    { step: 5, label: '5. Tool 5: DaVinci Resolve [CRITICAL CLIMAX REPLACES $400]', toolIdx: 4, isCritical: true },
                    { step: 6, label: '6. Viral Outro CTA ("Comment FREE for direct links")', type: 'cta' }
                  ].map((s) => {
                    const isSelected = activeToolStep === s.step;
                    return (
                      <button
                        key={s.step}
                        onClick={() => setActiveToolStep(s.step)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between text-xs ${
                          isSelected
                            ? 'bg-[#1d2536] border-amber-500 text-white font-bold ring-1 ring-amber-500'
                            : s.isCritical
                            ? 'bg-[#161c28] border-cyan-500/40 text-cyan-300 hover:border-cyan-400'
                            : 'bg-[#161c28] border-[#222a38] text-slate-300 hover:text-white'
                        }`}
                      >
                        <div className="truncate pr-2">{s.label}</div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Screen Transition & Archie Scale Controls */}
                <div className="pt-3 border-t border-[#202735] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">
                      Screen Transition
                    </span>
                    <div className="flex items-center gap-1 bg-[#161c28] p-1 rounded-lg border border-[#222a38]">
                      <button
                        onClick={() => setShowToolSlamScreen(true)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                          showToolSlamScreen ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Tool Slam
                      </button>
                      <button
                        onClick={() => setShowToolSlamScreen(false)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                          !showToolSlamScreen ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Archie Host
                      </button>
                    </div>
                  </div>

                  {/* Archie Presenter Scaling (Solves "Archie is too big and occupy all part of screen") */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">
                      Archie Presenter Scale
                    </span>
                    <div className="flex items-center gap-1 bg-[#161c28] p-1 rounded-lg border border-[#222a38]">
                      {(['compact', 'natural', 'focus'] as const).map(sc => (
                        <button
                          key={sc}
                          onClick={() => setHostScale(sc)}
                          className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize cursor-pointer ${
                            hostScale === sc ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {sc === 'compact' ? '38%' : sc === 'natural' ? '44%' : '50%'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Audio Controls Box */}
                  <div className="p-3 bg-[#161c28] rounded-xl border border-[#222a38] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <Music className="w-3.5 h-3.5 text-amber-400" />
                        Calm Piano Audio Level
                      </span>
                      <span className="font-mono text-[10px] text-amber-300">{Math.round(pianoVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="0.40"
                      step="0.02"
                      value={pianoVolume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Soft Ambient Chords</span>
                      <span>Ducked Under Voice</span>
                    </div>
                  </div>
                </div>

                {/* Current Active Tool Specs */}
                {activeToolStep >= 1 && activeToolStep <= 5 && (
                  <div className="p-3.5 bg-[#161c28] rounded-xl border border-[#222a38] space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-amber-400 font-bold uppercase text-[10px]">
                        Tool {activeTool.number} Specs
                      </span>
                      <span className="text-emerald-400 font-mono text-[10px] font-semibold">
                        ✓ {activeTool.freeTier}
                      </span>
                    </div>
                    <div className="font-bold text-white text-sm">
                      {activeTool.name}
                    </div>
                    <p className="text-slate-300 text-xs italic">
                      "{activeTool.usageSummary}"
                    </p>
                    <div className="space-y-1 pt-1">
                      {activeTool.pros.map((pro, pIdx) => (
                        <div key={pIdx} className="text-[11px] text-slate-400 flex items-start gap-1.5">
                          <Check className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{pro}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: 9:16 Shorts Canvas Simulator (7 cols) */}
            <div className="lg:col-span-7 flex flex-col items-center">
              <div className="w-full max-w-[380px] bg-[#0d1017] rounded-3xl p-3 border border-[#222a38] shadow-2xl space-y-3">
                <div className="flex items-center justify-between px-2 pt-1 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <span className="font-mono text-[11px] font-bold text-slate-200">
                      9:16 VERTICAL SHORTS CANVAS
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {showToolSlamScreen && activeToolStep >= 1 && activeToolStep <= 5 ? 'Tool Slam Active' : 'Archie at Desk'}
                  </span>
                </div>

                {/* 9:16 Frame */}
                <div className="relative aspect-[9/16] w-full bg-[#11141c] rounded-2xl overflow-hidden border border-[#222a38] shadow-inner flex items-center justify-center select-none">
                  {/* Background: Photorealistic Creator Studio */}
                  <img
                    src="/src/assets/images/studio_env_desk_chair_1790754334372.jpg"
                    alt="Creator Studio"
                    className={`w-full h-full object-cover transition-all duration-500 ${
                      showToolSlamScreen && activeToolStep >= 1 && activeToolStep <= 5 ? 'scale-105 blur-md brightness-40' : 'scale-100 blur-0'
                    }`}
                  />

                  {/* Archie seated naturally at the desk in BALANCED scale (NOT 100% full screen) */}
                  {(!showToolSlamScreen || activeToolStep === 0 || activeToolStep === 6) && (
                    <div className={`absolute bottom-0 inset-x-0 pointer-events-none z-10 flex items-end justify-center transition-all duration-300 ${
                      hostScale === 'compact' ? 'h-[38%]' : hostScale === 'focus' ? 'h-[50%]' : 'h-[44%]'
                    }`}>
                      <img
                        src="/src/assets/images/studio_archie_seated_1790754305287.jpg"
                        alt="Archie seated at desk"
                        className="h-full w-auto max-w-[85%] object-contain object-bottom drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)]"
                      />
                    </div>
                  )}

                  {/* TOOL SLAM OVERLAY: Glowing Neon Corners + Blurred Background + Topic-Accurate Screenshot */}
                  {showToolSlamScreen && activeToolStep >= 1 && activeToolStep <= 5 && (
                    <div className="absolute inset-4 pointer-events-none z-20 flex flex-col justify-between animate-in zoom-in-95 duration-300">
                      {/* Neon Glowing Corner Brackets */}
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.8)]" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.8)]" />
                      <div className="absolute bottom-16 left-0 w-8 h-8 border-b-2 border-l-2 border-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.8)]" />
                      <div className="absolute bottom-16 right-0 w-8 h-8 border-b-2 border-r-2 border-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.8)]" />

                      {/* Tool Slam Badge */}
                      <div className="pt-6 text-center space-y-1">
                        <div className="inline-block px-3 py-0.5 rounded-full bg-amber-950/90 border border-amber-400 text-amber-300 font-mono font-black text-xs uppercase tracking-widest shadow-md">
                          TOOL {activeTool.number} OF 5
                        </div>
                        <h2 className="text-xl font-black text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] tracking-tight">
                          {activeTool.name}
                        </h2>
                        <div className="text-xs text-amber-300 font-bold drop-shadow">
                          {activeTool.tagline}
                        </div>
                      </div>

                      {/* Topic-Accurate Software Screenshot (Never Out of Topic) */}
                      <div className="my-auto px-2">
                        <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden border-2 border-amber-500/50 shadow-2xl bg-[#0b0e14]">
                          <img
                            src={activeTool.screenshotUrl}
                            alt={activeTool.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono">
                            <span className="text-emerald-300 font-bold bg-black/80 px-2 py-0.5 rounded border border-emerald-800">
                              ✓ {activeTool.freeTier}
                            </span>
                            <span className="text-slate-300 font-semibold">{activeTool.category}</span>
                          </div>
                        </div>
                      </div>

                      {/* Pros Bullet Badges */}
                      <div className="space-y-1 pb-20">
                        {activeTool.pros.slice(0, 2).map((pro, pIdx) => (
                          <div key={pIdx} className="p-2 rounded-lg bg-[#0e121a]/90 border border-[#232b3a] text-[11px] text-white flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="font-semibold truncate">{pro}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Archie Spoken Narration Bubble (when Archie is talking) */}
                  {(!showToolSlamScreen || activeToolStep === 0 || activeToolStep === 6) && (
                    <div className="absolute top-12 left-4 right-14 pointer-events-none z-20 animate-in fade-in duration-300">
                      <div className="bg-[#0e121a]/95 border border-amber-500/40 rounded-xl p-3 shadow-2xl">
                        <div className="text-[10px] font-mono uppercase font-bold text-amber-400 flex items-center gap-1 mb-1">
                          <MessageSquare className="w-3 h-3 text-amber-400" />
                          <span>Archie's Spoken Hook</span>
                        </div>
                        <p className="text-xs font-semibold text-white leading-snug drop-shadow">
                          {activeToolStep === 0
                            ? `“${creatorScript.hook} ${creatorScript.subHook}”`
                            : activeToolStep === 6
                            ? `“${creatorScript.outroCta}”`
                            : `“${activeTool.usageSummary}”`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Shorts Social Icons (Right Side) */}
                  <div className="absolute right-2.5 bottom-24 flex flex-col items-center gap-3 pointer-events-none z-30 text-xs">
                    <div className="w-8 h-8 rounded-full bg-black/60 border border-slate-700/60 flex items-center justify-center text-white">
                      ❤️
                    </div>
                    <div className="w-8 h-8 rounded-full bg-black/60 border border-slate-700/60 flex items-center justify-center text-white">
                      💬
                    </div>
                    <div className="w-8 h-8 rounded-full bg-black/60 border border-slate-700/60 flex items-center justify-center text-white">
                      ↗️
                    </div>
                  </div>

                  {/* SAFE-ZONE CAPTIONS: Positioned at bottom-26 to bottom-32 */}
                  {/* NEVER covered by YouTube Shorts title or bottom action bar */}
                  <div className="absolute bottom-28 left-4 right-14 pointer-events-none z-30 flex flex-col items-center text-center">
                    <div className="bg-black/90 border border-slate-700/80 px-3 py-1.5 rounded-lg shadow-2xl">
                      <span className="text-xs font-black text-amber-300 uppercase tracking-wide drop-shadow">
                        {activeToolStep === 0
                          ? "STOP SCROLLING! IF YOU'RE A CREATOR, WAIT!"
                          : activeToolStep === 6
                          ? "COMMENT 'FREE' FOR DIRECT LINKS!"
                          : `TOOL ${activeTool.number}: ${activeTool.name.toUpperCase()}`}
                      </span>
                    </div>
                  </div>

                  {/* Shorts Bottom HUD: Channel handle & Title */}
                  <div className="absolute bottom-4 left-3 right-14 pointer-events-none z-20 space-y-1">
                    <div className="inline-block px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[9px] font-black uppercase tracking-wider">
                      CREATOR MATRIX
                    </div>
                    <div className="text-xs font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] truncate">
                      5 Tools Every Creator Needs in 2026 #Shorts
                    </div>
                    <div className="text-[10px] text-slate-300 drop-shadow flex items-center gap-1 font-mono">
                      <span>@ArchieExplains</span>
                      <span>•</span>
                      <span className="text-amber-300">Tool {Math.max(1, activeToolStep)} of 5</span>
                    </div>
                  </div>
                </div>

                {/* Preview Controls Bar */}
                <div className="p-3 bg-[#12161f] rounded-xl border border-[#222a38] text-[11px] flex items-center justify-between">
                  <span className="text-slate-400">
                    Step: <strong className="text-white">{activeToolStep === 0 ? 'Hook' : activeToolStep === 6 ? 'Outro' : `Tool ${activeToolStep}`}</strong>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setActiveToolStep(prev => Math.max(0, prev - 1))}
                      className="px-2.5 py-1 bg-[#181f2c] hover:bg-[#20293a] border border-[#2a3446] rounded-lg text-slate-300 cursor-pointer"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setActiveToolStep(prev => Math.min(6, prev + 1))}
                      className="px-2.5 py-1 bg-[#181f2c] hover:bg-[#20293a] border border-[#2a3446] rounded-lg text-slate-300 cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Complete 5-Tool Catalog Table with Direct Links */}
          <div className="p-5 bg-[#12161f] border border-[#222a38] rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#202735] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  Verified Content Creator 5-Tool Roster (Tested &amp; Zero Watermark)
                </h3>
                <p className="text-xs text-slate-400">
                  Real software screenshots with spoken 10-15s pros breakdown and direct developer links.
                </p>
              </div>
              <button
                onClick={handleCopyCreatorScript}
                className="py-1 px-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Script</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {creatorScript.tools.map((tool) => (
                <div
                  key={tool.number}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-3 ${
                    tool.isClimaxCritical
                      ? 'bg-[#182030] border-amber-500/60 shadow-md'
                      : 'bg-[#161c28] border-[#222a38]'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-black uppercase bg-amber-950 text-amber-300 border border-amber-800">
                        Tool #{tool.number}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">
                        {tool.freeTier}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white">
                      {tool.name}
                    </div>
                    <p className="text-xs text-slate-400">
                      {tool.tagline}
                    </p>
                    <div className="p-2 rounded-lg bg-[#0e121a] border border-[#202735] text-[11px] text-slate-300 italic">
                      "{tool.usageSummary}"
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#222a38] flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">{tool.category}</span>
                    <a
                      href={tool.directUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                    >
                      <span>Direct Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 2: PROBLEM -> PLAIN ENGLISH -> FREE REMEDY TOOL   */}
      {/* ========================================================= */}
      {activeSubTab === 'problem-remedy' && (
        <div className="space-y-6">
          <div className="p-5 bg-[#12161f] border border-[#222a38] rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#202735] pb-3">
              <div>
                <span className="text-amber-400 font-mono font-bold uppercase text-[10px]">
                  Archie Formula
                </span>
                <h2 className="text-base font-bold text-white mt-1">
                  1. Common Problem → 2. Plain English Mechanism → 3. Free Remedy Tool
                </h2>
                <p className="text-xs text-slate-400">
                  Explains tech frustrations in layman terms using Wikipedia &amp; DuckDuckGo, ending with a free tool or setting.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={problemQuery}
                onChange={(e) => setProblemQuery(e.target.value)}
                placeholder="Enter phenomenon e.g. Why does your phone charge slow after 80%?"
                className="flex-1 bg-[#161c28] border border-[#222a38] p-2.5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                onClick={() => handleRunElaboration()}
                disabled={isElaborating}
                className="py-2.5 px-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm shrink-0"
              >
                {isElaborating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>Elaborate Topic</span>
              </button>
            </div>

            {/* Elaborated Report Cards (Clean matte blocks) */}
            {elaboratedReport && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="p-4 bg-[#161c28] border border-rose-950/60 rounded-xl space-y-2">
                  <div className="text-[10px] font-mono uppercase font-bold text-rose-400">
                    Step 1: Common Problem
                  </div>
                  <h3 className="text-xs font-bold text-white">The Relatable Issue</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {elaboratedReport.problemStatement}
                  </p>
                </div>

                <div className="p-4 bg-[#161c28] border border-amber-950/60 rounded-xl space-y-2">
                  <div className="text-[10px] font-mono uppercase font-bold text-amber-400">
                    Step 2: Plain English Mechanism
                  </div>
                  <h3 className="text-xs font-bold text-white">How It Actually Works</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {elaboratedReport.plainEnglishExplanation}
                  </p>
                </div>

                <div className="p-4 bg-[#161c28] border border-emerald-950/60 rounded-xl space-y-2">
                  <div className="text-[10px] font-mono uppercase font-bold text-emerald-400">
                    Step 3: Free Remedy Tool
                  </div>
                  <h3 className="text-xs font-bold text-white">{elaboratedReport.freeRemedyTool.name}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {elaboratedReport.freeRemedyTool.actionableUsage}
                  </p>
                  <div className="text-[10px] text-emerald-400 font-mono pt-1">
                    ✓ {elaboratedReport.freeRemedyTool.freeTier}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 3: STUDIO STAGING & DESK OCCLUSION (GROUNDING)    */}
      {/* ========================================================= */}
      {activeSubTab === 'compositor' && (
        <div className="p-5 bg-[#12161f] border border-[#222a38] rounded-2xl space-y-5">
          <div className="border-b border-[#202735] pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-400" />
              Creator Studio Staging &amp; Grounding Architecture
            </h2>
            <p className="text-xs text-slate-400">
              Walnut desk occlusion barrier, boom microphone, and natural shadows eliminate the floating character look.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 bg-[#161c28] border border-[#222a38] rounded-xl space-y-2">
              <div className="text-xs font-bold text-white">Grounded Desk Barrier</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Positions the rich mahogany studio desk directly over Archie's lower torso, ensuring hands rest realistically on the surface.
              </p>
            </div>
            <div className="p-4 bg-[#161c28] border border-[#222a38] rounded-xl space-y-2">
              <div className="text-xs font-bold text-white">Balanced Presenter Scale</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Archie is scaled to 42-45% of frame height in the lower half, leaving the upper 55% open for tool graphics and titles.
              </p>
            </div>
            <div className="p-4 bg-[#161c28] border border-[#222a38] rounded-xl space-y-2">
              <div className="text-xs font-bold text-white">Slow Varying Piano Audio</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Procedural acoustic piano harmonies loop gently at -18dB to fill dead time without drowning out speech.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 4: ARCHIE POSES & SPRITES                         */}
      {/* ========================================================= */}
      {activeSubTab === 'character' && (
        <div className="p-5 bg-[#12161f] border border-[#222a38] rounded-2xl space-y-5">
          <div className="border-b border-[#202735] pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-400" />
              Archie Character Model &amp; Puppet Roster
            </h2>
            <p className="text-xs text-slate-400">
              Mature adult science educator with natural gestures: pointing, explaining, thinking, and seated at desk.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ARCHIE_PUPPET_POSES.map((pose) => (
              <div
                key={pose.id}
                onClick={() => setCharacterInspectPose(pose)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-colors ${
                  characterInspectPose.id === pose.id
                    ? 'bg-[#182030] border-amber-500'
                    : 'bg-[#161c28] border-[#222a38] hover:border-slate-600'
                }`}
              >
                <div className="text-xs font-bold text-white">{pose.name}</div>
                <div className="text-[10px] text-slate-400 mt-1 capitalize">{pose.gesture} · {pose.category}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 5: CREATOR STUDIOS & ENVIRONMENTS                 */}
      {/* ========================================================= */}
      {activeSubTab === 'environments' && (
        <div className="p-5 bg-[#12161f] border border-[#222a38] rounded-2xl space-y-5">
          <div className="border-b border-[#202735] pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Monitor className="w-5 h-5 text-amber-400" />
              18 Grounded Creator Studios &amp; Environments
            </h2>
            <p className="text-xs text-slate-400">
              Photorealistic desks, studio lighting, quantum labs, and collider backdrops.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {CLASSROOM_ENVIRONMENTS.map((env) => (
              <div
                key={env.id}
                onClick={() => setSelectedClassroomId(env.id)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-colors ${
                  selectedClassroomId === env.id
                    ? 'bg-[#182030] border-amber-500'
                    : 'bg-[#161c28] border-[#222a38] hover:border-slate-600'
                }`}
              >
                <div className="text-xs font-bold text-white truncate">{env.name}</div>
                <div className="text-[10px] text-slate-400 mt-1">{env.category}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
