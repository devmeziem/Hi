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
  Sliders
} from 'lucide-react';

interface MotivationReel {
  id: string;
  title: string;
  hook?: string;
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

export const TeenMotivationTab: React.FC = () => {
  const [reels, setReels] = useState<MotivationReel[]>([]);
  const [selectedReel, setSelectedReel] = useState<MotivationReel | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderingFormat, setRenderingFormat] = useState<string>('');
  const [toast, setToast] = useState<string | null>(null);

  // Audio Vault State
  const [audioChannel, setAudioChannel] = useState<'mindrush' | 'motivation_15s' | 'motivation_5s'>('mindrush');
  const [audioAssets, setAudioAssets] = useState<AudioAsset[]>([]);
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState<boolean>(false);
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

    const defaultReels: MotivationReel[] = [
      {
        id: 'teen_motivation_latest',
        title: 'Them: "You will never make it" vs Reality',
        hook: 'Them: "You\'re never gonna happen"',
        challenge: 'Me: "Keep projecting your own indolence onto my trajectory"',
        videoPath: '/rendered_videos/teen_motivation_latest.mp4',
        duration: 15.0,
        tags: ['#TeenMotivation', '#LockIn', '#Discipline', '#Shorts'],
        createdAt: new Date().toISOString()
      },
      {
        id: 'teen_5s_sample',
        title: '5-Second Rapid Discipline Punch',
        hook: 'Your future self is begging you to lock in today.',
        challenge: 'Show up regardless of your mood.',
        videoPath: '/test_artifacts/motivation_reels/teen_motivation_lock_in_exam_study.mp4',
        duration: 5.0,
        tags: ['#Discipline', '#StudyShorts', '#HardWork'],
        createdAt: new Date(Date.now() - 3600000).toISOString()
      }
    ];

