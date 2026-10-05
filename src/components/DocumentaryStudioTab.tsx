import React, { useState } from 'react';
import { Film, Compass, Volume2, Sparkles, Clock, Play, BookOpen, Layers, CheckCircle2, ChevronRight, Eye } from 'lucide-react';

interface ArchivalTopic {
  id: string;
  title: string;
  era: string;
  sourceVault: string;
  description: string;
  duration: string;
  soundscape: string;
  visualPreviewUrl: string;
}

const ARCHIVAL_TOPICS: ArchivalTopic[] = [
  {
    id: 'apollo-space-race',
    title: 'The Unheard Apollo Transmissions',
    era: '1969 • Cold War Space Age',
    sourceVault: 'NASA Archival Vault & Prelinger Collection',
    description: 'Declassified ground-to-orbit voice communications paired with genuine 70mm lunar surface film scans.',
    duration: '48s Short Essay',
    soundscape: 'Apollo cabin ambient hum, Quindar telemetry beep & deep orchestral strings',
    visualPreviewUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1080&auto=format&fit=crop'
  },
  {
    id: 'deep-ocean-mysteries',
    title: 'The Silent Abyss: Challenger Deep',
    era: '1960 • Bathyscaphe Trieste',
    sourceVault: 'National Oceanic Archives & Public Domain Film',
    description: 'Jacques Piccard and Don Walsh reaching the deepest point on Earth inside seven inches of forged steel.',
    duration: '52s Cinematic Essay',
    soundscape: 'Sub-bass sonar echo, hull pressure groans & solitary melancholic piano',
    visualPreviewUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1080&auto=format&fit=crop'
  },
  {
    id: 'ancient-library-alexandria',
    title: 'The Lost Scrolls of the Mouseion',
    era: '3rd Century BC • Hellenistic Egypt',
    sourceVault: 'Classical Antiquity Manuscript Archives & Museum Scans',
    description: 'How an empire attempted to collect every book in the world, and what humanity lost when it burned.',
    duration: '45s Historical Reflection',
    soundscape: 'Desert night wind, ancient harp resonance & slow ambient cello',
    visualPreviewUrl: 'https://images.unsplash.com/photo-1507842229453-764267675778?q=80&w=1080&auto=format&fit=crop'
  },
  {
    id: 'industrial-silence',
    title: 'When Steam Replaced Muscle',
    era: '1888 • Early Industrial Era',
    sourceVault: 'Library of Congress Motion Pictures & Early Film Pioneers',
    description: 'Rare 35mm archival reel footage of the earliest mechanized factories, ironworks, and steam locomotives.',
    duration: '44s Archival Journey',
    soundscape: '35mm projector whir, rhythmic steam valve pulse & brass horn crescendo',
    visualPreviewUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1080&auto=format&fit=crop'
  }
];

