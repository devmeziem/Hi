/**
 * Stoic Content Diversity & History Cooldown Engine
 * Handles Firestore history synchronization, duplicate prevention, and multi-dimensional variation
 * (topic, angle, hook, story/example, visual concept, narrative structure, ending)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

let parsedFirebaseConfig = null;
try {
  if (process.env.FIREBASE_CONFIG_JSON) {
    parsedFirebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG_JSON);
  }
} catch {}

const FIRESTORE_PROJECT_ID = process.env.FIRESTORE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || parsedFirebaseConfig?.projectId || "";
const FIRESTORE_DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || parsedFirebaseConfig?.databaseId || "ai-studio-voxam-a00cf6de-bee8-48db-97c4-0c43daab8a7e";
const FIRESTORE_API_KEY = process.env.FIRESTORE_API_KEY || process.env.VITE_FIREBASE_API_KEY || parsedFirebaseConfig?.apiKey || "";

// Local cache fallback for resilience
const LOCAL_HISTORY_CACHE_FILE = path.join(process.cwd(), '.content_history_cache.json');

/**
 * 20 Distinct Modern Stoic & Mental Strength Content Archetypes
 * Grounded in Stoic psychology, focused 100% on modern daily challenges.
 */
const STOIC_ARCHETYPES = [
  {
    lessonId: 'discipline_contract',
    theme: 'Discipline Over Motivation',
    angle: 'Eliminating Mood-Based Action & The Non-Negotiable Contract',
    philosophicalPrinciple: 'Self-command over fleeting impulses — reason dictates action, not temporary emotional state.',
    narrativeStructure: 'The Motivation Trap -> The Identity Shift -> The Daily Non-Negotiable Protocol',
    hookPatterns: [
      "Motivation is an emotion. Discipline is a contract you signed with yourself when you were thinking clearly.",
      "If you only work when you feel inspired, you will be outworked by anyone who simply refuses to quit.",
      "The reason you fail to stay consistent isn't lack of willpower — it's waiting to feel ready."
    ],
    modernScenario: "Staring at your desk with zero motivation, overcoming the urge to scroll social media, and executing deep work regardless of mood.",
    visualStyle: 'Cinematic modern minimalist workspace at dawn, intense focused silhouette against high-contrast window light, moody 9:16 vertical 8k photorealistic',
    outroPattern: "Execute regardless of how you feel. Follow {{CHANNEL_HANDLE}} for daily mental strength."
  },
  {
    lessonId: 'disrespect_silence',
    theme: 'Dealing with Disrespect',
    angle: 'The Power of Total Calm & Emotional Immunity to Insults',
    philosophicalPrinciple: 'Dichotomy of Control — external disrespect is a reflection of the attacker\'s weakness, not your worth.',
    narrativeStructure: 'The Reaction Trap -> The Sovereign Pause -> Disarming Hostility with Stillness',
    hookPatterns: [
      "When someone disrespects you in public, your instinct is to attack. Here is why absolute silence destroys them.",
      "A rude comment only has power if you agree to let it hurt you. Stop giving away your energy.",
      "The most dangerous response to disrespect is not anger. It is complete, calm indifference."
    ],
    modernScenario: "Navigating a hostile coworker, passive-aggressive remarks in a meeting, or online trolls without raising your voice.",
    visualStyle: 'Calm composed professional standing tall and unshakable in a blurred high-contrast boardroom or busy city street, sharp cinematic focus, 9:16 vertical 8k',
    outroPattern: "Master your reaction, master your peace. Follow {{CHANNEL_HANDLE}} for mental fortitude."
  },
  {
    lessonId: 'failure_rebuild',
    theme: 'Rebuilding Yourself After Failure',
    angle: 'The Clean Slate Protocol & Turning Total Loss into Starting Capital',
    philosophicalPrinciple: 'Amor Fati — accepting reality as it is and using the rubble as the foundation for your next build.',
    narrativeStructure: 'Stripping the Ego -> The Objective Audit -> The Step-by-Step Rebuilding Blueprint',
    hookPatterns: [
      "Losing everything hurts. But hitting rock bottom gives you the firmest foundation to rebuild.",
      "Failure is not your identity; it is just feedback on a flawed strategy. Here is how to rebuild from zero.",
      "When your plans collapse, don't ask 'why me?' Ask 'what does this demand from me right now?'"
    ],
    modernScenario: "Experiencing a collapsed venture, financial wipeout, or career setback, and systematically rebuilding daily habits without victimhood.",
    visualStyle: 'Solitary figure standing on a rain-slicked modern high-rise terrace overlooking a twilight cityscape with steely resolve, 9:16 vertical 8k',
    outroPattern: "Rebuild stronger than what was broken. Follow {{CHANNEL_HANDLE}} for daily mental strength."
  },
  {
    lessonId: 'overthinking_action',
    theme: 'Silencing Overthinking & Anxiety',
    angle: 'The Present-Moment Audit & Breaking the Mental Spiral with Action',
    philosophicalPrinciple: 'Objective representation — grounding the mind in physical facts rather than catastrophic imaginary futures.',
    narrativeStructure: 'Diagnosing the Spiral -> Cognitive De-escalation -> Immediate Physical Execution',
    hookPatterns: [
      "Overthinking is your brain inventing emergencies that will never actually happen. Here is how to stop the loop.",
      "You cannot think your way out of anxiety. You can only act your way into clarity.",
      "Whenever your mind starts spiraling late at night, use this 10-second mental reset."
    ],
    modernScenario: "Lying awake at 2 AM catastrophizing tomorrow's challenges, breaking the loop with objective grounding and decisive daytime action.",
    visualStyle: 'Moody cinematic shot of hands writing clearly in a sleek notebook under a focused warm desk lamp in a dark room, 9:16 vertical 8k',
    outroPattern: "Silence the noise, master the moment. Follow {{CHANNEL_HANDLE}} for mental clarity."
  },
  {
    lessonId: 'unsupported_isolation',
    theme: 'Staying Focused When Nobody Supports You',
    angle: 'The Silent Grind & Drawing Validation Exclusively from Within',
    philosophicalPrinciple: 'The Inner Citadel — authentic self-worth requires no external cheering section or public validation.',
    narrativeStructure: 'The Hunger for Approval -> The Sovereign Shift -> Building Relentlessly in the Dark',
    hookPatterns: [
      "When nobody believes in your vision, that isn't a curse. It is the ultimate test of your self-reliance.",
      "Stop looking for a cheerleading squad. The most transformative chapters of your life will be written alone.",
      "Work in the dark until your results speak so loudly that you never have to announce yourself."
    ],
    modernScenario: "Building a difficult skill, business, or fitness regimen late at night while friends and family doubt or mock your ambition.",
    visualStyle: 'Single illuminated room in a massive dark modern skyscraper at night, a solitary dedicated figure working steadily, 9:16 vertical 8k',
    outroPattern: "Build in silence, let character speak. Follow {{CHANNEL_HANDLE}} for daily fortitude."
  },
  {
    lessonId: 'pressure_calm',
    theme: 'Staying Calm Under Pressure',
    angle: 'The Slow Heartbeat Protocol & Tactical Prioritization Amidst Chaos',
    philosophicalPrinciple: 'Ataraxia (untroubled mind) — detaching emotional distress from high-stakes operational execution.',
    narrativeStructure: 'The Crisis Spike -> Physiological Brake -> Tactical High-Leverage Execution',
    hookPatterns: [
      "When everything is on fire, panicking burns twice as much energy. Here is how to stay ice cold under pressure.",
      "The person who stays calmest in a crisis controls the entire room. Here is the mental framework.",
      "Pressure is not an enemy. It is a filter that separates the disciplined from the reactive."
    ],
    modernScenario: "Navigating emergency project deadlines, high-stakes negotiations, or unexpected crisis situations with complete composure.",
    visualStyle: 'High-intensity chaotic environment in soft background blur, with a centered, razor-sharp calm subject in perfect focus, 9:16 vertical 8k',
    outroPattern: "Stay cold, execute clean. Follow {{CHANNEL_HANDLE}} for mental strength."
  },
  {
    lessonId: 'rejection_filter',
    theme: 'Handling Rejection & Criticism',
    angle: 'The Competence Filter & Emotional Immunity to Outside Opinions',
    philosophicalPrinciple: 'Socratic detachment — extract useful signal from criticism, discard emotional noise with zero resentment.',
    narrativeStructure: 'The Sting of Rejection -> The Objective Data Filter -> Transmuting Rejection into Momentum',
    hookPatterns: [
      "Rejection is never a stop sign. It is simply redirection toward something you are actually built for.",
      "Never take criticism personally from someone you wouldn't ask for advice. Here is how to build mental immunity.",
      "How to become emotionally bulletproof when everyone is criticizing your work."
    ],
    modernScenario: "Receiving harsh pitch rejections, workplace criticism, or public dismissal, calmly extracting feedback data and advancing.",
    visualStyle: 'Modern professional standing composed in an open architectural plaza at dusk, focused and unmoved by passing crowds, 9:16 vertical 8k',
    outroPattern: "Let your results be your answer. Follow {{CHANNEL_HANDLE}} for mental toughness."
  },
  {
    lessonId: 'comparison_timeline',
    theme: 'Overcoming Comparison & Social Media Envy',
    angle: 'Your Own Timeline & Eliminating Status Anxiety',
    philosophicalPrinciple: 'Internal standard of excellence — measuring growth only against who you were yesterday, never another\'s highlight reel.',
    narrativeStructure: 'The Highlight Reel Illusion -> Reality Check -> Returning 100% Focus to Your Own Craft',
    hookPatterns: [
      "Comparing your behind-the-scenes to someone else's edited highlight reel is the fastest way to feel miserable.",
      "The moment you look to the left or right to see how fast others are running, you trip over your own feet.",
      "True confidence isn't walking into a room thinking you're better than everyone; it's walking in without needing to compare at all."
    ],
    modernScenario: "Scrolling through social media seeing peers flaunting sudden success, breaking the envy loop and refocusing on your daily craft.",
    visualStyle: 'Modern smartphone placed facedown on a clean slate desk as the user turns away to focus on deep focused work, 9:16 vertical 8k',
    outroPattern: "Run your own race. Follow {{CHANNEL_HANDLE}} for daily mindset mastery."
  },
  {
    lessonId: 'loneliness_solitude',
    theme: 'Loneliness vs The Power of Solitude',
    angle: 'The Transformation Chamber & Upgrading Yourself in Isolation',
    philosophicalPrinciple: 'The Sacred Sanctuary — converting empty isolation into deep self-knowledge, clarity, and unshakeable inner peace.',
    narrativeStructure: 'The Ache of Isolation -> Reframing Empty Hours -> The Daily Transformation Protocol',
    hookPatterns: [
      "Feeling lonely is a sign that you are looking outside for something only your own character can provide.",
      "Solitude is not emptiness; it is the laboratory where your strongest self is forged.",
      "Why high-performers intentionally embrace periods of isolation to change their entire life."
    ],
    modernScenario: "Spending weekends alone when others are partying, using the quiet hours for intense study, physical training, and building.",
    visualStyle: 'Serene silhouette in a minimalist loft apartment at blue hour overlooking a quiet morning sunrise, 9:16 vertical 8k',
    outroPattern: "Master your solitude. Follow {{CHANNEL_HANDLE}} for mental fortitude."
  },
  {
    lessonId: 'impulse_delay',
    theme: 'Self-Control & Resisting Impulses',
    angle: 'The 10-Minute Friction Rule & Conquering Cheap Dopamine',
    philosophicalPrinciple: 'Mastery of the Hegemonikon (ruling center) — training reason to triumph over animalistic cravings.',
    narrativeStructure: 'The Urge Surge -> The Cooling Interval -> The Sovereign Decision',
    hookPatterns: [
      "Every time you give in to a cheap impulse, you train your brain that your willpower cannot be trusted.",
      "The 10-Minute Rule: How to kill cravings, doom-scrolling, and impulse spending before they start.",
      "Self-control is not about deprivation; it is the ultimate expression of personal freedom."
    ],
    modernScenario: "Defeating late-night screen addiction, impulsive spending, or junk food cravings by inserting strategic friction.",
    visualStyle: 'Minimalist analog timer counting down on a modern dark wood desk beside a closed laptop, 9:16 vertical 8k photorealistic',
    outroPattern: "Rule your impulses or they will rule you. Follow {{CHANNEL_HANDLE}} for self-mastery."
  },
  {
    lessonId: 'delayed_gratification',
    theme: 'Delayed Gratification & The Long Game',
    angle: 'Boring Consistency & The 1,000-Day Compounding Law',
    philosophicalPrinciple: 'Natural law of compounding — immense achievements are the uncelebrated accumulation of unremarkable daily choices.',
    narrativeStructure: 'The Instant Fix Illusion -> The Boring Middle -> The Unstoppable Compound Curve',
    hookPatterns: [
      "In a world addicted to instant gratification, the person willing to work for 3 years without applause will dominate.",
      "Stop looking for the magic shortcut. The real shortcut is doing the unglamorous work every single day without bragging.",
      "Why 99% of people quit right before their daily efforts begin compounding."
    ],
    modernScenario: "Showing up to training, coding, or building daily for months with zero immediate feedback, trusting the compound curve.",
    visualStyle: 'Solid granite block being polished to mirror sheen under dramatic studio lighting, 9:16 vertical 8k',
    outroPattern: "Play the long game. Follow {{CHANNEL_HANDLE}} for daily mental strength."
  },
  {
    lessonId: 'difficult_people_boundaries',
    theme: 'Dealing with Difficult & Toxic People',
    angle: 'The Emotional Mirror & Establishing Unshakable Personal Boundaries',
    philosophicalPrinciple: 'Acceptance of human nature — anticipating flawed behavior without allowing toxic energy to penetrate your inner sanctuary.',
    narrativeStructure: 'The Expectation Trap -> The Armor of Realism -> Non-Reactive Boundary Setting',
    hookPatterns: [
      "You cannot control toxic people, but you can control how easily they get access to your mental energy.",
      "When dealing with difficult people, remember: their chaos is their problem, not your assignment to fix.",
      "How to set ruthless boundaries with energy-draining people without starting a fight."
    ],
    modernScenario: "Handling manipulative colleagues, chronic complainers, or boundary-pushing individuals with calm, firm boundaries.",
    visualStyle: 'Aesthetic glass partition in modern architectural interior reflecting clean light, symbolizing clear boundaries, 9:16 vertical 8k',
    outroPattern: "Protect your energy. Rule your mind. Follow {{CHANNEL_HANDLE}}."
  },
  {
    lessonId: 'control_energy_ledger',
    theme: 'Letting Go of What You Cannot Control',
    angle: 'The Energy Ledger & Radical Surrender to the Unchangeable',
    philosophicalPrinciple: 'The Fundamental Dichotomy of Control — dividing all life into what is up to us and what is not.',
    narrativeStructure: 'The Friction of Resistance -> The Two-Column Audit -> Pouring 100% Effort into What Remains',
    hookPatterns: [
      "90% of your stress comes from trying to control things that were never yours to manage.",
      "The moment you stop fighting reality and focus entirely on your next move, your anxiety disappears.",
      "Here is a 30-second mental audit to instantly eliminate worry over things you cannot change."
    ],
    modernScenario: "Handling sudden economic shifts, travel disruptions, or external cancellations by shifting instantly to your next controllable move.",
    visualStyle: 'Open hand releasing autumn leaves in wind, juxtaposed with intense focused eyes locked onto the forward horizon, 9:16 vertical 8k',
    outroPattern: "Control what is yours. Release the rest. Follow {{CHANNEL_HANDLE}} for mental clarity."
  },
  {
    lessonId: 'confidence_self_trust',
    theme: 'Unshakable Confidence & Self-Trust',
    angle: 'Evidence-Based Self-Trust & Keeping Promises to Yourself',
    philosophicalPrinciple: 'Virtue and integrity — confidence is the natural byproduct of private alignment between word and action.',
    narrativeStructure: 'The Fake Confidence Trap -> The Self-Betrayal Cycle -> Building Undeniable Proof of Competence',
    hookPatterns: [
      "Real confidence is not loud bravado. It is the quiet knowing that you always keep the promises you make to yourself.",
      "You don't need mirror affirmations. You need a stack of undeniable proof that you do what you say.",
      "How to stop seeking permission from others and start trusting your own judgment."
    ],
    modernScenario: "Entering high-stakes meetings or making bold career decisions with quiet, grounded self-assurance.",
    visualStyle: 'Confident modern professional walking with purpose down a sleek architectural corridor in dramatic natural light, 9:16 vertical 8k',
    outroPattern: "Build evidence, build trust. Follow {{CHANNEL_HANDLE}} for mental strength."
  },
  {
    lessonId: 'depleted_micro_momentum',
    theme: 'Motivation When You Feel Completely Depleted',
    angle: 'The Micro-Momentum Protocol & Lowering the Friction Barrier',
    philosophicalPrinciple: 'Action precedes emotion — initiating physical momentum with the smallest meaningful action.',
    narrativeStructure: 'The Paralysis of Exhaustion -> The 2-Minute Gateway -> Reigniting the Internal Fire',
    hookPatterns: [
      "When you have zero energy and feel completely burned out, do not try to climb the mountain. Just tie your shoes.",
      "How to trick your exhausted brain into starting when everything inside you wants to quit.",
      "Momentum does not follow motivation. Motivation follows action."
    ],
    modernScenario: "Returning home exhausted from a demanding day and finding the focus to complete a key 20-minute study or training session.",
    visualStyle: 'Small spark catching in dry kindling, blooming into a steady warm flame against deep dark slate, 9:16 vertical 8k',
    outroPattern: "Start small, finish unstoppable. Follow {{CHANNEL_HANDLE}} for daily motivation."
  },
  {
    lessonId: 'mental_hardening',
    theme: 'Mental Hardening & Anti-Fragility',
    angle: 'Voluntary Discomfort & Building Psychological Armor',
    philosophicalPrinciple: 'Voluntary hardship — intentionally facing difficulty so that unexpected adversity cannot shatter you.',
    narrativeStructure: 'The Softness Trap -> The Voluntary Challenge -> Becoming Indestructible',
    hookPatterns: [
      "Comfort is a slow poison. If you never deliberately challenge yourself, the smallest inconvenience will break you.",
      "Do one hard thing every single day that makes you uncomfortable. That is how you build mental armor.",
      "Stop wishing for an easier life. Train yourself to be a stronger person."
    ],
    modernScenario: "Tackling cold morning workouts, difficult direct conversations, or the hardest task first thing in the morning.",
    visualStyle: 'Athlete in pre-dawn fog breathing steady vapor, eyes locked forward with steely determination, 9:16 vertical 8k',
    outroPattern: "Embrace the challenge, build the armor. Follow {{CHANNEL_HANDLE}} for fortitude."
  },
  {
    lessonId: 'reaction_tactical_pause',
    theme: 'Controlling Your Reactions Under Fire',
    angle: 'The 5-Second Tactical Pause & Owning the Space Between Stimulus and Response',
    philosophicalPrinciple: 'Sovereignty of judgment — external events are neutral until your interpretation gives them positive or negative meaning.',
    narrativeStructure: 'The Reflex Spike -> The Tactical Pause -> The Calculated Response',
    hookPatterns: [
      "Between what happens to you and how you react, there is a 5-second gap. That gap is where your power lives.",
      "When you react instantly, you hand your steering wheel to whoever provoked you.",
      "How to train your nervous system to stay completely calm when triggered."
    ],
    modernScenario: "Receiving an infuriating email or provocative remark, responding with calm calculated logic instead of an emotional rant.",
    visualStyle: 'Water droplet falling into a calm glassy pool, creating a single pristine concentric ripple in golden twilight, 9:16 vertical 8k',
    outroPattern: "Master the pause, own the outcome. Follow {{CHANNEL_HANDLE}} for emotional mastery."
  },
  {
    lessonId: 'judgment_spotlight_fallacy',
    theme: 'Overcoming Fear of Judgment',
    angle: 'The Spotlight Fallacy & Freedom from the Imaginary Audience',
    philosophicalPrinciple: 'Freedom from vanity — recognizing that people are consumed with their own anxieties, liberating you to act boldly.',
    narrativeStructure: 'The Paralyzing Fear -> The Reality Check -> Stepping Forward Boldly',
    hookPatterns: [
      "Nobody is thinking about you as much as you think they are. Everyone is too busy worrying about themselves.",
      "The moment you stop living for the approval of people who don't even know you is the day your real life begins.",
      "How to speak up, share your work, and take risks without fear of looking foolish."
    ],
    modernScenario: "Publishing a bold creative project, speaking up in a large meeting, or changing paths despite fear of judgment.",
    visualStyle: 'Figure stepping out from dark shadows into a clean focused beam of warm studio light, 9:16 vertical 8k',
    outroPattern: "Step into the light. Follow {{CHANNEL_HANDLE}} for mental strength."
  },
  {
    lessonId: 'mental_toughness',
    theme: 'Becoming Mentally Stronger in Hard Times',
    angle: 'The Crucible Principle & Forging Character Through Struggle',
    philosophicalPrinciple: 'The Obstacle is the Way — adversity is not in the way of your growth; it is the raw material of your growth.',
    narrativeStructure: 'The Heavy Burden -> The Perspective Reframe -> Rising Above the Storm',
    hookPatterns: [
      "Smooth seas never made a skilled sailor. The hardships you are facing right now are forging your greatest strength.",
      "You are not being buried by your problems; you are being planted. Here is how to grow through the dark.",
      "When life tests your limits, remember: you are far stronger than your comfort zone let you believe."
    ],
    modernScenario: "Carrying heavy life responsibilities, working through intense fatigue, and maintaining character and honor under stress.",
    visualStyle: 'Immovable ancient lighthouse standing firm against towering crashing storm waves at dusk, 9:16 vertical 8k',
    outroPattern: "Stand firm through the storm. Follow {{CHANNEL_HANDLE}} for daily strength."
  },
  {
    lessonId: 'deep_focus_distractions',
    theme: 'Unbreakable Focus in a Distracted World',
    angle: 'Attention Sovereignty & Building an Impenetrable Mental Fortress',
    philosophicalPrinciple: 'Guardianship of attention — your focus is your life; letting trivial distractions steal it is self-sabotage.',
    narrativeStructure: 'The Distraction Economy -> The Attention Audit -> The Fortress of Deep Work',
    hookPatterns: [
      "If you cannot control your attention for 60 minutes, you are not free — you are a product.",
      "In an era of endless digital noise, the ability to focus deeply on one thing is a superpower.",
      "How to build a mental fortress that makes you completely immune to digital distractions."
    ],
    modernScenario: "Locking into 2 hours of uninterrupted deep work with phone on airplane mode, outproducing an entire distracted department.",
    visualStyle: 'Laser beam cutting with micron precision through dark obsidian glass, atmospheric smoke and blue rim light, 9:16 vertical 8k',
    outroPattern: "Own your focus, own your life. Follow {{CHANNEL_HANDLE}} for mental clarity."
  }
];

