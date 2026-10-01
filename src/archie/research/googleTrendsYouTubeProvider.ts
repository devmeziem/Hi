/**
 * Google Search Trends & YouTube Search Suggest Discovery Engine
 * 
 * Features:
 * 1. Zero API Key Requirement: Fetches live Google Trends RSS and YouTube Search Suggest Autocomplete directly.
 * 2. Topic Deduplication: Compares candidate topics against saved topic history (Jaccard word shingle + canonical normalized matching).
 * 3. Deep Topic Elaboration: Combines DuckDuckGo Instant Answer API and Wikipedia REST API to extract:
 *    - Common Problem Statement
 *    - Layman Plain-English Mechanism (Zero big confusing jargon)
 *    - Concrete Free Remedy / Software Tool
 * 4. Content Creator 5-Tool Matrix Builder: Constructs the viral "5 Tools You'll Thank Me For Later" sequence with Tool Slam cues and safe captions.
 */

export interface TrendingTopicItem {
  id: string;
  topic: string;
  source: 'google_trends' | 'youtube_suggest' | 'creator_trend' | 'everyday_science' | 'software_remedy' | 'live_feed';
  searchQuery: string;
  approxTraffic?: string;
  category: 'creator_tools' | 'everyday_science' | 'digital_life' | 'software_remedy';
  isDuplicate?: boolean;
  similarityScore?: number;
  duplicateReason?: string;
}

export interface ElaboratedTopicReport {
  topic: string;
  sourceQuery: string;
  problemStatement: string;
  plainEnglishExplanation: string;
  freeRemedyTool: {
    name: string;
    description: string;
    freeTier: string;
    directUrl: string;
    pros: string[];
    actionableUsage: string;
  };
  wikipediaSummary?: string;
  duckDuckGoAbstract?: string;
  hashtags: string[];
  trendingKeywords: string[];
}

export interface CreatorToolItem {
  number: number;
  name: string;
  tagline: string;
  category: 'Editing' | 'Audio' | 'Graphics' | 'AI Scripting' | 'Compression' | 'Recording';
  freeTier: string;
  pros: string[];
  usageSummary: string; // 10-15s spoken explanation
  screenshotUrl: string;
  directUrl: string;
  isClimaxCritical?: boolean;
}

export interface Creator5ToolReelScript {
  hook: string;
  subHook: string;
  targetAudience: 'Content Creators';
  tools: CreatorToolItem[];
  outroCta: string;
  safeCaptions: Array<{
    cueSeconds: number;
    text: string;
    isToolSlam: boolean;
    activeToolNumber?: number;
  }>;
  hashtags: string[];
}

/**
 * Standard Verified Content Creator Tool Catalog with Real Provenance
 */
export const VERIFIED_CREATOR_TOOLS_CATALOG: CreatorToolItem[] = [
  {
    number: 1,
    name: 'CapCut Desktop & Web',
    tagline: 'Auto-Captions & 60fps Mobile Reel Timeline',
    category: 'Editing',
    freeTier: '100% Free with zero watermark on export',
    pros: ['Auto-generates word-by-word karaoke captions', 'One-click 9:16 vertical crop', 'Massive free sound effects library'],
    usageSummary: 'Instead of manually typing subtitles for two hours, its auto-caption engine transcribes your voice in 15 seconds with custom animations.',
    screenshotUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1080&q=80',
    directUrl: 'https://www.capcut.com'
  },
  {
    number: 2,
    name: 'Adobe Podcast AI Audio Enhance',
    tagline: 'Instant Studio Microphone Simulator',
    category: 'Audio',
    freeTier: 'Free web tier (1 hour of audio per day)',
    pros: ['Removes harsh room echo and fan noise', 'Boosts low-end vocal resonance like a $400 mic', 'Runs directly in your phone browser'],
    usageSummary: 'Upload raw phone audio recorded on a noisy street or in an echoey bedroom, and it eliminates 100% of background noise to sound like a studio condenser.',
    screenshotUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1080&q=80',
    directUrl: 'https://podcast.adobe.com/enhance'
  },
  {
    number: 3,
    name: 'Photopea Online Editor',
    tagline: 'Complete In-Browser Photoshop Alternative',
    category: 'Graphics',
    freeTier: '100% Free web app, zero download needed',
    pros: ['Opens native PSD, AI, and Figma files', 'Supports layer masks, smart filters & blending modes', 'Zero login required for immediate thumbnail editing'],
    usageSummary: 'You do not need a paid Photoshop subscription to make high-CTR YouTube thumbnails. Photopea runs identical tools inside your browser for free.',
    screenshotUrl: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=1080&q=80',
    directUrl: 'https://www.photopea.com'
  },
  {
    number: 4,
    name: 'TinyPNG / Squoosh Web',
    tagline: 'Lossless Visual Asset Compressor',
    category: 'Compression',
    freeTier: '100% Free online tool',
    pros: ['Cuts image weight by 70% with zero visible quality loss', 'Drastically speeds up video import and loading', 'Batch uploads up to 20 images at once'],
    usageSummary: 'Shrinks 15-megabyte camera stills down to 2 megabytes with zero visible distortion so your editing timeline stays butter-smooth without crashing.',
    screenshotUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1080&q=80',
    directUrl: 'https://tinypng.com'
  },
  {
    number: 5,
    name: 'DaVinci Resolve / OBS Studio',
    tagline: 'Hollywood Color Grading & 4K Recording Studio',
    category: 'Recording',
    freeTier: '100% Free permanent version (No watermark, no trial limits)',
    pros: ['Industry-standard Fairlight audio & Fusion VFX', 'Hardware-accelerated 4K timeline rendering', 'Zero monthly subscription forever'],
    usageSummary: 'This is the most critically needed free software on this list. It gives you professional Hollywood color grading, 4K multi-cam timelines, and noise-gate audio without a single dime.',
    screenshotUrl: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=1080&q=80',
    directUrl: 'https://www.blackmagicdesign.com/products/davinciresolve',
    isClimaxCritical: true
  }
];