    setReels(defaultReels);
    setSelectedReel(defaultReels[0]);
  };

  const loadAudioAssets = async (channelKey: string) => {
    setIsLoadingAudio(true);
    try {
      const res = await fetch(`/api/audio-assets?channel=${channelKey}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.files)) {
          setAudioAssets(data.files);
        }
      }
    } catch (e) {
      console.warn('Failed to load audio assets:', e);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  useEffect(() => {
    loadReels();
    loadAudioAssets(audioChannel);
  }, []);

  const handleChannelSwitch = (channelKey: 'mindrush' | 'motivation_15s' | 'motivation_5s') => {
    setAudioChannel(channelKey);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setPlayingAudioUrl(null);
    }
    loadAudioAssets(channelKey);
  };

  const handleAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(mp3|wav|m4a|aac|ogg)$/i)) {
      setToast('Please select a valid audio file (.mp3, .wav, .m4a, .aac)');
      setTimeout(() => setToast(null), 4000);
      return;
    }

    setIsUploadingAudio(true);
    setToast(`Uploading sound track "${file.name}" to 15s sound vault...`);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await fetch('/api/audio-assets/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel: audioChannel,
            filename: file.name,
            dataBase64: base64
          })
        });

        const data = await res.json();
        if (data.success) {
          setToast(`Audio track "${data.filename}" saved to ${audioChannel}!`);
          loadAudioAssets(audioChannel);
        } else {
          setToast(`Upload failed: ${data.error || 'Server error'}`);
        }
        setIsUploadingAudio(false);
        setTimeout(() => setToast(null), 4000);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setToast(`Upload error: ${err.message}`);
      setIsUploadingAudio(false);
      setTimeout(() => setToast(null), 4000);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAudio = async (filename: string) => {
    if (playingAudioUrl?.includes(filename) && audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setPlayingAudioUrl(null);
    }

    try {
      const res = await fetch(`/api/audio-assets?channel=${audioChannel}&filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setToast(`Removed ${filename}`);
        setAudioAssets(prev => prev.filter(a => a.filename !== filename));
        setTimeout(() => setToast(null), 3000);
      }
    } catch (err: any) {
      setToast(`Delete error: ${err.message}`);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const toggleAudioPlay = (streamUrl: string) => {
    if (playingAudioUrl === streamUrl) {
      audioPlayerRef.current?.pause();
      setPlayingAudioUrl(null);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      const audio = new Audio(streamUrl);
      audioPlayerRef.current = audio;
      setPlayingAudioUrl(streamUrl);
      audio.play().catch(() => setPlayingAudioUrl(null));
      audio.onended = () => setPlayingAudioUrl(null);
    }
  };

  const handleGenerate = async (format: '15s_slam' | '5s_reel') => {
    setIsRendering(true);
    setRenderingFormat(format);
    const label = format === '15s_slam' ? '15s Opinion vs Reality Slam Reel' : '5s Impact Reel';
    setToast(`Assembling ${label} (Ken Burns motion, sound effects, audio mix)...`);

    try {
      const res = await fetch('/api/motivation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format })
      });
      const data = await res.json();
      if (data.success && data.reel) {
        setReels(prev => [data.reel, ...prev]);
        setSelectedReel(data.reel);
        setToast(`Generated ${label} successfully!`);
      } else {
        await loadReels();
        setToast(`Render completed.`);
      }
    } catch {
      setToast('Video generation running in background.');
      setTimeout(loadReels, 12000);
    } finally {
      setIsRendering(false);
      setRenderingFormat('');
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
      <div id="teen-header-banner" className="p-6 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-slate-800 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-cyan-600/20 border border-cyan-500/40 rounded-2xl text-cyan-400">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-white tracking-tight">MindRush: Pure Aura & 3D Mystery Discipline</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 text-[10px] font-mono font-bold">
                  MindRush • 3 Posts Daily
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-950 border border-amber-800 text-amber-300 text-[10px] font-mono font-bold">
                  3D AI Visuals & Custom Sound
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Dynamic Cloudflare AI 3D imagery (cool characters, anthropomorphic animals, studio), intense debate slams, high-contrast typography, and custom user audio.
              </p>
            </div>
          </div>
        </div>

        {/* Action Generation Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            id="btn-generate-15s-slam"
            onClick={() => handleGenerate('15s_slam')}
            disabled={isRendering}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg shadow-amber-600/30 flex items-center gap-2 cursor-pointer"
          >
            {isRendering && renderingFormat === '15s_slam' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Flame className="w-4 h-4" />
            )}
            <span>Render 15s Debate Slam</span>
          </button>

          <button
            id="btn-generate-5s-reel"
            onClick={() => handleGenerate('5s_reel')}
            disabled={isRendering}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer border border-slate-700"
          >
            {isRendering && renderingFormat === '5s_reel' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 text-amber-400" />
            )}
            <span>Render 5s Impact Reel</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Video Player + Audio Upload Vault */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 9:16 Video Player */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  {selectedReel ? selectedReel.title : 'Latest Motivation Reel'}
                </h3>
                <div className="text-[11px] font-mono text-slate-400">
                  Apex Protocol • Duration: {selectedReel?.duration ? `${selectedReel.duration.toFixed(0)}s` : '15s'}
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-800 text-amber-300 text-[10px] font-mono font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3" />
                Live Preview
              </span>
            </div>

            {/* 9:16 Mobile Reel Container */}
            <div className="w-full aspect-[9/16] max-w-[320px] mx-auto bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative flex items-center justify-center">
              {selectedReel ? (
                <video
                  id="teen-video-preview"
                  key={selectedReel.videoPath}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover"
                  src={selectedReel.videoPath}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="text-center p-6 text-slate-500 text-xs">
                  No video selected.
                </div>
              )}
            </div>

            {/* Reel Details */}
            {selectedReel && (
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                {selectedReel.hook && (
                  <div>
                    <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">Public Opinion Hook</span>
                    <p className="text-xs font-bold text-white mt-0.5">{selectedReel.hook}</p>
                  </div>
                )}
                {selectedReel.challenge && (
                  <div className="pt-1">
                    <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">Comeback / Reality</span>
                    <p className="text-xs font-semibold text-slate-200 mt-0.5">{selectedReel.challenge}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Audio Upload Vault & Daily Schedule */}
        <div className="lg:col-span-7 space-y-6">
          {/* Audio Upload Vault Card */}
          <div id="teen-audio-vault" className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Music className="w-5 h-5 text-amber-400" />
                  Custom Audio & Sound Vault
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Upload audio beats and sound effects for your 15s and 5s reels. No voiceover is used — only your uploaded sound!
                </p>
              </div>

              {/* Folder Selector Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 shrink-0">
                <button
                  id="tab-audio-mindrush"
                  onClick={() => handleChannelSwitch('mindrush')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    audioChannel === 'mindrush'
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ⚡ MindRush Audio
                </button>
                <button
                  id="tab-audio-15s"
                  onClick={() => handleChannelSwitch('motivation_15s')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    audioChannel === 'motivation_15s'
                      ? 'bg-amber-600 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  15s Slams
                </button>
                <button
                  id="tab-audio-5s"
                  onClick={() => handleChannelSwitch('motivation_5s')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    audioChannel === 'motivation_5s'
                      ? 'bg-amber-600 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  5s Clips
                </button>
              </div>
            </div>

            {/* Upload Area */}
            <div className="p-4 border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-xl bg-slate-950/60 transition-colors text-center space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.aac"
                onChange={handleAudioUpload}
                className="hidden"
                id="audio-upload-input"
              />
              <label
                htmlFor="audio-upload-input"
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black rounded-xl text-xs cursor-pointer transition-all shadow-md"
              >
                <Upload className="w-4 h-4" />
                <span>{isUploadingAudio ? 'Uploading...' : 'Choose Sound File (.mp3, .wav, .m4a)'}</span>
              </label>
              <p className="text-[11px] text-slate-400">
                Targeting: <strong className="text-amber-300">sound_assets/{audioChannel}/</strong> (Auto-selected randomly when rendering)
              </p>
            </div>

            {/* List of Uploaded Audio Files */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>ACTIVE SOUND ASSETS IN VAULT ({audioAssets.length})</span>
                {isLoadingAudio && <span className="text-amber-400">Syncing...</span>}
              </div>

              {audioAssets.length === 0 ? (
                <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 text-center text-xs text-slate-500">
                  No custom sound files uploaded yet in this folder. Procedural ambient synthesis is used as fallback.
                </div>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {audioAssets.map((asset) => {
                    const isPlaying = playingAudioUrl === asset.streamUrl;
                    return (
                      <div
                        key={asset.filename}
                        className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <button
                            onClick={() => toggleAudioPlay(asset.streamUrl)}
                            className="p-2 bg-slate-800 hover:bg-amber-600 hover:text-slate-950 text-amber-400 rounded-lg shrink-0 transition-colors cursor-pointer"
                          >
                            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          </button>
                          <div className="overflow-hidden">
                            <div className="text-xs font-bold text-white truncate">
                              {asset.filename}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2">
                              <span>{asset.sizeFormatted}</span>
                              <span>•</span>
                              <span className="text-emerald-400">Active in Audio Engine</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteAudio(asset.filename)}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Delete audio track"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 3-Post Daily Schedule Blueprint */}
          <div id="teen-schedule-blueprint" className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Automated 3-Post Daily Timetable (GitHub Actions Pipeline)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="text-[10px] font-mono text-amber-400 font-bold uppercase">Drop 1 • 08:00 UTC</div>
                <div className="text-xs font-bold text-white">5s Punchline Reel</div>
                <p className="text-[11px] text-slate-400">Straight-to-point single image Ken Burns pan/zoom</p>
              </div>

              <div className="p-3.5 bg-slate-950 border border-amber-500/30 rounded-xl space-y-1">
                <div className="text-[10px] font-mono text-amber-300 font-bold uppercase">Drop 2 • 14:00 UTC</div>
                <div className="text-xs font-bold text-white">15s Debate Slam</div>
                <p className="text-[11px] text-slate-400">Karaoke captions, 3s break, 1s black screen slam reveal</p>
              </div>

              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="text-[10px] font-mono text-amber-400 font-bold uppercase">Drop 3 • 20:00 UTC</div>
                <div className="text-xs font-bold text-white">5s Impact Reel</div>
                <p className="text-[11px] text-slate-400">Evening lock-in challenge with dynamic audio mix</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
