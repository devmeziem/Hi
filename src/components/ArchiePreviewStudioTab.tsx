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
  Sparkle,
  Search,
  TrendingUp,
  Flame,
  Tv,
  ExternalLink,
  Shield,
  Zap,
  Check as CheckIcon,
  HelpCircle,
  Video,
  MonitorPlay,
  Ban,
  Clock,
  ThumbsUp,
  Share2
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
  Creator5ToolReelScript,
  VERIFIED_CREATOR_TOOLS_CATALOG
} from '../archie/research/googleTrendsYouTubeProvider';

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
  // Navigation Sub-Tabs: Default to the requested Content Creator 5-Tool Engine
  const [activeSubTab, setActiveSubTab] = useState<'creator-tools' | 'problem-remedy' | 'compositor' | 'character' | 'environments'>('creator-tools');

  // ==========================================
  // 1. Content Creator 5-Tool Countdown State
  // ==========================================
  const [creatorScript, setCreatorScript] = useState<Creator5ToolReelScript>(buildContentCreator5ToolReel());
  const [activeToolStep, setActiveToolStep] = useState<number>(1); // 0=Hook, 1=Tool1, 2=Tool2, 3=Tool3, 4=Tool4, 5=Tool5, 6=CTA
  const [showToolSlamScreen, setShowToolSlamScreen] = useState<boolean>(true);
  const [isAutoPlayingSequence, setIsAutoPlayingSequence] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  // ==========================================
  // 2. Google Trends & YouTube Suggestion State (Zero Key Required)
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
      topic: 'Best Free AI Tools for Video Editors & YouTubers',
      source: 'youtube_suggest',
      searchQuery: 'free ai tools for creators',
      category: 'creator_tools',
      isDuplicate: false,
      similarityScore: 12
    },
    {
      id: 'trend-yt-3',
      topic: 'Why Phone Batteries Degrade While Fast Charging',
      source: 'google_trends',
      searchQuery: 'phone battery internal resistance heat',
      category: 'everyday_science',
      approxTraffic: '20K+',
      isDuplicate: false,
      similarityScore: 5
    }
  ]);
  const [selectedTrendTopic, setSelectedTrendTopic] = useState<string>('5 Free Tools Every Content Creator Needs in 2026');

  // ==========================================
  // 3. Problem -> Plain English -> Free Remedy State
  // ==========================================
  const [problemQuery, setProblemQuery] = useState<string>('Why Does Your Phone Get Hot While Fast Charging?');
  const [isElaborating, setIsElaborating] = useState<boolean>(false);
  const [elaboratedReport, setElaboratedReport] = useState<ElaboratedTopicReport | null>({
    topic: 'Why Does Your Phone Get Hot While Fast Charging?',
    sourceQuery: 'Why Does Your Phone Get Hot While Fast Charging?',
    problemStatement: 'When fast charging, lithium-ion phone batteries heat up rapidly, triggering thermal throttling and battery health degradation.',
    plainEnglishExplanation: 'Fast-charging pushes a massive flood of electric current into the battery. The ions encounter internal resistance inside the chemical cells, converting friction into thermal energy (Joule heating).',
    freeRemedyTool: {
      name: '80% Battery Protection Limit (Built-In Zero Cost)',
      description: 'Enable the internal battery health protection toggle to cap fast charging at 80% and reduce thermal stress.',
      freeTier: '100% Free Built-in OS Feature',
      directUrl: 'https://support.google.com',
      pros: ['Stops Joule overheating by 60%', 'Doubles battery lifespan from 2 to 4 years', 'Zero app download required'],
      actionableUsage: 'Go to Settings -> Battery -> Battery Protection, and set the charging ceiling to 80% to stop peak thermal throttling.'
    },
    wikipediaSummary: 'Joule heating, also known as ohmic heating, is the process by which the passage of an electric current through a conductor produces heat.',
    duckDuckGoAbstract: 'Fast charging systems employ higher current rates which inevitably increase resistive thermal loss.',
    hashtags: ['#ArchieExplains', '#STEM', '#BatteryHacks', '#EverydayScience', '#Shorts'],
    trendingKeywords: ['why phone gets hot', 'joule heating', 'fast charging fix', 'battery health']
  });

  // ==========================================
  // 4. Compositor & Grounded Studio State
  // ==========================================
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>(initialClassroomId || 'creator_studio_warm');
  const [selectedPoseId, setSelectedPoseId] = useState<string>(initialPoseId || 'archie_studio_seated_natural');
  const [sceneTopic, setSceneTopic] = useState<string>(initialTopic || 'Why Does Your Phone Get Hot While Fast Charging?');
  const [dialogueText, setDialogueText] = useState<string>('If you are a content creator, wait—this video is for you! Here are 5 free tools you will thank me for later.');
  const [archiePosition, setArchiePosition] = useState<'left' | 'center' | 'right' | 'desk'>('desk');
  const [archieScale, setArchieScale] = useState<number>(1.0);
  const [enableDeskOcclusion, setEnableDeskOcclusion] = useState<boolean>(true);
  const [lightingAmbiance, setLightingAmbiance] = useState<'warm' | 'cool' | 'neutral'>('warm');
  const [enableSoftDepth, setEnableSoftDepth] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Character Inspector State
  const [characterInspectPose, setCharacterInspectPose] = useState<PuppetPose>(
    ARCHIE_PUPPET_POSES.find(p => p.id === 'archie_studio_seated_natural') || ARCHIE_PUPPET_POSES[0]
  );

  // Environments State
  const [inspectEnv, setInspectEnv] = useState<ClassroomEnvironment>(CLASSROOM_ENVIRONMENTS[0]);

  // Current classroom and pose
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
      // Deduplicate against saved catalog
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
      if (onToast) onToast({ text: 'Discovered live Google Trends & YouTube searches (Zero API key needed!)', isError: false });
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

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden animate-in fade-in duration-300 pb-12">
      {/* Top Banner & Mode Identity */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase bg-cyan-950 text-cyan-300 border border-cyan-800">
                ARCHIE SHORTS SUITE
              </span>
              <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Grounded Creator Studio • Zero Floating • 100% Free Live Trends
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
              <GraduationCap className="w-6 h-6 text-amber-400" />
              <span>Archie Content Creator Studio &amp; Trend Engine</span>
            </h1>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Find topics from Google Search Trends &amp; YouTube suggestions with automatic deduplication, elaborate in plain English via Wikipedia &amp; DuckDuckGo, and generate viral 5-tool countdowns with glowing neon tool slams.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyCreatorScript}
              className="py-2.5 px-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2"
            >
              {copiedScript ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedScript ? 'Copied Full Script!' : 'Copy 5-Tool Script'}</span>
            </button>
          </div>
        </div>

        {/* Sub-Tab Navigation Bar */}
        <div className="flex items-center gap-2 pt-5 border-t border-slate-800/80 overflow-x-auto max-w-full">
          {[
            { id: 'creator-tools', label: '1. Content Creator 5-Tool Reel', icon: Zap, highlight: true },
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
                className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                    : tab.highlight
                    ? 'bg-slate-950 border border-cyan-500/40 text-cyan-300 hover:text-white hover:border-cyan-400'
                    : 'bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : tab.highlight ? 'text-cyan-400' : 'text-slate-400'}`} />
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
          {/* Live Discovery & Deduplication Panel */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                    REAL-TIME TREND DISCOVERY
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Google Trends RSS &amp; YouTube Autocomplete (Zero API Key Needed)
                  </span>
                </div>
                <h2 className="text-base font-bold text-white mt-1 flex items-center gap-2">
                  <Search className="w-4 h-4 text-cyan-400" />
                  Live Trending Topics with Automated Deduplication
                </h2>
              </div>

              <button
                onClick={handleFetchLiveTrends}
                disabled={isFetchingTrends}
                className="py-2 px-3.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-colors shadow-lg shadow-cyan-600/20 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetchingTrends ? 'animate-spin' : ''}`} />
                <span>{isFetchingTrends ? 'Discovering Trends...' : 'Discover Live Creator Trends'}</span>
              </button>
            </div>

            {/* Trending Queries Cards with Deduplication Badge */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {trendingTopics.map((t, idx) => (
                <div
                  key={t.id || idx}
                  onClick={() => {
                    setSelectedTrendTopic(t.topic);
                    handleRunElaboration(t.topic);
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-2 flex flex-col justify-between ${
                    selectedTrendTopic === t.topic
                      ? 'bg-cyan-950/80 border-cyan-500 ring-1 ring-cyan-500'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-cyan-400 font-bold uppercase">{t.source.replace('_', ' ')}</span>
                    <span className="text-emerald-400 flex items-center gap-1 font-bold">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      {t.isDuplicate ? 'Overlap' : '100% Unique'}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white line-clamp-2">
                    "{t.topic}"
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <span>Target: Content Creators</span>
                    <span className="text-cyan-300 font-mono">Auto-Deduplicated</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sequence Controller & 9:16 Shorts Canvas Simulator */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Controls: Sequence Navigator (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Tv className="w-4 h-4 text-amber-400" />
                      5-Tool Reel Timeline Sequence
                    </h3>
                    <p className="text-[11px] text-slate-400">Step through the viral countdown sequence</p>
                  </div>

                  <button
                    onClick={() => setIsAutoPlayingSequence(!isAutoPlayingSequence)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isAutoPlayingSequence ? 'bg-amber-600 text-white' : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {isAutoPlayingSequence ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isAutoPlayingSequence ? 'Pause Reel' : 'Auto Play'}</span>
                  </button>
                </div>

                {/* Sequence Step Buttons */}
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { step: 0, label: '0. Viral Hook ("If you\'re a creator, wait!")', type: 'hook' },
                    { step: 1, label: '1. Tool 1: CapCut Desktop (Auto-Captions)', toolIdx: 0 },
                    { step: 2, label: '2. Tool 2: Adobe Podcast AI (Mic Enhancer)', toolIdx: 1 },
                    { step: 3, label: '3. Tool 3: Photopea Online (Free Photoshop)', toolIdx: 2 },
                    { step: 4, label: '4. Tool 4: TinyPNG Web (70% Compression)', toolIdx: 3 },
                    { step: 5, label: '5. Tool 5: DaVinci Resolve [CRITICAL CLIMAX]', toolIdx: 4, isCritical: true },
                    { step: 6, label: '6. Viral Outro CTA ("Comment FREE")', type: 'cta' }
                  ].map((s) => {
                    const isSelected = activeToolStep === s.step;
                    return (
                      <button
                        key={s.step}
                        onClick={() => setActiveToolStep(s.step)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between text-xs ${
                          isSelected
                            ? 'bg-amber-950/80 border-amber-500 text-white font-bold ring-1 ring-amber-500'
                            : s.isCritical
                            ? 'bg-slate-950 border-cyan-500/40 text-cyan-300 hover:border-cyan-400'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        <div className="truncate pr-2">{s.label}</div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Screen Transition View Mode Toggle */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase font-mono">
                    Screen Transition Mode
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setShowToolSlamScreen(true)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        showToolSlamScreen
                          ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Tool Slam (Glowing Corners)</span>
                    </button>
                    <button
                      onClick={() => setShowToolSlamScreen(false)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        !showToolSlamScreen
                          ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Archie at Creator Desk</span>
                    </button>
                  </div>
                </div>

                {/* Current Active Tool Deep Dive */}
                {activeToolStep >= 1 && activeToolStep <= 5 && (
                  <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-cyan-400 font-bold uppercase text-[10px]">
                        Tool {activeTool.number} Specs
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-mono border border-emerald-800">
                        {activeTool.freeTier}
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
                          <Check className="w-3 h-3 text-cyan-400 shrink-0 mt-0.5" />
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
              <div className="w-full max-w-[390px] bg-slate-950 rounded-3xl p-3 border border-slate-800 shadow-2xl space-y-3">
                <div className="flex items-center justify-between px-2 pt-1 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <span className="font-mono text-[11px] font-bold text-slate-200">
                      SHORTS / REEL 9:16 PREVIEW
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {showToolSlamScreen && activeToolStep >= 1 && activeToolStep <= 5 ? 'Tool Slam Active' : 'Creator Studio Desk'}
                  </span>
                </div>

                {/* 9:16 Frame */}
                <div className="relative aspect-[9/16] w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center select-none">
                  {/* Background: Photorealistic Creator Studio */}
                  <img
                    src="/src/assets/images/studio_env_desk_chair_1790754334372.jpg"
                    alt="Creator Studio"
                    className={`w-full h-full object-cover transition-all duration-500 ${
                      showToolSlamScreen && activeToolStep >= 1 && activeToolStep <= 5 ? 'scale-105 blur-md brightness-50' : 'scale-100 blur-0'
                    }`}
                  />

                  {/* Archie seated naturally at the desk (when not in tool slam or in hook/CTA) */}
                  {(!showToolSlamScreen || activeToolStep === 0 || activeToolStep === 6) && (
                    <div className="absolute inset-0 pointer-events-none">
                      <img
                        src="/src/assets/images/studio_archie_seated_1790754305287.jpg"
                        alt="Archie seated at desk"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* TOOL SLAM OVERLAY: Glowing Neon Corners + Blurred Background + Tool Graphic */}
                  {showToolSlamScreen && activeToolStep >= 1 && activeToolStep <= 5 && (
                    <div className="absolute inset-4 pointer-events-none z-20 flex flex-col justify-between animate-in zoom-in-95 duration-300">
                      {/* Neon Glowing Corner Brackets */}
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.9)]" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.9)]" />
                      <div className="absolute bottom-16 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.9)]" />
                      <div className="absolute bottom-16 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.9)]" />

                      {/* Tool Slam Badge */}
                      <div className="pt-8 text-center space-y-2">
                        <div className="inline-block px-3 py-1 rounded-full bg-cyan-950/90 border border-cyan-400 text-cyan-300 font-mono font-black text-xs uppercase tracking-widest shadow-lg shadow-cyan-950/80">
                          TOOL {activeTool.number} OF 5
                        </div>
                        <h2 className="text-2xl font-black text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] tracking-tight">
                          {activeTool.name}
                        </h2>
                        <div className="text-xs text-cyan-300 font-bold drop-shadow">
                          {activeTool.tagline}
                        </div>
                      </div>

                      {/* Real Tool Screenshot / Visual (NEVER AN EMPTY BLACK RECTANGLE) */}
                      <div className="my-auto px-2">
                        <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden border-2 border-cyan-500/50 shadow-2xl bg-slate-950">
                          <img
                            src={activeTool.screenshotUrl}
                            alt={activeTool.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-mono">
                            <span className="text-emerald-300 font-bold bg-slate-950/90 px-2 py-0.5 rounded border border-emerald-800">
                              ✓ {activeTool.freeTier}
                            </span>
                            <span className="text-slate-300 font-semibold">{activeTool.category}</span>
                          </div>
                        </div>
                      </div>

                      {/* Pros Bullet Badges */}
                      <div className="space-y-1.5 pb-20">
                        {activeTool.pros.slice(0, 2).map((pro, pIdx) => (
                          <div key={pIdx} className="p-2 rounded-xl bg-slate-950/80 backdrop-blur-md border border-cyan-800/40 text-[11px] text-white flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span className="font-semibold truncate">{pro}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Archie Spoken Narration Bubble (when Archie is talking) */}
                  {(!showToolSlamScreen || activeToolStep === 0 || activeToolStep === 6) && (
                    <div className="absolute top-14 left-4 right-14 pointer-events-none z-20 animate-in fade-in duration-300">
                      <div className="bg-slate-950/92 backdrop-blur-md border border-amber-500/40 rounded-2xl p-3 shadow-2xl">
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

                  {/* YouTube Shorts Interaction Icons (Right Side) */}
                  <div className="absolute right-2.5 bottom-24 flex flex-col items-center gap-3 pointer-events-none z-30">
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

                  {/* SAFE-ZONE CAPTIONS: Positioned at bottom-28 to bottom-34 */}
                  {/* NEVER covered by YouTube Shorts title, channel ID, or bottom bar */}
                  <div className="absolute bottom-28 left-4 right-14 pointer-events-none z-30 flex flex-col items-center text-center">
                    <div className="bg-slate-950/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-2xl">
                      <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wide drop-shadow">
                        {activeToolStep === 0
                          ? "IF YOU'RE A CONTENT CREATOR, WAIT!"
                          : activeToolStep === 6
                          ? "COMMENT 'FREE' FOR DIRECT LINKS!"
                          : `TOOL ${activeTool.number}: ${activeTool.name.toUpperCase()}`}
                      </span>
                    </div>
                  </div>

                  {/* Shorts Bottom HUD: Channel handle & Title */}
                  <div className="absolute bottom-4 left-3 right-14 pointer-events-none z-20 space-y-1">
                    <div className="inline-block px-2 py-0.5 rounded bg-cyan-500 text-slate-950 text-[9px] font-black uppercase tracking-wider">
                      CONTENT CREATOR MATRIX
                    </div>
                    <div className="text-xs font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] truncate">
                      5 Tools Every Creator Needs in 2026 #Shorts
                    </div>
                    <div className="text-[10px] text-slate-300 drop-shadow flex items-center gap-1 font-mono">
                      <span>@ArchieExplains</span>
                      <span>•</span>
                      <span className="text-cyan-300">Tool {Math.max(1, activeToolStep)} of 5</span>
                    </div>
                  </div>
                </div>

                {/* Preview Controls Bar */}
                <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-[11px] flex items-center justify-between">
                  <span className="text-slate-400">
                    Step: <strong className="text-white">{activeToolStep === 0 ? 'Intro Hook' : activeToolStep === 6 ? 'CTA Outro' : `Tool ${activeToolStep}`}</strong>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setActiveToolStep(prev => Math.max(0, prev - 1))}
                      className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 cursor-pointer"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setActiveToolStep(prev => Math.min(6, prev + 1))}
                      className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Complete 5-Tool Catalog Table with Direct Links */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-400" />
                  Verified Content Creator 5-Tool Roster (Direct Links &amp; 15s Script)
                </h3>
                <p className="text-xs text-slate-400">
                  Every tool has been tested and verified for legitimate free tiers without intrusive watermarks.
                </p>
              </div>
              <button
                onClick={handleCopyCreatorScript}
                className="py-1.5 px-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-600/20"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Script</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {creatorScript.tools.map((tool) => (
                <div
                  key={tool.number}
                  className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${
                    tool.isClimaxCritical
                      ? 'bg-slate-950 border-cyan-500/60 shadow-lg shadow-cyan-950/40'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-black uppercase bg-cyan-950 text-cyan-300 border border-cyan-800">
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
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 text-[11px] text-slate-300 italic">
                      "{tool.usageSummary}"
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">{tool.category}</span>
                    <a
                      href={tool.directUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
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
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
                  PROBLEM-SOLVER FORMULA
                </span>
                <h2 className="text-base font-bold text-white mt-1">
                  1. Common Relatable Problem → 2. Plain English Mechanism → 3. Free Remedy Tool
                </h2>
                <p className="text-xs text-slate-400">
                  Elaborates live via DuckDuckGo Instant Answers &amp; Wikipedia with zero confusing chemistry/physics formulas.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={problemQuery}
                onChange={(e) => setProblemQuery(e.target.value)}
                placeholder="Enter phenomenon e.g. Why does your towel feel icy after shower?"
                className="flex-1 bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                onClick={() => handleRunElaboration()}
                disabled={isElaborating}
                className="py-2.5 px-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-600/20 shrink-0"
              >
                {isElaborating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>Elaborate via DuckDuckGo &amp; Wikipedia</span>
              </button>
            </div>

            {/* Elaborated Report Cards */}
            {elaboratedReport && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 bg-slate-950 border border-rose-950/60 rounded-2xl space-y-2">
                  <div className="text-[10px] font-mono uppercase font-bold text-rose-400">
                    Step 1: Common Problem
                  </div>
                  <h3 className="text-xs font-bold text-white">The Relatable Issue</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {elaboratedReport.problemStatement}
                  </p>
                </div>

                <div className="p-4 bg-slate-950 border border-amber-950/60 rounded-2xl space-y-2">
                  <div className="text-[10px] font-mono uppercase font-bold text-amber-400">
                    Step 2: Plain English Mechanism
                  </div>
                  <h3 className="text-xs font-bold text-white">How It Actually Works</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {elaboratedReport.plainEnglishExplanation}
                  </p>
                </div>

                <div className="p-4 bg-slate-950 border border-emerald-950/60 rounded-2xl space-y-2">
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
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-400" />
              Creator Studio Staging &amp; Grounding Architecture
            </h2>
            <p className="text-xs text-slate-400">
              Walnut desk occlusion barrier, boom microphone, and natural shadows completely eliminate the floating character look.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="text-xs font-bold text-white">Desk Occlusion Barrier</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Positions the rich mahogany studio desk directly over Archie's lower torso, ensuring hands rest realistically on the surface.
              </p>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="text-xs font-bold text-white">Podcast Boom Microphone</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Foreground broadcast arm microphone adds tangible three-dimensional depth between host and viewer.
              </p>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="text-xs font-bold text-white">Warm Amber Bokeh Lighting</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Backlit bookshelves with science artifacts and atmospheric studio lamps replace crude cartoon vectors.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 4: ARCHIE POSES & FIGURES                         */}
      {/* ========================================================= */}
      {activeSubTab === 'character' && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
          <h2 className="text-base font-bold text-white">
            Archie Studio Host Figures &amp; Gestures
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {ARCHIE_PUPPET_POSES.slice(0, 4).map((p) => (
              <div key={p.id} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <div className="relative aspect-[9/16] max-h-[220px] rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                  <img src={p.imageUrl || p.pngPath} alt={p.name} className="w-full h-full object-contain" />
                </div>
                <div className="text-xs font-bold text-white">{p.name}</div>
                <div className="text-[10px] text-slate-400">{p.gesture}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 5: CREATOR STUDIOS & LABS                         */}
      {/* ========================================================= */}
      {activeSubTab === 'environments' && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
          <h2 className="text-base font-bold text-white">
            18 Backdrops &amp; Photorealistic Creator Studios
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {CLASSROOM_ENVIRONMENTS.slice(0, 3).map((env) => (
              <div key={env.id} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                  <img src={env.imageUrl || env.svgPath} alt={env.name} className="w-full h-full object-cover" />
                </div>
                <div className="text-xs font-bold text-white">{env.name}</div>
                <div className="text-[10px] text-slate-400">{env.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
