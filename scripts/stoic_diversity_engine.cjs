/**
 * Stoic Architecture Diversity & Script Synthesis Engine
 * Channel: @TheStoicArchitect / Modern Stoicism & Mental Strength
 * 
 * CORE CHANNEL PRINCIPLE:
 * Deliver deep, practical, spoken-conversational modern Stoic wisdom,
 * emotional discipline, and mental fortitude for everyday people.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Local history cache files
const LOCAL_HISTORY_CACHE_FILE = path.join(process.cwd(), 'daily_stoic_history_cache.json');
const MANIFEST_PATH = path.join(process.cwd(), 'daily_blueprint_manifest.json');

// Firestore credentials
const FIRESTORE_PROJECT_ID = process.env.FIRESTORE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'ai-studio-voxam-a00cf6de-bee8-48db-97c4-0c43daab8a7e';
const FIRESTORE_API_KEY = process.env.FIRESTORE_API_KEY || process.env.VITE_FIREBASE_API_KEY || '';
const FIRESTORE_DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || process.env.VITE_FIRESTORE_DATABASE_ID || 'ai-studio-voxam-a00cf6de-bee8-48db-97c4-0c43daab8a7e';

/**
 * Format a complete, viral YouTube Shorts title with high-CTR trending hashtags
 * Ensures NO mid-word cutoffs, NO incomplete sentences, and fits within YouTube's 100-char limit.
 */
