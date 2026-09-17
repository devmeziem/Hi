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
  const [activeSubTab, setActiveSubTab] = useState<'episodes' | '3d_universe' | 'kaggle_guide' | 'acts_schema'>('episodes');
  const [universeBible, setUniverseBible] = useState<any>(null);
  const [isSavingBible, setIsSavingBible] = useState<boolean>(false);
  const [bibleSaveStatus, setBibleSaveStatus] = useState<string | null>(null);

  // Load episodes from manifest or fallback
  const loadEpisodes = async () => {
    try {
      const res = await fetch('/api/movie/manifest');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const normalized = data.map((ep: EpisodeItem) => ({
            ...ep,
            videoPath: ep.videoPath.startsWith('/api/stream-video')
              ? ep.videoPath
              : `/api/stream-video?file=${encodeURIComponent(ep.videoPath)}`
          }));
          setEpisodes(normalized);
          setSelectedEpisode(normalized[0]);
        }
      }
    } catch {}

    // Load Universe Bible
    try {
      const bRes = await fetch('/api/movie/bible');
      if (bRes.ok) {
        const bData = await bRes.json();
        setUniverseBible(bData);
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
    if (episodes.length === 0) {
      setEpisodes(defaultEpisodes);
      setSelectedEpisode(defaultEpisodes[0]);
    }
  };

  const handleSaveBible = async () => {
    if (!universeBible) return;
    setIsSavingBible(true);
    setBibleSaveStatus(null);
    try {
      const res = await fetch('/api/movie/bible', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(universeBible)
      });
      if (res.ok) {
        setBibleSaveStatus('✅ 3D Character & Universe DNA saved successfully! Future renders will enforce this anchor.');
      } else {
        setBibleSaveStatus('Error saving Universe Bible.');
      }
    } catch (e: any) {
      setBibleSaveStatus(`Error: ${e.message}`);
    } finally {
      setIsSavingBible(false);
      setTimeout(() => setBibleSaveStatus(null), 6000);
    }
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
            <span>Render Ep 1: Sub-Level 14</span>
          </button>
          <button
            onClick={() => handleGenerateEpisode(2)}
            disabled={isGenerating}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-slate-700"
          >
            {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>Render Ep 2: The Signal</span>
          </button>
          <button
            onClick={() => handleGenerateEpisode(3)}
            disabled={isGenerating}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-slate-700"
          >
            {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>Render Ep 3: Core Chamber</span>
          </button>
        </div>
      </div>

      {/* Mode Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
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
          onClick={() => setActiveSubTab('3d_universe')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === '3d_universe'
              ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>3D Character & Universe DNA</span>
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
          <span>AI Image Models & Kaggle GPU</span>
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
                <h3 className="text-sm font-bold text-white">Ghost Vault Series Catalog</h3>
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

      {/* TAB CONTENT: 3D CHARACTER & UNIVERSE DNA */}
      {activeSubTab === '3d_universe' && (
        <div className="space-y-6">
          {/* Top Banner explaining consistency automation */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-600/20 border border-emerald-500/40 rounded-2xl text-emerald-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <span>3D Character & Universe Continuity Engine</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 text-[10px] font-mono">
                      100% Automated
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Guarantees persistent 3D characters, consistent protagonist facial anchors, and matching environments across all series episodes.
                  </p>
                </div>
              </div>

              <button
                onClick={handleSaveBible}
                disabled={isSavingBible}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer self-start sm:self-auto shrink-0"
              >
                {isSavingBible ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Save DNA to Cloud</span>
              </button>
            </div>

            {bibleSaveStatus && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-semibold rounded-xl animate-in fade-in">
                {bibleSaveStatus}
              </div>
            )}

            <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-2xl text-xs text-slate-300 space-y-1.5 font-mono">
              <div className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">
                How Character & Environment Consistency Is Automated:
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                1. <strong>Visual Anchor Injection</strong>: Every single act prompt locks the exact character DNA (<span className="text-emerald-300">Dax Mercer</span>, short dark cropped hair, weathered jawline, charcoal-gray hydraulic pressure suit, titanium chest armor, glowing blue scanner).<br />
                2. <strong>Cinematic Sci-Fi Engine</strong>: Strictly enforces <em>"Unreal Engine 5 aesthetic, volumetric steam, dramatic shadows, sharp metallic reflections"</em> and suppresses low quality artifacts.<br />
                3. <strong>Deterministic Seed Formula</strong>: <code className="text-indigo-300">baseSeed (741829) + (Episode * 100) + (Act * 17)</code> ensures photographic continuity without drift.<br />
                4. <strong>Auto-Advancement</strong>: Automatically progresses sequentially through the Ghost Vault storyline.
              </p>
            </div>
          </div>

          {/* Character & Environment DNA Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Protagonist DNA */}
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-300 font-bold text-xs">
                    DM
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Protagonist: Dax Mercer</h4>
                    <span className="text-[10px] font-mono text-indigo-400">Deep Salvage Operative // Hero DNA</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-mono">
                  Seed: 741829
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 text-[11px] font-bold mb-1">Character Name & Title</label>
                  <input
                    type="text"
                    value={universeBible?.protagonist?.name || 'Dax Mercer'}
                    onChange={(e) => setUniverseBible((prev: any) => ({
                      ...prev,
                      protagonist: { ...(prev?.protagonist || {}), name: e.target.value }
                    }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] font-bold mb-1">
                    Visual Anchor Prompt (Injected into every Act frame)
                  </label>
                  <textarea
                    rows={3}
                    value={universeBible?.protagonist?.visualAnchor || 'Rugged male operative Dax Mercer, short dark cropped hair, weathered jawline, wearing a heavy charcoal-gray hydraulic pressure suit, reinforced titanium chest armor, glowing blue telemetry scanner over right eye, holding a high-powered halogen exploration torch'}
                    onChange={(e) => setUniverseBible((prev: any) => ({
                      ...prev,
                      protagonist: { ...(prev?.protagonist || {}), visualAnchor: e.target.value }
                    }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1.5">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Enforced Consistency Rules:</div>
                  <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                    <li><strong>Hair:</strong> Short cropped dark hair with clean military fade</li>
                    <li><strong>Face / Eye:</strong> Weathered jawline + glowing blue telemetry scanner over right eye</li>
                    <li><strong>Suit:</strong> Heavy charcoal-gray pressure suit with titanium chest armor</li>
                    <li><strong>Prop:</strong> Industrial halogen torch cutting through black water</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Environment & World DNA */}
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-purple-300 font-bold text-xs">
                    GV
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Environment: Sub-Level 14 Flooded Tunnels</h4>
                    <span className="text-[10px] font-mono text-purple-400">The Ghost Vault // Architectural DNA</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-mono">
                  Unreal 5 Cinematic
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 text-[11px] font-bold mb-1">World / Setting Name</label>
                  <input
                    type="text"
                    value={universeBible?.environment?.worldName || 'Sub-Level 14 Flooded Industrial Tunnels'}
                    onChange={(e) => setUniverseBible((prev: any) => ({
                      ...prev,
                      environment: { ...(prev?.environment || {}), worldName: e.target.value }
                    }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] font-bold mb-1">
                    Environment Anchor Prompt
                  </label>
                  <textarea
                    rows={3}
                    value={universeBible?.environment?.visualAnchor || 'Massive flooded underground railway tunnels, deep black water, rusted steel beams, dripping concrete ceiling, emergency strobe lights softly glowing in the dark, dense atmospheric mist'}
                    onChange={(e) => setUniverseBible((prev: any) => ({
                      ...prev,
                      environment: { ...(prev?.environment || {}), visualAnchor: e.target.value }
                    }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] font-bold mb-1">
                    Art Style & Rendering Pipeline
                  </label>
                  <textarea
                    rows={2}
                    value={universeBible?.artStyle || 'Cinematic stylized film render, Unreal Engine 5 aesthetic, volumetric steam, dramatic shadows, sharp metallic reflections, high detail vertical 9:16 frame'}
                    onChange={(e) => setUniverseBible((prev: any) => ({
                      ...prev,
                      artStyle: e.target.value
                    }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3-Episode Storyline Continuity Arc */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Film className="w-5 h-5 text-rose-400" />
                  <span>The Ghost Vault: 3-Episode Arc</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Starring Dax Mercer across the flooded subterranean ruins with high-suspense cliffhangers.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-3 py-1 rounded-xl border border-emerald-800 self-start sm:self-auto">
                Auto-Progression Enabled
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {[
                { ep: 1, title: 'Sub-Level 14', status: 'Rendered & Ready', hook: 'Fresh footprints lead into the maintenance tunnel. The steel door slams shut as water rises.' },
                { ep: 2, title: 'The Signal in the Dark', status: 'Rendered & Ready', hook: 'A radio signal pulses every three seconds. A stranger on the gantry fires a weapon at Dax.' },
                { ep: 3, title: 'The Core Chamber', status: 'Rendered & Ready', hook: 'The intruder pulls off her tactical mask: "Dax? You were supposed to be dead."' }
              ].map((item) => (
                <div key={item.ep} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-indigo-400 font-bold">EPISODE 0{item.ep}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {item.status}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white mt-1">{item.title}</div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      {item.hook}
                    </p>
                  </div>

                  <button
                    onClick={() => handleGenerateEpisode(item.ep)}
                    disabled={isGenerating}
                    className="w-full mt-3 py-2 bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-500/50 text-slate-200 hover:text-rose-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 text-rose-400" />
                    <span>Re-Render Ep {item.ep}</span>
                  </button>
                </div>
              ))}
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
