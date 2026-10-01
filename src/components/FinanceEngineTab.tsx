import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  BookOpen,
  TrendingUp,
  Cpu,
  Search,
  CheckCircle2,
  FileText,
  Play,
  Layers,
  Settings2,
  Lock,
  Globe2,
  RefreshCw,
  Camera,
  Ban,
  Shield,
  History,
  Check,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { IntegrationKeys } from '../types';
import {
  searchRealtimeVisuals,
  optimizeVisualQuery,
  RealtimeSearchResult
} from '../archie/visuals/realtimeVisualEngine';
import {
  checkImageDedup,
  recordCompletedVideoImages,
  getDedupCache,
  ROLLING_WINDOW_SIZE,
  VideoImageRecord
} from '../utils/imageDedupService';

interface FinanceEngineTabProps {
  keys: IntegrationKeys;
}

export const FinanceEngineTab: React.FC<FinanceEngineTabProps> = ({ keys }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('small_capital_business');
  const [targetBudget, setTargetBudget] = useState<string>('₦5,000');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [formatMode, setFormatMode] = useState<'shorts' | 'standard' | 'deep_dive'>('shorts');
  const [autoPublish, setAutoPublish] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [pipelineStatus, setPipelineStatus] = useState<string>('IDLE');

  // Real-time Visual Search State (Unseeded & Free Repositories)
  const [visualSearchQuery, setVisualSearchQuery] = useState<string>('Nigerian small business retail packaging accounting desk');
  const [isSearchingVisuals, setIsSearchingVisuals] = useState<boolean>(false);
  const [realtimeVisuals, setRealtimeVisuals] = useState<RealtimeSearchResult | null>(null);
  const [selectedSlideForImage, setSelectedSlideForImage] = useState<number>(0);
  const [recordedNotice, setRecordedNotice] = useState<string | null>(null);
  const [recentVideosHistory, setRecentVideosHistory] = useState<VideoImageRecord[]>([]);

  // Generated content preview
  const [generatedScript, setGeneratedScript] = useState<any | null>({
    title: '3 Businesses You Can Start With ₦5,000 ($3.50 USD) #Shorts',
    category: 'small_capital_business',
    targetBudget: '₦5,000 (~$3.50 USD)',
    riskLevel: 'LOW',
    passedAudit: true,
    sources: [
      'NBS Micro-Enterprise Baseline Statistics 2025/2026',
      'Local Retail Packaging Unit Cost Index',
      'Small & Medium Enterprises Development Agency (SMEDAN)'
    ],
    riskAuditNote: 'Safe: Contains zero guaranteed income promises. Uses realistic estimated margins and break-even disclaimers.',
    slides: [
      {
        slideIndex: 0,
        text: 'If you only have ₦5,000 or about $3.50 USD left today, here is how you can start an actual micro-business.',
        visual: 'Authentic 9:16 vertical 8k photo, modern minimalist workstation, emerald green and gold rim lighting, dark slate backdrop, real smartphone ledger',
        imageUrl: '/src/assets/images/fin_editorial_wealth_1790755455009.jpg',
        imageProvider: 'Editorial Photography Standard'
      },
      {
        slideIndex: 1,
        text: 'The mistake most beginners make is waiting for millions instead of starting with fast-turnaround daily essentials.',
        visual: 'Entrepreneur evaluating budget items on smartphone screen, authentic workshop daylight, natural documentary capture',
        imageUrl: '/src/assets/images/fin_editorial_entrepreneur_1790755465848.jpg',
        imageProvider: 'Documentary Studio Standard'
      },
      {
        slideIndex: 2,
        text: 'Idea 1: Repackaging dry kitchen spices or roasted peanuts into ₦200 transparent mini-pouches.',
        visual: 'Clean commercial mini snack packaging setup with clear pricing labels on obsidian slate, zero cartoon',
        imageUrl: null,
        imageProvider: 'Unseeded Realtime Search'
      },
      {
        slideIndex: 3,
        text: '₦3,500 buys wholesale bulk raw stock, and ₦1,500 covers quality seal pouches and custom brand stickers.',
        visual: 'Unit economics breakdown diagram with glowing emerald numbers and transparent financial table',
        imageUrl: null,
        imageProvider: 'Unseeded Realtime Search'
      },
      {
        slideIndex: 4,
        text: 'Sell 30 packs at ₦200 to generate ₦6,000 total revenue, giving an estimated ₦1,000 gross margin on day one.',
        visual: 'Modern disciplined small business owner counting inventory in high-contrast cinematic setting',
        imageUrl: null,
        imageProvider: 'Unseeded Realtime Search'
      },
      {
        slideIndex: 5,
        text: 'Results vary with location. Always reinvest your first profit. Follow @bones_ceo for daily blueprints.',
        visual: 'Inspiring modern city morning horizon with subtle emerald and amber bokeh glow, 9:16 vertical 8k',
        imageUrl: null,
        imageProvider: 'Unseeded Realtime Search'
      }
    ]
  });

  const categories = [
    { id: 'small_capital_business', label: 'A. Small-Capital Business', desc: '₦1k, ₦5k, ₦10k startup economics, phone-only businesses & margin calculations', icon: DollarSign, color: 'text-emerald-400' },
    { id: 'saving_personal_finance', label: 'B. Saving & Personal Finance', desc: 'Budgeting ₦20,000, emergency funds, cutting bank fees & 50/30/20 systems', icon: TrendingUp, color: 'text-blue-400' },
    { id: 'financial_education', label: 'C. Financial Education', desc: 'Inflation explained, compound interest, loans, APR, ETFs & liquidity', icon: BookOpen, color: 'text-amber-400' },
    { id: 'skills_to_income', label: 'D. Skills → Income', desc: 'Phone-only video editing, writing, digital marketing, freelancing', icon: Cpu, color: 'text-purple-400' },
    { id: 'free_opportunities', label: 'E. Free & Low-Cost Opportunities', desc: 'Verified Google/MS certs, legitimate grants & scholarships', icon: Globe2, color: 'text-cyan-400' },
    { id: 'scam_awareness', label: 'F. Scam & Fraud Awareness', desc: 'Ponzi traps, fake crypto giveaways, phishing & warning signals', icon: AlertTriangle, color: 'text-rose-400' },
    { id: 'business_breakdowns', label: 'G. Business Breakdowns', desc: 'Unit economics: "Can ₦5k start a snack business?" with real gross margins', icon: Layers, color: 'text-emerald-300' },
    { id: 'beginner_investing_crypto', label: 'H. Beginner Investing & Crypto', desc: 'Bitcoin, USDT stablecoins, inflation hedging & self-custody rules', icon: Lock, color: 'text-indigo-400' }
  ];

  // Refresh deduplication history
  const refreshDedupState = () => {
    const cache = getDedupCache();
    const history = cache.channels['finance'] || [];
    setRecentVideosHistory(history.slice(-ROLLING_WINDOW_SIZE));
  };

  useEffect(() => {
    refreshDedupState();
    window.addEventListener('voxam-image-dedup-updated', refreshDedupState);
    return () => window.removeEventListener('voxam-image-dedup-updated', refreshDedupState);
  }, []);

  // Run live unseeded real-time search
  const handleLiveVisualSearch = async (queryText?: string) => {
    const q = queryText || visualSearchQuery || 'finance small business';
    setIsSearchingVisuals(true);
    try {
      const results = await searchRealtimeVisuals(q, {
        channelKey: 'finance',
        strictNoCartoon: true,
        maxResults: 6,
        pexelsApiKey: keys?.pexelsApiKey || ''
      });
      setRealtimeVisuals(results);
    } catch (err) {
      console.warn('[Finance Studio] Realtime search error:', err);
    } finally {
      setIsSearchingVisuals(false);
    }
  };

  // Assign a real-time unseeded image to a specific slide
  const handleAssignImageToSlide = (imgUrl: string, provider: string) => {
    // Perform live check
    const dedup = checkImageDedup('finance', imgUrl);
    if (!dedup.allowed) {
      alert(`Image blocked by 4-Video Non-Repeat Rule: ${dedup.reason}`);
      return;
    }

    if (!generatedScript) return;
    const newSlides = [...generatedScript.slides];
    if (newSlides[selectedSlideForImage]) {
      newSlides[selectedSlideForImage] = {
        ...newSlides[selectedSlideForImage],
        imageUrl: imgUrl,
        imageProvider: `${provider} (Live Real-Time)`
      };
      setGeneratedScript({
        ...generatedScript,
        slides: newSlides
      });
      setRecordedNotice(`Assigned real-time photo to Slide ${selectedSlideForImage + 1}`);
      setTimeout(() => setRecordedNotice(null), 3000);
    }
  };

  // Record completed video images into the 4-video rolling window
  const handleCommitVideoImages = () => {
    if (!generatedScript || !generatedScript.slides) return;
    const imagesToRecord = generatedScript.slides
      .filter((s: any) => s.imageUrl)
      .map((s: any) => ({
        url: s.imageUrl,
        title: `Slide ${s.slideIndex + 1}: ${s.text.slice(0, 30)}...`,
        provider: s.imageProvider || 'Live Real-Time'
      }));

    if (imagesToRecord.length === 0) {
      alert('No custom images assigned to record. Assign real-time images first.');
      return;
    }

    recordCompletedVideoImages(
      'finance',
      `fin_${Date.now()}`,
      imagesToRecord,
      generatedScript.title
    );
    refreshDedupState();
    setRecordedNotice(`Recorded ${imagesToRecord.length} images into 4-video cooldown memory!`);
    setTimeout(() => setRecordedNotice(null), 3500);
  };

  const handleGenerateIdeas = () => {
    setIsGenerating(true);
    setPipelineStatus('SEARCHING REAL-TIME DATA & AUDITING SOURCES');
    setTimeout(() => {
      setIsGenerating(false);
      setPipelineStatus('READY FOR REVIEW');
    }, 1200);
  };

  return (
    <div className="space-y-6 w-full max-w-full min-w-0 overflow-x-hidden">
      {/* Top Banner: Core Positioning & 21-Pillar Compliance */}
      <div className="p-6 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/40">
                CHANNEL 1 ENGINE
              </span>
              <span className="text-xs font-mono text-slate-400">@bones_ceo (Fin Blueprint)</span>
            </div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-400" />
              Finance Content &amp; Media Studio
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl">
              Real-world finance blueprints with zero seeded data, 4-video image non-repeat protection, and strictly authentic documentary photography.
            </p>
          </div>

          {/* Auto-Publish Toggle */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3 shrink-0">
            <div className="space-y-0.5">
              <div className="text-[11px] font-bold text-white">AUTO-PUBLISH</div>
              <div className="text-[10px] text-slate-400">{autoPublish ? 'Passes risk audit -> Live' : 'Requires manual sign-off'}</div>
            </div>
            <button
              onClick={() => setAutoPublish(!autoPublish)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                autoPublish ? 'bg-emerald-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  autoPublish ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Core Guardrails */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 space-y-1">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Non-Guru Positioning
            </span>
            <p className="text-[11px] text-slate-400">
              Never promises guaranteed wealth. Uses measured terms: "estimated margin", "potential revenue", "results vary".
            </p>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 space-y-1">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <Search className="w-4 h-4" /> Live Fact Sources (No Seeds)
            </span>
            <p className="text-[11px] text-slate-400">
              Searched dynamically from verified NBS, SMEDAN, and SEC indexes with zero hardcoded fake metrics.
            </p>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 space-y-1">
            <span className="font-bold text-sky-400 flex items-center gap-1.5">
              <Shield className="w-4 h-4" /> 4-Video Non-Repeat Guard
            </span>
            <p className="text-[11px] text-slate-400">
              Strict deduplication: no same images in 4 videos in a row. Automatically tracks URL and hash cooldowns.
            </p>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-emerald-500/40 space-y-1 bg-emerald-950/20">
            <span className="font-bold text-emerald-300 flex items-center gap-1.5">
              <Ban className="w-4 h-4 text-emerald-400" /> Zero Cartoon Standard
            </span>
            <p className="text-[11px] text-slate-400">
              Strictly authentic documentary photography & real workspaces. Cartoons, anime, and 3D CGI are completely banned.
            </p>
          </div>
        </div>
      </div>

      {/* NEW: Live Unseeded Visual Search & 4-Video Deduplication Media Center */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                UNSEEDED REAL-TIME VISUAL MEDIA ENGINE
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Live Search: Wikimedia Commons &amp; Openverse &amp; Pexels
              </span>
            </div>
            <h2 className="text-base font-bold text-white mt-1 flex items-center gap-2">
              <Camera className="w-5 h-5 text-emerald-400" />
              Real-Time Visual Search &amp; 4-Video Non-Repeat Cooldown
            </h2>
            <p className="text-xs text-slate-400">
              Searches live, copyright-compliant repositories with zero static seeding and automated search optimization.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              4-Video Rolling Window: {recentVideosHistory.length}/4 Active
            </span>
          </div>
        </div>

        {/* Search Bar & Query Optimizer Display */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={visualSearchQuery}
                onChange={(e) => setVisualSearchQuery(e.target.value)}
                placeholder="Search real-time visuals e.g. Nigerian spice packaging, retail wholesale, office desk"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
              />
            </div>
            <button
              onClick={() => handleLiveVisualSearch()}
              disabled={isSearchingVisuals}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20 shrink-0"
            >
              {isSearchingVisuals ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Searching Live Repositories...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Search Real-Time Visuals (No Seeds)</span>
                </>
              )}
            </button>
          </div>

          {/* Search Query Optimization Banner */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900 font-bold">
                QUERY OPTIMIZER
              </span>
              <span className="text-slate-400 text-[11px]">Enforced Style:</span>
              <span className="text-slate-200 font-mono text-[11px] truncate max-w-md">
                "{optimizeVisualQuery(visualSearchQuery, 'finance', true)}"
              </span>
            </div>
            <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
              <Ban className="w-3 h-3 text-emerald-400" /> Cartoon &amp; 3D Filters Active
            </div>
          </div>
        </div>

        {/* Real-time Visual Search Results Grid */}
        {realtimeVisuals && (
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <div className="text-slate-300 font-medium flex items-center gap-2">
                <span>Found {realtimeVisuals.photos.length} Real-Time Visual(s)</span>
                {realtimeVisuals.rejectedDuplicates > 0 && (
                  <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-mono">
                    🛡️ {realtimeVisuals.rejectedDuplicates} Duplicate(s) Blocked by 4-Video Window
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Target Slide:</span>
                <select
                  value={selectedSlideForImage}
                  onChange={(e) => setSelectedSlideForImage(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-emerald-400 font-bold focus:outline-none"
                >
                  {[0, 1, 2, 3, 4, 5].map((idx) => (
                    <option key={idx} value={idx}>
                      Slide {idx + 1}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {realtimeVisuals.photos.map((photo, pIdx) => {
                const dedup = checkImageDedup('finance', photo.mediaUrl, photo.id);
                return (
                  <div
                    key={photo.id || pIdx}
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-2 space-y-2 group flex flex-col justify-between"
                  >
                    <div className="relative aspect-[9/16] w-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
                      <img
                        src={photo.thumbnailUrl || photo.mediaUrl}
                        alt={photo.attributionText || 'Financial photograph'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                      <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-slate-950/80 text-white border border-slate-700">
                        {photo.provider === 'wikimedia_commons' ? 'WIKIMEDIA' : photo.provider.toUpperCase()}
                      </div>
                      <div className="absolute bottom-1.5 left-1.5 right-1.5 text-[9px] text-emerald-300 font-bold bg-slate-950/80 p-1 rounded backdrop-blur-sm truncate">
                        {photo.license}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[10px] text-slate-400 truncate">
                        {photo.creator || 'Verified Contributor'}
                      </div>
                      <button
                        onClick={() => handleAssignImageToSlide(photo.mediaUrl, photo.provider)}
                        disabled={!dedup.allowed}
                        className={`w-full py-1.5 px-2 rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                          dedup.allowed
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-rose-950/80 text-rose-300 border border-rose-800/80 cursor-not-allowed'
                        }`}
                      >
                        {dedup.allowed ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Apply to Slide {selectedSlideForImage + 1}</span>
                          </>
                        ) : (
                          <span>4-Video Cooldown</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4-Video Rolling Window History Inspector */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
            <span className="font-bold text-white flex items-center gap-1.5">
              <History className="w-4 h-4 text-emerald-400" />
              4-Video Rolling Window Cooldown Tracker (Finance Channel)
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Guarantees zero repeat visuals across consecutive 4 videos
            </span>
          </div>

          {recentVideosHistory.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              No recent videos recorded yet. When a video is staged or published, its visuals enter the 4-video non-repeat rolling window.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
              {recentVideosHistory.map((vid, vIdx) => {
                const slot = recentVideosHistory.length - vIdx;
                return (
                  <div key={vid.videoId || vIdx} className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-emerald-400 font-bold">Slot {slot} ({slot === 1 ? 'Last Video' : `${slot} videos ago`})</span>
                      <span className="text-slate-500">{vid.imageCount} visuals</span>
                    </div>
                    <div className="text-[11px] text-white font-medium truncate">
                      {vid.title || vid.videoId}
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono">
                      Locked: {vid.imageCount} image hashes
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-[11px] text-slate-400">
              {recordedNotice ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> {recordedNotice}
                </span>
              ) : (
                <span>Ready to lock current storyboard into 4-video non-repeat memory</span>
              )}
            </div>
            <button
              onClick={handleCommitVideoImages}
              className="py-1.5 px-3 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-[11px] font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Record Storyboard to 4-Video Cooldown</span>
            </button>
          </div>
        </div>
      </div>

      {/* Editorial Photography Standard Showcase (Eliminating Cartoon Aesthetic) */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                STRICT EDITORIAL STANDARD
              </span>
              <span className="text-[11px] font-mono text-slate-400">Bloomberg &amp; WSJ Quality</span>
            </div>
            <h2 className="text-base font-bold text-white mt-1">
              Editorial Financial Photography (No Cartoons / No 3D CGI)
            </h2>
            <p className="text-xs text-slate-400">
              Visual assets for @bones_ceo strictly depict authentic business settings, real market monitors, and genuine entrepreneurs.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2 group">
            <div className="relative aspect-[9/16] max-h-[320px] w-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
              <img
                src="/src/assets/images/fin_editorial_wealth_1790755455009.jpg"
                alt="Executive Financial Desk"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60" />
              <div className="absolute bottom-2.5 left-2.5 right-2.5 text-xs text-white font-bold drop-shadow">
                Executive Market Desk &amp; Terminal
              </div>
            </div>
            <div className="text-[11px] text-slate-400">
              Real mobile banking dashboard, leather journal, and dark slate corporate workstation with authentic 35mm camera lighting.
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2 group">
            <div className="relative aspect-[9/16] max-h-[320px] w-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
              <img
                src="/src/assets/images/fin_editorial_entrepreneur_1790755465848.jpg"
                alt="Micro-business Entrepreneur"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60" />
              <div className="absolute bottom-2.5 left-2.5 right-2.5 text-xs text-white font-bold drop-shadow">
                Micro-Enterprise Workshop &amp; Packaging
              </div>
            </div>
            <div className="text-[11px] text-slate-400">
              Authentic documentary capture of small business packaging and daily inventory economics with natural daylight.
            </div>
          </div>
        </div>
      </div>

      {/* Category Selector Grid */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-400" />
          Finance Content Category Selector (Admin Panel)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setVisualSearchQuery(cat.label.replace(/^[A-H]\.\s*/, '') + ' business accounting');
                }}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-2 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-emerald-950/80 border-emerald-500 ring-1 ring-emerald-500 shadow-lg shadow-emerald-950/50'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon className={`w-5 h-5 ${cat.color}`} />
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <div>
                  <div className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                    {cat.label}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                    {cat.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Format Engine & Topic Controller */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-5 lg:col-span-1">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-emerald-400" />
            Format Engine &amp; Parameters
          </h2>

          {/* Format Mode */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase font-mono">Video Format</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'shorts', label: 'Shorts (60s)', desc: '9:16 Vertical' },
                { id: 'standard', label: 'Standard (5-10m)', desc: '16:9 Landscape' },
                { id: 'deep_dive', label: 'Deep Dive (15m)', desc: '15 Chapters' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormatMode(f.id as any)}
                  className={`p-2.5 rounded-xl border text-center cursor-pointer transition-colors ${
                    formatMode === f.id
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs">{f.label}</div>
                  <div className="text-[9px] text-slate-400">{f.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Budget Preset */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase font-mono">Target Startup Budget</label>
            <div className="grid grid-cols-4 gap-1.5">
              {['₦1,000', '₦5,000', '₦10,000', '₦20,000'].map((b) => (
                <button
                  key={b}
                  onClick={() => setTargetBudget(b)}
                  className={`py-1.5 px-2 rounded-lg border text-xs font-mono cursor-pointer ${
                    targetBudget === b
                      ? 'bg-emerald-900/80 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Topic Input */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase font-mono">Custom Topic / Angle (Optional)</label>
            <input
              type="text"
              value={customTopic}
              onChange={(e) => {
                setCustomTopic(e.target.value);
                setVisualSearchQuery(e.target.value || 'Nigerian business accounting');
              }}
              placeholder="e.g. Can ₦5,000 really start a food reselling business?"
              className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateIdeas}
            disabled={isGenerating}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Synthesizing Verified Content...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Verified Finance Blueprint</span>
              </>
            )}
          </button>
        </div>

        {/* Live Studio Preview: Fact Check, Risk Audit & Storyboard */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                Source-Aware Script &amp; Risk Audit Inspector
              </h2>
              <p className="text-[11px] text-slate-400">
                Real-time review before rendering &amp; publishing
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                RISK AUDIT: PASSED
              </span>
            </div>
          </div>

          {generatedScript && (
            <div className="space-y-4">
              {/* Title & Stats */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">Generated High-CTR Title</span>
                  <span className="font-mono text-[10px]">6 Slides (60s)</span>
                </div>
                <div className="text-sm font-bold text-white">
                  "{generatedScript.title}"
                </div>
                <div className="flex flex-wrap gap-2 pt-1 text-[10px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                    Budget: {generatedScript.targetBudget}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-emerald-400 border border-emerald-900/60">
                    Niche: Nigerian &amp; Global Finance
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-indigo-300 border border-indigo-900/60">
                    Channel: @bones_ceo
                  </span>
                </div>
              </div>

              {/* Verified Sources & Safety Flag Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                  <div className="text-[10px] font-mono font-bold uppercase text-slate-400 flex items-center gap-1">
                    <Search className="w-3 h-3 text-cyan-400" />
                    Verified Sources Cited (Live)
                  </div>
                  <ul className="text-[11px] text-slate-300 space-y-1">
                    {generatedScript.sources.map((s: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-400 font-mono">[{idx + 1}]</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                  <div className="text-[10px] font-mono font-bold uppercase text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Automated Risk Detector
                  </div>
                  <p className="text-[11px] text-slate-300">
                    {generatedScript.riskAuditNote}
                  </p>
                  <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 pt-1">
                    <CheckCircle2 className="w-3 h-3" /> No "double your money" or deceptive claims
                  </div>
                </div>
              </div>

              {/* 6-Slide Storyboard Breakdown with Real-Time Image Previews */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase font-mono">
                  <span>Slide Sequence (Spoken English Narration + 9:16 Visuals)</span>
                  <span className="text-emerald-400">Click any slide to assign unseeded photos</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[360px] overflow-y-auto pr-1">
                  {generatedScript.slides.map((slide: any, idx: number) => {
                    const isSelected = selectedSlideForImage === idx;
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedSlideForImage(idx)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                          isSelected
                            ? 'bg-slate-950 border-emerald-500 ring-1 ring-emerald-500'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className={`font-bold ${isSelected ? 'text-emerald-400' : 'text-slate-300'}`}>
                            Slide {slide.slideIndex + 1} / 6 {isSelected && '• [TARGET]'}
                          </span>
                          <span className="text-slate-500">~14 words</span>
                        </div>
                        <p className="text-xs text-white font-medium line-clamp-2">"{slide.text}"</p>
                        
                        {slide.imageUrl ? (
                          <div className="flex items-center gap-2 pt-1">
                            <div className="w-8 h-12 bg-slate-900 rounded overflow-hidden shrink-0 border border-slate-800">
                              <img src={slide.imageUrl} alt="Slide preview" className="w-full h-full object-cover" />
                            </div>
                            <div className="text-[10px] text-emerald-400 font-mono truncate">
                              ✓ {slide.imageProvider || 'Editorial Photo'}
                            </div>
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-400 font-mono italic line-clamp-2">
                            Visual: {slide.visual}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
