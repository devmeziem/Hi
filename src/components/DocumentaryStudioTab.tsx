import React, { useState } from 'react';
import { Film, Compass, Volume2, Sparkles, Clock, CheckCircle2, Eye, DollarSign, ShieldAlert, BookOpen, Layers, Flame, ArrowUpRight } from 'lucide-react';

interface DocumentaryTopic {
  id: string;
  channel: 'ch4_finance_story' | 'driftreel_tiktok';
  genre: 'financial_story' | 'horror' | 'crime' | 'history' | 'story';
  title: string;
  era: string;
  sourceVault: string;
  description: string;
  duration: string;
  soundscape: string;
  visualPreviewUrl: string;
  narrativeArc: string;
}

const DOCUMENTARY_TOPICS: DocumentaryTopic[] = [
  // CHANNEL 4 — FINANCIAL STORY DOCUMENTARIES (Strictly narrative sagas)
  {
    id: 'south-sea-newton',
    channel: 'ch4_finance_story',
    genre: 'financial_story',
    title: 'How Isaac Newton Lost a Fortune',
    era: '1720 • The South Sea Bubble',
    sourceVault: 'Bank of England Archives & Royal Society Correspondence',
    description: 'The smartest man on Earth put his life savings into a speculative empire, sold at huge profit, was re-seduced by FOMO, and lost everything when the bubble burst.',
    duration: '48s Narrative Saga',
    soundscape: 'Historical dark cello pulse, vintage ledger quill scratch & ticking clock',
    visualPreviewUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=1080&auto=format&fit=crop',
    narrativeArc: 'The Setup -> The Astronomical Rise -> The Fatal Re-entry -> The Total Collapse'
  },
  {
    id: 'soros-broke-bank',
    channel: 'ch4_finance_story',
    genre: 'financial_story',
    title: 'The Man Who Broke the Bank of England',
    era: '1992 • Black Wednesday',
    sourceVault: 'City of London Historical Trading Logs & Financial Press',
    description: 'One private investor saw the British pound was artificially propped up by pride. He borrowed ten billion dollars and broke an entire empire central bank in twelve hours.',
    duration: '52s High-Stakes Story',
    soundscape: 'Fast ticking stopwatch, 1990s trading floor shouting & orchestral strings',
    visualPreviewUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1080&auto=format&fit=crop',
    narrativeArc: 'The Flaw in the System -> The Audacious Short -> The 7 PM Surrender -> The Billion Dollar Spoils'
  },
  {
    id: 'tulip-mania-amsterdam',
    channel: 'ch4_finance_story',
    genre: 'financial_story',
    title: 'When a Single Flower Cost a Mansion',
    era: '1637 • Dutch Golden Age',
    sourceVault: 'Amsterdam City Archives & Historic Tavern Contracts',
    description: 'In 17th-century Amsterdam, sailors traded lifetimes of wages for rare striped flower bulbs. When nobody raised a hand at auction, an empire economy collapsed in three days.',
    duration: '46s Historical Story',
    soundscape: 'Harpsichord tension, tavern murmur & dropping wooden coin rhythm',
    visualPreviewUrl: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=1080&auto=format&fit=crop',
    narrativeArc: 'The Golden Age Wealth -> The Exotic Virus -> The Tavern Madness -> The Silent Auction'
  },
  {
    id: 'nick-leeson-barings',
    channel: 'ch4_finance_story',
    genre: 'financial_story',
    title: 'The 28-Year-Old Who Sunk a 200-Year Bank',
    era: '1995 • The Fall of Barings',
    sourceVault: 'Singapore SIMEX Records & Bank of England Inquiry',
    description: 'Barings Bank funded the Napoleonic wars. A young trader hid his errors inside account 88888, doubled down before an earthquake, and destroyed the Queen bank.',
    duration: '50s Financial Drama',
    soundscape: 'Sub-bass heartbeat, flickering computer monitor hum & emergency sirens',
    visualPreviewUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=1080&auto=format&fit=crop',
    narrativeArc: 'The Golden Boy -> The Secret Account -> The Kobe Earthquake -> Sold For One Pound'
  },

  // DRIFTREEL — TIKTOK BUFFER (Horror, Crime, History & Survival Mysteries)
  {
    id: 'mary-celeste-horror',
    channel: 'driftreel_tiktok',
    genre: 'horror',
    title: 'The Ghost Ship of the Atlantic',
    era: '1872 • Ghost Ship Disappearance',
    sourceVault: 'Maritime Historical Archives & Admiralty Scans',
    description: 'The Mary Celeste found drifting off the Azores with warm meals on the table, zero damage, and all seven crewmen vanished into thin air.',
    duration: '46s Atmospheric Horror',
    soundscape: 'Eerie ocean wind, creaking timber hull & dark suspense drone',
    visualPreviewUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1080&auto=format&fit=crop',
    narrativeArc: 'The Silent Sailboat -> The Untouched Cabin -> The Vanished Family -> Unsolved Forever'
  },
  {
    id: 'db-cooper-crime',
    channel: 'driftreel_tiktok',
    genre: 'crime',
    title: 'The Skyjacking of D.B. Cooper',
    era: '1971 • Unsolved Aviation Heist',
    sourceVault: 'FBI Declassified Records & National Archives',
    description: 'A polite man in a dark business suit hijacks Flight 305, demands cash, and parachutes out the aft stairs into a pitch-black freezing rainstorm.',
    duration: '49s Investigative Crime',
    soundscape: 'Dark noir cello, vintage cockpit radio chatter & rain drumming',
    visualPreviewUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1080&auto=format&fit=crop',
    narrativeArc: 'The Calm Demand -> The Briefcase of Cash -> The Midnight Leap -> 50 Years of Silence'
  },
  {
    id: 'dyatlov-pass-incident',
    channel: 'driftreel_tiktok',
    genre: 'horror',
    title: 'The Dyatlov Pass Mystery',
    era: '1959 • Ural Mountains Tragedy',
    sourceVault: 'Soviet Declassified Inquest & Mountain Expedition Logs',
    description: 'Nine skilled hikers flee their slashed-open tent barefoot into minus thirty blizzard conditions. The injuries matched the impact of a high-speed vehicle crash.',
    duration: '47s Winter Horror',
    soundscape: 'Howling Ural mountain blizzard, low sub-bass drone & solitary cello',
    visualPreviewUrl: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?q=80&w=1080&auto=format&fit=crop',
    narrativeArc: 'The Mountain Expedition -> The Slashed Tent -> The Barefoot Escape -> The Unexplained Trauma'
  },
  {
    id: 'shackleton-survival-story',
    channel: 'driftreel_tiktok',
    genre: 'story',
    title: 'Shackleton: The Impossible Survival',
    era: '1915 • Imperial Trans-Antarctic Expedition',
    sourceVault: 'Royal Geographical Society & Frank Hurley Scans',
    description: 'The Endurance crushed by polar ice, forcing twenty-eight men through an 800-mile open-boat journey across hurricane seas with zero fatalities.',
    duration: '54s Epic Survival Story',
    soundscape: 'Polar gale winds, cracking ice shelf & triumphant cinematic strings',
    visualPreviewUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1080&auto=format&fit=crop',
    narrativeArc: 'The Ice Trap -> The Crushed Ship -> The 800-Mile Ocean Row -> Every Man Brought Home'
  }
];

