import React, { useState, useEffect, useRef } from 'react';
import {
  Music,
  Headphones,
  Upload,
  Play,
  Pause,
  Trash2,
  Sparkles,
  Scissors,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Flame,
  Radio,
  BookOpen,
  Film,
  Volume2
} from 'lucide-react';

interface AudioFileItem {
  filename: string;
  sizeBytes: number;
  sizeFormatted: string;
  uploadedAt: string;
  streamUrl: string;
}

interface ChannelAudioStudioProps {
  onSoundSelect?: (url: string) => void;
}

export const ChannelAudioStudio: React.FC<ChannelAudioStudioProps> = ({ onSoundSelect }) => {
  const [selectedChannel, setSelectedChannel] = useState<'motivation_15s' | 'motivation_5s' | 'finance' | 'stoic' | 'movie_brand'>('motivation_15s');
  const [tracks, setTracks] = useState<AudioFileItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Audio Playback State
  const [currentPlayingUrl, setCurrentPlayingUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const channelCards = [
    {
      id: 'motivation_15s' as const,
      label: 'Teen Motivation (15s)',
      subtitle: 'Drift Phonk & High-Energy Drops',
      icon: Flame,
      color: 'amber',
      accentBorder: 'border-amber-500/40',
      accentBg: 'bg-amber-500/10',
      accentText: 'text-amber-400',
      badge: 'Phonk / Gym'
    },
    {
      id: 'motivation_5s' as const,
      label: 'Teen Motivation (5s)',
      subtitle: 'Fast Impact Cuts & Climax Drops',
      icon: Sparkles,
      color: 'orange',
      accentBorder: 'border-orange-500/40',
      accentBg: 'bg-orange-500/10',
      accentText: 'text-orange-400',
      badge: '5s Impact'
    },
    {
      id: 'finance' as const,
      label: 'Finance Blueprint',
      subtitle: 'Ticking Clocks & Sub-Bass Tension',
      icon: Radio,
      color: 'emerald',
      accentBorder: 'border-emerald-500/40',
      accentBg: 'bg-emerald-500/10',
      accentText: 'text-emerald-400',
      badge: 'Tension / Suspense'
    },
    {
      id: 'stoic' as const,
      label: 'Stoic Architect',
      subtitle: 'Grand Piano & Contemplation',
      icon: BookOpen,
      color: 'indigo',
      accentBorder: 'border-indigo-500/40',
      accentBg: 'bg-indigo-500/10',
      accentText: 'text-indigo-400',
      badge: 'Wisdom / Piano'
    },
    {
      id: 'movie_brand' as const,
      label: 'Movie Brand',
      subtitle: 'Cinematic Drones & Atmosphere',
      icon: Film,
      color: 'rose',
      accentBorder: 'border-rose-500/40',
      accentBg: 'bg-rose-500/10',
      accentText: 'text-rose-400',
      badge: 'Cinematic'
    }
  ];

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const fetchChannelTracks = async (channelKey: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/audio-assets?channel=${encodeURIComponent(channelKey)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.files)) {
        setTracks(data.files);
      } else {
        setTracks([]);
      }
    } catch {
      showToast('Unable to load channel audio files', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChannelTracks(selectedChannel);
  }, [selectedChannel]);

  // Audio Playback Handler
  const togglePlay = (streamUrl: string) => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onerror = () => {
        setIsPlaying(false);
        showToast('Playback error on audio stream', 'error');
      };
    }

    const audio = audioRef.current;
    if (currentPlayingUrl === streamUrl && isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.src = streamUrl;
      audio.play().then(() => {
        setCurrentPlayingUrl(streamUrl);
        setIsPlaying(true);
      }).catch(() => {
        showToast('Click play again to start audio playback', 'error');
      });
    }
  };

  // Upload handler with Smart Sweet-Spot Auto-Cutter
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        const res = await fetch('/api/audio-assets/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel: selectedChannel,
            filename: file.name,
            dataBase64: base64Data
          })
        });

        const data = await res.json();
        if (data.success) {
          showToast(`"${file.name}" uploaded and precision cut to 15s & 5s master tracks!`);
          fetchChannelTracks(selectedChannel);
        } else {
          showToast(data.error || 'Upload failed', 'error');
        }
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      showToast(err.message || 'Error processing audio upload', 'error');
      setIsUploading(false);
    }
  };

  // Delete Track Handler
  const handleDeleteTrack = async (filename: string) => {
    try {
      const res = await fetch(`/api/audio-assets?channel=${encodeURIComponent(selectedChannel)}&filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Track "${filename}" removed`);
        fetchChannelTracks(selectedChannel);
      } else {
        showToast(data.error || 'Could not delete track', 'error');
      }
    } catch {
      showToast('Failed to delete audio file', 'error');
    }
  };

  // Synthesize Procedural Stems Handler
  const handleSynthesizeStems = async () => {
    setIsSynthesizing(true);
    try {
      const res = await fetch('/api/audio-assets/synthesize', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('All channel studio tracks (Phonk, Tension, Piano, Risers) regenerated!');
        fetchChannelTracks(selectedChannel);
      } else {
        showToast(data.error || 'Synthesis error', 'error');
      }
    } catch {
      showToast('Error generating studio stems', 'error');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const getTrackBadge = (filename: string) => {
    const fn = filename.toLowerCase();
    if (fn.includes('phonk') || fn.includes('drift')) {
      return { text: 'Phonk Drop', color: 'bg-amber-950/80 text-amber-300 border-amber-800/80' };
    }
    if (fn.includes('workout') || fn.includes('wave')) {
      return { text: 'Workout Phonk', color: 'bg-orange-950/80 text-orange-300 border-orange-800/80' };
    }
    if (fn.includes('riser') || fn.includes('manic')) {
      return { text: 'Tension Riser', color: 'bg-rose-950/80 text-rose-300 border-rose-800/80' };
    }
    if (fn.includes('piano') || fn.includes('reflective')) {
      return { text: 'Grand Piano', color: 'bg-indigo-950/80 text-indigo-300 border-indigo-800/80' };
    }
    if (fn.includes('clock') || fn.includes('ticking')) {
      return { text: 'Suspense Clock', color: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80' };
    }
    if (fn.includes('drone') || fn.includes('sub_bass')) {
      return { text: 'Sub-Bass Drone', color: 'bg-teal-950/80 text-teal-300 border-teal-800/80' };
    }
    if (fn.includes('murder') || fn.includes('mystery') || fn.includes('horror')) {
      return { text: 'Mystery Ambience', color: 'bg-purple-950/80 text-purple-300 border-purple-800/80' };
    }
    return { text: 'Studio Track', color: 'bg-slate-800 text-slate-300 border-slate-700' };
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-semibold ${
          toastMessage.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span className="truncate max-w-xs sm:max-w-md">{toastMessage.text}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="p-5 sm:p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Channel Audio Studio & Sweet-Spot Cutter</h2>
              <p className="text-xs text-slate-400">
                Channel-tailored audio library. Drops, tension, and phonk are automatically trimmed to 15s and 5s master cuts.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSynthesizeStems}
            disabled={isSynthesizing}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-xs font-medium text-slate-200 flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
            title="Generate custom procedural tracks"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSynthesizing ? 'animate-spin text-amber-400' : 'text-slate-400'}`} />
            <span>{isSynthesizing ? 'Mastering Tracks...' : 'Regenerate Stems'}</span>
          </button>
        </div>
      </div>

      {/* Channel Switcher */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {channelCards.map((card) => {
          const Icon = card.icon;
          const isSelected = selectedChannel === card.id;
          return (
            <button
              key={card.id}
              onClick={() => setSelectedChannel(card.id)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? `${card.accentBorder} bg-slate-900 shadow-md ring-1 ring-amber-400/20`
                  : 'border-slate-800 bg-slate-900/50 hover:bg-slate-900/80 hover:border-slate-750'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-1.5 rounded-lg ${card.accentBg} ${card.accentText}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  isSelected ? `${card.accentBg} ${card.accentText} ${card.accentBorder}` : 'bg-slate-800/60 text-slate-400 border-slate-700/50'
                }`}>
                  {card.badge}
                </span>
              </div>
              <div>
                <div className={`text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                  {card.label}
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                  {card.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Drag & Drop Audio Upload Zone with Smart Cutter */}
      <div className="p-4 sm:p-5 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-bold text-white">Direct Audio Upload & Smart Sweet-Spot Cutter</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Target: <strong className="text-amber-300">{channelCards.find(c => c.id === selectedChannel)?.label}</strong>
          </span>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          accept="audio/mp3,audio/wav,audio/m4a,audio/aac,audio/ogg,.mp3,.wav,.m4a"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
            e.target.value = '';
          }}
        />

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) handleFileUpload(file);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
            isUploading
              ? 'border-amber-500 bg-amber-500/5'
              : 'border-slate-750 hover:border-amber-400/60 bg-slate-950/60 hover:bg-slate-950'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="p-3 bg-slate-800/80 rounded-full text-slate-300">
              <Upload className={`w-5 h-5 ${isUploading ? 'animate-bounce text-amber-400' : ''}`} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">
                {isUploading ? 'Processing & Precision Cutting...' : 'Drop your MP3 / WAV audio file here, or click to browse'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-lg mx-auto">
                Files longer than 15s are automatically scanned to detect peak energy and sliced into precision 15-second and 5-second master tracks.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Channel Sound Tracks List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              {channelCards.find(c => c.id === selectedChannel)?.label} Sound Vault ({tracks.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Selected for automated reel production
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-xl">
            <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-amber-400" />
            Loading channel audio tracks...
          </div>
        ) : tracks.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            <Headphones className="w-6 h-6 mx-auto text-slate-500" />
            <p>No audio files currently loaded for this channel.</p>
            <button
              onClick={handleSynthesizeStems}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate Studio Tracks Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {tracks.map((track) => {
              const badge = getTrackBadge(track.filename);
              const isThisPlaying = isPlaying && currentPlayingUrl === track.streamUrl;
              const is15sCut = track.filename.includes('15s');
              const is5sCut = track.filename.includes('5s');

              return (
                <div
                  key={track.filename}
                  className={`p-3.5 bg-slate-900 border rounded-xl flex items-center justify-between gap-3 transition-all ${
                    isThisPlaying ? 'border-amber-500/70 bg-slate-900/90 shadow-md' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => togglePlay(track.streamUrl)}
                      className={`p-2.5 rounded-xl shrink-0 cursor-pointer transition-colors ${
                        isThisPlaying
                          ? 'bg-amber-500 text-slate-950 shadow-md'
                          : 'bg-slate-800 hover:bg-slate-750 text-slate-200'
                      }`}
                      title={isThisPlaying ? 'Pause' : 'Play audio preview'}
                    >
                      {isThisPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-white truncate max-w-[220px] sm:max-w-md">
                          {track.filename}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${badge.color}`}>
                          {badge.text}
                        </span>
                        {is15sCut && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            15s Master
                          </span>
                        )}
                        {is5sCut && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-orange-500/10 text-orange-400 border border-orange-500/30">
                            5s Punch
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>{track.sizeFormatted}</span>
                        <span>•</span>
                        <span>Ready for automation</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {onSoundSelect && (
                      <button
                        onClick={() => onSoundSelect(track.streamUrl)}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium cursor-pointer"
                      >
                        Select
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteTrack(track.filename)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Remove audio track"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Mini Player if track is playing */}
      {isPlaying && currentPlayingUrl && (
        <div className="p-3 bg-slate-900 border border-amber-500/40 rounded-xl flex items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <Volume2 className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
            <span className="text-xs text-slate-300 truncate">
              Playing preview: <strong className="text-white">{currentPlayingUrl.split('/').pop()}</strong>
            </span>
          </div>
          <button
            onClick={() => togglePlay(currentPlayingUrl)}
            className="px-3 py-1 bg-amber-500 text-slate-950 font-bold text-xs rounded-lg shrink-0 cursor-pointer"
          >
            Pause
          </button>
        </div>
      )}
    </div>
  );
};