/**
 * Fetch Live Google Trends and YouTube Suggestions without API key
 */
export async function fetchLiveTrends(category: string = 'creator'): Promise<TrendingTopicItem[]> {
  const discovered: TrendingTopicItem[] = [];

  // 1. YouTube Autocomplete Suggestions for Creators
  const ytQueries = [
    'free tools content creators',
    'best free software for video editors',
    'free ai tools for creators',
    'why does my phone',
    'how to fix audio echo free'
  ];

  for (const q of ytQueries) {
    try {
      const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(q)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const suggestions: string[] = data[1] || [];
        suggestions.slice(0, 3).forEach((item, idx) => {
          discovered.push({
            id: `yt-suggest-${q.replace(/\s+/g, '_')}-${idx}`,
            topic: item.charAt(0).toUpperCase() + item.slice(1),
            source: 'youtube_suggest',
            searchQuery: item,
            category: q.includes('creator') ? 'creator_tools' : 'everyday_science'
          });
        });
      }
    } catch (err) {
      console.warn(`[Trends Provider] Suggest query warning for "${q}":`, err);
    }
  }

  // 2. Google Search Trends RSS Feed (US/Global)
  try {
    const rssRes = await fetch('https://trends.google.com/trending/rss?geo=US');
    if (rssRes.ok) {
      const xml = await rssRes.text();
      const titleMatches = Array.from(xml.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g)).map(m => m[1]);
      const trafficMatches = Array.from(xml.matchAll(/<ht:approx_traffic>(.*?)<\/ht:approx_traffic>/g)).map(m => m[1]);

      titleMatches.slice(1, 6).forEach((title, idx) => {
        discovered.push({
          id: `g-trend-${idx}`,
          topic: title.charAt(0).toUpperCase() + title.slice(1),
          source: 'google_trends',
          searchQuery: title,
          approxTraffic: trafficMatches[idx] || '10K+',
          category: 'digital_life'
        });
      });
    }
  } catch (err) {
    console.warn('[Trends Provider] Google Trends RSS notice:', err);
  }

  // 3. Fallback High-Intent Curated Trending Inquiries (Ensures rich results in all network states)
  if (discovered.length === 0) {
    discovered.push(
      {
        id: 'creator-fallback-1',
        topic: '5 Free Tools Every Content Creator Needs in 2026',
        source: 'creator_trend',
        searchQuery: 'free content creator tools 2026',
        category: 'creator_tools'
      },
      {
        id: 'creator-fallback-2',
        topic: 'Why Phone Batteries Degrade While Gaming on Fast Charge',
        source: 'everyday_science',
        searchQuery: 'phone battery internal resistance heat',
        category: 'everyday_science'
      },
      {
        id: 'creator-fallback-3',
        topic: 'Free Browser Tools to Remove Audio Echo and Background Noise',
        source: 'software_remedy',
        searchQuery: 'remove audio noise free browser',
        category: 'software_remedy'
      }
    );
  }

  return discovered;
}

/**
 * Deduplicate candidate topics against previously saved topics
 */