export const DocumentaryStudioTab: React.FC = () => {
  const [activeChannelFilter, setActiveChannelFilter] = useState<'all' | 'ch4_finance_story' | 'driftreel_tiktok'>('all');
  const [selectedTopic, setSelectedTopic] = useState<DocumentaryTopic>(DOCUMENTARY_TOPICS[0]);
  const [narratorTone, setNarratorTone] = useState<string>('resonant_historian');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);

  const filteredTopics = activeChannelFilter === 'all'
    ? DOCUMENTARY_TOPICS
    : DOCUMENTARY_TOPICS.filter(t => t.channel === activeChannelFilter);

  const handleGeneratePreview = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      const destination = selectedTopic.channel === 'ch4_finance_story'
        ? 'YouTube Shorts (Channel 4 / Cinema Vanguard)'
        : 'TikTok Buffer (driftreel)';
      setGeneratedPreview(`Story Documentary Ready for ${destination}: "${selectedTopic.title}" — Narrative arc assembled with ${selectedTopic.soundscape.split(',')[0]}.`);
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 w-full overflow-hidden">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-slate-900 border border-amber-500/40 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold">
              <Film className="w-3.5 h-3.5" />
              <span>Multi-Niche Archival & Financial Story Documentaries</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Cinema Vanguard &amp; Driftreel Studio
            </h1>
            <p className="text-slate-300 text-xs md:text-sm max-w-2xl leading-relaxed">
              Dual-engine storytelling: Channel 4 produces gripping real-life financial narrative sagas (heists, crashes &amp; historic bubbles), while Driftreel publishes immersive crime, horror, and mystery documentary reels to TikTok.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleGeneratePreview}
              disabled={isSimulating}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs md:text-sm shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition-all cursor-pointer flex items-center gap-2 shrink-0"
            >
              {isSimulating ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing Reel...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Synthesize Documentary Story</span>
                </>
              )}
            </button>
          </div>
        </div>

        {generatedPreview && (
          <div className="mt-4 p-3 bg-emerald-950/70 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{generatedPreview}</span>
          </div>
        )}
      </div>

      {/* Channel Switcher Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveChannelFilter('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeChannelFilter === 'all'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
              : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
        >
          All Documentaries ({DOCUMENTARY_TOPICS.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveChannelFilter('ch4_finance_story')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeChannelFilter === 'ch4_finance_story'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Channel 4: Financial Stories (YouTube Shorts)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveChannelFilter('driftreel_tiktok')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeChannelFilter === 'driftreel_tiktok'
              ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20'
              : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Driftreel: Crime &amp; Horror (TikTok Buffer)</span>
        </button>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Topics Catalog */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" />
              <span>Curated Story Catalog &amp; Historical Chronicles</span>
            </h2>
            <span className="text-xs text-slate-400">Deduplicated Narratives</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTopics.map((topic) => {
              const isSelected = selectedTopic.id === topic.id;
              const isFinance = topic.channel === 'ch4_finance_story';

              return (
                <div
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden ${
                    isSelected
                      ? isFinance
                        ? 'bg-emerald-950/40 border-emerald-400 shadow-lg shadow-emerald-950/50 ring-1 ring-emerald-400/40'
                        : 'bg-amber-950/40 border-amber-400 shadow-lg shadow-amber-950/50 ring-1 ring-amber-400/40'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          topic.genre === 'financial_story' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          topic.genre === 'horror' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                          topic.genre === 'crime' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' :
                          'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}>
                          {topic.genre === 'financial_story' ? 'FINANCIAL STORY' : topic.genre}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-300 truncate max-w-[130px]">
                          {topic.era}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950/80 text-slate-300 border border-slate-700/60 shrink-0">
                        {isFinance ? 'CH 4' : 'DRIFTREEL'}
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
                    <div className="text-[11px] text-amber-300/90 font-medium flex items-center gap-1.5">
                      <ArrowUpRight className="w-3 h-3 shrink-0" />
                      <span className="truncate">{topic.narrativeArc}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Volume2 className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{topic.soundscape}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Workflow Architecture Overview */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-xs md:text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Documentary Production Workflow</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                <span className="text-xs font-bold text-emerald-300">1. Channel 4: Financial Stories</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Real-life economic sagas (Wall Street showdowns, rogue traders &amp; historic bubbles) told with deep authoritative narration and tense cello pulses.
                </p>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                <span className="text-xs font-bold text-sky-300">2. Driftreel: TikTok Mysteries</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  High-engagement crime, horror, ghost ship, and expedition survival reels formatted for TikTok with glowing dark outros and call-to-actions.
                </p>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                <span className="text-xs font-bold text-amber-300">3. Karaoke Subtitles &amp; Drift</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Word-synchronized karaoke captions with translucent drop-boxes, Ken Burns dynamic camera movement, and genre-specific sound effects.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Preview & Director Controls */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-xs md:text-sm font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-400" />
                <span>Visual Atmosphere Preview</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">9:16 VERTICAL</span>
            </h3>

            {/* Simulated 9:16 Vertical Card */}
            <div className="relative aspect-[9/15] w-full max-w-[280px] mx-auto rounded-2xl overflow-hidden border border-amber-500/30 shadow-2xl bg-slate-950">
              <img
                src={selectedTopic.visualPreviewUrl}
                alt={selectedTopic.title}
                className="w-full h-full object-cover filter contrast-110 brightness-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

              {/* Top Vignette Tag */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border backdrop-blur-sm ${
                  selectedTopic.channel === 'ch4_finance_story'
                    ? 'text-emerald-300 bg-slate-950/80 border-emerald-400/40'
                    : 'text-amber-300 bg-slate-950/80 border-amber-400/40'
                }`}>
                  {selectedTopic.channel === 'ch4_finance_story' ? 'FINANCIAL STORY' : 'DRIFTREEL'}
                </span>
                <span className="text-[10px] font-semibold text-slate-300 bg-slate-950/80 px-2 py-0.5 rounded backdrop-blur-sm">
                  {selectedTopic.era.split('•')[0]}
                </span>
              </div>

              {/* Center Simulated Karaoke Subtitles */}
              <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 text-center pointer-events-none">
                <div className="inline-block bg-black/75 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md">
                  <span className="text-xs font-black text-emerald-400 tracking-wide drop-shadow">
                    "I can calculate the stars,
                  </span>
                  <span className="text-xs font-bold text-white block">
                    but not the madness of men."
                  </span>
                </div>
              </div>

              {/* Bottom Quote & Topic Text */}
              <div className="absolute bottom-4 left-4 right-4 space-y-2">
                <h4 className="text-sm font-black text-white leading-snug drop-shadow-md">
                  {selectedTopic.title}
                </h4>
                <p className="text-[11px] text-slate-300 leading-normal line-clamp-2">
                  {selectedTopic.description}
                </p>
                <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-amber-300 font-medium">
                  <span>Target: {selectedTopic.channel === 'ch4_finance_story' ? 'YouTube Ch 4' : 'TikTok @driftreel'}</span>
                  <span>{selectedTopic.duration}</span>
                </div>
              </div>
            </div>

            {/* Voice & Cadence Selection */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Narration Voice &amp; Cadence
                </label>
                <select
                  value={narratorTone}
                  onChange={(e) => setNarratorTone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="resonant_historian">Authoritative Deep Narration (-6% rate, -20Hz pitch)</option>
                  <option value="financial_thriller">Tense Financial Chronicle (Measured &amp; urgent)</option>
                  <option value="cold_noir">Cold Noir Mystery (Quiet, haunting &amp; steady)</option>
                </select>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1 text-xs">
                <span className="font-semibold text-slate-300">Destination Pipeline:</span>
                <p className="text-slate-400 text-[11px]">
                  {selectedTopic.channel === 'ch4_finance_story'
                    ? 'Automatically uploads to YouTube Shorts (Channel 4 / Cinema Vanguard) daily at 14:00 UTC.'
                    : 'Dispatches to TikTok Buffer under account @driftreel daily with glowing dark outro.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
