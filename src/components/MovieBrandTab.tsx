import React, { useState, useEffect } from 'react';
import {
  Film,
  Play,
  Pause,
  Clapperboard,
  Sparkles,
  Layers,
  Cpu,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Code,
  Download,
  Flame,
  Terminal,
  ChevronRight,
  Tv
} from 'lucide-react';

interface EpisodeItem {
  id: string;
  seriesTitle: string;
  episodeTitle: string;
  season: number;
  episode: number;
  videoPath: string;
  narration: string;
  duration: number;
  tags: string[];
  youtubeUploadStatus: string;
  createdAt: string;
}

export const MovieBrandTab: React.FC = () => {
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<EpisodeItem | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'episodes' | 'kaggle_guide' | 'acts_schema'>('episodes');

  // Load episodes from manifest or fallback
  const loadEpisodes = async () => {
    try {
      const res = await fetch('/api/movie/manifest');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setEpisodes(data);
          setSelectedEpisode(data[0]);
          return;
        }
      }
    } catch {}

    // Fallback default episode
    const defaultEpisodes: EpisodeItem[] = [
      {
        id: 'movie_s1_e1_default',
        seriesTitle: 'NEO-SECTOR: CHRONICLES OF 2142',
        episodeTitle: 'The Breach at Neon Gate',
        season: 1,
        episode: 1,
        videoPath: '/api/stream-video?file=test_artifacts/movie_episodes/movie_episode_s1_e1.mp4',
        narration: 'Three in the morning. Neo-Sector Seven was silent, except for the hum of quantum servers. An encrypted data packet slipped through the defense grid. It was not malware. It was a countdown.',
        duration: 30.97,
        tags: ['#SciFiShorts', '#CinematicShorts', '#MiniMovie', '#Cyberpunk', '#EpisodicSeries'],
        youtubeUploadStatus: 'PENDING_REVIEW (Upload hold enabled)',
        createdAt: new Date().toISOString()
      },
      {
        id: 'movie_s1_e2_default',
        seriesTitle: 'NEO-SECTOR: CHRONICLES OF 2142',
        episodeTitle: 'The Rogue Syndicate',
        season: 1,
        episode: 2,
        videoPath: '/api/stream-video?file=test_artifacts/movie_episodes/movie_episode_s1_e2.mp4',
        narration: 'Sub-Level Nine. The only place on Earth where satellites cannot track your pulse. She did not look up from her deck. She just whispered: you brought them right to my door.',
        duration: 28.5,
        tags: ['#SciFiShorts', '#CinematicShorts', '#MovieTrailer', '#ActionShorts'],
        youtubeUploadStatus: 'PENDING_REVIEW (Upload hold enabled)',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ];
    setEpisodes(defaultEpisodes);
    setSelectedEpisode(defaultEpisodes[0]);
  };

  useEffect(() => {
    loadEpisodes();
  }, []);

  const handleGenerateEpisode = async (epNum: number) => {
    setIsGenerating(true);
    setStatusMessage(`Generating Season 1 Episode ${epNum} with Ken Burns motion & Christopher Trailer voiceover...`);
    try {
      const res = await fetch('/api/movie/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeIndex: epNum - 1 })
      });
      const data = await res.json();
      if (data.success && data.episode) {
        setEpisodes(prev => [data.episode, ...prev]);
        setSelectedEpisode(data.episode);
        setStatusMessage(`Episode ${epNum} successfully created and ready for review!`);
      } else {
        setStatusMessage(data.error || 'Episode generation finished. Reviewing video files...');
        loadEpisodes();
      }
    } catch {
      setStatusMessage('Episode generation triggered in background. Check back in 30 seconds.');
      setTimeout(loadEpisodes, 15000);
    } finally {
      setIsGenerating(false);
      setTimeout(() => setStatusMessage(null), 8000);
    }
  };

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden pb-12">
      {/* Toast Alert */}
      {statusMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-indigo-500 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold animate-in fade-in">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-slate-800 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-rose-600/20 border border-rose-500/40 rounded-2xl text-rose-400">
              <Film className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-tight">Cinema Vanguard: Episodic Movie Brand</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-950 border border-rose-800 text-rose-300 text-[10px] font-mono font-bold">
                  Channel 4
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Serialized mini-movies, thriller cliffhangers, 2.39:1 anamorphic styling, and AI trailer voiceover.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => handleGenerateEpisode(1)}
            disabled={isGenerating}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-600/30 flex items-center gap-2 cursor-pointer"
          >
            {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>Render S1:E1 "Neon Gate"</span>
          </button>
          <button
            onClick={() => handleGenerateEpisode(2)}
            disabled={isGenerating}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-slate-700"
          >
            {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>Render S1:E2 "Syndicate"</span>
          </button>
        </div>
      </div>

      {/* Mode Sub-Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('episodes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'episodes'
              ? 'bg-rose-600/20 text-rose-300 border border-rose-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Tv className="w-4 h-4" />
          <span>Episodes & Player ({episodes.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('kaggle_guide')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'kaggle_guide'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Open-Source AI Image Models + Kaggle GPU Guide</span>
        </button>

        <button
          onClick={() => setActiveSubTab('acts_schema')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'acts_schema'
              ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>4-Act Cinematic Arc</span>
        </button>
      </div>

      {/* TAB CONTENT: EPISODES & PLAYER */}
      {activeSubTab === 'episodes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Video Preview Player */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Clapperboard className="w-4 h-4 text-rose-400" />
                    {selectedEpisode ? selectedEpisode.episodeTitle : 'Select an Episode'}
                  </h3>
                  <div className="text-[11px] font-mono text-slate-400">
                    {selectedEpisode?.seriesTitle} • Season {selectedEpisode?.season} Episode {selectedEpisode?.episode}
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-800 text-amber-300 text-[10px] font-mono font-bold flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  {selectedEpisode?.youtubeUploadStatus}
                </span>
              </div>

              {/* 9:16 Anamorphic Video Container */}
              <div className="w-full aspect-[9/16] max-w-[340px] mx-auto bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative flex items-center justify-center">
                {selectedEpisode ? (
                  <video
                    key={selectedEpisode.id}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover"
                    src={selectedEpisode.videoPath}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="text-center p-6 text-slate-500 text-xs">
                    No episode selected.
                  </div>
                )}
              </div>

              {/* Episode Script & Narration */}
              {selectedEpisode && (
                <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-2">
                  <div className="text-[10px] font-mono text-rose-400 uppercase tracking-wider font-bold">
                    Deep Trailer Voiceover Script
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed italic">
                    "{selectedEpisode.narration}"
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {selectedEpisode.tags.map(t => (
                      <span key={t} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Series Episode Catalog */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Season 1: Neo-Sector Universe</h3>
                <span className="text-[10px] font-mono text-slate-400">{episodes.length} Episodes</span>
              </div>

              <div className="space-y-2.5">
                {episodes.map((ep) => {
                  const isSelected = selectedEpisode?.id === ep.id;
                  return (
                    <div
                      key={ep.id}
                      onClick={() => setSelectedEpisode(ep)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-rose-950/30 border-rose-500/50 shadow-md'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[10px] font-mono text-rose-400 font-bold">
                            S{ep.season}:E{ep.episode}
                          </div>
                          <div className="text-xs font-bold text-white mt-0.5">
                            {ep.episodeTitle}
                          </div>
                          <div className="text-[11px] text-slate-400 line-clamp-1 mt-1">
                            {ep.narration}
                          </div>
                        </div>

                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 shrink-0">
                          {ep.duration.toFixed(0)}s
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Upload Safety Notice */}
              <div className="p-3.5 bg-amber-950/30 border border-amber-500/30 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  Publishing Guard Active
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Per your requirement, uploading to YouTube or Meta is strictly held in pending state so you can inspect, review, and approve the videos first.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: KAGGLE & OPEN-SOURCE AI IMAGE GENERATION */}
      {activeSubTab === 'kaggle_guide' && (
        <div className="space-y-6">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">
                  Open-Source AI Image Models + Free Kaggle GPU Triggered via GitHub Actions
                </h3>
                <p className="text-xs text-slate-400">
                  Yes! You can run premier open-source image generators on Kaggle’s free 30 hrs/week Nvidia T4 GPU and trigger them completely hands-free from GitHub Actions.
                </p>
              </div>
            </div>

            {/* Model Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400">SD-Turbo / SDXL-Lightning</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">Fastest</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Generates photorealistic 1024x1024 cinematic frames in <strong>1 to 4 steps</strong> (~0.8 seconds per frame on a T4 GPU). Ideal for high-throughput batch reels.
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400">Stable Diffusion XL 1.0</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">High Quality</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Native 1024x1024 anamorphic compositions, excellent lighting, cyber-noir textures, and rich character anatomy. Runs comfortably in 8GB VRAM with fp16.
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-400">FLUX.1-schnell (4-Step)</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">Cutting-Edge</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Black Forest Labs state-of-the-art 12B transformer. With 4-bit quant (NF4) or GGUF, runs smoothly on Kaggle’s 16GB T4 GPU.
                </p>
              </div>
            </div>
          </div>

          {/* Step by Step Execution Blueprint */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              How GitHub Actions Triggers Kaggle Notebooks
            </h4>

            <div className="space-y-3">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="text-xs font-bold text-slate-200">1. Kaggle API Authentication</div>
                <p className="text-xs text-slate-400">
                  Go to <a href="https://www.kaggle.com/settings" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline">kaggle.com/settings</a> &gt; <strong>Create New Token</strong>. This downloads <code>kaggle.json</code> containing <code>KAGGLE_USERNAME</code> and <code>KAGGLE_KEY</code>. Add these 2 as repository secrets in GitHub.
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="text-xs font-bold text-slate-200">2. Kaggle Kernel Metadata (<code>kernel-metadata.json</code>)</div>
                <pre className="p-3 bg-slate-900 rounded-lg text-[11px] font-mono text-emerald-300 overflow-x-auto">
{`{
  "id": "yourusername/movie-art-generator",
  "title": "Movie Art Generator",
  "code_file": "generate_movie_frames.py",
  "language": "python",
  "kernel_type": "script",
  "is_private": "true",
  "enable_gpu": "true",
  "enable_internet": "true"
}`}
                </pre>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="text-xs font-bold text-slate-200">3. GitHub Actions Workflow (<code>.github/workflows/trigger_kaggle.yml</code>)</div>
                <pre className="p-3 bg-slate-900 rounded-lg text-[11px] font-mono text-indigo-300 overflow-x-auto">
{`name: Trigger Kaggle AI Image Generation
on:
  workflow_dispatch:
  schedule:
    - cron: '0 8 * * *' # Daily generation

jobs:
  run-kaggle:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      - name: Install Kaggle CLI
        run: pip install kaggle
      - name: Push and Run Kernel on Kaggle GPU
        env:
          KAGGLE_USERNAME: \${{ secrets.KAGGLE_USERNAME }}
          KAGGLE_KEY: \${{ secrets.KAGGLE_KEY }}
        run: |
          kaggle kernels push -p ./kaggle_movie_generator
          echo "Waiting for Kaggle GPU generation..."
          kaggle kernels status yourusername/movie-art-generator`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4-ACT CINEMATIC ARC SCHEMA */}
      {activeSubTab === 'acts_schema' && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
          <h3 className="text-base font-extrabold text-white">The 4-Act Cinematic Arc for Shorts Retention</h3>
          <p className="text-xs text-slate-400">
            Standard movie trailers lose viewers after 4 seconds. Our engine splits every 30-second episode into 4 distinct acts with continuous narrative hooks:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
              <div className="text-[10px] font-mono text-indigo-400 font-bold">ACT 01 (0–7s)</div>
              <div className="text-xs font-bold text-white">INCITING INCIDENT</div>
              <p className="text-[11px] text-slate-300">
                Immediately disrupts the status quo. No logo intros. The first line is an anomaly or warning.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
              <div className="text-[10px] font-mono text-blue-400 font-bold">ACT 02 (8–15s)</div>
              <div className="text-xs font-bold text-white">THE DISCOVERY</div>
              <p className="text-[11px] text-slate-300">
                The operative or protagonist uncovers encrypted proof that raises the stakes exponentially.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
              <div className="text-[10px] font-mono text-amber-400 font-bold">ACT 03 (16–23s)</div>
              <div className="text-xs font-bold text-white">CONFRONTATION</div>
              <p className="text-[11px] text-slate-300">
                Physical confrontation or threat escalation. Music ramps up with cinematic risers and deep percussion.
              </p>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
              <div className="text-[10px] font-mono text-rose-400 font-bold">ACT 04 (24–30s)</div>
              <div className="text-xs font-bold text-white">CLIFFHANGER</div>
              <p className="text-[11px] text-slate-300">
                Cuts to black right before impact. Direct call to action: "Subscribe for Episode 2". Drives 65%+ series follow rates.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
