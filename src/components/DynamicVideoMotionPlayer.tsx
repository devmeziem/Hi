import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Sparkles, Volume2, VolumeX, Layers, Music, Youtube } from 'lucide-react';
import { VideoSlide } from '../types';

interface DynamicVideoMotionPlayerProps {
  slides: VideoSlide[];
  audioUrl?: string;
  bgMusicUrl?: string;
  title: string;
  channelName?: string;
  onPostToYouTube?: () => void;
  isPublishingToYt?: boolean;
}

export const DynamicVideoMotionPlayer: React.FC<DynamicVideoMotionPlayerProps> = ({
  slides,
  audioUrl,
  bgMusicUrl,
  title,
  channelName = 'The Stoic Architect',
  onPostToYouTube,
  isPublishingToYt = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  // Total duration calculation
  const totalDuration = Math.max(slides.reduce((acc, s) => acc + (s.durationSeconds || 6), 0), 10);

  // Pre-calculate precise slide timing intervals
  const slideRanges = slides.reduce<{ start: number; end: number; index: number; text: string; words: string[] }[]>((acc, s, idx) => {
    const prevEnd = acc.length > 0 ? acc[acc.length - 1].end : 0;
    const dur = s.durationSeconds || Math.max(Math.round(totalDuration / (slides.length || 1)), 5);
    const words = (s.text || '').split(/\s+/).filter(Boolean);
    acc.push({ start: prevEnd, end: prevEnd + dur, index: idx, text: s.text || '', words });
    return acc;
  }, []);

  // Motion animation classes per slide index using high-performance CSS keyframe animations
  const getMotionAnimationClass = (index: number) => {
    const effects = [
      'animate-motion-zoom-pan',
      'animate-motion-pan-left',
      'animate-motion-pan-right',
      'animate-motion-zoom-top',
      'animate-motion-dramatic'
    ];
    return effects[index % effects.length];
  };

  // Sync slide & audio playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const current = audio.currentTime;
      const dur = audio.duration || totalDuration || 1;
      setCurrentTimeSec(current);
      setProgress((current / dur) * 100);

      // Find current slide
      const currentRange = slideRanges.find(r => current >= r.start && current < r.end);
      if (currentRange && currentRange.index !== currentSlideIndex) {
        setCurrentSlideIndex(currentRange.index);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(100);
      setCurrentSlideIndex(0);
      setCurrentTimeSec(0);
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
        bgMusicRef.current.currentTime = 0;
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [slideRanges, currentSlideIndex, totalDuration]);

  // Synthetic timer fallback if no voiceover audio URL is provided
  useEffect(() => {
    if (audioUrl || !isPlaying) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setIsPlaying(false);
          setCurrentSlideIndex(0);
          setCurrentTimeSec(0);
          if (bgMusicRef.current) {
            bgMusicRef.current.pause();
            bgMusicRef.current.currentTime = 0;
          }
          return 0;
        }
        const next = prev + (100 / (totalDuration * 10));
        const currentSec = (next / 100) * totalDuration;
        setCurrentTimeSec(currentSec);

        const currentRange = slideRanges.find(r => currentSec >= r.start && currentSec < r.end);
        if (currentRange && currentRange.index !== currentSlideIndex) {
          setCurrentSlideIndex(currentRange.index);
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, audioUrl, totalDuration, slideRanges, currentSlideIndex]);

  const togglePlay = () => {
    if (isPlaying) {
      if (audioRef.current) audioRef.current.pause();
      if (bgMusicRef.current) bgMusicRef.current.pause();
    } else {
      if (audioRef.current && audioUrl) {
        audioRef.current.play().catch(() => {});
      }
      if (bgMusicRef.current && bgMusicUrl) {
        bgMusicRef.current.volume = 0.22; // subtle background mix
        bgMusicRef.current.play().catch(() => {});
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      if (isPlaying) audioRef.current.play().catch(() => {});
    }
    if (bgMusicRef.current) {
      bgMusicRef.current.currentTime = 0;
      if (isPlaying && bgMusicUrl) bgMusicRef.current.play().catch(() => {});
    }
    setCurrentSlideIndex(0);
    setCurrentTimeSec(0);
    setProgress(0);
  };

  // Compute 3-to-4 words fast-cycling kinetic subtitles
  const activeRange = slideRanges[currentSlideIndex] || slideRanges[0] || { start: 0, end: 7, words: ['Welcome'] };
  const wordsInSlide = activeRange.words.length > 0 ? activeRange.words : (title || 'Focus and Execute').split(/\s+/);
  const slideDuration = Math.max(activeRange.end - activeRange.start, 1);
  const timeIntoSlide = Math.max(currentTimeSec - activeRange.start, 0);

  // Group slide words into 3-4 word phrases
  const chunkSize = 3;
  const wordChunks: string[][] = [];
  for (let i = 0; i < wordsInSlide.length; i += chunkSize) {
    wordChunks.push(wordsInSlide.slice(i, i + chunkSize));
  }

  // Determine current active chunk
  const chunkDuration = slideDuration / Math.max(wordChunks.length, 1);
  const activeChunkIndex = Math.min(Math.floor(timeIntoSlide / chunkDuration), wordChunks.length - 1);
  const currentChunkWords = wordChunks[activeChunkIndex] || wordChunks[0] || ['Focus', 'And', 'Execute'];

  // Word-level Golden Highlight Index inside the active chunk
  const timeIntoChunk = timeIntoSlide - (activeChunkIndex * chunkDuration);
  const wordTimeStep = chunkDuration / Math.max(currentChunkWords.length, 1);
  const activeWordInChunkIndex = Math.min(Math.floor(timeIntoChunk / wordTimeStep), currentChunkWords.length - 1);

  return (
    <div className="flex flex-col items-center w-full max-w-[340px] mx-auto bg-slate-950 p-3.5 rounded-3xl border border-slate-800 shadow-2xl space-y-3">
      {/* 9:16 Vertical Video Frame */}
      <div className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl select-none group">
        {/* Render Active Slide with Smooth Ken Burns Motion Transition */}
        {slides.map((slide, idx) => {
          const isActive = idx === currentSlideIndex;
          return (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              <img
                src={slide.imageUrl || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1080&q=80'}
                alt={`Slide ${idx + 1}`}
                className={`w-full h-full object-cover ${
                  isActive && isPlaying ? getMotionAnimationClass(idx) : 'scale-100'
                }`}
                referrerPolicy="no-referrer"
              />
            </div>
          );
        })}

        {/* Ambient Top & Bottom Contrast Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60 z-20 pointer-events-none p-4 flex flex-col justify-between" />

        {/* Top Overlay Badges */}
        <div className="absolute top-3 inset-x-3 z-30 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-mono text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>9:16 KINETIC MOTION</span>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-300">
            <Layers className="w-3 h-3 text-indigo-400" />
            <span>SLIDE {currentSlideIndex + 1}/{slides.length}</span>
          </div>
        </div>

        {/* 3-4 Word Dynamic Kinetic Subtitles Positioned Underneath Post Content */}
        <div className="absolute bottom-8 inset-x-2 z-30 flex flex-col items-center text-center pointer-events-none px-2">
          <div className="inline-flex items-center justify-center flex-wrap gap-1.5 px-3.5 py-2 rounded-xl bg-black/95 backdrop-blur-md border border-slate-700/80 shadow-[0_8px_25px_rgba(0,0,0,0.95)] max-w-[92%] transition-all duration-100">
            {currentChunkWords.map((w, wIdx) => {
              const isGoldenWord = wIdx === activeWordInChunkIndex;
              return (
                <span
                  key={wIdx}
                  className={`text-[13px] sm:text-[14px] font-black uppercase tracking-wider transition-all duration-100 ${
                    isGoldenWord
                      ? 'text-amber-400 scale-105 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)] underline decoration-amber-400 decoration-2 underline-offset-2'
                      : 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)]'
                  }`}
                >
                  {w}
                </span>
              );
            })}
          </div>
        </div>

        {/* Live Playback Progress Bar */}
        <div className="absolute bottom-0 inset-x-0 h-1.5 bg-slate-900/80 z-30">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-indigo-500 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Center Play Overlay when Paused */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-black/70 backdrop-blur-md border border-white/30 flex items-center justify-center text-white z-30 hover:scale-110 transition-transform cursor-pointer shadow-2xl"
          >
            <Play className="w-6 h-6 fill-white translate-x-0.5" />
          </button>
        )}
      </div>

      {/* Hidden Audio Elements */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          muted={isMuted}
          preload="auto"
          className="hidden"
        />
      )}

      {bgMusicUrl && (
        <audio
          ref={bgMusicRef}
          src={bgMusicUrl}
          loop
          muted={isMuted}
          preload="auto"
          className="hidden"
        />
      )}

      {/* Media Player Controls */}
      <div className="w-full space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
          <span className="truncate max-w-[170px]">{channelName}</span>
          <span className="text-emerald-400 font-bold">
            Slide {currentSlideIndex + 1} of {slides.length}
          </span>
        </div>

        {/* Control Buttons Bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-900/30 transition-all cursor-pointer"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause Motion</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Play 9:16 Video</span>
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            title="Replay from Slide 1"
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {(audioUrl || bgMusicUrl) && (
            <button
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? 'Unmute' : 'Mute'}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          )}
        </div>

        {/* Direct Post to YouTube Button */}
        {onPostToYouTube && (
          <button
            onClick={onPostToYouTube}
            disabled={isPublishingToYt}
            className="w-full py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-950/50 transition-all cursor-pointer disabled:opacity-50"
          >
            {isPublishingToYt ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Publishing to YouTube Channel...</span>
              </>
            ) : (
              <>
                <Youtube className="w-4 h-4 fill-white text-white" />
                <span>Post Directly to YouTube ({channelName})</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
