/**
 * Stoic Content Diversity & History Cooldown Engine
 * Handles Firestore history synchronization, duplicate prevention, and multi-dimensional variation
 * (topic, angle, hook, story/example, visual concept, narrative structure, ending)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const FIRESTORE_PROJECT_ID = "gen-lang-client-0135161700";
const FIRESTORE_DATABASE_ID = "ai-studio-voxam-a00cf6de-bee8-48db-97c4-0c43daab8a7e";
const FIRESTORE_API_KEY = "AIzaSyDajoMYBcuzePAnf8B4dNNNeuxmlU2IfhI";

// Local cache fallback for resilience
const LOCAL_HISTORY_CACHE_FILE = path.join(process.cwd(), '.content_history_cache.json');

/**
 * 12 Rich Stoic Content Archetypes (Angles, Themes, Visual Styles, Structures)
 */
const STOIC_ARCHETYPES = [
  {
    theme: 'Procrastination & Time Mastery',
    angle: 'Urgent Memento Mori / The Illusion of Someday',
    historicalFigure: 'Seneca',
    philosophicalPrinciple: 'On the Shortness of Life: You act like mortals in all that you fear, and like immortals in all that you desire.',
    narrativeStructure: '3-Step Anti-Procrastination Protocol (Diagnosis -> Psychological Reframe -> Instant Action)',
    hookPatterns: [
      "Seneca wrote 2,000 years ago: 'It is not that we have a short time to live, but that we waste a lot of it.'",
      "You are not lazy. You are terrified of failing. Here is how Roman Stoics conquered procrastination.",
      "The brutal Stoic truth: Someday is not a day of the week. Stop delaying your life."
    ],
    storyExample: "Seneca observing wealthy Romans obsessing over trivial wealth while frittering away the only non-renewable asset they possess: time.",
    visualStyle: 'Minimalist ancient Roman study with antique bronze hourglass, parchment, flickering candlelight, and golden sunbeam, 8k 9:16 vertical',
    outroPattern: "Memento Mori. Master your day today. Follow @TheStoicArchitect for daily Stoic mental strength."
  },
  {
    theme: 'Emotional Mastery & Conflict',
    angle: 'The Dichotomy of Control / Eliminating Reactive Anger',
    historicalFigure: 'Epictetus',
    philosophicalPrinciple: 'Men are disturbed not by things, but by the view which they take of them.',
    narrativeStructure: '5-Rule Playbook on Sovereign Emotional Detachment',
    hookPatterns: [
      "Epictetus was born an enslaved man, yet he had more mental freedom than modern millionaires. Here is why.",
      "When someone insults you, remember this ancient Stoic law before you react.",
      "Mastering your reaction is the highest form of power. Here are 5 Stoic rules for emotional mastery."
    ],
    storyExample: "Epictetus walking with a broken leg in ancient Rome, smiling because external physical pain could never shatter his inner sovereign mind.",
    visualStyle: 'Dramatic marble sculpture of Epictetus in contemplative posture with soft chiaroscuro rim lighting against dark slate backdrop, 8k 9:16 vertical',
    outroPattern: "Control your reactions, control your destiny. Follow @TheStoicArchitect for daily Stoic wisdom."
  },
  {
    theme: 'Extreme Self-Discipline & Morning Command',
    angle: 'Winning the First 30 Minutes / Dopamine Fasting',
    historicalFigure: 'Marcus Aurelius',
    philosophicalPrinciple: 'At dawn, when you have trouble getting out of bed, tell yourself: I have to go to work as a human being.',
    narrativeStructure: 'Direct Morning Protocol & Discipline Mindset',
    hookPatterns: [
      "Marcus Aurelius ruled the largest empire on Earth, yet his biggest daily battle was getting out of bed at dawn.",
      "5 brutal morning rules of Roman Emperors to eliminate dopamine addiction and build elite discipline.",
      "If you cannot control your morning, you will never control your life."
    ],
    storyExample: "Marcus Aurelius shivering in a military tent along the frozen Danube river, choosing duty and morning discipline over warm blankets.",
    visualStyle: 'Roman Emperor sitting at simple wooden desk writing in personal journal by oil lamp at misty dawn inside military tent, 8k 9:16 vertical',
    outroPattern: "Win the morning, conquer the day. Follow @TheStoicArchitect for daily mental fortitude."
  },
  {
    theme: 'Rejection, Critics & External Validation',
    angle: 'The Fortress of Inner Sovereignty / Immunity to Criticism',
    historicalFigure: 'Marcus Aurelius & Cato the Younger',
    philosophicalPrinciple: 'How much time he saves who does not look to see what his neighbor says or does or thinks.',
    narrativeStructure: 'Paradox Inversion: Why Praise is Poison and Rejection is Your Shield',
    hookPatterns: [
      "Why seeking approval from others is the fastest way to lose your self-respect.",
      "Cato the Younger purposely walked the streets of Rome wearing strange clothes to become immune to ridicule.",
      "The Stoic cure for fear of rejection: realize that another person's opinion has zero power over your character."
    ],
    storyExample: "Cato walking bareheaded in rain and enduring public laughter without a single flinch of anger or embarrassment.",
    visualStyle: 'Solitary Stoic philosopher in dark cloak standing immovable amidst a bustling crowded ancient Roman forum, 8k 9:16 vertical photorealistic',
    outroPattern: "Your self-worth is determined by your character, not applause. Follow @TheStoicArchitect."
  },
  {
    theme: 'Adversity & Amor Fati (Love of Fate)',
    angle: 'Turning Obstacles into Fuel / Radical Anti-Fragility',
    historicalFigure: 'Marcus Aurelius & Zeno of Citium',
    philosophicalPrinciple: 'The impediment to action advances action. What stands in the way becomes the way.',
    narrativeStructure: 'Historical Case Study -> The Stoic Transmutation Technique -> Action Blueprint',
    hookPatterns: [
      "Zeno lost his entire merchant fortune in a catastrophic shipwreck. His response created the greatest philosophy in history.",
      "The Obstacle is the Way: How Stoics turn betrayal, failure, and disaster into fuel.",
      "Stop wishing life was easier. Start training your mind to be unbreakable."
    ],
    storyExample: "Zeno arriving penniless in Athens after losing everything at sea, walking into a bookstore and declaring: 'Fortune has commanded me to be a philosopher.'",
    visualStyle: 'Immovable warrior standing tall on a jagged coastal cliff against violent crashing storm waves and lightning, 8k 9:16 vertical cinematic',
    outroPattern: "Amor Fati: Love whatever happens. Follow @TheStoicArchitect for daily Stoic strength."
  },
  {
    theme: 'Patience & The Compound Power of Virtue',
    angle: 'Quiet Daily Craftsmanship / Conquering Instant Gratification',
    historicalFigure: 'Cleanthes the Boxer & Zeno',
    philosophicalPrinciple: 'Well-being is realized by small steps, but is truly no small thing.',
    narrativeStructure: 'The Master Craftsman Blueprint: Consistency over Intensity',
    hookPatterns: [
      "In a world obsessed with instant results, patience is the ultimate superpower.",
      "Cleanthes carried water at night just to study philosophy by day for twenty years without complaining.",
      "How to build quiet competence that outlasts every noisy trend."
    ],
    storyExample: "Cleanthes grinding grain in darkness each night with blistered hands to fund his daily pursuit of wisdom.",
    visualStyle: 'Master blacksmith forging red-hot iron on an ancient anvil with radiant golden sparks flying in dark atmospheric stone workshop, 8k 9:16 vertical',
    outroPattern: "Master the small steps. The great monument will follow. Follow @TheStoicArchitect."
  },
  {
    theme: 'True Manhood, Dignity & Honor',
    angle: 'Quiet Competence, Accountability & Respect over Toxic Posturing',
    historicalFigure: 'Marcus Aurelius & Musonius Rufus',
    philosophicalPrinciple: 'Waste no more time arguing what a good man should be. Be one.',
    narrativeStructure: 'The Standard of True Strength: Emotional Maturity and Mutual Respect',
    hookPatterns: [
      "What does real strength actually look like? Ancient Stoics answered this 2,000 years ago.",
      "Loud aggression is a mask for weakness. True masculine power is calm, protective, and accountable.",
      "Why Stoic philosophy demanded equal virtue, dignity, and respect for all human beings."
    ],
    storyExample: "Musonius Rufus lecturing in Rome that true courage is protecting the vulnerable and taking 100% accountability for one's actions.",
    visualStyle: 'Inspiring composed philosopher overlooking a vast mountain range at golden hour with serene posture, 8k 9:16 vertical photorealistic',
    outroPattern: "Live with honor and quiet strength. Follow @TheStoicArchitect for daily wisdom."
  },
  {
    theme: 'Conquering Anxiety & Overthinking',
    angle: 'The Cosmic Perspective / The View from Above',
    historicalFigure: 'Marcus Aurelius',
    philosophicalPrinciple: 'Look down from above on the countless gatherings, the thousands of ceremonies, and every sea voyage.',
    narrativeStructure: 'Socratic Meditation & Mental Decompression',
    hookPatterns: [
      "Whenever you feel overwhelmed by anxiety, use this 60-second Stoic mental exercise.",
      "Marcus Aurelius cured his anxiety by imagining the Earth from high above the clouds.",
      "We suffer more in our imagination than in reality. Here is how to silence overthinking."
    ],
    storyExample: "Marcus visualizing the vast cosmos and realizing how tiny modern squabbles and temporary worries are in the grand river of time.",
    visualStyle: 'Breathtaking celestial view of Earth and ancient temples bathed in cosmic twilight and ethereal golden nebulae, 8k 9:16 vertical',
    outroPattern: "Zoom out, breathe, and conquer your present moment. Follow @TheStoicArchitect."
  },
  {
    theme: 'Voluntary Discomfort & Anti-Fragility',
    angle: 'Hardening the Body and Mind / Practicing Hardship',
    historicalFigure: 'Seneca & Musonius Rufus',
    philosophicalPrinciple: 'Set aside a certain number of days, during which you shall be content with the scantiest and cheapest fare.',
    narrativeStructure: 'Practical Hardship Protocol: Building Inner Immunity to Luxury Addiction',
    hookPatterns: [
      "Why Seneca, one of the richest men in Rome, spent 3 days every month eating stale bread and sleeping on the floor.",
      "Comfort makes you weak. Voluntary hardship makes you dangerous.",
      "How to train your mind so that nothing in modern life can break you."
    ],
    storyExample: "Seneca wearing rough coarse garments in his palace to prove to himself that losing luxury could never destroy his happiness.",
    visualStyle: 'Athlete training in harsh cold mountain wilderness at sunrise with vapor breath and intense determined focus, 8k 9:16 vertical',
    outroPattern: "Embrace voluntary discomfort and become unbreakable. Follow @TheStoicArchitect."
  },
  {
    theme: 'Radical Accountability & Blameless Living',
    angle: 'Owning Your Destiny / Eradicating the Victim Mentality',
    historicalFigure: 'Epictetus',
    philosophicalPrinciple: 'An uneducated person accuses others of their own misfortunes; one who has begun to educate themselves accuses themselves; an educated person accuses neither.',
    narrativeStructure: 'The 3 Levels of Consciousness: Victim -> Self-Blamer -> Stoic Sovereign',
    hookPatterns: [
      "The most dangerous trap in life is believing someone else is responsible for your peace of mind.",
      "Epictetus on the 3 stages of mental maturity: Which one are you currently in?",
      "Stop blaming circumstances. Take absolute command of your standards today."
    ],
    storyExample: "Epictetus teaching students that when a ship sinks, you do not blame the ocean; you adjust your navigation.",
    visualStyle: 'Weathered stone lighthouse standing firm amidst tumultuous ocean waves with bright beacon cutting through the dark storm, 8k 9:16 vertical',
    outroPattern: "Own your actions. Rule your mind. Follow @TheStoicArchitect."
  },
  {
    theme: 'Solitude & The Inner Citadel',
    angle: 'Protecting Your Mental Sanctuary / Eliminating Modern Noise',
    historicalFigure: 'Marcus Aurelius',
    philosophicalPrinciple: 'Nowhere can man find a quieter or more untroubled retreat than in his own soul.',
    narrativeStructure: 'The 4 Walls of the Inner Citadel: Guarding Your Attention',
    hookPatterns: [
      "You do not need a vacation to find peace. You need to build your Inner Citadel.",
      "Why spending 15 minutes in absolute silence every day is a superpower.",
      "How Roman Stoics protected their mental energy from toxic people and constant distraction."
    ],
    storyExample: "Marcus Aurelius retreating inside his mind while surrounded by corrupt senators, flatterers, and political turmoil.",
    visualStyle: 'Ancient majestic marble fortress on high mountain summit overlooking lush green valley in golden dawn light, 8k 9:16 vertical',
    outroPattern: "Guard your inner peace at all costs. Follow @TheStoicArchitect for daily Stoic fortitude."
  },
  {
    theme: 'Delayed Gratification & The Long Game',
    angle: 'Resisting Cheap Dopamine / The Architecture of Character',
    historicalFigure: 'Seneca & Zeno',
    philosophicalPrinciple: 'No great thing is created suddenly, any more than a bunch of grapes or a fig.',
    narrativeStructure: 'Delayed Gratification vs Dopamine Traps: The Stoic Framework',
    hookPatterns: [
      "The secret to extraordinary achievement: Fall in love with the boredom of daily repetition.",
      "Why instant pleasure always leads to long-term regret, and how Stoics broke the cycle.",
      "How to train your brain to crave hard work instead of cheap digital validation."
    ],
    storyExample: "Zeno refining the foundations of Stoic logic through decades of patient daily discourse under the Stoa Poikile porch in Athens.",
    visualStyle: 'Classical Greek architectural columns of the Stoa with golden sunbeams streaming across stone floor and philosophers in conversation, 8k 9:16 vertical',
    outroPattern: "Play the long game. Build character that stands the test of time. Follow @TheStoicArchitect."
  }
];

