import React, { useState, useEffect } from 'react';
import { 
  Music, 
  Headphones, 
  Volume2, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles, 
  Play, 
  Pause, 
  Save, 
  Radio, 
  Film, 
  Flame, 
  Atom, 
  TrendingUp, 
  Info, 
  ShieldCheck,
  Zap,
  Sliders
} from 'lucide-react';

export const SoundSetupTab: React.FC = () => {
  const [pixabayKey, setPixabayKey] = useState<string>('');
  const [soundUrls, setSoundUrls] = useState<{
    universal: string;
    ch1_finance: string;
    ch2_stoic: string;
    ch3_archie: string;
    ch4_movie: string;
    ch5_teen: string;
  }>({
    universal: '',
    ch1_finance: '',
    ch2_stoic: '',
    ch3_archie: '',
    ch4_movie: '',
    ch5_teen: ''
  });

  const [audioSettings, setAudioSettings] = useState<{
    voiceGain: number;
    musicDucking: number;
    enableChime: boolean;
    autoFade: boolean;
  }>({
    voiceGain: 1.35,
    musicDucking: 12,
    enableChime: true,
    autoFade: true
  });

  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Load persisted sound setup
    const savedPixabay = localStorage.getItem('voxam_pixabay_key') || '';
    const savedUrls = localStorage.getItem('voxam_sound_urls');
    const savedSettings = localStorage.getItem('voxam_audio_settings');

    if (savedPixabay) setPixabayKey(savedPixabay);
    if (savedUrls) {
      try { setSoundUrls(JSON.parse(savedUrls)); } catch {}
    }
    if (savedSettings) {
      try { setAudioSettings(JSON.parse(savedSettings)); } catch {}
    }
  }, []);

  const handleSaveAll = () => {
    localStorage.setItem('voxam_pixabay_key', pixabayKey);
    localStorage.setItem('voxam_sound_urls', JSON.stringify(soundUrls));
    localStorage.setItem('voxam_audio_settings', JSON.stringify(audioSettings));

    setSaveToast('Sound & Music preferences saved successfully!');
    setTimeout(() => setSaveToast(null), 4000);
  };

  const handlePlayPreview = (url: string) => {
    if (!url) return;

    if (activePreviewUrl === url && isPlaying) {
      if (audioElement) audioElement.pause();
      setIsPlaying(false);
      return;
    }

    if (audioElement) {
      audioElement.pause();
    }

    const audio = new Audio(url);
    audio.volume = 0.5;
    audio.play()
      .then(() => {
        setAudioElement(audio);
        setActivePreviewUrl(url);
        setIsPlaying(true);
      })
      .catch(() => {
        setSaveToast('Unable to preview audio link directly. Ensure URL allows cross-origin streaming.');
        setTimeout(() => setSaveToast(null), 4000);
      });

    audio.onended = () => setIsPlaying(false);
  };

  const steps = [
    {
      num: 1,
      title: "Where To Find Safe Sound URLs (Zero Copyright Claims)",
      badge: "Sources",
      content: (
        <div className="space-y-3">
          <p className="text-xs text-slate-300 leading-relaxed">
            Never use commercial radio pop songs directly in the video file because YouTube and Meta Content ID will flag or mute the upload. Instead, grab verified royalty-free direct MP3 links from these free hubs:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <a 
              href="https://pixabay.com/music/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-3 bg-slate-900 border border-slate-700/80 rounded-xl flex items-center justify-between hover:border-indigo-400 transition-colors group"
            >
              <div>
                <div className="text-xs font-bold text-white group-hover:text-indigo-300 flex items-center gap-1.5">
                  Pixabay Music <ExternalLink className="w-3 h-3" />
                </div>
                <div className="text-[10px] text-slate-400">100% free commercial beats & tracks</div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                Recommended
              </span>
            </a>

            <a 
              href="https://studio.youtube.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-3 bg-slate-900 border border-slate-700/80 rounded-xl flex items-center justify-between hover:border-indigo-400 transition-colors group"
            >
              <div>
                <div className="text-xs font-bold text-white group-hover:text-indigo-300 flex items-center gap-1.5">
                  YouTube Audio Library <ExternalLink className="w-3 h-3" />
                </div>
                <div className="text-[10px] text-slate-400">Built into YouTube Studio, 100% pre-cleared</div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                Studio Safe
              </span>
            </a>

            <a 
              href="https://freemusicarchive.org/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-3 bg-slate-900 border border-slate-700/80 rounded-xl flex items-center justify-between hover:border-indigo-400 transition-colors group"
            >
              <div>
                <div className="text-xs font-bold text-white group-hover:text-indigo-300 flex items-center gap-1.5">
                  Free Music Archive (FMA) <ExternalLink className="w-3 h-3" />
                </div>
                <div className="text-[10px] text-slate-400">Atmospheric synth & background tracks</div>
              </div>
            </a>

            <a 
              href="https://freesound.org/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-3 bg-slate-900 border border-slate-700/80 rounded-xl flex items-center justify-between hover:border-indigo-400 transition-colors group"
            >
              <div>
                <div className="text-xs font-bold text-white group-hover:text-indigo-300 flex items-center gap-1.5">
                  Freesound SFX <ExternalLink className="w-3 h-3" />
                </div>
                <div className="text-[10px] text-slate-400">Whooshes, chimes, cinematic risers</div>
              </div>
            </a>
          </div>
        </div>
      )
    },
    {
      num: 2,
      title: "Channel Sound URLs & Workflows",
      badge: "URL Configuration",
      content: (
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            Paste direct HTTP/HTTPS links to `.mp3` or `.wav` audio files. The pipeline automatically downloads, trims, loops, and ducks the music underneath the voiceover:
          </p>

          <div className="space-y-3">
            {/* Channel 3: Archie Cartoon */}
            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                  <Atom className="w-3.5 h-3.5 text-emerald-400" />
                  Channel 3: Archie Lab / Cartoon Science Reels
                </label>
                <span className="text-[10px] font-mono text-slate-400">Upbeat / Science Groove</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://example.com/archie-science-groove.mp3"
                  value={soundUrls.ch3_archie}
                  onChange={(e) => setSoundUrls({ ...soundUrls, ch3_archie: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                />
                {soundUrls.ch3_archie && (
                  <button 
                    onClick={() => handlePlayPreview(soundUrls.ch3_archie)}
                    className="p-2 bg-emerald-950 border border-emerald-600/40 hover:bg-emerald-900 text-emerald-300 rounded-lg shrink-0"
                    title="Preview Audio"
                  >
                    {isPlaying && activePreviewUrl === soundUrls.ch3_archie ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            {/* Channel 1: Fin Blueprint */}
            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-indigo-300 flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-indigo-400" />
                  Channel 1: Fin Blueprint Quotes & Mystery
                </label>
                <span className="text-[10px] font-mono text-slate-400">Dark Suspense / Mystery</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://example.com/mystery-darkness.mp3"
                  value={soundUrls.ch1_finance}
                  onChange={(e) => setSoundUrls({ ...soundUrls, ch1_finance: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                />
                {soundUrls.ch1_finance && (
                  <button 
                    onClick={() => handlePlayPreview(soundUrls.ch1_finance)}
                    className="p-2 bg-indigo-950 border border-indigo-600/40 hover:bg-indigo-900 text-indigo-300 rounded-lg shrink-0"
                  >
                    {isPlaying && activePreviewUrl === soundUrls.ch1_finance ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            {/* Channel 4: Movie Brand Series */}
            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-rose-300 flex items-center gap-2">
                  <Film className="w-3.5 h-3.5 text-rose-400" />
                  Channel 4: Movie Brand (Episodic Series)
                </label>
                <span className="text-[10px] font-mono text-slate-400">Cinematic Drone / Orchestral</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://example.com/cinematic-movie-theme.mp3"
                  value={soundUrls.ch4_movie}
                  onChange={(e) => setSoundUrls({ ...soundUrls, ch4_movie: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-400"
                />
                {soundUrls.ch4_movie && (
                  <button 
                    onClick={() => handlePlayPreview(soundUrls.ch4_movie)}
                    className="p-2 bg-rose-950 border border-rose-600/40 hover:bg-rose-900 text-rose-300 rounded-lg shrink-0"
                  >
                    {isPlaying && activePreviewUrl === soundUrls.ch4_movie ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            {/* Channel 5: Teen Motivation */}
            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-300 flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  Channel 5: Apex Discipline (Teen Motivation)
                </label>
                <span className="text-[10px] font-mono text-slate-400">High-Octane Gym / Drill / Phonk</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://example.com/high-energy-grindset.mp3"
                  value={soundUrls.ch5_teen}
                  onChange={(e) => setSoundUrls({ ...soundUrls, ch5_teen: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
                {soundUrls.ch5_teen && (
                  <button 
                    onClick={() => handlePlayPreview(soundUrls.ch5_teen)}
                    className="p-2 bg-amber-950 border border-amber-600/40 hover:bg-amber-900 text-amber-300 rounded-lg shrink-0"
                  >
                    {isPlaying && activePreviewUrl === soundUrls.ch5_teen ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      num: 3,
      title: "Automated Pixabay Music API (Optional)",
      badge: "Zero-Click Auto Fetch",
      content: (
        <div className="space-y-3">
          <p className="text-xs text-slate-300">
            If you provide a free Pixabay API key, the pipeline can automatically search and download royalty-free studio tracks matching your video topic without manual URLs:
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Pixabay API Key (e.g. 48293712-9c...)"
              value={pixabayKey}
              onChange={(e) => setPixabayKey(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-400 font-mono"
            />
          </div>
          <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            Get a free key in 30 seconds at <a href="https://pixabay.com/api/docs/" target="_blank" rel="noopener noreferrer" className="text-indigo-300 underline">pixabay.com/api/docs</a>.
          </p>
        </div>
      )
    },
    {
      num: 4,
      title: "Audio Ducking & Studio Mix Engine",
      badge: "Sound Architecture",
      content: (
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            Our audio assembler uses automatic sidechain ducking and broadcast loudness normalization (-16 LUFS) so narration is never drowned out:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-200">
                <span>Background Music Ducking</span>
                <span className="font-mono text-indigo-400">{audioSettings.musicDucking}% (-18.4 dB)</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                value={audioSettings.musicDucking}
                onChange={(e) => setAudioSettings({ ...audioSettings, musicDucking: parseInt(e.target.value, 10) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="text-[10px] text-slate-400">Ducks background audio low while speaker talks.</div>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-200">
                <span>Voiceover Boost / Clarity</span>
                <span className="font-mono text-emerald-400">{audioSettings.voiceGain}x (+3.5 dB)</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="1.8"
                step="0.05"
                value={audioSettings.voiceGain}
                onChange={(e) => setAudioSettings({ ...audioSettings, voiceGain: parseFloat(e.target.value) })}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="text-[10px] text-slate-400">Keeps speech clear on mobile phone speakers.</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={audioSettings.enableChime}
                onChange={(e) => setAudioSettings({ ...audioSettings, enableChime: e.target.checked })}
                className="accent-indigo-500 rounded"
              />
              Soft Card Reveal Chimes (Archie & Fin)
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={audioSettings.autoFade}
                onChange={(e) => setAudioSettings({ ...audioSettings, autoFade: e.target.checked })}
                className="accent-indigo-500 rounded"
              />
              Smooth 0.3s Audio In/Out Fades
            </label>
          </div>
        </div>
      )
    },
    {
      num: 5,
      title: "The Viral 'Trending Sound' Secret",
      badge: "Algorithm Growth",
      content: (
        <div className="p-4 bg-gradient-to-r from-amber-950/40 via-indigo-950/40 to-slate-900 border border-amber-500/30 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
            <TrendingUp className="w-4 h-4 text-amber-400 shrink-0" />
            How to ride TikTok & Shorts Viral Audio waves safely:
          </div>
          <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
            <li>Let the pipeline render your video with crisp speech and subtle background ambience.</li>
            <li>When opening YouTube Shorts, TikTok, or Instagram Reels to post, tap <strong>"Add Sound" / "Use Sound"</strong>.</li>
            <li>Select the viral trending track (from the billboard or trending tab).</li>
            <li>Slide the trending music volume to <strong>10%–15%</strong> and your original voice to <strong>100%</strong>.</li>
          </ol>
          <div className="text-[11px] text-amber-200/80 pt-1 font-medium">
            💡 <strong>Result:</strong> The platform algorithm actively pushes your reel to everyone browsing that trending sound, with zero copyright penalties because YouTube pays the music rights!
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden pb-12">
      {/* Toast Alert */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Music className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-extrabold text-white tracking-tight">Sound & Music Setup Hub</h2>
          </div>
          <p className="text-xs text-slate-400">
            Configure real background music URLs, automated royalty-free tracks, and audio ducking across all channels.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          Save Audio Preferences
        </button>
      </div>

      {/* Steps List */}
      <div className="space-y-4">
        {steps.map((step) => (
          <div 
            key={step.num}
            className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-3.5 transition-all hover:border-slate-700"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-500/40 text-indigo-300 font-bold text-xs flex items-center justify-center">
                  0{step.num}
                </span>
                <h3 className="text-sm font-bold text-white tracking-tight">{step.title}</h3>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {step.badge}
              </span>
            </div>

            <div className="pl-0 md:pl-10">
              {step.content}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Save Reminder */}
      <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl flex items-center justify-between">
        <span className="text-xs text-slate-400">
          Settings are saved to local project storage and automatically loaded during video rendering.
        </span>
        <button
          onClick={handleSaveAll}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Save className="w-3.5 h-3.5 text-indigo-400" />
          Save Changes
        </button>
      </div>
    </div>
  );
};
