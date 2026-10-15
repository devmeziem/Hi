import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Trash2, 
  Search, 
  RefreshCw, 
  Calendar, 
  Hash, 
  CheckCircle, 
  AlertTriangle,
  Layers,
  Sparkles
} from 'lucide-react';

interface DedupEntry {
  hash: string;
  channel: string;
  topic: string;
  timestamp: string;
}

const INITIAL_ENTRIES: DedupEntry[] = [
  {
    hash: '7f8b9c1d2e3f',
    channel: 'fin',
    topic: 'Zero-Overhead Micro Distribution Model',
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
  },
  {
    hash: 'a1b2c3d4e5f6',
    channel: 'cartoon',
    topic: 'Why Aerodynamic Winglets Slash Airplane Fuel Drag',
    timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString()
  },
  {
    hash: '3d4e5f6a7b8c',
    channel: 'stoic',
    topic: 'The Power of Strategic Silence Under Insult',
    timestamp: new Date(Date.now() - 14 * 3600 * 1000).toISOString()
  },
  {
    hash: '9e8d7c6b5a4f',
    channel: 'documentary',
    topic: 'The 1928 Vanishing of the Western Mail Train',
    timestamp: new Date(Date.now() - 22 * 3600 * 1000).toISOString()
  },
  {
    hash: '5c6b7a8d9e0f',
    channel: 'teen_motivation',
    topic: 'The 21-Day Silence Reset: Reclaiming Deep Focus',
    timestamp: new Date(Date.now() - 28 * 3600 * 1000).toISOString()
  },
  {
    hash: '8f7e6d5c4b3a',
    channel: 'fin',
    topic: 'The 24-Hour Micro-Test Before Buying Inventory',
    timestamp: new Date(Date.now() - 36 * 3600 * 1000).toISOString()
  },
  {
    hash: '2c3d4e5f6a7b',
    channel: 'cartoon',
    topic: 'How Maglev Trains Float with Zero Friction',
    timestamp: new Date(Date.now() - 44 * 3600 * 1000).toISOString()
  },
  {
    hash: '1a2b3c4d5e6f',
    channel: 'fin',
    topic: 'Why Keeping a $100 Cash Reserve Changes Negotiation Leverage',
    timestamp: new Date(Date.now() - 52 * 3600 * 1000).toISOString()
  }
];

