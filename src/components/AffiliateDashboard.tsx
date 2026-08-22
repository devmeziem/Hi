import React from 'react';
import { DollarSign, ExternalLink, TrendingUp, Award, Link, ShoppingBag, CheckCircle } from 'lucide-react';

export const AffiliateDashboard: React.FC = () => {
  const affiliatePlatforms = [
    {
      name: 'Selar (Africa & Global Creators)',
      url: 'https://selar.co',
      badge: 'High Conversion (WAT/Africa)',
      description: 'Host digital products, ebooks, templates, and courses with direct checkout in NGN, GHS, KES, ZAR, and USD.',
      products: [
        { name: 'AI Micro-SaaS Blueprint 2026', commission: '60%', link: 'https://selar.co/p/ai-micro-saas-blueprint' },
        { name: 'Stoic Productivity System (Notion)', commission: '50%', link: 'https://selar.co/p/stoic-notion-system' }
      ]
    },
    {
      name: 'Digistore24 (Global Tier 1 Traffic)',
      url: 'https://www.digistore24.com',
      badge: 'Global USD/EUR Payouts',
      description: 'High-ticket automated affiliate marketplace for software, courses, and financial tools with 85% revenue shares.',
      products: [
        { name: 'Crypto & Forex Automated Bot Mastery', commission: '75%', link: 'https://www.digistore24.com/redir/crypto-bot' },
        { name: 'Ultimate YouTube Automation Kit', commission: '70%', link: 'https://www.digistore24.com/redir/yt-kit' }
      ]
    },
    {
      name: 'Gumroad & Lemon Squeezy',
      url: 'https://gumroad.com',
      badge: 'Tech & Developer Tools',
      description: 'Instant delivery for AI prompts, code snippets, GitHub templates, and developer toolkits.',
      products: [
        { name: '100+ Cursor AI & DeepSeek Workflows', commission: '50%', link: 'https://gumroad.com/l/cursor-deepseek' }
      ]
    }
  ];

  return (
    <div className="space-y-6 w-full max-w-full min-w-0 overflow-x-hidden">
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <DollarSign className="w-6 h-6 text-emerald-400" />
              Monetization & Affiliate Integration Hub
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Active affiliate funnels and product links auto-inserted into your 4 daily YouTube Shorts descriptions and pinned comments.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-xs font-mono font-bold">
              3 Networks Active
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {affiliatePlatforms.map((plat) => (
            <div key={plat.name} className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm text-white">{plat.name}</h3>
                  <span className="text-[10px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded font-mono font-semibold border border-indigo-800/40">
                    {plat.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{plat.description}</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">Top Funnels</div>
                {plat.products.map(p => (
                  <div key={p.name} className="p-2 bg-slate-900/60 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-slate-200 truncate pr-2">{p.name}</span>
                    <span className="font-mono font-bold text-emerald-400 shrink-0">{p.commission}</span>
                  </div>
                ))}
              </div>

              <a
                href={plat.url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Manage Affiliate Account</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
