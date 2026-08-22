import React from 'react';
import { BookOpen, CheckCircle, AlertTriangle, ShieldCheck, Flame, Cpu, DollarSign } from 'lucide-react';

export const GuidelinesMasterclass: React.FC = () => {
  return (
    <div className="space-y-6 w-full max-w-full min-w-0 overflow-x-hidden">
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
          <BookOpen className="w-6 h-6 text-indigo-400" />
          Voxam Content & Algorithm Guidelines
        </h2>
        <p className="text-xs text-slate-400">
          Strict high-retention frameworks to ensure every YouTube Short passes automated community guidelines and achieves &gt;80% View-Through Rate (VTR).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Niche 1 Guidelines */}
          <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <DollarSign className="w-4 h-4" />
              <span>Channel 1: Finance & SaaS</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Focus on zero-code AI tools, ARR case studies, and real affiliate metrics.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Avoid get-rich-quick claims; show exact pricing frameworks and unit economics.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Include Selar / Digistore24 affiliate lead magnets in pinned comments.</span>
              </li>
            </ul>
          </div>

          {/* Niche 2 Guidelines */}
          <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
              <Flame className="w-4 h-4" />
              <span>Channel 2: Stoic Motivation</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span>Cite authentic passages from Meditations, Seneca, and Epictetus.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span>Use cinematic high-contrast marble/dark statue imagery with deep audio pacing.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span>Zero fluff; deliver immediate philosophical clarity in under 45 seconds.</span>
              </li>
            </ul>
          </div>

          {/* Niche 3 Guidelines */}
          <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
              <Cpu className="w-4 h-4" />
              <span>Channel 3: Tech & AI Tools</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>Benchmark real models (DeepSeek-R1, Gemini 2.5, Claude 3.7, Cursor).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>Provide terminal commands, open-source links, and local AI configs.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>Target developer tools with high affiliate commissions and workflow value.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
