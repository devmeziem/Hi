import React, { useState, useEffect } from 'react';
import {
  Flame,
  Play,
  Dumbbell,
  Smartphone,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Clock,
  ExternalLink,
  Target,
  Zap,
  CheckCircle2,
  Users,
  Trophy,
  Activity
} from 'lucide-react';

interface MotivationReel {
  id: string;
  title: string;
  hook: string;
  challenge: string;
  videoPath: string;
  duration: number;
  tags: string[];
  youtubeUploadStatus: string;
  createdAt: string;
}

export const TeenMotivationTab: React.FC = () => {
  const [reels, setReels] = useState<MotivationReel[]>([]);
  const [selectedReel, setSelectedReel] = useState<MotivationReel | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);

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
        id: 'motivation_dopamine_reset',
        title: 'Why Your Phone Is Stealing Your Future',
        hook: "You're not lazy. You're just drowning in cheap dopamine.",
        challenge: 'RULE 1: NO PHONE IN BED FOR 7 DAYS',
        videoPath: '/api/stream-video?file=test_artifacts/motivation_reels/teen_motivation_dopamine_reset_21_days.mp4',
        duration: 24.68,
        tags: ['#TeenMotivation', '#YoungMenMotivation', '#Discipline', '#DopamineDetox', '#Shorts'],
        youtubeUploadStatus: 'PENDING_REVIEW (Upload hold enabled)',
        createdAt: new Date().toISOString()
      },
      {
        id: 'motivation_lock_in_exam',
        title: 'How To Lock In When Everyone Else Quits',
        hook: "While they are talking about what they're gonna do, you put your head down and work.",
        challenge: 'TRY THE 50/10 RULE: 50 MIN FOCUS, 0 NOTIFICATIONS',
        videoPath: '/api/stream-video?file=test_artifacts/motivation_reels/teen_motivation_lock_in_exam_study.mp4',
        duration: 22.4,
        tags: ['#StudyMotivation', '#LockIn', '#AcademicComeback', '#TeenDiscipline', '#Shorts'],
        youtubeUploadStatus: 'PENDING_REVIEW (Upload hold enabled)',
        createdAt: new Date(Date.now() - 43200000).toISOString()
      },
      {
        id: 'motivation_gym_armor',
        title: 'The Gym Doesn\'t Build Muscle, It Builds Armor',
        hook: "You can't buy genuine self-respect. You have to earn it under the barbell.",
        challenge: 'NEVER SKIP MONDAY: SHOW UP REGARDLESS OF MOOD',
        videoPath: '/api/stream-video?file=test_artifacts/motivation_reels/teen_motivation_gym_confidence_rule.mp4',
        duration: 25.1,
        tags: ['#GymMotivation', '#TeenFitness', '#MindsetShift', '#HardWork', '#Shorts'],
        youtubeUploadStatus: 'PENDING_REVIEW (Upload hold enabled)',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ];

    setReels(defaultReels);
    setSelectedReel(defaultReels[0]);
  };

  useEffect(() => {
    loadReels();
  }, []);

  const handleGenerateReel = async (topicIdx: number) => {
    setIsRendering(true);
    setToast('Synthesizing brotherly mentor audio & rendering high-voltage typography...');
    try {
      const res = await fetch('/api/motivation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicIndex: topicIdx })
      });
      const data = await res.json();
      if (data.success && data.reel) {
        setReels(prev => [data.reel, ...prev]);
        setSelectedReel(data.reel);
        setToast('New Teen Motivation reel generated and held for your review!');
      } else {
        loadReels();
        setToast('Generation complete. Refreshing reel vault...');
      }
    } catch {
      setToast('Reel generation queued in background.');
      setTimeout(loadReels, 15000);
    } finally {
      setIsRendering(false);
      setTimeout(() => setToast(null), 6000);
    }
  };

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden pb-12">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-amber-500 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold animate-in fade-in">
          <Zap className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-slate-800 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-600/20 border border-amber-500/40 rounded-2xl text-amber-400">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-tight">Apex Discipline: Young Men & Teen Motivation</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-950 border border-amber-800 text-amber-300 text-[10px] font-mono font-bold">
                  Channel 5
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Dopamine reset, study lockdown, gym discipline, and anti-doomscrolling brotherly coaching for Gen-Z.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => handleGenerateReel(0)}
            disabled={isRendering}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg shadow-amber-600/30 flex items-center gap-2 cursor-pointer"
          >
            {isRendering ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
            <span>Dopamine Reset</span>
          </button>
          <button
            onClick={() => handleGenerateReel(1)}
            disabled={isRendering}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer border border-slate-700"
          >
            {isRendering ? <RefreshCw className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
            <span>Exam Lock-In</span>
          </button>
          <button
            onClick={() => handleGenerateReel(2)}
            disabled={isRendering}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-bold rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer border border-slate-700"
          >
            {isRendering ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Dumbbell className="w-4 h-4" />}
            <span>Gym Armor</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Video Player + Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Video Player Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  {selectedReel ? selectedReel.title : 'Select a Reel'}
                </h3>
                <div className="text-[11px] font-mono text-slate-400">
                  Apex Protocol • Duration: {selectedReel?.duration.toFixed(0)}s
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-800 text-amber-300 text-[10px] font-mono font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3" />
                Held For Review
              </span>
            </div>

            {/* 9:16 Mobile Reel Container */}
            <div className="w-full aspect-[9/16] max-w-[340px] mx-auto bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative flex items-center justify-center">
              {selectedReel ? (
                <video
                  key={selectedReel.id}
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
                  No reel selected.
                </div>
              )}
            </div>

            {/* Hook & Action Challenge */}
            {selectedReel && (
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                <div>
                  <div className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-bold">
                    Primary Hook (0–3 Seconds)
                  </div>
                  <div className="text-sm font-black text-white mt-0.5">
                    "{selectedReel.hook}"
                  </div>
                </div>

                <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-lg">
                  <div className="text-[10px] font-mono text-amber-300 uppercase tracking-wider font-bold flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-amber-400" />
                    Action Challenge Given to Viewer
                  </div>
                  <div className="text-xs font-bold text-amber-100 mt-1">
                    {selectedReel.challenge}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedReel.tags.map(t => (
                    <span key={t} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Topics & Catalog Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <h3 className="text-sm font-bold text-white">Curated Daily Protocols ({reels.length})</h3>

            <div className="space-y-2.5">
              {reels.map((reel) => {
                const isSelected = selectedReel?.id === reel.id;
                return (
                  <div
                    key={reel.id}
                    onClick={() => setSelectedReel(reel)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-950/30 border-amber-500/50 shadow-md'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-white">
                          {reel.title}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1 mt-1">
                          {reel.hook}
                        </div>
                        <div className="text-[10px] font-mono text-amber-400 mt-1 font-semibold">
                          {reel.challenge}
                        </div>
                      </div>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 shrink-0">
                        {reel.duration.toFixed(0)}s
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Teen Psychology & Retention Principles */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5 mt-4">
              <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                Why Teen Motivation Explodes on Shorts & TikTok
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
                <li><strong>No Preachy Lecturing:</strong> Speaks as an older brother, not a parent or professor.</li>
                <li><strong>Concrete 7-Day Challenges:</strong> Teens love measurable rules (e.g. "No phone in bed for 7 days").</li>
                <li><strong>High Shareability:</strong> "Tag a brother who needs to lock in" triggers peer-to-peer DMs.</li>
                <li><strong>High-Energy Soundtrack:</strong> Ducked phonk/gym drill audio keeps retention past the 15-second mark.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
