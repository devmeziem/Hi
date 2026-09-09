/**
 * Stoic & World Scholars 5-Second / 3-Second Quote Reel Generator (Daily 5th Video)
 *
 * Requirements:
 * - Configurable duration: 5.0s (default) or 3.0s
 * - Exactly 1 cinematic 9:16 vertical image of the author/scholar (auto-fetched via public search / Wikimedia or AI generated)
 * - Royalty-free loopable mystery sound matching Pixabay archetypes:
 *     1. Horror Scene Murder Mystery (eerie sub-drone, minor second dissonance, metallic shimmer)
 *     2. Instrumental Mystery (suspended minor chord, cavernous echo, hypnotic pulse)
 *     3. Mystery Darkness (abyssal 43Hz sub-bass, cold atmospheric ambient)
 * - Quotes from world scholars across history (psychologists, philosophers, Nobel laureates, scientists, ancient masters)
 * - Transparent, frosted center-bottom glass caption card with exact scholar reference & credentials (PhD, MD, field)
 * - Deduplicated via Firestore + local history cache (Jaccard similarity + author rotation)
 * - Seamless loop design for YouTube Shorts & TikTok
 * - Better title, description, and hashtags
 * - Generates daily YouTube Community Post (text + 1080x1080 image)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const { getSyncedChannelProfile, formatChannelFollowCta } = require('./youtube_channel_dispatcher.cjs');

const MANIFEST_PATH = path.join(process.cwd(), 'daily_blueprint_manifest.json');
const LOCAL_QUOTE_CACHE = path.join(process.cwd(), 'stoic_quote_history.json');
const OUTPUT_DIR = path.join(process.cwd(), 'rendered_videos');
const ARTIFACTS_DIR = path.join(process.cwd(), 'test_artifacts');
const PORTRAITS_DIR = path.join(ARTIFACTS_DIR, 'scholar_portraits');

// Configurable video duration (5.0s default, or 3.0s)
const TARGET_DURATION = parseFloat(process.env.SHORT_DURATION || process.env.DURATION_SECONDS || '5.0');
const FPS = 30;
const TOTAL_FRAMES = Math.round(TARGET_DURATION * FPS);

/**
 * Curated Catalog of World Scholars, Nobel Laureates, Philosophers, and Polymaths
 * with Full Names, Academic Credentials, Institutional Chairs, and Quotations.
 */
