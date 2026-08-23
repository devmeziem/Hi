import React from 'react';
import { Sliders, Clock, Tag, Globe, Sparkles } from 'lucide-react';
import { NicheType } from '../types';

export const NicheConfig: React.FC = () => {
  const niches = [
    {
      id: 'finance_saas',
      title: 'Channel 1: Fin Blueprint (@bones_ceo)',
      schedule: '4 slots/day: 09:00 (Hustle), 13:00 (News Poll), 17:00 (Story), 21:00 (Wealth)',
      topics: ['Low-Capital Side Hustles', 'Finance News & Opinion Polls', 'True Starting-Small Stories', 'Wealth Discipline Habits'],
      tags: ['#FinBlueprint', '#SideHustle', '#FinanceNews', '#CaseStudy', '#Shorts']
    },
    {
      id: 'motivation_stoicism',
      title: 'Channel 2: Modern Stoicism & Mental Strength',
      schedule: '4 slots/day: 06:00, 11:00, 16:00, 20:00 (UTC)',
      topics: ['Discipline Over Motivation', 'Dealing with Disrespect & Silence', 'Emotional Control Under Pressure', 'Handling Rejection & Failure', 'Overcoming Overthinking', 'Rebuilding from Zero'],
      tags: ['#Shorts', '#Discipline', '#Motivation', '#MentalStrength', '#SelfControl', '#Stoicism', '#Mindset']
    },
    {
      id: 'tech_ai',
      title: 'Channel 3: Godswill Isaac (@bonesceo)',
      schedule: '4 slots/day: 10:00, 14:00, 18:00, 22:00 (EST)',
      topics: ['DeepSeek vs Gemini Coding', 'Top Open-Source CLI Tools', 'Cloudflare Free TTS', 'Autonomous Content Pipelines'],
      tags: ['#AITools', '#DeepSeek', '#OpenSource', '#TechNews', '#Shorts']
    }
  ];

  return (
    <div className="space-y-6 w-full max-w-full min-w-0 overflow-x-hidden">
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
          <Sliders className="w-6 h-6 text-indigo-400" />
          Autonomous 3-Niche Engine Configuration
        </h2>
        <p className="text-xs text-slate-400">
          Preset posting slots, viral keyword matrices, and hashtag clusters configured for each channel's daily 4-post automation sequence.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {niches.map(n => (
            <div key={n.id} className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">{n.title}</h3>
              <div className="flex items-center gap-2 text-[11px] text-indigo-300 font-mono">
                <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>{n.schedule}</span>
              </div>
              <div className="space-y-1 pt-1">
                <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">Top Topics</div>
                <div className="flex flex-wrap gap-1">
                  {n.topics.map(t => (
                    <span key={t} className="text-[10px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-800">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-1 pt-1">
                <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">Hashtag Matrix</div>
                <div className="flex flex-wrap gap-1">
                  {n.tags.map(tag => (
                    <span key={tag} className="text-[10px] bg-indigo-950/60 text-indigo-300 px-2 py-0.5 rounded font-mono">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