/**
 * Extract semantic lesson identifier from topic / hook text
 */
function classifyLessonIntent(text) {
  if (!text) return 'general_stoic';
  const lower = text.toLowerCase();

  if (lower.includes('disrespect') || lower.includes('insult') || lower.includes('rude') || lower.includes('mock') || lower.includes('silence')) return 'disrespect_silence';
  if (lower.includes('fail') || lower.includes('rebuild') || lower.includes('rock bottom') || lower.includes('collapse') || lower.includes('loss')) return 'failure_rebuild';
  if (lower.includes('overthink') || lower.includes('anxiety') || lower.includes('spiral') || lower.includes('worry') || lower.includes('night')) return 'overthinking_action';
  if (lower.includes('alone') || lower.includes('nobody support') || lower.includes('solitude') || lower.includes('lonel') || lower.includes('dark')) return 'unsupported_isolation';
  if (lower.includes('pressure') || lower.includes('panic') || lower.includes('crisis') || lower.includes('calm under') || lower.includes('ice cold')) return 'pressure_calm';
  if (lower.includes('reject') || lower.includes('critic') || lower.includes('hate') || lower.includes('opinion')) return 'rejection_filter';
  if (lower.includes('compar') || lower.includes('envy') || lower.includes('jealous') || lower.includes('social media') || lower.includes('highlight reel')) return 'comparison_timeline';
  if (lower.includes('impulse') || lower.includes('craving') || lower.includes('dopamine') || lower.includes('scroll') || lower.includes('willpower') || lower.includes('self-control')) return 'impulse_delay';
  if (lower.includes('delayed') || lower.includes('gratification') || lower.includes('long game') || lower.includes('shortcut') || lower.includes('compound')) return 'delayed_gratification';
  if (lower.includes('difficult people') || lower.includes('toxic') || lower.includes('drain') || lower.includes('boundary') || lower.includes('boundaries')) return 'difficult_people_boundaries';
  if (lower.includes('control') || lower.includes('let go') || lower.includes('cannot change') || lower.includes('release') || lower.includes('surrender')) return 'control_energy_ledger';
  if (lower.includes('confiden') || lower.includes('self-trust') || lower.includes('self-respect') || lower.includes('promise')) return 'confidence_self_trust';
  if (lower.includes('depleted') || lower.includes('burnout') || lower.includes('exhaust') || lower.includes('tired') || lower.includes('micro-momentum') || lower.includes('start small')) return 'depleted_micro_momentum';
  if (lower.includes('comfort') || lower.includes('hard thing') || lower.includes('armor') || lower.includes('uncomfortable') || lower.includes('hardening')) return 'mental_hardening';
  if (lower.includes('reaction') || lower.includes('pause') || lower.includes('trigger') || lower.includes('5-second') || lower.includes('respond')) return 'reaction_tactical_pause';
  if (lower.includes('judgment') || lower.includes('spotlight') || lower.includes('approval') || lower.includes('foolish') || lower.includes('embarrass')) return 'judgment_spotlight_fallacy';
  if (lower.includes('tough') || lower.includes('storm') || lower.includes('sailor') || lower.includes('adversity') || lower.includes('hard times')) return 'mental_toughness';
  if (lower.includes('focus') || lower.includes('distract') || lower.includes('attention') || lower.includes('deep work')) return 'deep_focus_distractions';
  if (lower.includes('discipline') || lower.includes('lazy') || lower.includes('habit') || lower.includes('contract') || lower.includes('consistent')) return 'discipline_contract';

  return 'general_stoic';
}

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
 * Enforces both semantic lesson intent matching and lexical word overlap.
 */