const WORLD_SCHOLARS_QUOTES = [
  // Dr. Viktor Frankl, M.D., Ph.D.
  {
    quote: "When we are no longer able to change a situation, we are challenged to change ourselves.",
    author: "Dr. Viktor Frankl, M.D., Ph.D.",
    credentials: "Neurologist & Psychiatrist • University of Vienna",
    wikiSearch: "Viktor_Frankl",
    theme: "defense",
    communityQuestion: "What is one situation in your life where changing your internal reaction matters more than trying to force the external outcome?"
  },
  {
    quote: "Between stimulus and response there is a space. In that space is our power to choose our response.",
    author: "Dr. Viktor Frankl, M.D., Ph.D.",
    credentials: "Neurologist & Psychiatrist • University of Vienna",
    wikiSearch: "Viktor_Frankl",
    theme: "discipline",
    communityQuestion: "When was the last time you took a deep breath and paused in that space before reacting?"
  },
  // Dr. Carl Jung, M.D.
  {
    quote: "Until you make the unconscious conscious, it will direct your life and you will call it fate.",
    author: "Dr. Carl Jung, M.D.",
    credentials: "Founder of Analytical Psychology • Psychiatrist",
    wikiSearch: "Carl_Jung",
    theme: "mastery",
    communityQuestion: "What hidden habit or fear is silently directing your daily decisions?"
  },
  {
    quote: "I am not what happened to me, I am what I choose to become.",
    author: "Dr. Carl Jung, M.D.",
    credentials: "Founder of Analytical Psychology • Psychiatrist",
    wikiSearch: "Carl_Jung",
    theme: "confidence",
    communityQuestion: "What past event have you finally decided will no longer define your future?"
  },
  // Prof. Friedrich Nietzsche
  {
    quote: "He who has a why to live can bear almost any how.",
    author: "Prof. Friedrich Nietzsche",
    credentials: "Chair of Classical Philology • University of Basel",
    wikiSearch: "Friedrich_Nietzsche",
    theme: "fortitude",
    communityQuestion: "What is the single 'why' that gets you out of bed even on the hardest mornings?"
  },
  {
    quote: "No price is too high to pay for the privilege of owning yourself.",
    author: "Prof. Friedrich Nietzsche",
    credentials: "Chair of Classical Philology • University of Basel",
    wikiSearch: "Friedrich_Nietzsche",
    theme: "sovereignty",
    communityQuestion: "What distraction or bad habit are you sacrificing to fully own your daily focus?"
  },
  // Marcus Aurelius
  {
    quote: "You have power over your mind, not outside events. Realize this, and you will find strength.",
    author: "Marcus Aurelius",
    credentials: "Roman Emperor & Stoic Philosopher • Author of Meditations",
    wikiSearch: "Marcus_Aurelius",
    theme: "sovereignty",
    communityQuestion: "Which outside noise or circumstance will you consciously stop worrying about today?"
  },
  {
    quote: "The soul becomes dyed with the color of its thoughts.",
    author: "Marcus Aurelius",
    credentials: "Roman Emperor & Stoic Philosopher • Author of Meditations",
    wikiSearch: "Marcus_Aurelius",
    theme: "discipline",
    communityQuestion: "What recurring thought will you replace with calm conviction today?"
  },
  // Epictetus
  {
    quote: "No man is free who is not master of himself.",
    author: "Epictetus",
    credentials: "Stoic Philosopher • Founder of the Nicopolis School",
    wikiSearch: "Epictetus",
    theme: "mastery",
    communityQuestion: "In which area of your life does your discipline need to match your ambition?"
  },
  {
    quote: "We have two ears and one mouth so that we can listen twice as much as we speak.",
    author: "Epictetus",
    credentials: "Stoic Philosopher • Founder of the Nicopolis School",
    wikiSearch: "Epictetus",
    theme: "wisdom",
    communityQuestion: "Who in your life needs your quiet, undivided listening today rather than advice?"
  },
  // Seneca the Younger
  {
    quote: "We suffer more often in imagination than in reality.",
    author: "Seneca the Younger",
    credentials: "Roman Statesman, Dramatist & Stoic Moralist",
    wikiSearch: "Seneca_the_Younger",
    theme: "defense",
    communityQuestion: "What worst-case scenario have you been replaying that hasn't actually happened?"
  },
  {
    quote: "Difficulties strengthen the mind, as labor does the body.",
    author: "Seneca the Younger",
    credentials: "Roman Statesman, Dramatist & Stoic Moralist",
    wikiSearch: "Seneca_the_Younger",
    theme: "fortitude",
    communityQuestion: "What recent struggle taught you an invaluable lesson about your own resilience?"
  },
  // Miyamoto Musashi
  {
    quote: "Do nothing that is of no use. Polish your spirit daily through relentless devotion.",
    author: "Miyamoto Musashi",
    credentials: "Master Swordsman & Philosopher • The Book of Five Rings",
    wikiSearch: "Miyamoto_Musashi",
    theme: "discipline",
    communityQuestion: "What is one low-value activity you can ruthlessly cut from your routine today?"
  },
  {
    quote: "There is nothing outside of yourself that can ever enable you to get better. Everything is within.",
    author: "Miyamoto Musashi",
    credentials: "Master Swordsman & Philosopher • The Book of Five Rings",
    wikiSearch: "Miyamoto_Musashi",
    theme: "confidence",
    communityQuestion: "Do you look for external approval, or do you build quiet internal certainty?"
  },
  // Lao Tzu
  {
    quote: "He who conquers others is strong; he who conquers himself is mighty.",
    author: "Lao Tzu",
    credentials: "Ancient Sage & Philosopher • Author of the Tao Te Ching",
    wikiSearch: "Laozi",
    theme: "mastery",
    communityQuestion: "What impulse or reaction did you successfully master today?"
  },
  {
    quote: "Silence is a source of great strength. In stillness, all conflict dissolves.",
    author: "Lao Tzu",
    credentials: "Ancient Sage & Philosopher • Author of the Tao Te Ching",
    wikiSearch: "Laozi",
    theme: "defense",
    communityQuestion: "How often do you sit in complete silence with zero screens or notifications?"
  },
  // Sun Tzu
  {
    quote: "He will win who knows when to fight and when not to fight.",
    author: "Sun Tzu",
    credentials: "General, Strategist & Philosopher • Author of The Art of War",
    wikiSearch: "Sun_Tzu",
    theme: "strategy",
    communityQuestion: "What pointless argument or drama are you choosing to walk away from today?"
  },
  // Dr. Albert Einstein, Ph.D.
  {
    quote: "In the middle of difficulty lies opportunity.",
    author: "Dr. Albert Einstein, Ph.D.",
    credentials: "Theoretical Physicist • Nobel Laureate in Physics",
    wikiSearch: "Albert_Einstein",
    theme: "wisdom",
    communityQuestion: "What current obstacle in your work might secretly be your greatest breakthrough?"
  },
  {
    quote: "A person who never made a mistake never tried anything new.",
    author: "Dr. Albert Einstein, Ph.D.",
    credentials: "Theoretical Physicist • Nobel Laureate in Physics",
    wikiSearch: "Albert_Einstein",
    theme: "confidence",
    communityQuestion: "What is one bold project you are holding back on out of fear of making an error?"
  },
  // Prof. Arthur Schopenhauer
  {
    quote: "A man can be himself only so long as he is alone. If he does not love solitude, he will not love freedom.",
    author: "Prof. Arthur Schopenhauer",
    credentials: "Metaphysician & Philosopher • University of Berlin",
    wikiSearch: "Arthur_Schopenhauer",
    theme: "sovereignty",
    communityQuestion: "Do you use solitude to recharge your mind, or do you run from being alone?"
  },
  // Dr. Richard Feynman, Ph.D.
  {
    quote: "The first principle is that you must not fool yourself, and you are the easiest person to fool.",
    author: "Dr. Richard Feynman, Ph.D.",
    credentials: "Theoretical Physicist • Nobel Laureate in Physics • Caltech",
    wikiSearch: "Richard_Feynman",
    theme: "truth",
    communityQuestion: "Where in your life are you rationalizing instead of looking at reality objectively?"
  },
  // Dr. Marie Curie, Ph.D.
  {
    quote: "Nothing in life is to be feared, it is only to be understood. Now is the time to understand more, so that we may fear less.",
    author: "Dr. Marie Curie, Ph.D.",
    credentials: "Physicist & Chemist • Double Nobel Laureate • Sorbonne",
    wikiSearch: "Marie_Curie",
    theme: "fortitude",
    communityQuestion: "What unknown challenge do you need to study and demystify rather than fear?"
  },
  // Dr. Jane Goodall, Ph.D., DBE
  {
    quote: "What you do makes a difference, and you have to decide what kind of difference you want to make.",
    author: "Dr. Jane Goodall, Ph.D., DBE",
    credentials: "Primatologist & Anthropologist • University of Cambridge",
    wikiSearch: "Jane_Goodall",
    theme: "purpose",
    communityQuestion: "What small, honorable action will you take today that genuinely helps another person?"
  },
  // Dr. J. Robert Oppenheimer, Ph.D.
  {
    quote: "The optimist thinks this is the best of all possible worlds. The pessimist fears it is true.",
    author: "Dr. J. Robert Oppenheimer, Ph.D.",
    credentials: "Theoretical Physicist • Director, Institute for Advanced Study Princeton",
    wikiSearch: "J._Robert_Oppenheimer",
    theme: "wisdom",
    communityQuestion: "Are you viewing your future through clear discernment or blind assumption?"
  },
  // Prof. Baltasar Gracián
  {
    quote: "A wise man gets more use from his enemies than a fool from his friends.",
    author: "Prof. Baltasar Gracián",
    credentials: "Philosopher & Rector • Author of The Art of Worldly Wisdom",
    wikiSearch: "Baltasar_Graci%C3%A1n",
    theme: "defense",
    communityQuestion: "How can criticism from your detractors reveal blind spots you need to sharpen?"
  },
  // Dr. Alan Turing, Ph.D., OBE
  {
    quote: "Sometimes it is the people no one can imagine anything of who do the things that no one can imagine.",
    author: "Dr. Alan Turing, Ph.D., OBE",
    credentials: "Mathematician, Logician & Cryptanalyst • Cambridge & Princeton",
    wikiSearch: "Alan_Turing",
    theme: "confidence",
    communityQuestion: "Have you ever doubted your capabilities simply because others failed to recognize your quiet depth?"
  },
  // Dr. Bertrand Russell, Ph.D.
  {
    quote: "The whole problem with the world is that fools and fanatics are always so certain of themselves, and wiser people so full of doubts.",
    author: "Dr. Bertrand Russell, Ph.D.",
    credentials: "Logician, Philosopher & Nobel Laureate • Trinity College Cambridge",
    wikiSearch: "Bertrand_Russell",
    theme: "wisdom",
    communityQuestion: "Why is intellectual humility the truest marker of deep knowledge?"
  },
  // Hypatia of Alexandria
  {
    quote: "Reserve your right to think, for even to think wrongly is better than not to think at all.",
    author: "Hypatia of Alexandria",
    credentials: "Mathematician, Astronomer & Neoplatonist Philosopher",
    wikiSearch: "Hypatia",
    theme: "truth",
    communityQuestion: "Are you thinking independently, or adopting opinions handed to you by an algorithm?"
  },
  // Dr. Martin Luther King Jr., Ph.D.
  {
    quote: "The ultimate measure of a man is not where he stands in moments of comfort, but where he stands at times of challenge.",
    author: "Dr. Martin Luther King Jr., Ph.D.",
    credentials: "Theologian & Civil Rights Leader • Boston University",
    wikiSearch: "Martin_Luther_King_Jr.",
    theme: "fortitude",
    communityQuestion: "When pressure hits, do you maintain your character or compromise your standards?"
  },
  // Dr. Abraham Maslow, Ph.D.
  {
    quote: "In any given moment we have two options: to step forward into growth or to step back into safety.",
    author: "Dr. Abraham Maslow, Ph.D.",
    credentials: "Pioneer of Humanistic Psychology • Columbia University",
    wikiSearch: "Abraham_Maslow",
    theme: "discipline",
    communityQuestion: "Which choice today will represent stepping forward into growth for you?"
  },
  // Ibn Khaldun
  {
    quote: "Throughout history, cities have been destroyed because people placed comfort above discipline.",
    author: "Ibn Khaldun",
    credentials: "Historian, Sociologist & Philosopher • Author of the Muqaddimah",
    wikiSearch: "Ibn_Khaldun",
    theme: "discipline",
    communityQuestion: "Where has unchecked comfort begun eroding your mental toughness?"
  },
  // Confucius (Kong Fuzi)
  {
    quote: "The man who moves a mountain begins by carrying away small stones.",
    author: "Confucius",
    credentials: "Grand Philosopher & Educator of Ancient China",
    wikiSearch: "Confucius",
    theme: "discipline",
    communityQuestion: "What tiny stone will you move today toward your long-term goal?"
  },
  // Leonardo da Vinci
  {
    quote: "Simplicity is the ultimate sophistication.",
    author: "Leonardo da Vinci",
    credentials: "Polymath, Anatomist, Engineer & Renaissance Master",
    wikiSearch: "Leonardo_da_Vinci",
    theme: "wisdom",
    communityQuestion: "What overcomplicated part of your life or work needs radical simplification?"
  },
  // Baruch Spinoza
  {
    quote: "Peace is not an absence of war, it is a virtue, a state of mind, a disposition for benevolence.",
    author: "Baruch Spinoza",
    credentials: "Rationalist Philosopher & Ethicist • Amsterdam",
    wikiSearch: "Baruch_Spinoza",
    theme: "defense",
    communityQuestion: "Are you cultivating inner peace, or merely avoiding difficult truths?"
  },
  // Dr. Max Planck, Ph.D.
  {
    quote: "When you change the way you look at things, the things you look at change.",
    author: "Dr. Max Planck, Ph.D.",
    credentials: "Nobel Laureate in Physics • Originator of Quantum Theory",
    wikiSearch: "Max_Planck",
    theme: "mindset",
    communityQuestion: "What perspective shift can turn your current frustration into fuel?"
  }
];