export const DocumentaryStudioTab: React.FC = () => {
  const [selectedTopic, setSelectedTopic] = useState<ArchivalTopic>(ARCHIVAL_TOPICS[0]);
  const [narratorTone, setNarratorTone] = useState<string>('resonant_historian');
  const [filmGrainIntensity, setFilmGrainIntensity] = useState<string>('subtle');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);

  const handleGeneratePreview = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setGeneratedPreview(`Documentary Essay Ready: "${selectedTopic.title}" — Archival reel matched with authentic ${selectedTopic.soundscape}.`);
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border border-amber-500/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold">
              <Film className="w-3.5 h-3.5" />
              <span>Public Domain Historical Documentaries</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Archival Documentary Video Studio
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Automated cinematic documentary creation utilizing verified public domain archives, declassified footage, authentic historical voiceovers, and atmospheric acoustic soundscapes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleGeneratePreview}
              disabled={isSimulating}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition-all cursor-pointer flex items-center gap-2 shrink-0"
            >
              {isSimulating ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Curating Reel...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Synthesize Documentary</span>
                </>
              )}
            </button>
          </div>
        </div>

        {generatedPreview && (
          <div className="mt-4 p-3.5 bg-emerald-950/70 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{generatedPreview}</span>
          </div>
        )}
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Archival Vault Selections */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" />
              <span>Curated Historical Archival Vaults</span>
            </h2>
            <span className="text-xs text-slate-400">Public Domain Archives &amp; Museum Records</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ARCHIVAL_TOPICS.map((topic) => {
              const isSelected = selectedTopic.id === topic.id;
              return (
                <div
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden ${
                    isSelected
                      ? 'bg-amber-950/40 border-amber-400 shadow-lg shadow-amber-950/50 ring-1 ring-amber-400/40'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-amber-300 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30">
                        {topic.era}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {topic.duration}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white tracking-tight">
                      {topic.title}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {topic.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 space-y-1">
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <BookOpen className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="truncate">Vault: {topic.sourceVault}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Volume2 className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="truncate">Sound: {topic.soundscape}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Documentary Production Pipeline Features */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Automated Documentary Workflow Architecture</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                <span className="text-xs font-bold text-amber-300">1. Archival Motion Sourcing</span>
                <p className="text-[11px] text-slate-400">
                  Direct connection to Internet Archive (Prelinger Archives), Wikimedia Commons Historical Reel, and National Archives.
                </p>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                <span className="text-xs font-bold text-amber-300">2. Atmospheric Audio Layering</span>
                <p className="text-[11px] text-slate-400">
                  Dual-track audio engineering blending historical room tones, 35mm projector flutter, vinyl warmth, and cinematic cello pads.
                </p>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                <span className="text-xs font-bold text-amber-300">3. Ken Burns Pan &amp; Zoom</span>
                <p className="text-[11px] text-slate-400">
                  Slow hypnotic camera drift pushing into historical faces and manuscripts with elegant serif typography cards.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Preview & Director Controls */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-400" />
                <span>Visual Atmosphere Preview</span>
              </span>
              <span className="text-[11px] text-slate-400">9:16 Vertical Documentary</span>
            </h3>

            {/* Simulated 9:16 Card */}
            <div className="relative aspect-[9/14] w-full max-w-[280px] mx-auto rounded-2xl overflow-hidden border border-amber-500/30 shadow-2xl bg-slate-950">
              <img
                src={selectedTopic.visualPreviewUrl}
                alt={selectedTopic.title}
                className="w-full h-full object-cover filter contrast-110 brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

              {/* Top Vignette Tag */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-slate-950/80 px-2.5 py-1 rounded-full border border-amber-400/40 backdrop-blur-sm">
                  ARCHIVAL ESSAY
                </span>
                <span className="text-[10px] font-semibold text-slate-300 bg-slate-950/80 px-2 py-0.5 rounded backdrop-blur-sm">
                  {selectedTopic.era.split('•')[0]}
                </span>
              </div>

              {/* Bottom Quote & Topic Text */}
              <div className="absolute bottom-4 left-4 right-4 space-y-2">
                <h4 className="text-sm font-black text-white leading-snug drop-shadow-md">
                  {selectedTopic.title}
                </h4>
                <p className="text-[11px] text-slate-300 leading-normal line-clamp-3">
                  {selectedTopic.description}
                </p>
                <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-amber-300 font-medium">
                  <span>Sound: {selectedTopic.soundscape.split(',')[0]}</span>
                  <span>{selectedTopic.duration}</span>
                </div>
              </div>
            </div>

            {/* Director Settings */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Narrator Tone &amp; Cadence
                </label>
                <select
                  value={narratorTone}
                  onChange={(e) => setNarratorTone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="resonant_historian">Resonant Historian (Andrew Voice -5% rate, -25Hz pitch)</option>
                  <option value="contemplative_philosopher">Contemplative Baritone (Quiet, steady &amp; reflective)</option>
                  <option value="archival_radio">Vintage Newsreel (Subtle radio filter &amp; room resonance)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Archival Texture &amp; Film Grain
                </label>
                <select
                  value={filmGrainIntensity}
                  onChange={(e) => setFilmGrainIntensity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="subtle">Subtle 35mm Emulsion (Clean with warm film grain)</option>
                  <option value="vintage_reel">Vintage 16mm Archive (Soft vignette &amp; gentle grain)</option>
                  <option value="crisp_hd">Ultra-Clean Contemporary Museum Scan (Zero grain)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
