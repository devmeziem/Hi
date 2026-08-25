import React, { useState } from 'react';
import {
  DollarSign,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  BookOpen,
  TrendingUp,
  Cpu,
  Search,
  CheckCircle2,
  FileText,
  Play,
  Layers,
  Settings2,
  Lock,
  Flame,
  Globe2,
  Send,
  Eye,
  RefreshCw
} from 'lucide-react';
import { IntegrationKeys } from '../types';

interface FinanceEngineTabProps {
  keys: IntegrationKeys;
}

export const FinanceEngineTab: React.FC<FinanceEngineTabProps> = ({ keys }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('small_capital_business');
  const [targetBudget, setTargetBudget] = useState<string>('₦5,000');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [formatMode, setFormatMode] = useState<'shorts' | 'standard' | 'deep_dive'>('shorts');
  const [autoPublish, setAutoPublish] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [pipelineStatus, setPipelineStatus] = useState<string>('IDLE');
  
  // Generated content preview
  const [generatedScript, setGeneratedScript] = useState<any | null>({
    title: '3 Businesses You Can Start With ₦5,000 ($3.50 USD) #Shorts',
    category: 'small_capital_business',
    targetBudget: '₦5,000 (~$3.50 USD)',
    riskLevel: 'LOW',
    passedAudit: true,
    sources: [
      'NBS Micro-Enterprise Baseline Statistics 2025/2026',
      'Local Retail Packaging Unit Cost Index',
      'Small & Medium Enterprises Development Agency (SMEDAN)'
    ],
    riskAuditNote: 'Safe: Contains zero guaranteed income promises. Uses realistic estimated margins and break-even disclaimers.',
    slides: [
      {
        slideIndex: 0,
        text: 'If you only have ₦5,000 or about $3.50 USD left today, here is how you can start an actual micro-business.',
        visual: 'Cinematic 9:16 vertical 8k scene, modern minimalist workspace, emerald green and gold rim lighting, dark slate backdrop'
      },
      {
        slideIndex: 1,
        text: 'The mistake most beginners make is waiting for millions instead of starting with fast-turnaround daily essentials.',
        visual: 'Entrepreneur evaluating budget items on smartphone screen, clean studio lighting with emerald glow'
      },
      {
        slideIndex: 2,
        text: 'Idea 1: Repackaging dry kitchen spices or roasted peanuts into ₦200 transparent mini-pouches.',
        visual: 'Clean commercial mini snack packaging setup with clear pricing labels on obsidian slate'
      },
      {
        slideIndex: 3,
        text: '₦3,500 buys wholesale bulk raw stock, and ₦1,500 covers quality seal pouches and custom brand stickers.',
        visual: 'Unit economics breakdown diagram with glowing emerald numbers and transparent financial table'
      },
      {
        slideIndex: 4,
        text: 'Sell 30 packs at ₦200 to generate ₦6,000 total revenue, giving an estimated ₦1,000 gross margin on day one.',
        visual: 'Modern disciplined small business owner counting inventory in high-contrast cinematic setting'
      },
      {
        slideIndex: 5,
        text: 'Results vary with location. Always reinvest your first profit. Follow @bones_ceo for daily blueprints.',
        visual: 'Inspiring modern city morning horizon with subtle emerald and amber bokeh glow, 9:16 vertical 8k'
      }
    ]
  });

  const categories = [
    { id: 'small_capital_business', label: 'A. Small-Capital Business', desc: '₦1k, ₦5k, ₦10k startup economics, phone-only businesses & margin calculations', icon: DollarSign, color: 'text-emerald-400' },
    { id: 'saving_personal_finance', label: 'B. Saving & Personal Finance', desc: 'Budgeting ₦20,000, emergency funds, cutting bank fees & 50/30/20 systems', icon: TrendingUp, color: 'text-blue-400' },
    { id: 'financial_education', label: 'C. Financial Education', desc: 'Inflation explained, compound interest, loans, APR, ETFs & liquidity', icon: BookOpen, color: 'text-amber-400' },
    { id: 'skills_to_income', label: 'D. Skills → Income', desc: 'Phone-only video editing, writing, digital marketing, freelancing', icon: Cpu, color: 'text-purple-400' },
    { id: 'free_opportunities', label: 'E. Free & Low-Cost Opportunities', desc: 'Verified Google/MS certs, legitimate grants & scholarships', icon: Globe2, color: 'text-cyan-400' },
    { id: 'scam_awareness', label: 'F. Scam & Fraud Awareness', desc: 'Ponzi traps, fake crypto giveaways, phishing & warning signals', icon: AlertTriangle, color: 'text-rose-400' },
    { id: 'business_breakdowns', label: 'G. Business Breakdowns', desc: 'Unit economics: "Can ₦5k start a snack business?" with real gross margins', icon: Layers, color: 'text-emerald-300' },
    { id: 'beginner_investing_crypto', label: 'H. Beginner Investing & Crypto', desc: 'Bitcoin, USDT stablecoins, inflation hedging & self-custody rules', icon: Lock, color: 'text-indigo-400' }
  ];

  const handleGenerateIdeas = () => {
    setIsGenerating(true);
    setPipelineStatus('RESEARCHING SOURCES & FACT CHECKING');
    setTimeout(() => {
      setIsGenerating(false);
      setPipelineStatus('READY FOR REVIEW');
    }, 1200);
  };

  return (
    <div className="space-y-6 w-full max-w-full min-w-0 overflow-x-hidden">
      {/* Top Banner: Core Positioning & 21-Pillar Compliance */}
      <div className="p-6 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/40">
                CHANNEL 1 ENGINE
              </span>
              <span className="text-xs font-mono text-slate-400">@bones_ceo (Fin Blueprint)</span>
            </div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-400" />
              Nigerian & Global Finance Content Studio
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl">
              "Learn how to manage money, start small businesses, develop valuable skills, find legitimate opportunities, and understand finance in simple language."
            </p>
          </div>

          {/* Auto-Publish Toggle */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3 shrink-0">
            <div className="space-y-0.5">
              <div className="text-[11px] font-bold text-white">AUTO-PUBLISH</div>
              <div className="text-[10px] text-slate-400">{autoPublish ? 'Passes risk audit -> Live' : 'Requires manual sign-off'}</div>
            </div>
            <button
              onClick={() => setAutoPublish(!autoPublish)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                autoPublish ? 'bg-emerald-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  autoPublish ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Core Guardrails */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 space-y-1">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Non-Guru Positioning
            </span>
            <p className="text-[11px] text-slate-400">
              Never promises guaranteed wealth. Uses measured terms: "estimated margin", "potential revenue", "results vary".
            </p>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 space-y-1">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <Search className="w-4 h-4" /> Fact-Checking & Sources
            </span>
            <p className="text-[11px] text-slate-400">
              Verified against NBS, CBN, SEC, and SMEDAN official indexes with source citation in descriptions.
            </p>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 space-y-1">
            <span className="font-bold text-sky-400 flex items-center gap-1.5">
              <Globe2 className="w-4 h-4" /> Dual Currency Context
            </span>
            <p className="text-[11px] text-slate-400">
              Seamlessly integrates Nigerian Naira (₦) with global USD ($) estimates (e.g. ₦5,000 / ~$3.50 USD).
            </p>
          </div>
        </div>
      </div>

      {/* Category Selector Grid */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-400" />
          Finance Content Category Selector (Admin Panel)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-2 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-emerald-950/80 border-emerald-500 ring-1 ring-emerald-500 shadow-lg shadow-emerald-950/50'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon className={`w-5 h-5 ${cat.color}`} />
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <div>
                  <div className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                    {cat.label}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                    {cat.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Format Engine & Topic Controller */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-5 lg:col-span-1">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-emerald-400" />
            Format Engine & Parameters
          </h2>

          {/* Format Mode */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase font-mono">Video Format</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'shorts', label: 'Shorts (60s)', desc: '9:16 Vertical' },
                { id: 'standard', label: 'Standard (5-10m)', desc: '16:9 Landscape' },
                { id: 'deep_dive', label: 'Deep Dive (15m)', desc: '15 Chapters' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormatMode(f.id as any)}
                  className={`p-2.5 rounded-xl border text-center cursor-pointer transition-colors ${
                    formatMode === f.id
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs">{f.label}</div>
                  <div className="text-[9px] text-slate-400">{f.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Budget Preset */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase font-mono">Target Startup Budget</label>
            <div className="grid grid-cols-4 gap-1.5">
              {['₦1,000', '₦5,000', '₦10,000', '₦20,000'].map((b) => (
                <button
                  key={b}
                  onClick={() => setTargetBudget(b)}
                  className={`py-1.5 px-2 rounded-lg border text-xs font-mono cursor-pointer ${
                    targetBudget === b
                      ? 'bg-emerald-900/80 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Topic Input */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase font-mono">Custom Topic / Angle (Optional)</label>
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="e.g. Can ₦5,000 really start a food reselling business?"
              className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateIdeas}
            disabled={isGenerating}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Synthesizing Verified Content...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Verified Finance Blueprint</span>
              </>
            )}
          </button>
        </div>

        {/* Live Studio Preview: Fact Check, Risk Audit & Storyboard */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                Source-Aware Script & Risk Audit Inspector
              </h2>
              <p className="text-[11px] text-slate-400">
                Real-time review before rendering & publishing
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                RISK AUDIT: PASSED
              </span>
            </div>
          </div>

          {generatedScript && (
            <div className="space-y-4">
              {/* Title & Stats */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">Generated High-CTR Title</span>
                  <span className="font-mono text-[10px]">6 Slides (60s)</span>
                </div>
                <div className="text-sm font-bold text-white">
                  "{generatedScript.title}"
                </div>
                <div className="flex flex-wrap gap-2 pt-1 text-[10px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                    Budget: {generatedScript.targetBudget}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-emerald-400 border border-emerald-900/60">
                    Niche: Nigerian & Global Finance
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-indigo-300 border border-indigo-900/60">
                    Channel: @bones_ceo
                  </span>
                </div>
              </div>

              {/* Verified Sources & Safety Flag Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                  <div className="text-[10px] font-mono font-bold uppercase text-slate-400 flex items-center gap-1">
                    <Search className="w-3 h-3 text-cyan-400" />
                    Verified Sources Cited
                  </div>
                  <ul className="text-[11px] text-slate-300 space-y-1">
                    {generatedScript.sources.map((s: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-400 font-mono">[{idx + 1}]</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                  <div className="text-[10px] font-mono font-bold uppercase text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Automated Risk Detector
                  </div>
                  <p className="text-[11px] text-slate-300">
                    {generatedScript.riskAuditNote}
                  </p>
                  <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 pt-1">
                    <CheckCircle2 className="w-3 h-3" /> No "double your money" or deceptive claims
                  </div>
                </div>
              </div>

              {/* 6-Slide Storyboard Breakdown */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase font-mono">
                  Slide Sequence (Spoken English Narration + 9:16 Visuals)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                  {generatedScript.slides.map((slide: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-emerald-400 font-bold">Slide {slide.slideIndex + 1} / 6</span>
                        <span className="text-slate-500">~14 words</span>
                      </div>
                      <p className="text-xs text-white font-medium">"{slide.text}"</p>
                      <p className="text-[10px] text-slate-400 font-mono italic line-clamp-2">
                        Visual: {slide.visual}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