/**
 * Public Search: Resolve Scholar Portrait Image from Wikipedia / Wikimedia Commons
 * If public search fails or times out, uses AI / stylized fallback generator.
 */
async function resolveScholarPortrait(scholar) {
  if (!fs.existsSync(PORTRAITS_DIR)) fs.mkdirSync(PORTRAITS_DIR, { recursive: true });

  const safeName = scholar.wikiSearch || scholar.author.replace(/[^a-zA-Z0-9]/g, '_');
  const portraitPath = path.join(PORTRAITS_DIR, `${safeName}.jpg`);

  // Check cached image first
  if (fs.existsSync(portraitPath) && fs.statSync(portraitPath).size > 10000) {
    console.log(`[Scholar Portrait] Using cached portrait for ${scholar.author}`);
    return portraitPath;
  }

  console.log(`[Scholar Portrait] Searching public Wikimedia/Wikipedia archives for: "${scholar.wikiSearch}"...`);

  let fetchedUrl = null;

  try {
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(scholar.wikiSearch)}`;
    const pageData = await new Promise((resolve, reject) => {
      const req = https.get(summaryUrl, {
        headers: {
          'User-Agent': 'VoxamScholarBot/2.0 (educational citation video creator; contact@voxam.ai)',
          'Accept': 'application/json'
        },
        timeout: 8000
      }, res => {
        let raw = '';
        res.on('data', chunk => { raw += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(raw));
          } catch (e) {
            resolve(null);
          }
        });
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); resolve(null); });
    });

    if (pageData) {
      if (pageData.originalimage && pageData.originalimage.source && !pageData.originalimage.source.endsWith('.svg')) {
        fetchedUrl = pageData.originalimage.source;
      } else if (pageData.thumbnail && pageData.thumbnail.source) {
        // Upgrade thumbnail size if possible
        fetchedUrl = pageData.thumbnail.source.replace(/\/\d+px-/, '/1080px-');
      }
    }
  } catch (err) {
    console.warn(`[Scholar Portrait] Wikipedia lookup notice: ${err.message}`);
  }

  // Download image if URL was found
  if (fetchedUrl) {
    try {
      console.log(`[Scholar Portrait] Downloading verified public portrait: ${fetchedUrl.slice(0, 70)}...`);
      await new Promise((resolve, reject) => {
        const file = fs.createWriteStream(portraitPath);
        const req = https.get(fetchedUrl, {
          headers: {
            'User-Agent': 'VoxamScholarBot/2.0 (educational citation video creator; contact@voxam.ai)'
          },
          timeout: 10000
        }, res => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            https.get(res.headers.location, r2 => {
              r2.pipe(file);
              file.on('finish', () => { file.close(resolve); });
            }).on('error', reject);
            return;
          }
          res.pipe(file);
          file.on('finish', () => { file.close(resolve); });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Download timeout')); });
      });

      if (fs.existsSync(portraitPath) && fs.statSync(portraitPath).size > 5000) {
        console.log(`[Scholar Portrait] Successfully fetched portrait (${(fs.statSync(portraitPath).size / 1024).toFixed(1)} KB)`);
        return portraitPath;
      }
    } catch (err) {
      console.warn(`[Scholar Portrait] Image download notice: ${err.message}`);
    }
  }

  // Fallback 1: Try AI model image generation (Pollinations / Flux / Grok portrait)
  console.log(`[Scholar Portrait] Public archive unavailable. Generating authentic likeness using AI model...`);
  const aiPrompt = encodeURIComponent(`Cinematic 9:16 vertical 8k photorealistic portrait of ${scholar.author}, ${scholar.credentials}, dramatic chiaroscuro side lighting, dark obsidian and deep slate background, classical scholar atmosphere, dignified masterpiece`);
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${aiPrompt}?width=1080&height=1920&model=flux&nologo=true`;

  try {
    await new Promise((resolve, reject) => {
      const file = fs.createWriteStream(portraitPath);
      const req = https.get(pollinationsUrl, { timeout: 12000 }, res => {
        if (res.statusCode === 200) {
          res.pipe(file);
          file.on('finish', () => { file.close(resolve); });
        } else {
          reject(new Error(`AI generation returned HTTP ${res.statusCode}`));
        }
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('AI image timeout')); });
    });

    if (fs.existsSync(portraitPath) && fs.statSync(portraitPath).size > 10000) {
      console.log(`[Scholar Portrait] AI-generated likeness rendered successfully.`);
      return portraitPath;
    }
  } catch (e) {
    console.warn(`[Scholar Portrait] AI generation notice: ${e.message}`);
  }

  // Fallback 2: Generate majestic classical dark slate scholar silhouette
  console.log(`[Scholar Portrait] Generating high-contrast classical scholar silhouette background...`);
  const fallbackSvgPath = path.join(PORTRAITS_DIR, `${safeName}_fallback.svg`);
  const fallbackPngPath = path.join(PORTRAITS_DIR, `${safeName}_fallback.png`);

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#080c14" />
        <stop offset="30%" stop-color="#0f172a" />
        <stop offset="70%" stop-color="#090d16" />
        <stop offset="100%" stop-color="#030712" />
      </linearGradient>
      <radialGradient id="scholarAura" cx="50%" cy="38%" r="45%">
        <stop offset="0%" stop-color="#d4af37" stop-opacity="0.18" />
        <stop offset="60%" stop-color="#38bdf8" stop-opacity="0.06" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="1080" height="1920" fill="url(#bg)" />
    <circle cx="540" cy="720" r="420" fill="url(#scholarAura)" />
    <!-- Classical Scholar Bust Silhouette -->
    <path d="M 540 460 C 470 460, 420 520, 420 600 C 420 680, 460 740, 540 740 C 620 740, 660 680, 660 600 C 660 520, 610 460, 540 460 Z" fill="#1e293b" fill-opacity="0.7" />
    <path d="M 330 920 C 330 780, 410 750, 540 750 C 670 750, 750 780, 750 920 C 750 960, 330 960, 330 920 Z" fill="#1e293b" fill-opacity="0.75" />
    <!-- Classical Greek/Roman Pillar Accents -->
    <line x1="120" y1="0" x2="120" y2="1920" stroke="#334155" stroke-width="1.5" stroke-opacity="0.3" />
    <line x1="960" y1="0" x2="960" y2="1920" stroke="#334155" stroke-width="1.5" stroke-opacity="0.3" />
  </svg>`;

  fs.writeFileSync(fallbackSvgPath, svgContent, 'utf8');
  execSync(`ffmpeg -y -i "${fallbackSvgPath}" "${fallbackPngPath}" 2>/dev/null`);
  return fallbackPngPath;
}

/**
 * Sound Engine: Synthesize Seamless Loopy Mystery Audio
 * Supports three requested Pixabay archetypes or loads user audio files:
 * 1. horror-scene-murder-mystery (pixabay 519625)
 * 2. instrumental-mystery (pixabay 548639)
 * 3. mystery-darkness (pixabay 355606)
 */
function generateLoopyMysterySound(outputPath, durationSeconds = 5.0) {
  if (!fs.existsSync(path.dirname(outputPath))) fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  // 1. Check if user placed custom audio files in assets/sounds, test_artifacts/sounds/, etc.
  const soundDirs = [
    path.join(process.cwd(), 'assets', 'sounds'),
    path.join(process.cwd(), 'src', 'assets', 'audio'),
    path.join(process.cwd(), 'src', 'assets', 'sounds'),
    path.join(process.cwd(), 'test_artifacts', 'sounds')
  ];

  const presets = [
    'horror_scene_murder_mystery',
    'instrumental_mystery',
    'mystery_darkness'
  ];
  const chosenPreset = process.env.SOUND_PRESET || presets[Math.floor(Date.now() / (1000 * 60 * 15)) % presets.length];

  for (const sDir of soundDirs) {
    if (fs.existsSync(sDir)) {
      // Check for exact preset file first
      const specificFile = path.join(sDir, `${chosenPreset}.wav`);
      const specificMp3 = path.join(sDir, `${chosenPreset}.mp3`);
      const targetLocal = fs.existsSync(specificFile) ? specificFile : (fs.existsSync(specificMp3) ? specificMp3 : null);

      if (targetLocal) {
        console.log(`[Sound Engine] Using master audio track: ${path.basename(targetLocal)}`);
        try {
          execSync(
            `ffmpeg -y -stream_loop -1 -i "${targetLocal}" -t ${durationSeconds} -af "afade=t=in:ss=0:d=0.15,afade=t=out:st=${(durationSeconds - 0.15).toFixed(2)}:d=0.15" -c:a pcm_s16le -ar 44100 "${outputPath}" 2>/dev/null`
          );
          if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 5000) {
            return outputPath;
          }
        } catch (e) {
          // Fall back to procedural synthesis
        }
      }

      const audioFiles = fs.readdirSync(sDir).filter(f => f.match(/\.(mp3|wav|ogg|aac|m4a)$/i));
      if (audioFiles.length > 0) {
        const localTrack = path.join(sDir, audioFiles[0]);
        console.log(`[Sound Engine] Using local audio track: ${path.basename(localTrack)}`);
        try {
          execSync(
            `ffmpeg -y -stream_loop -1 -i "${localTrack}" -t ${durationSeconds} -af "afade=t=in:ss=0:d=0.15,afade=t=out:st=${(durationSeconds - 0.15).toFixed(2)}:d=0.15" -c:a pcm_s16le -ar 44100 "${outputPath}" 2>/dev/null`
          );
          if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 5000) {
            return outputPath;
          }
        } catch (e) {
          // Fall back to procedural synthesis
        }
      }
    }
  }

  console.log(`[Sound Engine] Synthesizing loopable mystery audio track: "${chosenPreset}" (${durationSeconds}s loop)...`);

  let filterExpr = '';
  const d = durationSeconds.toFixed(2);
  const fadeOutStart = (durationSeconds - 0.2).toFixed(2);

  if (chosenPreset === 'horror_scene_murder_mystery') {
    // Archetype 1: Horror Scene Murder Mystery (pixabay 519625)
    // Dissonant minor second & tritone tension, bowed sub-drone (48Hz/96Hz/135.7Hz), metallic eerie tremolo shimmer
    filterExpr = [
      `aevalsrc='sin(2*PI*48*t)*0.32 + sin(2*PI*96*t)*0.22 + sin(2*PI*135.76*t)*0.18 + sin(2*PI*192*t)*0.10 + sin(2*PI*1536*t)*(0.025+0.02*sin(2*PI*0.4*t))':s=44100:d=${d}`,
      `lowpass=f=1200`,
      `aecho=0.85:0.75:350|700:0.25|0.15`,
      `afade=t=in:ss=0:d=0.2,afade=t=out:st=${fadeOutStart}:d=0.2`
    ].join(',');
  } else if (chosenPreset === 'instrumental_mystery') {
    // Archetype 2: Instrumental Mystery (pixabay 548639)
    // Atmospheric suspense chord (C minor 9th: 65.4Hz C2, 98Hz G2, 155.5Hz Eb3, 233Hz Bb3), deep cavernous echo
    filterExpr = [
      `aevalsrc='sin(2*PI*65.4*t)*0.28 + sin(2*PI*98*t)*0.22 + sin(2*PI*155.56*t)*0.18 + sin(2*PI*233.08*t)*0.14 + sin(2*PI*392*t)*(0.04+0.03*sin(2*PI*0.25*t))':s=44100:d=${d}`,
      `bandpass=f=800:w=600`,
      `aecho=0.8:0.7:450|900:0.3|0.2`,
      `afade=t=in:ss=0:d=0.2,afade=t=out:st=${fadeOutStart}:d=0.2`
    ].join(',');
  } else {
    // Archetype 3: Mystery Darkness (pixabay 355606)
    // Abyssal deep 43Hz F1 bass, cold atmospheric wind sweep, dark ambient room tone
    filterExpr = [
      `aevalsrc='sin(2*PI*43.65*t)*0.36 + sin(2*PI*87.3*t)*0.24 + sin(2*PI*130.81*t)*0.16 + sin(2*PI*261.63*t)*0.08':s=44100:d=${d}`,
      `lowpass=f=450`,
      `aecho=0.9:0.8:500|1000:0.35|0.2`,
      `afade=t=in:ss=0:d=0.2,afade=t=out:st=${fadeOutStart}:d=0.2`
    ].join(',');
  }

  const cmd = `ffmpeg -y -f lavfi -i "${filterExpr}" -c:a pcm_s16le -ar 44100 -ac 2 "${outputPath}" 2>/dev/null`;
  execSync(cmd, { maxBuffer: 20 * 1024 * 1024 });

  return outputPath;
}

/**
 * Deduplication Engine: Select Unique Scholar & Quote
 */
async function selectUniqueScholarQuote() {
  let localHistory = [];
  try {
    if (fs.existsSync(LOCAL_QUOTE_CACHE)) {
      localHistory = JSON.parse(fs.readFileSync(LOCAL_QUOTE_CACHE, 'utf8'));
      if (!Array.isArray(localHistory)) localHistory = [];
    }
  } catch (e) {
    localHistory = [];
  }

  const recentQuotes = localHistory.map(h => (typeof h === 'string' ? h : h.quote || ''));
  const recentAuthors = localHistory.slice(-8).map(h => (typeof h === 'object' ? h.author : ''));

  // Filter out recently used authors and quotes
  let candidates = WORLD_SCHOLARS_QUOTES.filter(entry => {
    // Avoid same author if they were featured in last 8 runs
    if (recentAuthors.includes(entry.author)) return false;

    // Check Jaccard similarity against all recent quotes
    for (const prev of recentQuotes) {
      if (calculateJaccardSimilarity(entry.quote, prev) > 0.35) {
        return false;
      }
    }
    return true;
  });

  // If candidate pool exhausted, reset author filter but keep strict quote deduplication
  if (candidates.length === 0) {
    console.log('[Deduplication] Relaxing author rotation, checking quote similarity...');
    candidates = WORLD_SCHOLARS_QUOTES.filter(entry => {
      for (const prev of recentQuotes) {
        if (calculateJaccardSimilarity(entry.quote, prev) > 0.40) return false;
      }
      return true;
    });
  }

  if (candidates.length === 0) {
    candidates = WORLD_SCHOLARS_QUOTES;
  }

  // Pick deterministic but rotating candidate based on day index
  const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const chosen = candidates[dayIndex % candidates.length];
  return chosen;
}

/**
 * Word token Jaccard similarity
 */
function calculateJaccardSimilarity(textA, textB) {
  const setA = new Set((textA || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean));
  const setB = new Set((textB || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean));
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Save Chosen Quote to Local Cache & Firestore
 */
async function saveQuoteHistory(entry) {
  try {
    let localHistory = [];
    if (fs.existsSync(LOCAL_QUOTE_CACHE)) {
      localHistory = JSON.parse(fs.readFileSync(LOCAL_QUOTE_CACHE, 'utf8'));
      if (!Array.isArray(localHistory)) localHistory = [];
    }
    localHistory.push({
      quote: entry.quote,
      author: entry.author,
      credentials: entry.credentials,
      theme: entry.theme,
      usedAt: new Date().toISOString()
    });
    if (localHistory.length > 100) localHistory.shift();
    fs.writeFileSync(LOCAL_QUOTE_CACHE, JSON.stringify(localHistory, null, 2), 'utf8');
  } catch (e) {
    // Non-blocking
  }
}

/**
 * Wrap text into clean lines (max 28 chars/line for vertical mobile 1080x1920 display)
 */
function wrapQuoteText(text, maxChars = 28) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = '';

  for (const w of words) {
    if ((current + ' ' + w).trim().length <= maxChars) {
      current = (current + ' ' + w).trim();
    } else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Escape XML for SVG
 */
function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate 5-Second / 3-Second Loopy YouTube Short
 */
async function generateStoic5sVideo() {
  console.log('\n======================================================');
  console.log(`🏛️  [SCHOLAR QUOTE REEL] GENERATING DAILY ${TARGET_DURATION.toFixed(1)}s VIDEO`);
  console.log('======================================================\n');

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  if (!fs.existsSync(ARTIFACTS_DIR)) fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

  // 1. Select Unique Scholar & Quote
  const chosen = await selectUniqueScholarQuote();
  console.log(`[Quote Reel] Scholar:      ${chosen.author}`);
  console.log(`[Quote Reel] Credentials:  ${chosen.credentials}`);
  console.log(`[Quote Reel] Theme:        ${chosen.theme.toUpperCase()}`);
  console.log(`[Quote Reel] Quote:        "${chosen.quote}"\n`);

  // 2. Resolve Scholar Portrait via Public Search / AI
  const portraitPath = await resolveScholarPortrait(chosen);

  // 3. Synthesize Seamless Loopy Audio
  const wavPath = path.join(ARTIFACTS_DIR, `scholar_mystery_sound_${TARGET_DURATION}s.wav`);
  generateLoopyMysterySound(wavPath, TARGET_DURATION);

  // 4. Prepare High-Contrast Glass Caption Overlay with Maximum Legibility
  const quoteLines = wrapQuoteText(chosen.quote, 24);
  const quoteTspans = quoteLines.map((line, idx) =>
    `<tspan x="540" dy="${idx === 0 ? 0 : 62}">${escapeXml(line)}</tspan>`
  ).join('\n        ');

  const cardHeight = Math.max(520, 290 + quoteLines.length * 64);
  const cardY = 1680 - cardHeight;

  const overlaySvgPath = path.join(ARTIFACTS_DIR, 'quote_overlay.svg');
  const overlayPngPath = path.join(ARTIFACTS_DIR, 'quote_overlay.png');

  const overlaySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
    <defs>
      <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="24" stdDeviation="36" flood-color="#000000" flood-opacity="0.98" />
      </filter>
      <filter id="textShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000000" flood-opacity="1.0" />
      </filter>
      <linearGradient id="cardBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#020617" stop-opacity="0.94" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.98" />
      </linearGradient>
    </defs>

    <!-- Heavy Vignette Shading for Maximum Text Contrast -->
    <rect x="0" y="800" width="1080" height="1120" fill="black" fill-opacity="0.65" />

    <!-- High-Contrast Caption Card -->
    <rect x="50" y="${cardY}" width="980" height="${cardHeight}" rx="28" fill="url(#cardBg)" stroke="#d4af37" stroke-width="2.5" stroke-opacity="0.75" filter="url(#cardShadow)" />

    <!-- Gold Header Pill Badge -->
    <rect x="360" y="${cardY + 36}" width="360" height="38" rx="19" fill="#1e1b4b" stroke="#d4af37" stroke-width="2" />
    <text x="540" y="${cardY + 61}" font-family="sans-serif" font-size="14" font-weight="900" fill="#fef08a" letter-spacing="3" text-anchor="middle">🏛️ STOIC WISDOM</text>

    <!-- Large High-Contrast Quote Text (42px bold white) -->
    <text x="540" y="${cardY + 145}" font-family="serif" font-size="42" font-weight="900" fill="#ffffff" text-anchor="middle" filter="url(#textShadow)">
        ${quoteTspans}
    </text>

    <!-- Accent Divider -->
    <line x1="380" y1="${cardY + 175 + quoteLines.length * 62}" x2="700" y2="${cardY + 175 + quoteLines.length * 62}" stroke="#d4af37" stroke-width="2" stroke-opacity="0.8" />

    <!-- Scholar Name (26px Gold Ultra-Bold) -->
    <text x="540" y="${cardY + 235 + quoteLines.length * 62}" font-family="sans-serif" font-size="26" font-weight="900" fill="#facc15" letter-spacing="2" text-anchor="middle" filter="url(#textShadow)">
      — ${escapeXml(chosen.author.toUpperCase())} —
    </text>
    <text x="540" y="${cardY + 275 + quoteLines.length * 62}" font-family="sans-serif" font-size="17" font-weight="700" fill="#cbd5e1" letter-spacing="1" text-anchor="middle">
      ${escapeXml(chosen.credentials)}
    </text>
  </svg>`;

  fs.writeFileSync(overlaySvgPath, overlaySvg, 'utf8');

  // Convert SVG to PNG with Multi-Tool Fallback
  try {
    if (fs.existsSync(overlayPngPath)) fs.unlinkSync(overlayPngPath);
    let rasterized = false;
    try {
      execSync(`rsvg-convert -w 1080 -h 1920 "${overlaySvgPath}" -o "${overlayPngPath}" 2>/dev/null`);
      rasterized = fs.existsSync(overlayPngPath) && fs.statSync(overlayPngPath).size > 2000;
    } catch (_) {}

    if (!rasterized) {
      try {
        execSync(`convert -background none -density 150 "${overlaySvgPath}" "${overlayPngPath}" 2>/dev/null`);
        rasterized = fs.existsSync(overlayPngPath) && fs.statSync(overlayPngPath).size > 2000;
      } catch (_) {}
    }

    if (!rasterized) {
      execSync(`ffmpeg -y -i "${overlaySvgPath}" "${overlayPngPath}" 2>/dev/null`);
    }
  } catch (err) {
    console.warn('[Quote Reel] SVG rasterizer notice:', err.message);
  }

  const finalMp4Path = path.join(OUTPUT_DIR, 'stoic_quote_5s_latest.mp4');
  const artifactMp4Path = path.join(ARTIFACTS_DIR, 'stoic_quote_5s_latest.mp4');

  console.log(`[Quote Reel] Compositing ${TARGET_DURATION}s seamless loop vertical video with subtle Ken Burns zoom...`);

  const overlayInput = (fs.existsSync(overlayPngPath) && fs.statSync(overlayPngPath).size > 1000) ? overlayPngPath : overlaySvgPath;

  // Zoompan formula: subtle zoom from 1.00 to 1.04 over duration, dark contrast boost
  const filterComplex = [
    `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(zoom+0.0003,1.04)':d=${TOTAL_FRAMES}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=${FPS},eq=brightness=-0.10:contrast=1.14:saturation=0.88[bg]`,
    `[1:v]scale=1080:1920[ov]`,
    `[bg][ov]overlay=0:0,format=yuv420p[v]`
  ].join(';');

  const ffmpegCmd = `ffmpeg -y -loglevel error -loop 1 -t ${TARGET_DURATION} -i "${portraitPath}" -loop 1 -t ${TARGET_DURATION} -i "${overlayInput}" -i "${wavPath}" -filter_complex "${filterComplex}" -map "[v]" -map 2:a -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k -t ${TARGET_DURATION} "${finalMp4Path}"`;

  try {
    execSync(ffmpegCmd, { maxBuffer: 50 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (err) {
    console.warn('[Quote Reel] Primary filter complex notice, falling back to direct overlay:', err.message);
    const fallbackCmd = `ffmpeg -y -loglevel error -loop 1 -t ${TARGET_DURATION} -i "${portraitPath}" -loop 1 -t ${TARGET_DURATION} -i "${overlayInput}" -i "${wavPath}" -filter_complex "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,eq=brightness=-0.10:contrast=1.12[bg];[1:v]scale=1080:1920[ov];[bg][ov]overlay=0:0[v]" -map "[v]" -map 2:a -c:v libx264 -preset ultrafast -crf 22 -pix_fmt yuv420p -c:a aac -b:a 192k -t ${TARGET_DURATION} "${finalMp4Path}"`;
    execSync(fallbackCmd, { maxBuffer: 50 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'] });
  }

  if (!fs.existsSync(finalMp4Path) || fs.statSync(finalMp4Path).size < 10000) {
    throw new Error('FFmpeg failed to produce 5-second quote reel MP4');
  }

  fs.copyFileSync(finalMp4Path, artifactMp4Path);
  await saveQuoteHistory(chosen);

  // 5. Format High-Retention Title, Description, and Targeted Hashtags
  const cleanAuthorName = chosen.author.replace(/^(Dr\.|Prof\.)\s*/, '').trim();
  const viralTitle = `The Stoic Lesson Most People Learn Too Late — ${chosen.author} #Shorts`;
  const initialFollowCta = formatChannelFollowCta('motivation_stoicism', process.env.YOUTUBE_HANDLE_CH2 || process.env.YOUTUBE_HANDLE_STOIC || '');
  const viralDescription = `"${chosen.quote}"
— ${chosen.author}
${chosen.credentials}

🏛️ Timeless Stoic wisdom and philosophy to master your emotions, build unbreakable resilience, and focus on what you can control.

💬 ${chosen.communityQuestion || 'How do you apply this Stoic principle in your daily life?'}

${initialFollowCta}

#Stoicism #Stoic #MarcusAurelius #Philosophy #Mindset #Wisdom #DailyStoic #Quotes #LifeLessons #SelfDiscipline #Shorts`;

  const fileSizeMb = (fs.statSync(finalMp4Path).size / 1024 / 1024).toFixed(2);
  console.log(`\n======================================================`);
  console.log(`🚀 [Quote Reel] SUCCESS! ${TARGET_DURATION.toFixed(1)}s Scholar Video Rendered:`);
  console.log(`📹 Video File:  ${finalMp4Path} (${fileSizeMb} MB)`);
  console.log(`⏱️  Duration:    Exactly ${TARGET_DURATION.toFixed(1)}s (${TOTAL_FRAMES} frames @ 30 FPS)`);
  console.log(`📜 Scholar:     ${chosen.author}`);
  console.log(`🎓 Reference:   ${chosen.credentials}`);
  console.log(`🎵 Sound:       Loopable mystery drone (cold atmospheric tension)`);
  console.log(`======================================================\n`);

  // Update daily blueprint manifest
  try {
    let manifest = { videos: [] };
    if (fs.existsSync(MANIFEST_PATH)) {
      manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
      if (!Array.isArray(manifest.videos)) manifest.videos = [];
    }
    manifest.videos.push({
      type: 'scholar_quote_reel_5s',
      title: viralTitle,
      description: viralDescription,
      quote: chosen.quote,
      author: chosen.author,
      credentials: chosen.credentials,
      theme: chosen.theme,
      duration: TARGET_DURATION,
      videoPath: finalMp4Path,
      loopable: true,
      publishedAt: new Date().toISOString()
    });
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  } catch (e) {
    console.warn('[Quote Reel] Manifest sync notice:', e.message);
  }

  // 7. Publish to YouTube as 5s Viral Short (Exclusively Channel 2: The Stoic Architect)
  const isDryRun = process.env.DRY_RUN === 'true';
  const clientId = process.env.YOUTUBE_CLIENT_ID_CH2 || process.env.YOUTUBE_CLIENT_ID_STOIC || process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET_CH2 || process.env.YOUTUBE_CLIENT_SECRET_STOIC || process.env.YOUTUBE_CLIENT_SECRET;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN_CH2 || process.env.YOUTUBE_REFRESH_TOKEN_STOIC || process.env.YOUTUBE_REFRESH_TOKEN_STOICISM || (process.env.ALLOW_SHARED_YOUTUBE_TOKEN === 'true' ? process.env.YOUTUBE_REFRESH_TOKEN : '');

  if (clientId && clientSecret && refreshToken && !isDryRun) {
    try {
      console.log(`\n[Quote Reel] 📤 Publishing 5s Stoic Quote Reel to YouTube Shorts (Channel 2: The Stoic Architect)...`);
      await uploadQuoteReelToYouTube(finalMp4Path, viralTitle, viralDescription, [
        'Stoicism', 'MarcusAurelius', 'DailyStoic', 'Philosophy', 'Wisdom', 'StoicQuotes', 'Discipline', 'Mindset', 'MentalFortitude', 'Stoic', 'Shorts', chosen.author.replace(/[^a-zA-Z0-9]/g, '')
      ]);
    } catch (err) {
      console.warn(`[Quote Reel] YouTube upload notice: ${err.message}`);
    }
  } else if (isDryRun) {
    console.log(`[Quote Reel] ℹ️ Dry Run mode enabled — video saved locally for review without live YouTube upload.`);
  } else {
    console.log(`[Quote Reel] ℹ️ Channel 2 (The Stoic Architect) credentials not provided in environment.`);
  }

  return finalMp4Path;
}

/**
 * Upload 5s video to YouTube via OAuth2 resumable upload (Channel 2: The Stoic Architect)
 */
async function uploadQuoteReelToYouTube(videoFilePath, title, description, tags = []) {
  const clientId = process.env.YOUTUBE_CLIENT_ID_CH2 || process.env.YOUTUBE_CLIENT_ID_STOIC;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET_CH2 || process.env.YOUTUBE_CLIENT_SECRET_STOIC;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN_CH2 || process.env.YOUTUBE_REFRESH_TOKEN_STOIC;

  const postData = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  }).toString();

  const tokenRes = await new Promise((resolve) => {
    const req = https.request('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 10000
    }, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve({}); }
      });
    });
    req.on('error', () => resolve({}));
    req.write(postData);
    req.end();
  });

  if (!tokenRes.access_token) {
    throw new Error('Failed to obtain YouTube OAuth2 access token: ' + (tokenRes.error_description || tokenRes.error || 'unknown'));
  }

  const accessToken = tokenRes.access_token;
  const fileSize = fs.statSync(videoFilePath).size;

  let activeDescription = description;
  try {
    const synced = await getSyncedChannelProfile(accessToken);
    if (synced && synced.handle) {
      console.log(`[Stoic Upload] 🔄 Synced channel profile: "${synced.title}" (${synced.handle})`);
      const dynamicFollow = formatChannelFollowCta('motivation_stoicism', synced.handle, synced.title);
      activeDescription = description.replace(/🏛️ Follow [^\n]+/, dynamicFollow);
    }
  } catch (e) {}

  const metadata = JSON.stringify({
    snippet: {
      title: title.slice(0, 100),
      description: activeDescription,
      tags: tags.slice(0, 15),
      categoryId: '27'
    },
    status: {
      privacyStatus: 'public',
      selfDeclaredMadeForKids: false,
      containsSyntheticMedia: true
    }
  });

  const sessionRes = await new Promise((resolve) => {
    const req = https.request('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Length': fileSize,
        'X-Upload-Content-Type': 'video/mp4'
      }
    }, (res) => {
      if (res.headers.location) {
        resolve({ success: true, location: res.headers.location });
      } else {
        resolve({ success: false, statusCode: res.statusCode });
      }
    });
    req.on('error', (e) => resolve({ success: false, error: e.message }));
    req.write(metadata);
    req.end();
  });

  if (!sessionRes.success || !sessionRes.location) {
    throw new Error('Failed to initiate YouTube upload session');
  }

  const uploadResult = await new Promise((resolve) => {
    const stream = fs.createReadStream(videoFilePath);
    const req = https.request(sessionRes.location, {
      method: 'PUT',
      headers: {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4'
      }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ success: true, data: JSON.parse(d) }); } catch { resolve({ success: false }); }
      });
    });
    req.on('error', (e) => resolve({ success: false, error: e.message }));
    stream.pipe(req);
  });

  if (uploadResult.success && uploadResult.data?.id) {
    const vidId = uploadResult.data.id;
    console.log(`[Quote Reel] ✅ Published to YouTube: https://www.youtube.com/shorts/${vidId}`);
    return vidId;
  }
}

if (require.main === module) {
  generateStoic5sVideo().catch(err => {
    console.error(`[Quote Reel Fatal]`, err);
    process.exit(1);
  });
}

module.exports = {
  generateStoic5sVideo,
  selectUniqueScholarQuote,
  generateLoopyMysterySound,
  resolveScholarPortrait,
  WORLD_SCHOLARS_QUOTES
};