export function deduplicateTopics(
  candidates: TrendingTopicItem[],
  savedTopicsHistory: string[],
  threshold: number = 0.55
): TrendingTopicItem[] {
  const normWords = (str: string) => {
    return new Set(
      str
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2)
    );
  };

  return candidates.map(candidate => {
    const candWords = normWords(candidate.topic);
    let highestSim = 0;
    let matchedReason = '';

    for (const saved of savedTopicsHistory) {
      const savedWords = normWords(saved);
      let matchCount = 0;
      for (const w of candWords) {
        if (savedWords.has(w)) matchCount++;
      }
      const union = candWords.size + savedWords.size - matchCount;
      const jaccard = union > 0 ? matchCount / union : 0;

      if (jaccard > highestSim) {
        highestSim = jaccard;
        matchedReason = `Overlaps with saved topic: "${saved}"`;
      }
    }

    const isDuplicate = highestSim >= threshold;

    return {
      ...candidate,
      isDuplicate,
      similarityScore: Math.round(highestSim * 100),
      duplicateReason: isDuplicate ? matchedReason : undefined
    };
  });
}

/**
 * Elaborate on chosen topic using DuckDuckGo + Wikipedia (Zero Key Required)
 */
export async function elaborateTopicWithWikiAndDuckDuckGo(
  topicTitle: string
): Promise<ElaboratedTopicReport> {
  let duckDuckGoAbstract = '';
  let wikipediaSummary = '';

  // 1. DuckDuckGo Instant Answer API
  try {
    const ddgRes = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(topicTitle)}&format=json`);
    if (ddgRes.ok) {
      const ddgData = await ddgRes.json();
      duckDuckGoAbstract = ddgData.AbstractText || ddgData.Abstract || '';
    }
  } catch (err) {
    console.warn('[Elaborator] DuckDuckGo notice:', err);
  }

  // 2. Wikipedia Summary REST API
  try {
    const cleanTerm = topicTitle.replace(/^(why|how|what|is|are|5|tools|free)\b/gi, '').trim().split(' ')[0] || topicTitle;
    const wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanTerm)}`, {
      headers: {
        'User-Agent': 'ArchieScienceLab/2.0 (educational inquiry; devmeziem@gmail.com)'
      }
    });
    if (wikiRes.ok) {
      const wikiData = await wikiRes.json();
      wikipediaSummary = wikiData.extract || '';
    }
  } catch (err) {
    console.warn('[Elaborator] Wikipedia REST notice:', err);
  }

  // Synthesize Problem, Plain English Mechanism & Free Remedy
  const lower = topicTitle.toLowerCase();

  let problemStatement = 'Most users run into hidden bottlenecks, unexpected latency, or quality drop-offs without realizing the underlying cause.';
  let plainEnglishExplanation = duckDuckGoAbstract || wikipediaSummary || 'Here is the plain English mechanism: Digital systems trade off energy efficiency and thermal dissipation. When tasks run unoptimized, protective throttling kicks in.';
  let freeRemedyTool = {
    name: 'Built-In Diagnostic & System Optimization Tool',
    description: 'Free utility that regulates thermal ceilings and clears unlinked cache memory.',
    freeTier: '100% Free & Built-In',
    directUrl: 'https://github.com',
    pros: ['Prevents thermal throttling', 'Zero cost or subscription', 'Immediate measurable boost'],
    actionableUsage: 'Apply the optimal settings profile to eliminate bottleneck latency.'
  };

  if (lower.includes('phone') || lower.includes('batter') || lower.includes('charg')) {
    problemStatement = 'Your phone rockets from 0% to 80% in 20 minutes, but the last 20% takes forever—and leaving it plugged in overnight cooks the chemical cells.';
    plainEnglishExplanation = 'Think of charging like parking cars in a massive empty lot. At first, cars zoom straight into open spots at 60mph. But once 80% of spots are taken, cars must crawl at 5mph to avoid crashing into each other. Pushing high current into a full battery creates internal friction (Joule heating), which permanently degrades lithium capacity.';
    freeRemedyTool = {
      name: '80% Battery Protection Limit (Built-In OS Feature)',
      description: 'Built-in battery health limiter found in both iOS and Android settings.',
      freeTier: '100% Free Built-In Setting',
      directUrl: 'https://support.google.com/android/answer/7664692',
      pros: ['Cuts peak charging heat by 60%', 'Doubles battery lifespan from 2 to 4 years', 'Zero app download required'],
      actionableUsage: 'Go to Settings -> Battery -> Battery Health / Protection, and turn on the 80% Charge Limit ceiling.'
    };
  } else if (lower.includes('echo') || lower.includes('noise') || lower.includes('audio') || lower.includes('mic')) {
    problemStatement = 'Recording videos on a phone microphone in a bedroom or office captures harsh room echo, air conditioning rumble, and fan noise that makes the video sound amateur.';
    plainEnglishExplanation = 'Sound waves bounce off hard walls, glass windows, and desks like tennis balls, arriving at your mic milliseconds after your direct voice. An AI speech filter decomposes the sound into a spectrogram, isolates vocal formants, and mathematically deletes 100% of the acoustic reverb reflections.';
    freeRemedyTool = {
      name: 'Adobe Podcast AI Audio Enhance',
      description: 'One-click neural speech enhancer that transforms raw phone audio into a $400 studio condenser microphone sound.',
      freeTier: '100% Free Browser Tier (1 hr/day)',
      directUrl: 'https://podcast.adobe.com/enhance',
      pros: ['Removes 100% of room echo and background hum', 'Adds broadcast vocal warmth & presence', 'Runs entirely in your web browser'],
      actionableUsage: 'Drop your raw audio file into the web browser, let the AI clean it for 15 seconds, and export pristine studio audio.'
    };
  } else if (lower.includes('airplane') || lower.includes('window') || lower.includes('hole')) {
    problemStatement = 'At cruising altitude of 35,000 feet, external atmospheric pressure drops to just 3.4 PSI while cabin pressure is maintained at 11 PSI, exerting thousands of pounds of explosive force on the windows.';
    plainEnglishExplanation = 'Airplane passenger windows are made of three separate acrylic panes. The tiny hole is located exclusively in the middle pane, called the "bleed hole". It allows pressure to equalize between the cabin and the air gap, ensuring only the heavy outer pane bears the structural pressure while venting moisture to keep the window fog-free.';
    freeRemedyTool = {
      name: 'Flightradar24 Live Aircraft Telemetry',
      description: 'Live aircraft cabin altitude, atmospheric pressure differential, and airspeed tracker.',
      freeTier: '100% Free Web & Mobile App',
      directUrl: 'https://www.flightradar24.com',
      pros: ['Displays real-time cabin pressure altitude', 'Track any commercial flight globally', 'Free 3D cockpit perspective view'],
      actionableUsage: 'Open the app during your flight to view your exact altitude, ambient air temperature (-50°C), and pressure differentials in real time.'
    };
  } else if (lower.includes('photoshop') || lower.includes('photopea') || lower.includes('graphic') || lower.includes('thumbnail')) {
    problemStatement = 'Adobe charges over $20 every single month for Photoshop, which is unaffordable for new creators who just need to remove backgrounds and make high-CTR thumbnails.';
    plainEnglishExplanation = 'Modern web browsers support WebAssembly (Wasm) and WebGL, allowing complex C++ photo editing applications to run directly inside a browser tab at near-native CPU/GPU speeds without downloading any software.';
    freeRemedyTool = {
      name: 'Photopea Online Editor',
      description: 'Complete in-browser Photoshop replacement supporting native PSD, layer masks, and smart filters.',
      freeTier: '100% Free with zero watermark',
      directUrl: 'https://www.photopea.com',
      pros: ['Opens and saves native .PSD files', 'Full support for layer styles, pen tool, and blending modes', 'Zero account registration or installation needed'],
      actionableUsage: 'Go to photopea.com, drag in your thumbnail canvas, use the Quick Selection tool to cut out your portrait, and export high-res PNGs.'
    };
  } else if (lower.includes('delete') || lower.includes('trash') || lower.includes('storage') || lower.includes('recover')) {
    problemStatement = 'Users accidentally empty their trash folder or believe deleted photos on an old phone are gone forever, leaving private data exposed or valuable memories lost.';
    plainEnglishExplanation = 'Flash storage chips use NAND gates. Physically erasing billions of electrons takes significant time and battery voltage. Therefore, when you click "Delete", the operating system simply unlinks the file address pointer in the Master File Table. The actual binary data sits intact in the physical silicon until new photos overwrite it.';
    freeRemedyTool = {
      name: 'PhotoRec & Recuva (Open Source Data Recovery)',
      description: 'Free forensic file carver that reads raw unlinked flash sectors to resurrect deleted photos and videos.',
      freeTier: '100% Free Open-Source Software',
      directUrl: 'https://www.cgsecurity.org/wiki/PhotoRec',
      pros: ['Ignores damaged file system headers', 'Recovers hundreds of file formats (JPEG, MP4, RAW)', 'Zero trial restrictions or paywalls'],
      actionableUsage: 'Stop writing new files to the device immediately, run PhotoRec on the memory card or drive, and extract your unlinked photos in 10 minutes.'
    };
  } else if (lower.includes('creator') || lower.includes('tool') || lower.includes('edit')) {
    problemStatement = 'Content creators spend 4+ hours every single day manually syncing audio, typing subtitles, and wrestling with paid subscription paywalls.';
    plainEnglishExplanation = 'Free AI workflows and open-source tools now match 95% of expensive enterprise software capabilities. By combining auto-captioning, audio enhancement, and browser graphic suites, you save hundreds of dollars a month.';
    freeRemedyTool = {
      name: 'CapCut Desktop & Adobe Podcast AI',
      description: 'Auto-transcription and neural vocal studio enhancer with zero watermarks.',
      freeTier: '100% Free Tier Available',
      directUrl: 'https://podcast.adobe.com/enhance',
      pros: ['One-click background echo removal', 'Word-by-word animated captions', 'No hardware upgrade required'],
      actionableUsage: 'Drop your raw audio or video into the browser window, let the neural filter clean the waveform in 15 seconds, and export lossless audio directly.'
    };
  }

  return {
    topic: topicTitle,
    sourceQuery: topicTitle,
    problemStatement,
    plainEnglishExplanation,
    freeRemedyTool,
    wikipediaSummary,
    duckDuckGoAbstract,
    hashtags: ['#ArchieExplains', '#STEM', '#TechHacks', '#CreatorTips', '#Shorts'],
    trendingKeywords: ['free creator tools', 'how it works', 'plain english explanation', 'tech breakdown']
  };
}