/**
 * Fetch recent content history from Firestore REST API
 */
async function fetchRecentHistoryFromFirestore(channelId = 'motivation_stoicism', limit = 25) {
  const historyItems = [];

  // 1. Try local cache first
  if (fs.existsSync(LOCAL_HISTORY_CACHE_FILE)) {
    try {
      const cached = JSON.parse(fs.readFileSync(LOCAL_HISTORY_CACHE_FILE, 'utf8'));
      if (Array.isArray(cached)) {
        historyItems.push(...cached);
      }
    } catch {}
  }

  // 2. Fetch from Firestore REST API
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/${FIRESTORE_DATABASE_ID}/documents/content_history?pageSize=${limit}&key=${FIRESTORE_API_KEY}`;
    const res = await new Promise((resolve) => {
      const req = https.get(url, { timeout: 8000 }, (resp) => {
        let data = '';
        resp.on('data', c => data += c);
        resp.on('end', () => {
          if (resp.statusCode === 200) {
            try {
              const j = JSON.parse(data);
              resolve({ success: true, documents: j.documents || [] });
            } catch (e) {
              resolve({ success: false, error: e.message });
            }
          } else {
            resolve({ success: false, statusCode: resp.statusCode, error: data.slice(0, 150) });
          }
        });
      });
      req.on('error', err => resolve({ success: false, error: err.message }));
      req.on('timeout', () => { req.destroy(); resolve({ success: false, error: 'timeout' }); });
    });

    if (res.success && Array.isArray(res.documents)) {
      for (const doc of res.documents) {
        const fields = doc.fields || {};
        const item = {
          id: doc.name ? doc.name.split('/').pop() : fields.id?.stringValue,
          channelId: fields.channelId?.stringValue || 'motivation_stoicism',
          topic: fields.topic?.stringValue || fields.title?.stringValue || '',
          theme: fields.theme?.stringValue || '',
          angle: fields.angle?.stringValue || '',
          hook: fields.hook?.stringValue || '',
          visualStyle: fields.visualStyle?.stringValue || '',
          narrativeStructure: fields.narrativeStructure?.stringValue || '',
          createdAt: fields.createdAt?.stringValue || ''
        };
        if (item.topic && (!channelId || item.channelId === channelId)) {
          historyItems.push(item);
        }
      }
    }
  } catch (err) {
    console.warn("Firestore history fetch notice:", err.message);
  }

  // 3. Also check saved_campaigns collection to ensure any campaigns are caught
  try {
    const campUrl = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/${FIRESTORE_DATABASE_ID}/documents/saved_campaigns?pageSize=${limit}&key=${FIRESTORE_API_KEY}`;
    const campRes = await new Promise((resolve) => {
      const req = https.get(campUrl, { timeout: 6000 }, (resp) => {
        let data = '';
        resp.on('data', c => data += c);
        resp.on('end', () => {
          if (resp.statusCode === 200) {
            try {
              const j = JSON.parse(data);
              resolve({ success: true, documents: j.documents || [] });
            } catch (e) {
              resolve({ success: false });
            }
          } else {
            resolve({ success: false });
          }
        });
      });
      req.on('error', () => resolve({ success: false }));
      req.on('timeout', () => { req.destroy(); resolve({ success: false }); });
    });

    if (campRes.success && Array.isArray(campRes.documents)) {
      for (const doc of campRes.documents) {
        const fields = doc.fields || {};
        const title = fields.title?.stringValue || '';
        const niche = fields.niche?.stringValue || '';
        if (title && (niche === 'motivation_stoicism' || niche.includes('stoic'))) {
          historyItems.push({
            topic: title,
            theme: title,
            angle: 'Legacy Campaign',
            hook: title,
            visualStyle: '',
            createdAt: fields.createdAt?.stringValue || ''
          });
        }
      }
    }
  } catch {}

  // Deduplicate history items by topic name
  const seen = new Set();
  const deduped = [];
  for (const h of historyItems) {
    const key = (h.topic || '').toLowerCase().trim();
    if (key && !seen.has(key)) {
      seen.add(key);
      deduped.push(h);
    }
  }

  return deduped;
}