function formatViralShortsTitle(rawHeadline, nicheOrCategory = 'stoic', isDeepDive = false) {
  if (!rawHeadline) rawHeadline = 'The Stoic Mindset Mastery Blueprint';
  
  // 1. Clean raw title from markdown, thinking blocks, code quotes, etc.
  let headline = String(rawHeadline)
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<think>[\s\S]*/gi, '')
    .replace(/Thinking Process:[\s\S]*?(?=\n\n|\n[A-Z0-9"']|$)/gi, '')
    .replace(/```[\s\S]*?```/gi, '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/['"\\`]/g, '')
    .replace(/[<>|:]/g, ' - ')
    .replace(/[{}[\]]/g, '')
    .replace(/#\w+/g, '') // remove existing loose hashtags to rebuild cleanly
    .replace(/\s+/g, ' ')
    .trim();

  // If long-form / deep-dive (15-20 min masterclass), no #Shorts hashtag
  if (isDeepDive) {
    if (headline.length > 90) {
      const trimmed = headline.slice(0, 88);
      const lastSpace = trimmed.lastIndexOf(' ');
      headline = (lastSpace > 30 ? trimmed.slice(0, lastSpace) : trimmed).trim();
    }
    headline = headline.replace(/[\s\-,;:]+(and|to|with|the|of|in|for|by|or|a|an|from|on|is|are)?$/i, '').trim();
    return headline;
  }

  // 2. Select curated viral & trending hashtags for this niche
  const lower = (nicheOrCategory || '').toLowerCase();
  let tagPool = [];
  if (lower.includes('stoic') || lower.includes('mind') || lower.includes('discipline') || lower.includes('motivation')) {
    tagPool = ['#Shorts', '#viral', '#trending', '#stoic', '#mindset', '#discipline', '#motivation', '#fyp'];
  } else if (lower.includes('fin') || lower.includes('money') || lower.includes('business') || lower.includes('wealth')) {
    tagPool = ['#Shorts', '#viral', '#trending', '#money', '#finance', '#wealth', '#business', '#fyp'];
  } else if (lower.includes('tech') || lower.includes('ai') || lower.includes('code') || lower.includes('developer')) {
    tagPool = ['#Shorts', '#viral', '#trending', '#ai', '#tech', '#coding', '#developer', '#fyp'];
  } else {
    tagPool = ['#Shorts', '#viral', '#trending', '#fyp', '#explore'];
  }

  // Mandatory primary viral tags
  const coreTags = ['#Shorts', '#viral', '#trending'];
  const extraTags = tagPool.filter(t => !coreTags.includes(t));

  // Max headline length target around 68 chars to preserve hashtag space
  if (headline.length > 68) {
    const trimmed = headline.slice(0, 68);
    const lastSpace = trimmed.lastIndexOf(' ');
    headline = (lastSpace > 25 ? trimmed.slice(0, lastSpace) : trimmed).trim();
  }

  // Clean trailing connector words or punctuation to guarantee a complete phrase
  headline = headline
    .replace(/[,\-;:–—]+$/, '')
    .replace(/\s+(and|to|with|the|of|in|for|by|or|a|an|from|on|is|are|your|their|that)\s*$/i, '')
    .replace(/[,\-;:–—]+$/, '')
    .trim();

  // 3. Greedily append hashtags up to 98 chars total
  let finalTitle = headline;
  const allTagsToTry = [...coreTags, ...extraTags];
  
  for (const tag of allTagsToTry) {
    if ((finalTitle + ' ' + tag).length <= 98) {
      finalTitle += ' ' + tag;
    }
  }

  return finalTitle;
}

// 8 Distinct Rotating Hook Frameworks for Stoicism & Mindset
const ROTATING_STOIC_HOOK_TEMPLATES = [
  {
    id: 'contrarian_paradox',
    name: 'Contrarian Paradox',
    formula: 'The reason you are exhausted is not hard work—it is caring about things you cannot control...',
    generateHook: (theme) => `The real reason you feel mentally exhausted is not your workload—it is caring about things you cannot control.`
  },
  {
    id: 'brutal_truth',
    name: 'Brutal Reality / Ancient Law',
    formula: 'Nobody is coming to save you. Marcus Aurelius realized 2,000 years ago that your transformation begins when...',
    generateHook: (theme) => `Nobody is coming to save you. The day you stop waiting for external rescue is the day your real power awakens.`
  },
  {
    id: 'under_fire_scenario',
    name: 'Under-Fire Scenario',
    formula: 'When someone insults you or disrespects your name, the most dangerous response is not anger—it is...',
    generateHook: (theme) => `When someone disrespects you or tries to provoke an argument, the most dangerous response is not anger—it is complete, icy silence.`
  },
  {
    id: 'curiosity_gap_tactical',
    name: '5-Second Gap Curiosity',
    formula: 'There is a 5-second space between what happens to you and how you react that dictates your entire future...',
    generateHook: (theme) => `There is a 5-second space between a provocation and your response. That gap is where your freedom and sovereignty live.`
  },
  {
    id: 'iron_law_mindset',
    name: 'The Iron Law of Mental Fortress',
    formula: 'The first law of mental toughness: If you do not rule your own mind, the world will happily rule it for you...',
    generateHook: (theme) => `The first law of mental toughness: If you do not rule your own mind, chaotic people and trivial events will happily rule it for you.`
  },
  {
    id: 'challenge_diagnostic',
    name: '40-Second Mental Armor Challenge',
    formula: 'Give me 40 seconds to give you psychological armor that makes you immune to other people\'s opinions...',
    generateHook: (theme) => `Give me 40 seconds to give you the psychological armor that makes you completely immune to disrespect and judgment.`
  },
  {
    id: 'question_pivot_night',
    name: 'Late-Night Overthinking Question',
    formula: 'Why do you stay awake overthinking everything at 2 AM? It is not anxiety—it is this single mental trap...',
    generateHook: (theme) => `Why do you stay awake overthinking conversations from three years ago? It is not anxiety—it is this single mental trap.`
  },
  {
    id: 'power_of_solitude',
    name: 'Solitude & Self-Mastery',
    formula: 'When everyone is running after cheap dopamine and noisy validation, the most formidable person in the room is...',
    generateHook: (theme) => `When everyone is addicted to cheap dopamine and validation, the most formidable person is the one who can sit alone in quiet discipline.`
  }
];

// 10 Distinct Rotating Outro & Infinite Loop Formats
const ROTATING_STOIC_OUTROS = [
  {
    id: 'stoic_question_reversal',
    template: (handle) => `Follow ${handle} to build unshakeable mental armor every day, because the real secret to self-control is...`
  },
  {
    id: 'stoic_first_principle',
    template: (handle) => `Tap follow on ${handle} for daily fortitude, and remember that conquering your mind always starts with...`
  },
  {
    id: 'stoic_silent_trap',
    template: (handle) => `Follow ${handle} to master daily chaos, because whenever life tests your patience, you must remember that...`
  },
  {
    id: 'stoic_action_origin',
    template: (handle) => `Save this wisdom and follow ${handle}, because becoming emotionally untouchable begins the exact second you ask...`
  },
  {
    id: 'stoic_reverse_psychology',
    template: (handle) => `Most people will react with weakness, but disciplined minds follow ${handle} and immediately remember that...`
  },
  {
    id: 'stoic_foundation_recall',
    template: (handle) => `Follow ${handle} for unshakeable focus, because the only thing you truly own in this chaotic world is...`
  },
  {
    id: 'stoic_critical_inquiry',
    template: (handle) => `Subscribe to ${handle} for daily stoic clarity, and before you react to anything today, ask yourself...`
  },
  {
    id: 'stoic_discipline_contract',
    template: (handle) => `Build evidence and follow ${handle}, because the non-negotiable contract with yourself always starts with...`
  },
  {
    id: 'stoic_fortress_defense',
    template: (handle) => `Join ${handle} to become indestructible against life's storms, and always remember that real power begins by...`
  },
  {
    id: 'stoic_algorithmic_repeat',
    template: (handle) => `Watch this again and follow ${handle}, because the single master key to mental peace is...`
  }
];

// 25+ Comprehensive Stoic Archetypes
const STOIC_ARCHETYPES = [
  {
    lessonId: 'disrespect_silence',
    theme: 'Responding to Disrespect with Silence',
    angle: 'The Psychology of Strategic Silence: Why Silence Is the Ultimate Weapon Against Provocation',
    philosophicalPrinciple: 'Inner Citadel — no external insult can pierce your peace unless your own judgment permits it.',
    hookArchetypeId: 'under_fire_scenario',
    modernScenario: 'Someone tries to humiliate or provoke you in a public meeting or social group.',
    visualStyle: 'Moody obsidian marble bust in dramatic cinematic chiaroscuro, warm amber side rim lighting, 9:16 vertical 8k'
  },
  {
    lessonId: 'failure_rebuild',
    theme: 'Rebuilding from Failure & Starting Over',
    angle: 'The Amor Fati Blueprint: How to Rebuild Your Entire Life When Everything Falls Apart',
    philosophicalPrinciple: 'Amor Fati — loving your fate, using the fire of adversity as fuel for your next chapter.',
    hookArchetypeId: 'brutal_truth',
    modernScenario: 'Recovering from a severe business loss, relationship collapse, or career setback.',
    visualStyle: 'Solitary figure rising amidst dramatic mountain mist at golden hour sunrise, sharp cinematic depth of field'
  },
  {
    lessonId: 'overthinking_action',
    theme: 'Killing Overthinking & Analysis Paralysis',
    angle: 'The Action Antidote: Why Physical Momentum Destroys Mental Anxiety in 60 Seconds',
    philosophicalPrinciple: 'Action cures fear — the imagination creates a thousand false catastrophes that never occur.',
    hookArchetypeId: 'question_pivot_night',
    modernScenario: 'Staring at the ceiling at 2 AM paralyzed by worry about tomorrow\'s decisions.',
    visualStyle: 'Close-up of intense focused eyes in dark moody slate atmosphere, sharp amber rim light, 9:16 vertical 8k'
  },
  {
    lessonId: 'unsupported_isolation',
    theme: 'Thriving When Nobody Supports You',
    angle: 'The Lone Wolf Protocol: How to Build Immense Strength in Complete Solitude',
    philosophicalPrinciple: 'Self-Reliance — your character is forged in the dark when nobody is watching or clapping.',
    hookArchetypeId: 'power_of_solitude',
    modernScenario: 'Working towards ambitious goals with zero encouragement from family or peers.',
    visualStyle: 'Atmospheric solitary figure walking purposefully through dark architectural archways towards bright sunlight'
  },
  {
    lessonId: 'pressure_calm',
    theme: 'Staying Ice Cold Under Extreme Pressure',
    angle: 'The 10-Second Tactical Pause: How to Lower Heart Rate & Maintain Absolute Calm in Crisis',
    philosophicalPrinciple: 'Apatheia — freedom from disruptive passions and emotional reactivity under fire.',
    hookArchetypeId: 'curiosity_gap_tactical',
    modernScenario: 'High-stakes negotiations, urgent emergencies, or unexpected severe conflicts.',
    visualStyle: 'Still drop of water creating pristine ripple in glassy black pool, warm gold rim light, 9:16 vertical 8k'
  },
  {
    lessonId: 'rejection_filter',
    theme: 'Overcoming Rejection & Criticism',
    angle: 'The Rejection Armor: Why Being Rejected Is the Greatest Filter for True Greatness',
    philosophicalPrinciple: 'Indifferents — external opinions have zero intrinsic moral value over your soul.',
    hookArchetypeId: 'challenge_diagnostic',
    modernScenario: 'Receiving harsh criticism online, a rejected job application, or social dismissal.',
    visualStyle: 'Sharp silhouette of focused individual standing unwavering in a busy blurred city, 9:16 vertical 8k'
  },
  {
    lessonId: 'comparison_timeline',
    theme: 'Curing Social Comparison & Envy',
    angle: 'The Singular Lane: How to Stop Comparing Your Real Life to Other People\'s Highlight Reels',
    philosophicalPrinciple: 'Virtue as Sole Good — true excellence is competing only with who you were yesterday.',
    hookArchetypeId: 'contrarian_paradox',
    modernScenario: 'Doom-scrolling social media feeling inadequate seeing peers appear to succeed faster.',
    visualStyle: 'Sleek dark minimalist study, glowing single amber lantern illuminating open leather notebook, 9:16 vertical 8k'
  },
  {
    lessonId: 'impulse_delay',
    theme: 'Conquering Cheap Dopamine & Impulsive Desires',
    angle: 'The Dopamine Reset: How to Break Free From Mindless Scrolling & Craving Instant Gratification',
    philosophicalPrinciple: 'Temperance / Moderation — mastering bodily impulses so your rational mind reigns supreme.',
    hookArchetypeId: 'iron_law_mindset',
    modernScenario: 'Struggling with phone addiction, late-night junk food, and endless procrastination.',
    visualStyle: 'Smartphone face-down on dark polished slate table, hands resting calmly in meditative focus, 9:16 vertical 8k'
  },
  {
    lessonId: 'delayed_gratification',
    theme: 'The Long Game & Compounding Discipline',
    angle: 'The Compound Character Principle: Why Boring Daily Repetitions Create Undefeatable Men and Women',
    philosophicalPrinciple: 'Perseverance — great things are not created by sudden impulse, but by small things brought together.',
    hookArchetypeId: 'brutal_truth',
    modernScenario: 'Feeling discouraged after weeks of hard work with no visible dramatic changes.',
    visualStyle: 'Massive ancient stone monolith standing unweathered against stormy ocean waves at twilight, 9:16 vertical 8k'
  },
  {
    lessonId: 'difficult_people_boundaries',
    theme: 'Setting Boundaries with Toxic & Difficult People',
    angle: 'The Armor of Realism: How to Deal with Manipulative People Without Losing Your Peace',
    philosophicalPrinciple: 'Expectation of Human Nature — Marcus Aurelius morning meditation on meeting ungrateful and arrogant people.',
    hookArchetypeId: 'under_fire_scenario',
    modernScenario: 'Handling toxic colleagues, demanding relatives, or passive-aggressive acquaintances.',
    visualStyle: 'Aesthetic glass partition reflecting clean golden light, symbolizing impenetrable boundaries, 9:16 vertical 8k'
  },
  {
    lessonId: 'control_energy_ledger',
    theme: 'Radical Surrender to What You Cannot Control',
    angle: 'The Energy Ledger: How to Instantly Eliminate 90% of Daily Stress by Releasing the Unchangeable',
    philosophicalPrinciple: 'Dichotomy of Control — dividing all life into what is up to us and what is not.',
    hookArchetypeId: 'contrarian_paradox',
    modernScenario: 'Facing unexpected flight cancellations, bad weather, or macroeconomic shifts.',
    visualStyle: 'Open hand releasing autumn leaves in wind, eyes locked forward onto the rising horizon, 9:16 vertical 8k'
  },
  {
    lessonId: 'confidence_self_trust',
    theme: 'Evidence-Based Self-Trust & Keeping Promises',
    angle: 'The Integrity Protocol: How to Build Real Unshakeable Confidence Without Fake Affirmations',
    philosophicalPrinciple: 'Virtue and integrity — confidence is the byproduct of private alignment between word and action.',
    hookArchetypeId: 'iron_law_mindset',
    modernScenario: 'Overcoming chronic self-doubt and impostor syndrome when taking on bigger responsibilities.',
    visualStyle: 'Confident figure walking with purpose down a sunlit architectural corridor in dramatic natural light, 9:16 vertical 8k'
  },
  {
    lessonId: 'depleted_micro_momentum',
    theme: 'Motivation When You Feel Completely Exhausted',
    angle: 'The 2-Minute Gateway: How to Trick an Exhausted Brain Into Starting When You Want to Quit',
    philosophicalPrinciple: 'Action precedes emotion — initiating physical momentum with the smallest meaningful action.',
    hookArchetypeId: 'curiosity_gap_tactical',
    modernScenario: 'Returning home drained after a grueling day and finding the willpower to train or study.',
    visualStyle: 'Small spark blooming into a steady warm flame against deep dark slate, 9:16 vertical 8k'
  },
  {
    lessonId: 'mental_hardening',
    theme: 'Voluntary Hardship & Anti-Fragility',
    angle: 'The Cold Water Protocol: Why Seeking Discomfort Makes You Immune to Life\'s Hardships',
    philosophicalPrinciple: 'Voluntary hardship — intentionally facing difficulty so unexpected adversity cannot break you.',
    hookArchetypeId: 'challenge_diagnostic',
    modernScenario: 'Taking cold showers, hard workouts, or tackling the most dreaded email first thing in the morning.',
    visualStyle: 'Athlete in pre-dawn mist breathing steady vapor, eyes locked forward with steely resolve, 9:16 vertical 8k'
  },
  {
    lessonId: 'judgment_spotlight_fallacy',
    theme: 'Overcoming the Fear of Looking Foolish',
    angle: 'The Spotlight Fallacy: Why Nobody Cares About Your Mistakes as Much as You Think',
    philosophicalPrinciple: 'Freedom from vanity — recognizing that people are consumed with their own anxieties.',
    hookArchetypeId: 'contrarian_paradox',
    modernScenario: 'Speaking up in a large meeting, publishing creative work, or starting a public venture.',
    visualStyle: 'Figure stepping out from deep shadows into a clean focused beam of warm studio light, 9:16 vertical 8k'
  },
  {
    lessonId: 'mental_toughness',
    theme: 'Adversity as Raw Fuel (The Obstacle is the Way)',
    angle: 'The Crucible Principle: How Hard Times Are Forging Your Greatest Strength',
    philosophicalPrinciple: 'The Obstacle is the Way — adversity is the raw material of personal transformation.',
    hookArchetypeId: 'brutal_truth',
    modernScenario: 'Carrying heavy family responsibilities, working through financial stress, and refusing to break.',
    visualStyle: 'Ancient stone lighthouse standing firm against towering crashing storm waves at dusk, 9:16 vertical 8k'
  },
  {
    lessonId: 'deep_focus_distractions',
    theme: 'Guarding Your Attention in a Noisy World',
    angle: 'The Attention Fortress: How to Eliminate Distractions and Enter Deep Work at Will',
    philosophicalPrinciple: 'Guardianship of attention — your focus is your life; letting trivial noise steal it is self-sabotage.',
    hookArchetypeId: 'iron_law_mindset',
    modernScenario: 'Struggling to stay focused on deep reading or analytical tasks amidst constant notifications.',
    visualStyle: 'Soundproof minimalist study with warm wooden accents, single focused desk lamp in dark room, 9:16 vertical 8k'
  },
  {
    lessonId: 'memento_mori_urgency',
    theme: 'Memento Mori: Using Mortality to Kill Procrastination',
    angle: 'The Death Clock: Why Remembering Your Time Is Limited Destroys Trivial Drama Instantly',
    philosophicalPrinciple: 'Memento Mori — remember that you must die; let that define what you do, say, and think.',
    hookArchetypeId: 'brutal_truth',
    modernScenario: 'Wasting days on petty arguments or delaying important life dreams out of fear.',
    visualStyle: 'Aesthetic bronze hourglass with flowing golden sand, dramatic low key lighting, 9:16 vertical 8k'
  },
  {
    lessonId: 'evening_mental_audit',
    theme: 'The Seneca Evening Review Routine',
    angle: 'The 3-Question Nightly Audit That Eliminates Regret and Builds Daily Growth',
    philosophicalPrinciple: 'Self-Examination — examining your day without cruelty, noting what went well and what to improve.',
    hookArchetypeId: 'question_pivot_night',
    modernScenario: 'Closing the day with clarity instead of tossing and turning with mental anxiety.',
    visualStyle: 'Leather journal on dark wood desk beside extinguished candle with wisps of smoke, 9:16 vertical 8k'
  },
  {
    lessonId: 'ego_is_the_enemy',
    theme: 'Killing the Ego Before It Destroys You',
    angle: 'The Quiet Master: Why Staying Humble in Success Protects You From Devastating Falls',
    philosophicalPrinciple: 'Humility — pride comes before destruction; the student mindset keeps you sharp forever.',
    hookArchetypeId: 'iron_law_mindset',
    modernScenario: 'Experiencing early success and feeling tempted to brag, spend recklessly, or become complacent.',
    visualStyle: 'Sculptor quietly working on fine marble details, bathed in warm morning atelier light, 9:16 vertical 8k'
  }
];

/**
 * Resolve dynamic rotating outro for Stoic channel
 */
function resolveStoicOutro(channelHandle = '@thestoicarchitect-n4b', seed = Math.random()) {
  const cleanHandle = channelHandle.startsWith('@') ? channelHandle : `@${channelHandle}`;
  const index = Math.floor(Math.abs(seed) * ROTATING_STOIC_OUTROS.length) % ROTATING_STOIC_OUTROS.length;
  const outroObj = ROTATING_STOIC_OUTROS[index];
  return outroObj.template(cleanHandle);
}

/**
 * Select a rotating hook format
 */
function selectStoicHookFormat(slotIndex = 0, historyCount = 0) {
  const index = (slotIndex + historyCount + Math.floor(Math.random() * 3)) % ROTATING_STOIC_HOOK_TEMPLATES.length;
  return ROTATING_STOIC_HOOK_TEMPLATES[index];
}

/**
 * Fetch recent stoic history from Firestore REST API and local cache
 */
async function fetchRecentHistoryFromFirestore(channelId = 'motivation_stoicism', limit = 35) {
  const historyItems = [];

  // 1. Check local manifest
  if (fs.existsSync(MANIFEST_PATH)) {
    try {
      const raw = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
      if (Array.isArray(raw)) {
        for (const item of raw) {
          if (item.title || item.topic) {
            historyItems.push({
              topic: item.topic || item.title,
              title: item.title || item.topic,
              theme: item.theme || item.title,
              angle: item.angle || '',
              createdAt: item.timestamp || item.createdAt || ''
            });
          }
        }
      }
    } catch {}
  }

  // 2. Check local stoic cache file
  if (fs.existsSync(LOCAL_HISTORY_CACHE_FILE)) {
    try {
      const cached = JSON.parse(fs.readFileSync(LOCAL_HISTORY_CACHE_FILE, 'utf8'));
      if (Array.isArray(cached)) {
        historyItems.push(...cached);
      }
    } catch {}
  }

  // 3. Fetch from Firestore REST API (content_history)
  if (FIRESTORE_API_KEY && FIRESTORE_PROJECT_ID) {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/${FIRESTORE_DATABASE_ID}/documents/content_history?pageSize=${limit}&key=${FIRESTORE_API_KEY}`;
      const res = await new Promise((resolve) => {
        const req = https.get(url, { timeout: 6000 }, (resp) => {
          let data = '';
          resp.on('data', c => data += c);
          resp.on('end', () => {
            if (resp.statusCode === 200) {
              try {
                const j = JSON.parse(data);
                resolve({ success: true, documents: j.documents || [] });
              } catch (e) { resolve({ success: false }); }
            } else { resolve({ success: false }); }
          });
        });
        req.on('error', () => resolve({ success: false }));
        req.on('timeout', () => { req.destroy(); resolve({ success: false }); });
      });

      if (res.success && Array.isArray(res.documents)) {
        for (const doc of res.documents) {
          const fields = doc.fields || {};
          const item = {
            topic: fields.topic?.stringValue || fields.title?.stringValue || '',
            title: fields.title?.stringValue || fields.topic?.stringValue || '',
            theme: fields.theme?.stringValue || '',
            angle: fields.angle?.stringValue || '',
            createdAt: fields.createdAt?.stringValue || ''
          };
          if (item.topic) historyItems.push(item);
        }
      }
    } catch {}
  }

  // Deduplicate history items
  const seen = new Set();
  const deduped = [];
  for (const h of historyItems) {
    const key = (h.topic || h.title || '').toLowerCase().trim();
    if (key && !seen.has(key)) {
      seen.add(key);
      deduped.push(h);
    }
  }

  return deduped;
}

/**
 * Strict check if candidate topic matches or is too similar to recent history
 */
function isTopicSimilarToHistory(candidateTopic, candidateTheme, recentHistory = [], threshold = 0.50) {
  if (!candidateTopic) return true;
  const normCandidate = candidateTopic.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
  const stopWords = new Set(['how', 'the', 'what', 'when', 'with', 'your', 'from', 'this', 'that', 'they', 'will', 'stoic', 'stoicism', 'rule', 'rules', 'mind', 'mental', 'life', 'daily', 'shorts']);

  const wordsCandidate = new Set(
    normCandidate.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w))
  );

  const windowToCheck = recentHistory.slice(0, 30);

  for (const item of windowToCheck) {
    const prevText = ((item.topic || item.title || '') + ' ' + (item.theme || '')).toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
    if (normCandidate === prevText || prevText.includes(normCandidate) || normCandidate.includes(prevText)) {
      return true;
    }

    const wordsPrev = prevText.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
    if (wordsCandidate.size > 0 && wordsPrev.length > 0) {
      let matches = 0;
      for (const w of wordsPrev) {
        if (wordsCandidate.has(w)) matches++;
      }
      const overlap = matches / Math.min(wordsCandidate.size, wordsPrev.length);
      if (overlap >= threshold) return true;
    }
  }

  return false;
}

/**
 * Select daily diverse slots avoiding recent themes
 */
function selectDailyDiverseSlots(count = 4, recentHistory = []) {
  const recentThemes = new Set(recentHistory.map(h => (h.theme || '').toLowerCase()));
  const available = STOIC_ARCHETYPES.filter(a => !recentThemes.has(a.theme.toLowerCase()));
  const pool = available.length >= count ? available : STOIC_ARCHETYPES;

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Build rich system and user prompts for multi-model AI generators with rotating hooks and loops
 */
function buildStoicPromptForSlot(slotArchetype, recentHistory, slotIndex = 0, channelHandle = '@thestoicarchitect-n4b') {
  const recentTitles = (recentHistory || []).slice(0, 20).map(h => `"${h.topic || h.title}"`).join(', ');
  const cleanHandle = channelHandle.startsWith('@') ? channelHandle : `@${channelHandle}`;
  
  const chosenHookFormat = selectStoicHookFormat(slotIndex, (recentHistory || []).length);
  const chosenOutro = resolveStoicOutro(cleanHandle, slotIndex * 13 + Date.now());

  const systemPrompt = `You are a master viral scriptwriter and YouTube director for the Modern Stoicism & Mental Strength channel (${cleanHandle}).
CHANNEL GOAL: Deliver practical, high-impact modern stoicism, emotional discipline, and mental fortitude in clear, spoken-conversational English.
AUDIENCE: Everyday normal people dealing with stress, difficult people, self-doubt, burnout, and daily distractions.

CRITICAL YOUTUBE SHORTS ALGORITHM RETENTION RULES (32-42 SECONDS TOTAL):
1. RUNTIME & PACING: Exactly 6 high-impact slides (slideIndex 0 to 5). Each slide MUST have 18 to 25 punchy spoken words (110-140 words total).
2. SLIDE 0 (ANTI-SWIPE HOOK): Use the '${chosenHookFormat.name}' format! Formula: "${chosenHookFormat.formula}". Start directly with an intense pattern-interrupt question or shocking statement in under 12 words.
3. SLIDE 1 (THE PSYCHOLOGICAL TRAP): Why most people react impulsively and hand over their power.
4. SLIDE 2 (THE STOIC MINDSET SHIFT): The core mental principle in plain modern language.
5. SLIDE 3 (THE TACTICAL DAILY PROTOCOL): Concrete physical/mental action to execute immediately.
6. SLIDE 4 (SOVEREIGN BENEFIT): Why this response makes you completely untouchable.
7. SLIDE 5 (INFINITE RETENTION LOOP & OUTRO): Golden law + short CTA + this exact seamless bridge: "${chosenOutro}" that connects grammatically right back into Slide 0!

UNIFIED VISUAL IDENTITY (9:16 Vertical 8k Cinematic):
- All 6 visual prompts MUST share the same aesthetic: ${slotArchetype.visualStyle}
- Lighting: Warm amber rim lighting, dark moody obsidian slate background, sharp 35mm anamorphic portrait depth of field.

EXCLUDED PREVIOUS TOPICS (DO NOT REPEAT):
[${recentTitles || 'None'}]

TARGET THEME & ANGLE:
- Theme: ${slotArchetype.theme}
- Angle: ${slotArchetype.angle}

OUTPUT FORMAT: Return strictly a valid JSON object matching the schema below.
CRITICAL: Output EXACTLY 6 slides (slideIndex 0 to 5).

{
  "title": "Complete High-Impact Hook Title (around 35-50 chars) #Shorts #viral #trending",
  "theme": "${slotArchetype.theme}",
  "angle": "${slotArchetype.angle}",
  "description": "Practical breakdown of ${slotArchetype.theme} and mental strength.\\n\\n#Shorts #viral #trending #Discipline #Motivation #MentalStrength #SelfControl #Stoicism #Mindset #PersonalGrowth #fyp",
  "tags": ["#Shorts", "#viral", "#trending", "#Discipline", "#Motivation", "#MentalStrength", "#SelfControl", "#Stoicism", "#Mindset", "#PersonalGrowth", "#fyp"],
  "slides": [
    {
      "slideIndex": 0,
      "text": "Shocking hook matching ${chosenHookFormat.name} (18-22 words)...",
      "visual": "Cinematic 9:16 vertical 8k scene, ${slotArchetype.visualStyle}"
    },
    {
      "slideIndex": 1,
      "text": "The psychological trap beginners fall into explained simply (18-22 words)...",
      "visual": "Cinematic 9:16 vertical 8k scene matching ${slotArchetype.visualStyle}"
    },
    {
      "slideIndex": 2,
      "text": "The core Stoic mental shift in plain modern English (18-22 words)...",
      "visual": "Cinematic 9:16 vertical 8k scene matching ${slotArchetype.visualStyle}"
    },
    {
      "slideIndex": 3,
      "text": "The tactical step-by-step action to take right now (18-22 words)...",
      "visual": "Cinematic 9:16 vertical 8k scene matching ${slotArchetype.visualStyle}"
    },
    {
      "slideIndex": 4,
      "text": "Why this makes your character and peace untouchable (18-22 words)...",
      "visual": "Cinematic 9:16 vertical 8k scene matching ${slotArchetype.visualStyle}"
    },
    {
      "slideIndex": 5,
      "text": "Golden rule + ${chosenOutro} (18-22 words)...",
      "visual": "Cinematic 9:16 vertical 8k scene matching ${slotArchetype.visualStyle}"
    }
  ]
}`;

  const userPrompt = `Generate a fresh, viral, high-retention 6-slide Modern Stoic Short storyboard for Slot ${slotIndex + 1}.
Theme: "${slotArchetype.theme}". Angle: "${slotArchetype.angle}". Hook Format: "${chosenHookFormat.name}".
MANDATE: Output EXACTLY 6 slides (slideIndex 0 to 5) with 18-25 words per slide (32-42s runtime). Connect Slide 5 seamlessly into Slide 0. Output strictly valid JSON.`;

  return { systemPrompt, userPrompt, chosenHookFormat, chosenOutro };
}

/**
 * Deterministic fallback storyboard generator strictly outputting 6 slides (32-42s runtime)
 */
function synthesizeDeterministicStoryboard(slotArchetype, topicTitle, channelHandle = '@thestoicarchitect-n4b', slotIndex = 0) {
  const cleanHandle = channelHandle.startsWith('@') ? channelHandle : `@${channelHandle}`;
  const resolvedOutro = resolveStoicOutro(cleanHandle, slotIndex * 11 + Date.now());
  const arch = slotArchetype || STOIC_ARCHETYPES[0];
  const rawTitle = (topicTitle && topicTitle.length > 5) ? topicTitle : `${arch.theme} - The Stoic Rule for Mental Strength`;
  const title = formatViralShortsTitle(rawTitle, 'stoic', false);

  return {
    title: title,
    theme: arch.theme,
    angle: arch.angle,
    hook: arch.angle,
    description: `Comprehensive modern breakdown of ${arch.theme} and mental strength.\n\n#Shorts #viral #trending #Discipline #Motivation #MentalStrength #SelfControl #Stoicism #Mindset #PersonalGrowth #Confidence #fyp`,
    tags: ["#Shorts", "#viral", "#trending", "#Discipline", "#Motivation", "#MentalStrength", "#SelfControl", "#Stoicism", "#Mindset", "#PersonalGrowth", "#fyp"],
    slides: [
      {
        slideIndex: 0,
        text: `When life tests your character and throws chaos in your path, your immediate reaction is the only thing in this world you truly own.`,
        visual: `Cinematic vertical 9:16 shot, ${arch.visualStyle}, atmospheric cinematic lighting, dark slate and amber color tone, 8k resolution`
      },
      {
        slideIndex: 1,
        text: `Most people operate on automatic pilot. When provoked or facing sudden friction, they immediately react with panic, anger, and helpless frustration.`,
        visual: `Cinematic vertical 9:16 shot matching ${arch.visualStyle}, close angle, rich slate gray shadows with warm amber rim light, 8k`
      },
      {
        slideIndex: 2,
        text: `The core Stoic principle is simple: external events have zero power to hurt you until your mind judges them as harmful or humiliating.`,
        visual: `Cinematic vertical 9:16 shot matching ${arch.visualStyle}, solitary contemplative figure in sharp focus, slate stone texture and golden highlights, 8k`
      },
      {
        slideIndex: 3,
        text: `Institute a strict ten-second tactical pause. Do not speak, do not react with anger, and evaluate if this obstacle is within your control.`,
        visual: `Cinematic vertical 9:16 shot matching ${arch.visualStyle}, intense focused perspective, atmospheric depth, cinematic slate and golden amber tones, 8k`
      },
      {
        slideIndex: 4,
        text: `Redirect every drop of your energy into your next controllable action: your effort, your calm, and your private commitment to excellence.`,
        visual: `Cinematic vertical 9:16 shot matching ${arch.visualStyle}, powerful solid architectural composition, deep slate and warm amber illumination, 8k`
      },
      {
        slideIndex: 5,
        text: `Silence the noise, master your internal dialogue, and ${resolvedOutro}`,
        visual: `Cinematic vertical 9:16 shot matching ${arch.visualStyle}, confident thinker looking towards horizon at dawn, warm amber and obsidian tones, 8k`
      }
    ]
  };
}

/**
 * Build rich prompt for 15-chapter 15-20 min Stoic Masterclass video
 */
function buildStoicDeepDivePrompt(archetype, recentHistory = [], channelHandle = '@thestoicarchitect-n4b') {
  const cleanHandle = channelHandle.startsWith('@') ? channelHandle : `@${channelHandle}`;
  const recentTitles = (recentHistory || []).slice(0, 20).map(h => `"${h.topic || h.title}"`).join(', ');
  const resolvedOutro = resolveStoicOutro(cleanHandle);

  const systemPrompt = `You are a master Stoic philosopher, psychologist, and long-form documentary scriptwriter for the channel (${cleanHandle}).
CHANNEL GOAL: Deliver deep, practical, spoken-conversational modern Stoic wisdom that transforms everyday lives.
AUDIENCE: Normal everyday people seeking unshakeable discipline, emotional mastery, and mental fortitude.

LONG-FORM MASTERCLASS REQUIREMENTS (15 CHAPTERS / 15-20 MINUTES):
1. EXACTLY 15 COMPREHENSIVE CHAPTERS (SLIDES 0 TO 14):
   - Each slide represents an in-depth teaching section (~110-140 words of natural, wise, spoken-word narration).
   - Clear, low-level English (5th-7th grade readability) that answers real human questions.
2. 15-CHAPTER PROGRESSIVE STOIC BLUEPRINT:
   - Slide 0: Executive Hook & The Reality of Modern Mental Chaos
   - Slide 1: The Core Question - Why Do We Lose Our Peace?
   - Slide 2: The Dichotomy of Control (The Foundation)
   - Slide 3: Taming the Emotional Spike (The 10-Second Pause)
   - Slide 4: Overcoming the Fear of Other People's Opinions
   - Slide 5: Transforming Pain & Rejection into Raw Fuel (Amor Fati)
   - Slide 6: The Daily Contract - Discipline Over Fleeting Moods
   - Slide 7: Silence as Power - Disarming Disrespect Without Anger
   - Slide 8: The Solitude Protocol - Building Your Fortress in Private
   - Slide 9: Conquering Cheap Dopamine & Impulsive Desires
   - Slide 10: Keeping Promises to Yourself (Evidence-Based Self-Trust)
   - Slide 11: Real-Life Modern Scenario & Step-by-Step Resolution
   - Slide 12: Morning & Evening Mental Audits (The Daily Routine)
   - Slide 13: Memento Mori - Using Urgency to Eliminate Trivial Drama
   - Slide 14: The 30-Day Stoic Reset Blueprint & Outro (${resolvedOutro})
3. VISUALS: 16:9 widescreen 8k cinematic dark slate and warm amber lighting.

OUTPUT FORMAT: Return strictly valid JSON matching:
{
  "title": "Stoic Masterclass Title (No #Shorts)",
  "theme": "${archetype.theme}",
  "angle": "${archetype.angle}",
  "description": "Full 15-chapter masterclass on ${archetype.theme}.\\n\\n#Stoicism #Mindset #Discipline #MentalStrength",
  "tags": ["#Stoicism", "#Mindset", "#Discipline", "#MentalStrength", "#SelfControl"],
  "slides": [
    {
      "slideIndex": 0,
      "chapterTitle": "Introduction & The Modern Trap",
      "text": "Detailed 110-140 words spoken narration...",
      "visual": "16:9 widescreen 8k cinematic dark slate and warm amber lighting..."
    }
  ]
}`;

  const userPrompt = `Generate a 15-chapter 15-20 minute Stoic Masterclass documentary script on "${archetype.theme}". Angle: "${archetype.angle}". Avoid recent titles: [${recentTitles || 'None'}]. Return strictly valid JSON.`;

  return { systemPrompt, userPrompt };
}

/**
 * Deterministic Fallback for 15-Chapter Masterclass
 */
function synthesizeDeterministicDeepDiveStoryboard(archetype, topicTitle, channelHandle = '@thestoicarchitect-n4b') {
  const cleanHandle = channelHandle.startsWith('@') ? channelHandle : `@${channelHandle}`;
  const resolvedOutro = resolveStoicOutro(cleanHandle);
  const arch = archetype || STOIC_ARCHETYPES[0];
  const cleanTopic = (topicTitle && topicTitle.length > 5) ? topicTitle : arch.theme;

  const chapters = [
    { title: 'The Modern Mental Crisis', focus: 'Why 99% of people are overwhelmed by constant digital noise, emotional reactivity, and loss of sovereignty.' },
    { title: 'The Core Question: Why Do We Lose Our Peace?', focus: 'Examining the hidden belief that external situations owe us comfort, ease, and praise.' },
    { title: 'The Dichotomy of Control', focus: 'Drawing an absolute, impenetrable line between what is strictly up to us and what is completely outside our power.' },
    { title: 'The 10-Second Tactical Pause', focus: 'How to halt the fight-or-flight nervous response before speaking, emailing, or reacting under fire.' },
    { title: 'Freedom from Other People’s Opinions', focus: 'Recognizing the spotlight fallacy and realizing that other people’s praise or criticism has zero bearing on your true virtue.' },
    { title: 'Amor Fati: Loving Adversity as Fuel', focus: 'How to stop wishing for an easier life and treat every obstacle as the exact training ground you need.' },
    { title: 'The Daily Contract: Discipline Over Mood', focus: 'Why motivation is a weak, unreliable emotion, and why keeping private daily commitments builds real self-respect.' },
    { title: 'Strategic Silence: Disarming Disrespect', focus: 'Why reacting with fury surrenders your power, and why calm silence dismantles manipulative behavior.' },
    { title: 'The Solitude Fortress', focus: 'Learning to sit alone in a quiet room without needing digital dopamine or superficial social validation.' },
    { title: 'Conquering Impulsive Desires', focus: 'How delaying gratification for 24 hours rewires your dopamine baseline and restores mental clarity.' },
    { title: 'Evidence-Based Self-Trust', focus: 'Why real confidence is not positive affirmations, but a mountain of undeniable proof that you keep your word.' },
    { title: 'Real-Life Scenario Walkthrough', focus: 'A step-by-step breakdown of how a Stoic handles betrayal, economic hardship, or severe career setbacks.' },
    { title: 'Morning & Evening Mental Audits', focus: 'The exact two-minute journaling questions Marcus Aurelius and Seneca used to begin and end each day.' },
    { title: 'Memento Mori: The Ultimate Clarity', focus: 'Using the certainty of death to dissolve petty grievances, social anxiety, and foolish procrastination.' },
    { title: 'The 30-Day Stoic Reset Blueprint', focus: `Your complete daily implementation protocol. Rule your mind, conquer your desires, and ${resolvedOutro}` }
  ];

  return {
    title: `${cleanTopic} - Complete Stoic Masterclass Documentary`,
    theme: arch.theme,
    angle: arch.angle,
    description: `Full 15-Chapter Masterclass on ${arch.theme}.\n\nTimestamps:\n` +
      chapters.map((c, i) => `${String(Math.floor(i * 1.2)).padStart(2, '0')}:00 Chapter ${i + 1}: ${c.title}`).join('\n') +
      `\n\n#Stoicism #Mindset #Discipline #MentalStrength #Philosophy`,
    tags: ["#Stoicism", "#Mindset", "#Discipline", "#MentalStrength", "#Philosophy", "#SelfControl"],
    slides: chapters.map((c, idx) => ({
      slideIndex: idx,
      chapterTitle: c.title,
      text: `In this chapter of our masterclass on ${arch.theme}, we analyze ${c.title.toLowerCase()}. ${c.focus} When Marcus Aurelius and Epictetus taught these principles in ancient Rome, human nature was identical to today. You will face arrogant people, unexpected delays, and sudden loss. Your fortress is not built with stone walls, but with an unshakeable mind that refuses to surrender its peace to external events.`,
      visual: `16:9 widescreen 8k cinematic scene, atmospheric dark slate architecture with warm golden amber rim lighting, ultra-high resolution, documentary depth`
    }))
  };
}

module.exports = {
  STOIC_ARCHETYPES,
  ROTATING_STOIC_HOOK_TEMPLATES,
  ROTATING_STOIC_OUTROS,
  formatViralShortsTitle,
  resolveStoicOutro,
  selectStoicHookFormat,
  fetchRecentHistoryFromFirestore,
  isTopicSimilarToHistory,
  selectDailyDiverseSlots,
  buildStoicPromptForSlot,
  buildStoicDeepDivePrompt,
  synthesizeDeterministicStoryboard,
  synthesizeDeterministicDeepDiveStoryboard
};