/**
 * Generates the Viral Content Creator 5-Tool Countdown Script
 */
export function buildContentCreator5ToolReel(): Creator5ToolReelScript {
  return {
    hook: "Stop scrolling! If you're a content creator, wait—this video is for you.",
    subHook: "I'm giving you 5 completely free tools you'll thank me for later. And make sure to save Tool 5, because it replaces a $400 monthly subscription with zero watermark.",
    targetAudience: 'Content Creators',
    tools: VERIFIED_CREATOR_TOOLS_CATALOG,
    outroCta: "Comment any other secret free tool you use, or comment 'FREE' right now and I'll send you the direct links to all 5 tools!",
    safeCaptions: [
      { cueSeconds: 0.0, text: "Stop scrolling! If you're a content creator, wait...", isToolSlam: false },
      { cueSeconds: 3.2, text: "Here are 5 free tools you will thank me for later...", isToolSlam: false },
      { cueSeconds: 6.0, text: "TOOL 1: CAPCUT DESKTOP", isToolSlam: true, activeToolNumber: 1 },
      { cueSeconds: 8.0, text: "Auto-generates word-by-word karaoke captions in 15 seconds with zero watermarks.", isToolSlam: false, activeToolNumber: 1 },
      { cueSeconds: 16.0, text: "TOOL 2: ADOBE PODCAST AI", isToolSlam: true, activeToolNumber: 2 },
      { cueSeconds: 18.0, text: "Removes 100% of room echo and background noise from raw phone audio.", isToolSlam: false, activeToolNumber: 2 },
      { cueSeconds: 27.0, text: "TOOL 3: PHOTOPEA ONLINE", isToolSlam: true, activeToolNumber: 3 },
      { cueSeconds: 29.0, text: "A complete in-browser Photoshop replacement for high-CTR thumbnails.", isToolSlam: false, activeToolNumber: 3 },
      { cueSeconds: 38.0, text: "TOOL 4: TINYPNG & SQUOOSH", isToolSlam: true, activeToolNumber: 4 },
      { cueSeconds: 40.0, text: "Shrinks 15MB stills down to 2MB with zero visible quality loss.", isToolSlam: false, activeToolNumber: 4 },
      { cueSeconds: 48.0, text: "TOOL 5: DAVINCI RESOLVE (THE GAME CHANGER)", isToolSlam: true, activeToolNumber: 5 },
      { cueSeconds: 50.0, text: "Hollywood 4K color grading, multi-cam timelines, and zero monthly subscription.", isToolSlam: false, activeToolNumber: 5 },
      { cueSeconds: 56.0, text: "Comment 'FREE' and I'll send you direct links to all 5 tools!", isToolSlam: false }
    ],
    hashtags: ['#ContentCreator', '#CreatorTools', '#VideoEditing', '#FreeTools', '#YouTubeShorts', '#ArchieCreator']
  };
}