/**
 * Save newly generated topic/content metadata to Firestore & local cache
 */
async function saveContentHistoryToFirestore(entry) {
  const historyId = `hist_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const record = {
    id: historyId,
    channelId: entry.channelId || 'motivation_stoicism',
    title: entry.title || entry.topic,
    topic: entry.topic,
    theme: entry.theme || 'Stoic Philosophy',
    angle: entry.angle || 'Practical Self-Improvement',
    hook: entry.hook || '',
    storyExample: entry.storyExample || '',
    visualStyle: entry.visualStyle || '',
    narrativeStructure: entry.narrativeStructure || 'Standard 6-Slide Storyboard',
    usedAiModel: entry.usedAiModel || 'AI Generator',
    createdAt: new Date().toISOString()
  };

  // 1. Update local cache
  try {
    let localList = [];
    if (fs.existsSync(LOCAL_HISTORY_CACHE_FILE)) {
      try {
        localList = JSON.parse(fs.readFileSync(LOCAL_HISTORY_CACHE_FILE, 'utf8'));
      } catch {}
    }
    localList.unshift(record);
    fs.writeFileSync(LOCAL_HISTORY_CACHE_FILE, JSON.stringify(localList.slice(0, 100), null, 2));
  } catch {}

  // 2. Post to Firestore REST API
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/${FIRESTORE_DATABASE_ID}/documents/content_history?documentId=${historyId}&key=${FIRESTORE_API_KEY}`;
    const firestoreFields = {
      id: { stringValue: historyId },
      channelId: { stringValue: record.channelId },
      title: { stringValue: record.title },
      topic: { stringValue: record.topic },
      theme: { stringValue: record.theme },
      angle: { stringValue: record.angle },
      hook: { stringValue: record.hook },
      storyExample: { stringValue: record.storyExample },
      visualStyle: { stringValue: record.visualStyle },
      narrativeStructure: { stringValue: record.narrativeStructure },
      usedAiModel: { stringValue: record.usedAiModel },
      createdAt: { stringValue: record.createdAt }
    };

    const postData = JSON.stringify({ fields: firestoreFields });
    await new Promise((resolve) => {
      const req = https.request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 8000
      }, (res) => {
        resolve();
      });
      req.on('error', () => resolve());
      req.on('timeout', () => { req.destroy(); resolve(); });
      req.write(postData);
      req.end();
    });
  } catch (e) {
    console.warn("Firestore history save notice:", e.message);
  }

  return record;
}

