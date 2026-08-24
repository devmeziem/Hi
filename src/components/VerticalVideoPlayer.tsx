import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
  Share2,
  ThumbsUp,
  MessageCircle,
  Download,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Music,
  FileText,
  Clapperboard,
  FastForward,
  Layers
} from 'lucide-react';
import { SavedCampaign, VideoSlide } from '../types';

interface VerticalVideoPlayerProps {
  campaign: SavedCampaign | {
    id: string;
    title: string;
    niche: string;
    createdAt?: string;
    videoUrl?: string;
    payload?: {
      channelId?: string;
      topic?: string;
      youtube?: {
        title?: string;
        description?: string;
        tags?: string[];
        slides?: VideoSlide[];
      };
    };
    audioUrl?: string;
    imageUrl?: string;
  };
  onClose?: () => void;
  isOpen?: boolean;
}

export const VerticalVideoPlayer: React.FC<VerticalVideoPlayerProps> = ({
  campaign,
  onClose,
  isOpen = true
}) => {
  if (!isOpen || !campaign) return null;

  const safeTitle = campaign.title || 'Autonomous AI Short Production';
  const safeNiche = campaign.niche || campaign.payload?.channelId || 'finance_saas';
  const rawSlides = campaign.payload?.youtube?.slides;

  const slides: VideoSlide[] = Array.isArray(rawSlides) && rawSlides.length > 0
    ? rawSlides
    : [
        {
          text: safeTitle,
          scriptText: safeTitle,
          imagePrompt: safeTitle,
          imageUrl: (campaign as any).imageUrl || `https://image.pollinations.ai/prompt/${encodeURIComponent(safeTitle + ' 8k vertical 9:16 cinematic luxury photography')}?width=1080&height=1920&nologo=true`,
          durationSeconds: 8,
          effect: 'ken-burns'
        }
      ];

  // If a real MP4 video exists on the campaign, default to true MP4 video mode
  const initialVideoUrl = (campaign as any).videoUrl || null;
  const [videoSrc, setVideoSrc] = useState<string | null>(initialVideoUrl);
  const [playerMode, setPlayerMode] = useState<'video' | 'storyboard'>(initialVideoUrl ? 'video' : 'storyboard');

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [slideProgress, setSlideProgress] = useState(0); // 0 to 100
  const [likes, setLikes] = useState<number>((campaign as any).likes || 48);
  const [hasLiked, setHasLiked] = useState(false);
  const [showScriptDrawer, setShowScriptDrawer] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);

  // Active word-by-word caption states (for storyboard fallback)
  const [activeChunkIndex, setActiveChunkIndex] = useState(0);
  const [visibleWordCount, setVisibleWordCount] = useState(0);
  const [currentSpokenWordIndex, setCurrentSpokenWordIndex] = useState(0);

  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const currentSlide = slides[currentSlideIndex] || slides[0];

  // Channel Identity Map
  const channelMeta = (() => {
    const niche = safeNiche.toLowerCase();
    if (niche.includes('finance') || niche.includes('saas')) {
      return {
        handle: '@bones_ceo',
        name: 'Fin Blueprint',
        avatarBg: 'bg-emerald-600',
        badgeColor: 'text-emerald-400',
        affiliate: 'https://selar.co/m/bones-ceo',
        affiliateLabel: '15k Micro-SaaS Blueprint'
      };
    }
    if (niche.includes('stoic') || niche.includes('motivation')) {
      return {
        handle: '@thestoicarchitect-n4b',
        name: 'The Stoic Architect',
        avatarBg: 'bg-purple-600',
        badgeColor: 'text-purple-400',
        affiliate: 'https://selar.co/m/stoic-fortress',
        affiliateLabel: 'Stoic Fortress Planner'
      };
    }
    return {
      handle: '@bonesceo',
      name: 'Godswill Isaac',
      avatarBg: 'bg-blue-600',
      badgeColor: 'text-blue-400',
      affiliate: 'https://github.com/devmeziem/Voxam',
      affiliateLabel: 'AI Automation Repo'
    };
  })();

  // Server-generated Cloudflare TTS Audio Engine (for storyboard mode)
  const [serverAudioUrl, setServerAudioUrl] = useState<string | null>(
    currentSlide.audioUrl || (campaign as any).audioUrl || null
  );

  // Auto-fetch server-side Cloudflare TTS audio if not already provided
  useEffect(() => {
    if (playerMode === 'video') return;
    let isCancelled = false;
    const narrationText = currentSlide.scriptText || currentSlide.text || safeTitle;

    if (currentSlide.audioUrl) {
      setServerAudioUrl(currentSlide.audioUrl);
      return;
    }

    if ((campaign as any).audioUrl && currentSlideIndex === 0) {
      setServerAudioUrl((campaign as any).audioUrl);
      return;
    }

    fetch('/api/generate-tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: narrationText })
    })
      .then(res => res.json())
      .then(data => {
        if (!isCancelled && data.audioUrl) {
          setServerAudioUrl(data.audioUrl);
        }
      })
      .catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, [currentSlideIndex, currentSlide, safeTitle, (campaign as any).audioUrl, playerMode]);

  // Video Element synchronization
  useEffect(() => {
    if (playerMode === 'video' && videoElementRef.current) {
      videoElementRef.current.playbackRate = playbackRate;
      videoElementRef.current.muted = isMuted;
      if (isPlaying) {
        videoElementRef.current.play().catch(() => {});
      } else {
        videoElementRef.current.pause();
      }
    }
  }, [playerMode, isPlaying, isMuted, playbackRate, videoSrc]);

  // Audio Playback Controller (Storyboard mode)
  useEffect(() => {
    if (playerMode !== 'storyboard' || !audioElementRef.current) return;

    if (serverAudioUrl) {
      audioElementRef.current.src = serverAudioUrl;
      audioElementRef.current.playbackRate = playbackRate;
      audioElementRef.current.muted = isMuted;

      if (isPlaying) {
        audioElementRef.current.play().catch(() => {});
      } else {
        audioElementRef.current.pause();
      }
    }
  }, [serverAudioUrl, isPlaying, isMuted, playbackRate, playerMode]);

  // Storyboard word ticker
  const slideWords = useMemo(() => {
    const raw = currentSlide.scriptText || currentSlide.text || safeTitle;
    return raw.split(/\s+/).filter(Boolean);
  }, [currentSlide, safeTitle]);

  const currentSlideDurationMs = useMemo(() => {
    const calculated = slideWords.length * 520;
    return Math.max(8500, (currentSlide.durationSeconds || 9) * 1000, calculated);
  }, [slideWords.length, currentSlide.durationSeconds]);

  const wordChunks = useMemo(() => {
    const chunks: { chunkIndex: number; words: string[]; startWordIdx: number }[] = [];
    const chunkSize = 3;
    for (let i = 0; i < slideWords.length; i += chunkSize) {
      chunks.push({
        chunkIndex: Math.floor(i / chunkSize),
        words: slideWords.slice(i, i + chunkSize),
        startWordIdx: i
      });
    }
    return chunks.length > 0 ? chunks : [{ chunkIndex: 0, words: [safeTitle], startWordIdx: 0 }];
  }, [slideWords, safeTitle]);

  // Reset slide timer on index change
  useEffect(() => {
    if (playerMode === 'video') return;
    setSlideProgress(0);
    setActiveChunkIndex(0);
    setVisibleWordCount(1);
    setCurrentSpokenWordIndex(0);
    startTimeRef.current = Date.now();
  }, [currentSlideIndex, playerMode]);

  // Storyboard ticker loop
  useEffect(() => {
    if (playerMode === 'video' || !isPlaying) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const updateTimer = () => {
      let progress = 0;
      const elapsed = Date.now() - startTimeRef.current;

      if (audioElementRef.current && !audioElementRef.current.paused && audioElementRef.current.duration > 0) {
        progress = Math.min(100, (audioElementRef.current.currentTime / audioElementRef.current.duration) * 100);
      } else {
        progress = Math.min(100, (elapsed / currentSlideDurationMs) * 100);
      }

      setSlideProgress(progress);

      if (slideWords.length > 0) {
        const wordRatio = progress / 100;
        const estimatedWordIdx = Math.min(slideWords.length - 1, Math.floor(wordRatio * slideWords.length));
        const estimatedChunkIdx = Math.floor(estimatedWordIdx / 3);
        const wordInChunk = (estimatedWordIdx % 3) + 1;

        setActiveChunkIndex(estimatedChunkIdx);
        setVisibleWordCount(wordInChunk);
        setCurrentSpokenWordIndex(estimatedWordIdx);
      }

      if (progress >= 100 || elapsed >= currentSlideDurationMs) {
        if (currentSlideIndex < slides.length - 1) {
          setCurrentSlideIndex(prev => prev + 1);
        } else {
          setCurrentSlideIndex(0);
          if (audioElementRef.current) {
            audioElementRef.current.currentTime = 0;
            audioElementRef.current.play().catch(() => {});
          }
        }
        startTimeRef.current = Date.now();
      } else {
        animationFrameRef.current = requestAnimationFrame(updateTimer);
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateTimer);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, currentSlideIndex, currentSlideDurationMs, slides.length, slideWords.length, playerMode]);

  const handleLike = () => {
    if (!hasLiked) {
      setLikes((prev: number) => prev + 1);
      setHasLiked(true);
    } else {
      setLikes((prev: number) => prev - 1);
      setHasLiked(false);
    }
  };

  const handleCopyMeta = () => {
    const text = `Title: ${safeTitle}\n\nDescription: ${campaign.payload?.youtube?.description || ''}\n\nTags: ${(campaign.payload?.youtube?.tags || []).join(', ')}`;
    navigator.clipboard.writeText(text);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const currentChunk = wordChunks[activeChunkIndex] || wordChunks[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-[980px] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[92vh]">
        
        {/* LEFT COLUMN: 9:16 VERTICAL VIDEO PLAYER CONTAINER */}
        <div className="w-full md:w-[390px] lg:w-[420px] bg-black flex flex-col items-center justify-center relative p-3 sm:p-4 select-none shrink-0">
          
          {/* Top Floating Controls */}
          <div className="absolute top-6 left-6 right-6 z-30 flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-[10px] font-mono text-slate-200 font-medium flex items-center gap-1.5 shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {playerMode === 'video' ? 'Full Rendered MP4' : 'Storyboard View'}
              </span>

              {videoSrc && (
                <button
                  onClick={() => setPlayerMode(m => m === 'video' ? 'storyboard' : 'video')}
                  className="px-2 py-1 rounded-full bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-[10px] font-mono text-indigo-300 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Layers className="w-3 h-3" />
                  {playerMode === 'video' ? 'Storyboard' : 'Watch MP4'}
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPlaybackRate(r => r === 1.0 ? 1.25 : r === 1.25 ? 0.9 : 1.0)}
                className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-mono text-slate-200 hover:bg-black/90 border border-white/10 transition-colors cursor-pointer"
                title="Playback Speed"
              >
                {playbackRate}x
              </button>

              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/90 border border-white/10 transition-colors cursor-pointer shadow-md"
                title={isMuted ? 'Unmute Audio Narration' : 'Mute Audio'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            </div>
          </div>

          {/* 9:16 Aspect Video Stage (Authentic Full MP4 / Ken Burns Stitched Player) */}
          <div className="relative w-full max-w-[340px] aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950 flex flex-col justify-between group">
            
            {playerMode === 'video' && videoSrc ? (
              /* REAL STITCHED MP4 VIDEO WITH BURNED-IN CAPTIONS & AUDIO */
              <div 
                onClick={() => setIsPlaying(!isPlaying)}
                className="absolute inset-0 bg-black flex items-center justify-center cursor-pointer"
              >
                <video
                  ref={videoElementRef}
                  src={videoSrc}
                  loop
                  playsInline
                  autoPlay
                  className="w-full h-full object-cover"
                  onTimeUpdate={(e) => {
                    const v = e.currentTarget;
                    if (v.duration > 0) {
                      setSlideProgress((v.currentTime / v.duration) * 100);
                    }
                  }}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />

                {!isPlaying && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-black/75 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-2xl">
                      <Play className="w-6 h-6 ml-1 text-white" />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* STORYBOARD MULTI-SCENE SLIDE PLAYER */
              <>
                <div className="absolute inset-0 overflow-hidden bg-slate-950">
                  <img
                    key={currentSlideIndex}
                    src={currentSlide.imageUrl || `https://image.pollinations.ai/prompt/${encodeURIComponent((currentSlide.imagePrompt || currentSlide.text || safeTitle) + ' 8k vertical 9:16 photorealistic luxury cinematic studio lighting')}`}
                    alt={currentSlide.text}
                    className="w-full h-full object-cover transition-transform duration-1000 ease-out"
                    style={{
                      transform: isPlaying
                        ? currentSlideIndex % 2 === 0
                          ? 'scale(1.2) translate(-3%, -2%)'
                          : 'scale(1.22) translate(3%, 2%)'
                        : 'scale(1.08)',
                      transition: 'transform 9s cubic-bezier(0.25, 1, 0.5, 1)'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/50 pointer-events-none" />
                </div>

                {/* Top Segmented Progress Bar */}
                <div className="relative z-20 px-3 pt-3 flex items-center gap-1.5 w-full">
                  {slides.map((_, idx) => (
                    <div key={idx} className="flex-1 h-1 bg-white/25 rounded-full overflow-hidden backdrop-blur-sm shadow-sm">
                      <div
                        className="h-full bg-amber-400 transition-all duration-100 ease-linear rounded-full shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                        style={{
                          width:
                            idx < currentSlideIndex
                              ? '100%'
                              : idx === currentSlideIndex
                              ? `${slideProgress}%`
                              : '0%'
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Pinned Top Hook Title (First 4-5 Seconds / Slide 1) */}
                {currentSlideIndex === 0 && (
                  <div className="absolute top-12 inset-x-3 z-30 flex justify-center pointer-events-none animate-fadeIn">
                    <div className="bg-black/92 backdrop-blur-xl border border-amber-400/80 px-3.5 py-1.5 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center gap-2 max-w-[90%] ring-1 ring-amber-400/50">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
                      <span className="text-xs sm:text-sm font-black text-amber-300 tracking-wide uppercase truncate">
                        {safeTitle.replace(/#\w+/g, '').trim()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Subtitle / Caption Box: Centered High-Contrast Drop-Box Pill with Synchronized Word Streaming */}
                <div
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="relative z-20 flex-1 flex flex-col justify-center items-center px-4 cursor-pointer select-none"
                >
                  {/* Stable compact pill container in screen center with high contrast backdrop */}
                  <div className="bg-black/95 backdrop-blur-xl border-2 border-white/30 px-5 py-3 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.98)] min-h-[54px] max-w-[90%] flex items-center justify-center transition-all duration-150 ring-1 ring-white/20">
                    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center">
                      {currentChunk.words.map((word, wIdx) => {
                        const isVisible = wIdx < visibleWordCount;
                        const isCurrentWord = (currentChunk.startWordIdx + wIdx) === currentSpokenWordIndex;
                        if (!isVisible) return null;

                        return (
                          <span
                            key={`${activeChunkIndex}-${wIdx}`}
                            className={`text-base sm:text-lg tracking-wide transition-all duration-100 inline-block ${
                              isCurrentWord
                                ? 'text-[#FFD700] scale-105 font-black drop-shadow-[0_0_14px_rgba(255,215,0,1)]'
                                : 'text-white font-black drop-shadow-[0_2px_6px_rgba(0,0,0,1)]'
                            }`}
                          >
                            {word}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {!isPlaying && (
                    <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-black/85 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-2xl ring-2 ring-white/20">
                      <Play className="w-5 h-5 ml-0.5 text-white" />
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Bottom Footer: Channel Handle & Pinned Link */}
            <div className="relative z-20 p-3.5 space-y-2 pointer-events-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full ${channelMeta.avatarBg} flex items-center justify-center text-white text-[11px] font-extrabold shadow ring-1 ring-white/30`}>
                    {channelMeta.name[0]}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white leading-tight flex items-center gap-1">
                      {channelMeta.handle}
                      <span className="w-3.5 h-3.5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[8px] font-bold">✓</span>
                    </div>
                    <div className="text-[10px] text-slate-300">
                      {channelMeta.name}
                    </div>
                  </div>
                </div>

                <a
                  href={channelMeta.affiliate}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/30 text-[10px] font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>Link in Bio</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>

            {/* Vertical Action Bar (Likes, Script Drawer, Share) */}
            <div className="absolute right-2 bottom-24 z-30 flex flex-col items-center gap-3">
              <button
                onClick={handleLike}
                className={`p-2.5 rounded-full backdrop-blur-md border transition-all cursor-pointer ${
                  hasLiked
                    ? 'bg-rose-600 text-white border-rose-500 scale-110 shadow-lg shadow-rose-600/40'
                    : 'bg-black/70 text-white border-white/15 hover:bg-black/90'
                }`}
                title="Like Short"
              >
                <ThumbsUp className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-bold text-white font-mono drop-shadow">{likes}</span>

              <button
                onClick={() => setShowScriptDrawer(!showScriptDrawer)}
                className={`p-2.5 rounded-full backdrop-blur-md border transition-all cursor-pointer ${
                  showScriptDrawer
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-black/70 text-white border-white/15 hover:bg-black/90'
                }`}
                title="Full Storyboard Narration Script"
              >
                <FileText className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-bold text-white font-mono drop-shadow">Script</span>

              <button
                onClick={handleCopyMeta}
                className="p-2.5 rounded-full bg-black/70 backdrop-blur-md text-white border border-white/15 hover:bg-black/90 transition-all cursor-pointer"
                title="Copy Video Payload"
              >
                {copiedPayload ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              </button>
              <span className="text-[10px] font-bold text-white font-mono drop-shadow">Copy</span>
            </div>
          </div>

          {/* Slide Navigation Controls */}
          <div className="w-full max-w-[340px] flex items-center justify-between gap-2 mt-3">
            <button
              onClick={() => {
                if (currentSlideIndex > 0) setCurrentSlideIndex(prev => prev - 1);
                else setCurrentSlideIndex(slides.length - 1);
              }}
              className="flex-1 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Prev Slide
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-md"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            <button
              onClick={() => {
                if (currentSlideIndex < slides.length - 1) setCurrentSlideIndex(prev => prev + 1);
                else setCurrentSlideIndex(0);
              }}
              className="flex-1 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors"
            >
              Next Slide <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: STORYBOARD BREAKDOWN, TTS ENGINE SELECTOR & MONETIZATION */}
        <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between overflow-y-auto bg-slate-900/90 border-t md:border-t-0 md:border-l border-slate-800 space-y-5">
          
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 text-[10px] font-mono font-bold uppercase">
                  Primary: {channelMeta.name} ({channelMeta.handle})
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {campaign.createdAt ? new Date(campaign.createdAt).toLocaleTimeString() : 'Ready for Channel Sync'}
                </span>
              </div>
              <h2 className="text-base font-extrabold text-white mt-1.5 leading-snug">
                {campaign.title}
              </h2>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Stitched Video Selection Switcher */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
            <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5">
              <Clapperboard className="w-3.5 h-3.5 text-indigo-400" />
              Rendered Production Shorts (Burned-in Captions & Ken Burns)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setVideoSrc('/rendered_videos/stoic_test_cloudflare_aura2.mp4');
                  setPlayerMode('video');
                  setIsPlaying(true);
                }}
                className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                  videoSrc === '/rendered_videos/stoic_test_cloudflare_aura2.mp4' && playerMode === 'video'
                    ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="font-bold font-mono text-[11px] text-emerald-400 mb-0.5">Test 1: Cloudflare Aura-2</div>
                <div className="text-[10px] text-slate-400 line-clamp-1">Rule 1 · Control your perceptions · Aura Helios</div>
              </button>

              <button
                onClick={() => {
                  setVideoSrc('/rendered_videos/stoic_test_edge_christopher.mp4');
                  setPlayerMode('video');
                  setIsPlaying(true);
                }}
                className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                  videoSrc === '/rendered_videos/stoic_test_edge_christopher.mp4' && playerMode === 'video'
                    ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="font-bold font-mono text-[11px] text-sky-400 mb-0.5">Test 2: Edge TTS Christopher</div>
                <div className="text-[10px] text-slate-400 line-clamp-1">Rule 2 · Eliminate nonessential · Deep Masculine</div>
              </button>
            </div>
          </div>

          {/* Slide Deck Storyboard */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Video Storyboard Slides ({slides.length})
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Click slide to inspect
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[140px] overflow-y-auto pr-1">
              {slides.map((slide, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setCurrentSlideIndex(idx);
                    setPlayerMode('storyboard');
                    setIsPlaying(true);
                  }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                    idx === currentSlideIndex && playerMode === 'storyboard'
                      ? 'bg-indigo-950/70 border-indigo-500 shadow-md shadow-indigo-600/20 ring-1 ring-indigo-400'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                    <span className={idx === currentSlideIndex && playerMode === 'storyboard' ? 'text-indigo-300 font-bold' : 'text-slate-500'}>
                      Slide {idx + 1}
                    </span>
                    <span className="text-slate-400">{slide.durationSeconds || 7}s</span>
                  </div>
                  <p className="text-[11px] text-slate-200 line-clamp-2 leading-tight">
                    {slide.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Narration Script & Full Description */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                Narration Script & Verified YouTube Metadata
              </span>
              <button
                onClick={handleCopyMeta}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1 cursor-pointer"
              >
                {copiedPayload ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedPayload ? 'Copied' : 'Copy Payload'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed bg-slate-900/70 p-3 rounded-xl border border-slate-800/60 max-h-[90px] overflow-y-auto">
              {campaign.payload?.youtube?.description ||
                slides.map(s => s.scriptText || s.text).join(' ') ||
                campaign.title}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <a
                href={videoSrc || '/rendered_videos/stoic_test_cloudflare_aura2.mp4'}
                download={`${(safeTitle || 'short').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 20)}_1080x1920.mp4`}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 cursor-pointer transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Full MP4</span>
              </a>

              <a
                href={currentSlide.imageUrl || (campaign as any).imageUrl}
                target="_blank"
                rel="noreferrer"
                download={`${(safeTitle || 'short').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 20)}_frame.jpg`}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Frame</span>
              </a>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyMeta}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 cursor-pointer transition-colors"
              >
                {copiedPayload ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>Copy YouTube Metadata</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden audio element for storyboard audio narration */}
      <audio ref={audioElementRef} className="hidden" />
    </div>
  );
};