function isTopicSimilarToHistory(candidateTopic, candidateTheme, recentHistory, threshold = 0.55) {
  if (!candidateTopic) return true;
  const normCandidate = candidateTopic.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
  const candidateLesson = classifyLessonIntent(candidateTopic + ' ' + (candidateTheme || ''));

  // Stop words to ignore during lexical comparison
  const stopWords = new Set(['how', 'the', 'what', 'when', 'with', 'your', 'from', 'this', 'that', 'they', 'will', 'stop', 'rule', 'laws', 'life', 'mind', 'power', 'secret', 'stoic', 'daily', 'people', 'every', 'real', 'make', 'give', 'step', 'take', 'time']);

  const wordsCandidate = new Set(
    normCandidate.split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.has(w))
  );

  // Check the most recent 10 history items for duplicate underlying lessons
  const recentWindow = recentHistory.slice(0, 10);

  for (const h of recentWindow) {
    const prevTopic = (h.topic || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
    if (normCandidate === prevTopic) return true;

    // 1. Semantic Lesson Intent Match (Cooldown on identical underlying lesson)
    const prevLesson = classifyLessonIntent((h.topic || '') + ' ' + (h.theme || ''));
    if (candidateLesson !== 'general_stoic' && candidateLesson === prevLesson) {
      return true; // Cooldown: Same underlying lesson was used recently!
    }

    // 2. Lexical word overlap
    const wordsPrev = prevTopic.split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
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
 * Select a balanced, diverse set of distinct archetypes for daily batch generation
 * taking into account recent Firestore history to avoid cooldown violations.
 */
function selectDailyDiverseSlots(recentHistory, slotCount = 4) {
  const recentThemes = new Set(recentHistory.slice(0, 12).map(h => (h.theme || '').toLowerCase()));
  const recentAngles = new Set(recentHistory.slice(0, 12).map(h => (h.angle || '').toLowerCase()));
  const recentLessons = new Set(recentHistory.slice(0, 10).map(h => classifyLessonIntent((h.topic || '') + ' ' + (h.theme || ''))));

  // Prioritize archetypes whose themes, angles, and lesson IDs have NOT been used recently
  const scoredArchetypes = STOIC_ARCHETYPES.map((arch, index) => {
    let score = 100;
    if (recentLessons.has(arch.lessonId)) score -= 70;
    if (recentThemes.has(arch.theme.toLowerCase())) score -= 40;
    if (recentAngles.has(arch.angle.toLowerCase())) score -= 30;
    // Add minor entropy to break ties across runs
    score += (index * 13 + Date.now()) % 19;
    return { arch, score };
  });

  scoredArchetypes.sort((a, b) => b.score - a.score);

  const chosen = [];
  const pickedThemes = new Set();
  const pickedLessons = new Set();

  for (const item of scoredArchetypes) {
    if (chosen.length >= slotCount) break;
    if (!pickedThemes.has(item.arch.theme) && !pickedLessons.has(item.arch.lessonId)) {
      chosen.push(item.arch);
      pickedThemes.add(item.arch.theme);
      pickedLessons.add(item.arch.lessonId);
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
 * Resolve dynamic channel handle in outro patterns
 */
function resolveOutroPattern(pattern, channelHandle = '@thestoicarchitect-n4b') {
  const cleanHandle = channelHandle.startsWith('@') ? channelHandle : `@${channelHandle}`;
  return (pattern || '').replace(/\{\{CHANNEL_HANDLE\}\}/g, cleanHandle).replace(/@TheStoicArchitect\b/gi, cleanHandle);
}

/**
 * Build rich system and user prompts for multi-model AI generators that enforce
 * MODERN STOICISM + MOTIVATION + MENTAL STRENGTH (no historical biographies / quotes lists).
 */
function buildStoicPromptForSlot(slotArchetype, recentHistory, slotIndex = 0, channelHandle = '@thestoicarchitect-n4b') {
  const recentTitles = (recentHistory || []).slice(0, 12).map(h => `"${h.topic}"`).join(', ');
  const cleanHandle = channelHandle.startsWith('@') ? channelHandle : `@${channelHandle}`;
  const resolvedOutro = resolveOutroPattern(slotArchetype.outroPattern, cleanHandle);

  const systemPrompt = `You are the lead content creator and YouTube Shorts director for the Modern Stoicism & Mental Strength channel (${cleanHandle}).
CHANNEL FOCUS: MODERN STOICISM + MOTIVATION + MENTAL STRENGTH.
TARGET AUDIENCE: Modern ambitious individuals, creators, professionals, and students dealing with daily pressure, rejection, burnout, self-doubt, disrespect, and distractions.

CRITICAL CONTENT & VISUAL HARMONY DIRECTIVES:
1. FOCUS ON REAL MODERN LIFE:
   - Do NOT make the video mainly about Stoic philosophers, their biographies, or lists of ancient quotes.
   - Stoic philosophy is strictly the psychological foundation (dichotomy of control, emotional sovereignty, voluntary discomfort, amor fati).
   - The topic, hook, and slides MUST focus on real modern problems (discipline, self-control, rejection, failure, pressure, disrespect, overthinking, comparison, loneliness, difficult people).
   - Deliver practical, empowering modern takeaways that viewers can apply immediately today.

2. VISUAL HARMONY & UNIFIED COLOR RANGE (MANDATORY):
   - ALL 6 SLIDES MUST SHARE THE EXACT SAME VISUAL AESTHETIC, COLOR PALETTE, AND LIGHTING TONE.
   - Core Visual DNA: ${slotArchetype.visualStyle}
   - Unified Color Range: High-contrast monochromatic slate and deep obsidian charcoal, warm amber/tungsten rim accents, dramatic chiaroscuro shadows, 35mm cinematic anamorphic lens, 9:16 vertical 8k photorealistic.
   - Do NOT jump between random unrelated styles or stock images. Each slide must feel like an organic shot in the SAME cinematic film focused entirely on ${slotArchetype.theme}.

3. SPECIFIC ASSIGNED THEMATIC ANGLE FOR THIS VIDEO:
   - Theme: ${slotArchetype.theme}
   - Angle: ${slotArchetype.angle}
   - Core Stoic Principle Foundation: ${slotArchetype.philosophicalPrinciple}
   - Narrative Progression: ${slotArchetype.narrativeStructure}
   - Modern Scenario: ${slotArchetype.modernScenario}
   - Visual Style Aesthetic: ${slotArchetype.visualStyle}
   - Ending Outro: ${resolvedOutro}

4. ANTI-DUPLICATION MANDATE:
   - Recently covered topics to avoid duplicating: [${recentTitles || 'None'}]
   - Do NOT produce a topic with the same underlying lesson even if worded differently.
   - Every sentence must be punchy, clear, grammatically sound, and deliver strong emotional/mental resonance.
   - Strictly 6 slides formatted in valid JSON.

MANDATORY 6-SLIDE JSON OUTPUT SCHEMA:
{
  "title": "Punchy, High-CTR Modern Stoic Title (e.g. 'Why Silence Destroys Disrespect' or 'The 10-Minute Rule for Self-Control') #Shorts",
  "theme": "${slotArchetype.theme}",
  "angle": "${slotArchetype.angle}",
  "hook": "${slotArchetype.hookPatterns[slotIndex % slotArchetype.hookPatterns.length]}",
  "description": "Powerful modern breakdown of ${slotArchetype.theme} and mental strength.\\n\\n#Shorts #Discipline #Motivation #MentalStrength #SelfControl #Mindset #Stoicism #PersonalGrowth #Confidence",
  "tags": ["#Shorts", "#Discipline", "#Motivation", "#MentalStrength", "#SelfControl", "#Stoicism", "#Mindset", "#PersonalGrowth"],
  "slides": [
    {
      "slideIndex": 0,
      "text": "Opening hook addressing the modern pain point (12-16 words)...",
      "visual": "Cinematic 9:16 vertical 8k shot adhering to ${slotArchetype.visualStyle} in unified slate & amber chiaroscuro palette..."
    },
    {
      "slideIndex": 1,
      "text": "The psychological trap or common mistake people make (12-15 words)...",
      "visual": "Detailed 9:16 vertical prompt matching the exact same scene style, lighting, and slate/amber color palette for scene 2..."
    },
    {
      "slideIndex": 2,
      "text": "The core Stoic mental shift applied to modern life (12-15 words)...",
      "visual": "Detailed 9:16 vertical prompt matching the exact same scene style, lighting, and slate/amber color palette for scene 3..."
    },
    {
      "slideIndex": 3,
      "text": "The practical tactical protocol to handle this situation (12-15 words)...",
      "visual": "Detailed 9:16 vertical prompt matching the exact same scene style, lighting, and slate/amber color palette for scene 4..."
    },
    {
      "slideIndex": 4,
      "text": "The deeper mindset of sovereignty and mental toughness (12-15 words)...",
      "visual": "Detailed 9:16 vertical prompt matching the exact same scene style, lighting, and slate/amber color palette for scene 5..."
    },
    {
      "slideIndex": 5,
      "text": "Final punchy rule + '${resolvedOutro}' (12-15 words)...",
      "visual": "Detailed 9:16 vertical prompt matching the exact same scene style, lighting, and slate/amber color palette for scene 6 with cinematic resolution..."
    }
  ]
}`;

  const userPrompt = `Generate a brand new, highly original Modern Stoic & Mental Strength Short storyboard for Slot ${slotIndex + 1} of 4.
Theme: "${slotArchetype.theme}". Angle: "${slotArchetype.angle}". Modern Scenario: "${slotArchetype.modernScenario}".
Ensure the content is practical, modern, and psychologically powerful with zero historical biography fluff. Output strictly valid JSON matching the schema.`;

  return { systemPrompt, userPrompt };
}

/**
 * High-quality deterministic fallback storyboard generator when external LLMs are unreachable or rate-limited
 */
function synthesizeDeterministicStoryboard(slotArchetype, topicTitle, channelHandle = '@thestoicarchitect-n4b') {
  const resolvedOutro = resolveOutroPattern(slotArchetype.outroPattern, channelHandle);
  const hook = slotArchetype.hookPatterns[0] || "When life tests your character, your reaction is the only thing you truly own.";
  const title = (topicTitle && topicTitle.length > 5) ? topicTitle : `${slotArchetype.theme} - The Stoic Rule for Mental Strength #Shorts`;

  return {
    title: title,
    theme: slotArchetype.theme,
    angle: slotArchetype.angle,
    hook: hook,
    description: `Master modern mental strength and resilience.\n\n#Shorts #Discipline #Motivation #MentalStrength #SelfControl #Mindset #Stoicism #PersonalGrowth #Confidence`,
    tags: ["#Shorts", "#Discipline", "#Motivation", "#MentalStrength", "#SelfControl", "#Stoicism", "#Mindset", "#PersonalGrowth"],
    slides: [
      {
        slideIndex: 0,
        text: hook,
        visual: `Cinematic vertical 9:16 shot, ${slotArchetype.visualStyle}, atmospheric cinematic lighting, dark slate and amber color tone, 8k resolution`
      },
      {
        slideIndex: 1,
        text: `Most people react with anger or panic, giving away their power to external chaos.`,
        visual: `Cinematic vertical 9:16 shot matching ${slotArchetype.visualStyle}, close angle, rich slate gray shadows with warm amber rim light, 8k resolution`
      },
      {
        slideIndex: 2,
        text: `The Stoic truth is simple: you cannot control outside events, only your internal discipline.`,
        visual: `Cinematic vertical 9:16 shot matching ${slotArchetype.visualStyle}, solitary contemplative figure in sharp focus, slate stone texture and golden highlights, 8k`
      },
      {
        slideIndex: 3,
        text: `When adversity strikes, pause for ten seconds and let logic lead before emotion speaks.`,
        visual: `Cinematic vertical 9:16 shot matching ${slotArchetype.visualStyle}, intense focused perspective, atmospheric depth, cinematic slate and golden amber tones, 8k`
      },
      {
        slideIndex: 4,
        text: `Your mental peace is your fortress; never surrender it to opinions or temporary setbacks.`,
        visual: `Cinematic vertical 9:16 shot matching ${slotArchetype.visualStyle}, powerful solid architectural composition, deep slate and warm amber illumination, 8k`
      },
      {
        slideIndex: 5,
        text: `Control your mind, own your destiny. ${resolvedOutro}`,
        visual: `Cinematic vertical 9:16 shot matching ${slotArchetype.visualStyle}, dramatic sunrise lighting breaking through dark slate clouds, golden rays, 8k resolution`
      }
    ]
  };
}

module.exports = {
  STOIC_ARCHETYPES,
  classifyLessonIntent,
  fetchRecentHistoryFromFirestore,
  saveContentHistoryToFirestore,
  isTopicSimilarToHistory,
  selectDailyDiverseSlots,
  resolveOutroPattern,
  buildStoicPromptForSlot,
  synthesizeDeterministicStoryboard
};