/**
 * Check if a candidate topic or angle is too similar to recent history (cooldown check)
 */
function isTopicSimilarToHistory(candidateTopic, candidateTheme, recentHistory, threshold = 0.60) {
  if (!candidateTopic) return true;
  const normCandidate = candidateTopic.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
  const wordsCandidate = new Set(normCandidate.split(/\s+/).filter(w => w.length > 3));

  for (const h of recentHistory) {
    const prevTopic = (h.topic || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
    if (normCandidate === prevTopic) return true;

    const wordsPrev = prevTopic.split(/\s+/).filter(w => w.length > 3);
    if (wordsCandidate.size > 0 && wordsPrev.length > 0) {
      let matches = 0;
      for (const w of wordsPrev) {
        if (wordsCandidate.has(w)) matches++;
      }
      const overlap = matches / Math.max(wordsCandidate.size, wordsPrev.length);
      if (overlap >= threshold) return true;
    }
  }

  return false;
}

/**
 * Select a balanced, diverse set of 4 distinct archetypes for daily batch generation
 * taking into account recent Firestore history to avoid cooldown violations.
 */
function selectDailyDiverseSlots(recentHistory, slotCount = 4) {
  const recentThemes = new Set(recentHistory.slice(0, 10).map(h => (h.theme || '').toLowerCase()));
  const recentAngles = new Set(recentHistory.slice(0, 10).map(h => (h.angle || '').toLowerCase()));

  // Prioritize archetypes whose themes and angles have NOT been used recently
  const scoredArchetypes = STOIC_ARCHETYPES.map((arch, index) => {
    let score = 100;
    if (recentThemes.has(arch.theme.toLowerCase())) score -= 50;
    if (recentAngles.has(arch.angle.toLowerCase())) score -= 40;
    // Add minor entropy to break ties
    score += (index * 7) % 23;
    return { arch, score };
  });

  scoredArchetypes.sort((a, b) => b.score - a.score);

  const chosen = [];
  const pickedThemes = new Set();

  for (const item of scoredArchetypes) {
    if (chosen.length >= slotCount) break;
    if (!pickedThemes.has(item.arch.theme)) {
      chosen.push(item.arch);
      pickedThemes.add(item.arch.theme);
    }
  }

  // Fallback fill if needed
  if (chosen.length < slotCount) {
    for (const item of scoredArchetypes) {
      if (chosen.length >= slotCount) break;
      if (!chosen.includes(item.arch)) {
        chosen.push(item.arch);
      }
    }
  }

  return chosen;
}

/**
 * Build rich system and user prompts for multi-model AI generators that enforce
 * high diversity in topic, angle, hook, story/example, visual concept, and ending.
 */
function buildStoicPromptForSlot(slotArchetype, recentHistory, slotIndex = 0) {
  const recentTitles = recentHistory.slice(0, 12).map(h => `"${h.topic}"`).join(', ');

  const systemPrompt = `You are the lead Stoic philosopher and YouTube Shorts director for "The Stoic Architect" (@thestoicarchitect-n4b).
CHANNEL NICHE: Stoicism + discipline + mental strength + self-improvement.
TARGET AUDIENCE: Driven individuals seeking ancient psychological resilience, focus, emotional sovereignty, and practical self-mastery.

MANDATORY DIVERSITY & COOLDOWN CONSTRAINTS:
1. SPECIFIC THEMATIC ANGLE: For this video, you MUST strictly focus on:
   - Theme: ${slotArchetype.theme}
   - Angle: ${slotArchetype.angle}
   - Ancient Anchor: ${slotArchetype.historicalFigure} (${slotArchetype.philosophicalPrinciple})
   - Narrative Structure: ${slotArchetype.narrativeStructure}
   - Story/Historical Example to integrate: ${slotArchetype.storyExample}
   - Visual Style Aesthetic: ${slotArchetype.visualStyle}
   - Ending Outro: ${slotArchetype.outroPattern}

2. ANTI-REPETITION MANDATE (STRICT):
   - DO NOT repeat or closely mirror recently generated topics: [${recentTitles || 'None'}]
   - Ensure the hook is fresh, shocking, or deeply thought-provoking without generic clichés.
   - Deliver complete, grammatically sound, philosophically profound sentences across all 6 slides.
   - Absolutely NO promotional pitches, bio link sales, or commercial calls to action.
   - Outro on Slide 6 MUST conclude with a profound truth and the clean outro: "${slotArchetype.outroPattern}"

MANDATORY 6-SLIDE JSON OUTPUT SCHEMA:
{
  "title": "Fresh, High-CTR Stoic Title Specific to this Angle",
  "theme": "${slotArchetype.theme}",
  "angle": "${slotArchetype.angle}",
  "hook": "Opening hook line",
  "description": "Comprehensive video description with deep philosophical summary and tags #Shorts #Stoicism #MarcusAurelius #Discipline #Motivation #Mindset #Wisdom #PersonalGrowth #DailyStoic",
  "tags": ["#Shorts", "#Stoicism", "#Discipline", "#Motivation", "#MarcusAurelius", "#Mindset", "#Wisdom", "#SelfMastery"],
  "slides": [
    {
      "slideIndex": 0,
      "text": "Complete, profound hook sentence (12-16 words)...",
      "visual": "Extremely detailed 9:16 vertical 8k prompt adhering to ${slotArchetype.visualStyle} with lighting and mood..."
    },
    {
      "slideIndex": 1,
      "text": "Complete historical foundation or paradox sentence (12-15 words)...",
      "visual": "Detailed 9:16 vertical prompt for scene 2..."
    },
    {
      "slideIndex": 2,
      "text": "First actionable Stoic mechanism / historical truth (12-15 words)...",
      "visual": "Detailed 9:16 vertical prompt for scene 3..."
    },
    {
      "slideIndex": 3,
      "text": "Second actionable Stoic mechanism / real-world contrast (12-15 words)...",
      "visual": "Detailed 9:16 vertical prompt for scene 4..."
    },
    {
      "slideIndex": 4,
      "text": "Deep sovereign takeaway on mental resilience (12-15 words)...",
      "visual": "Detailed 9:16 vertical prompt for scene 5..."
    },
    {
      "slideIndex": 5,
      "text": "Final timeless truth + '${slotArchetype.outroPattern}' (12-15 words)...",
      "visual": "Detailed 9:16 vertical prompt for scene 6 with heroic lighting and resolution..."
    }
  ]
}`;

  const userPrompt = `Generate a brand new, highly original Stoic Short storyboard for Slot ${slotIndex + 1} of 4 today.
Theme: "${slotArchetype.theme}". Angle: "${slotArchetype.angle}".
Ensure full variation in hook, story, visual imagery, and narrative structure. Output strictly raw JSON.`;

  return { systemPrompt, userPrompt };
}

module.exports = {
  STOIC_ARCHETYPES,
  fetchRecentHistoryFromFirestore,
  saveContentHistoryToFirestore,
  isTopicSimilarToHistory,
  selectDailyDiverseSlots,
  buildStoicPromptForSlot
};