export const TopicDedupTab: React.FC = () => {
  const [entries, setEntries] = useState<DedupEntry[]>(INITIAL_ENTRIES);
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [testTopicInput, setTestTopicInput] = useState<string>('');
  const [testResult, setTestResult] = useState<{ isDuplicate: boolean; match?: DedupEntry } | null>(null);
  const [retentionDays] = useState<number>(30);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const channelLabels: Record<string, { label: string; badge: string; color: string; border: string }> = {
    fin: { label: 'Fin Blueprint', badge: 'Channel 1', color: 'text-emerald-400 bg-emerald-950/60', border: 'border-emerald-800' },
    stoic: { label: 'The Stoic Architect', badge: 'Channel 2', color: 'text-amber-400 bg-amber-950/60', border: 'border-amber-800' },
    cartoon: { label: 'Archie Science Lab', badge: 'Channel 3', color: 'text-teal-400 bg-teal-950/60', border: 'border-teal-800' },
    documentary: { label: 'Cinema Vanguard', badge: 'Channel 4', color: 'text-rose-400 bg-rose-950/60', border: 'border-rose-800' },
    teen_motivation: { label: 'BonesCEO Motivation', badge: 'Channel 5', color: 'text-sky-400 bg-sky-950/60', border: 'border-sky-800' }
  };

  const filteredEntries = useMemo(() => {
    return entries.filter(item => {
      const matchesChannel = selectedChannel === 'all' || item.channel === selectedChannel;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q || item.topic.toLowerCase().includes(q) || item.hash.toLowerCase().includes(q);
      return matchesChannel && matchesSearch;
    });
  }, [entries, selectedChannel, searchQuery]);

  const handleTestDeduplication = (e: React.FormEvent) => {
    e.preventDefault();
    const query = testTopicInput.trim().toLowerCase();
    if (!query) return;

    const words = new Set(query.split(/\s+/).filter(w => w.length > 3));
    let foundMatch: DedupEntry | undefined;

    for (const item of entries) {
      const topicLower = item.topic.toLowerCase();
      if (topicLower === query || topicLower.includes(query) || query.includes(topicLower)) {
        foundMatch = item;
        break;
      }
      const itemWords = topicLower.split(/\s+/).filter(w => w.length > 3);
      if (words.size > 0 && itemWords.length > 0) {
        let matches = 0;
        for (const w of itemWords) {
          if (words.has(w)) matches++;
        }
        const overlap = matches / Math.max(words.size, itemWords.length);
        if (overlap > 0.6) {
          foundMatch = item;
          break;
        }
      }
    }

    if (foundMatch) {
      setTestResult({ isDuplicate: true, match: foundMatch });
    } else {
      setTestResult({ isDuplicate: false });
    }
  };

  const handlePurgeOldEntries = () => {
    const cutoff = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
    const fresh = entries.filter(e => new Date(e.timestamp).getTime() >= cutoff);
    const purgedCount = entries.length - fresh.length;
    setEntries(fresh);
    showToast(purgedCount > 0 ? `Purged ${purgedCount} expired entries older than 30 days.` : 'All entries are within the active 30-day window.');
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to reset the local preview log? The repository data file remains preserved.')) {
      setEntries([]);
      showToast('Local preview entries cleared.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-lg shadow-xl flex items-center space-x-2 text-sm">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-emerald-950/80 border border-emerald-700/50 rounded-lg text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Topic Deduplication & Anti-Repeat Engine
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Rolling 30-day SHA-256 topic registry committed to repository. Enforces strict cross-channel topic isolation so Archie never receives finance copy and duplicate topics are prevented.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={handlePurgeOldEntries}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
              title="Purge items older than 30 days"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Purge Expired (30d)</span>
            </button>
            <button
              onClick={handleClearAll}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-800/80 hover:bg-rose-950/50 text-slate-400 hover:text-rose-300 text-xs font-semibold rounded-lg border border-slate-700 hover:border-rose-800/60 transition"
              title="Reset preview log"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset View</span>
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-3">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Active Tracked Topics</div>
            <div className="text-lg font-bold text-white mt-1">{entries.length}</div>
            <div className="text-[10px] text-emerald-400 mt-0.5">Committed to Git</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-3">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Retention Window</div>
            <div className="text-lg font-bold text-white mt-1">30 Days</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Automated Monthly Purge</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-3">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Niche Isolation</div>
            <div className="text-lg font-bold text-emerald-400 mt-1">100% Strict</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Zero Cross-Channel Bleed</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-3">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Storage Format</div>
            <div className="text-lg font-bold text-slate-200 mt-1">Compact JSON</div>
            <div className="text-[10px] text-slate-400 mt-0.5">data/topic_dedup_log.json</div>
          </div>
        </div>
      </div>

      {/* Live Duplicate Checker Tool */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center space-x-2 mb-3">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Live Topic Duplicate Pre-Check
          </h3>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          Paste any proposed script title or concept to verify if it has been published within the last 30 days.
        </p>

        <form onSubmit={handleTestDeduplication} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={testTopicInput}
            onChange={(e) => {
              setTestTopicInput(e.target.value);
              setTestResult(null);
            }}
            placeholder="e.g. Why airplane winglets save fuel, or Micro-distribution arbitrage"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition shrink-0"
          >
            Check Uniqueness
          </button>
        </form>

        {testResult && (
          <div className={`mt-3 p-3.5 rounded-lg border text-xs flex items-start space-x-2.5 ${
            testResult.isDuplicate 
              ? 'bg-rose-950/50 border-rose-800/80 text-rose-200' 
              : 'bg-emerald-950/50 border-emerald-800/80 text-emerald-200'
          }`}>
            {testResult.isDuplicate ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div>
              {testResult.isDuplicate ? (
                <>
                  <span className="font-bold">Duplicate Detected!</span> This topic has a high similarity to:{' '}
                  <span className="font-semibold underline">"{testResult.match?.topic}"</span> logged on{' '}
                  {new Date(testResult.match?.timestamp || '').toLocaleDateString()}. The pipeline will reject this angle and pick a fresh discovery topic.
                </>
              ) : (
                <>
                  <span className="font-bold">100% Unique & Safe!</span> No duplicate detected in the 30-day repository registry. This topic is eligible for immediate production.
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Filter and Registry List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {/* Controls Bar */}
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Channel Filters */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedChannel('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedChannel === 'all'
                  ? 'bg-slate-200 text-slate-900'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              All ({entries.length})
            </button>
            {Object.entries(channelLabels).map(([key, info]) => {
              const count = entries.filter(e => e.channel === key).length;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedChannel(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                    selectedChannel === key
                      ? 'bg-slate-200 text-slate-900'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  {info.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topic or hash..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-600 transition"
            />
          </div>
        </div>

        {/* Entries Table / Mobile List */}
        {filteredEntries.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-sm">
            No tracked topics found matching the current filters.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredEntries.map((item) => {
              const chInfo = channelLabels[item.channel] || {
                label: item.channel,
                badge: 'Active',
                color: 'text-slate-300 bg-slate-800',
                border: 'border-slate-700'
              };
              const dateStr = new Date(item.timestamp).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={`${item.hash}_${item.channel}`}
                  className="p-3.5 sm:p-4 hover:bg-slate-800/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${chInfo.color} ${chInfo.border}`}>
                        {chInfo.label}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 flex items-center space-x-1">
                        <Hash className="w-2.5 h-2.5" />
                        <span>{item.hash}</span>
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{dateStr}</span>
                      </span>
                    </div>

                    <div className="text-sm font-semibold text-slate-200 break-words">
                      {item.topic}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 rounded text-[11px] font-medium">
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                      <span>Protected</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
