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
    outroPattern: "Execute regardless of how you feel. Follow this channel for daily mental strength."
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
    modernScenario: "Navigating a rude comment, a dismissive person, or online negativity without raising your voice or losing your cool.",
    visualStyle: 'Calm composed person standing tall and unshakable in a quiet morning city street, sharp cinematic focus, 9:16 vertical 8k',
    outroPattern: "Master your reaction, master your peace. Follow this channel for mental fortitude."
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
    outroPattern: "Rebuild stronger than what was broken. Follow this channel for daily mental strength."
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
    outroPattern: "Silence the noise, master the moment. Follow this channel for mental clarity."
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
    outroPattern: "Build in silence, let character speak. Follow this channel for daily fortitude."
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
    outroPattern: "Stay cold, execute clean. Follow this channel for mental strength."
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
    outroPattern: "Let your results be your answer. Follow this channel for mental toughness."
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
    outroPattern: "Run your own race. Follow this channel for daily mindset mastery."
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
    outroPattern: "Master your solitude. Follow this channel for mental fortitude."
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
    outroPattern: "Rule your impulses or they will rule you. Follow this channel for self-mastery."
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
    outroPattern: "Play the long game. Follow this channel for daily mental strength."
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
    outroPattern: "Protect your energy. Rule your mind. Follow this channel for strength."
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
    outroPattern: "Control what is yours. Release the rest. Follow this channel for mental clarity."
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
    modernScenario: "Facing challenging daily decisions, social pressure, or unpredictable situations with quiet, grounded self-assurance.",
    visualStyle: 'Confident person walking with purpose down a modern sunlit pathway in dramatic natural light, 9:16 vertical 8k',
    outroPattern: "Build evidence, build trust. Follow this channel for mental strength."
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
    outroPattern: "Start small, finish unstoppable. Follow this channel for daily motivation."
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
    outroPattern: "Embrace the challenge, build the armor. Follow this channel for fortitude."
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
    outroPattern: "Master the pause, own the outcome. Follow this channel for emotional mastery."
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
    outroPattern: "Step into the light. Follow this channel for mental strength."
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
    outroPattern: "Stand firm through the storm. Follow this channel for daily strength."
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
    outroPattern: "Own your focus, own your life. Follow this channel for mental clarity."
  },
  {
    lessonId: 'qa_mental_exhaustion',
    theme: 'Why Are You Always Mentally Exhausted?',
    angle: 'Question & Simple Answer: Why You Feel Tired Without Physical Work & 3 Easy Steps to Fix It',
    philosophicalPrinciple: 'Mental conservation — unnecessary cognitive friction and rumination deplete energy faster than physical labor.',
    narrativeStructure: 'Burning Question -> Surprising Plain Reason -> 3 Simple Daily Steps -> Clear Takeaway',
    hookPatterns: [
      "Why do you feel completely drained even when you did not do heavy physical work today?",
      "Have you ever wondered why your brain feels exhausted by 2 PM? Here is the simple reason.",
      "Why does doing nothing all day sometimes make you feel more tired than working hard?"
    ],
    modernScenario: "Feeling overwhelmed by mental fatigue from phone notifications and racing thoughts, resetting energy with 3 simple habits.",
    visualStyle: 'Calm reflective figure placing smartphone facedown on clean wooden desk beside an open notebook in soft morning window light, 9:16 vertical 8k',
    outroPattern: "Protect your mental energy. Follow this channel for daily clarity."
  },
  {
    lessonId: 'qa_silence_rude_people',
    theme: 'Why Does Silence Defeat Rude People?',
    angle: 'Question & Simple Answer: Why Quiet Silence Destroys Disrespect Faster Than Shouting',
    philosophicalPrinciple: 'Sovereign stillness — refusing to feed another person\'s anger leaves their malice stranded in public embarrassment.',
    narrativeStructure: 'Relatable Question -> The Psychology of Disrespect -> The Power of Calm Silence -> The Sovereign Takeaway',
    hookPatterns: [
      "Why does keeping quiet hurt a rude person far more than shouting back at them?",
      "When someone insults you in public, why is complete silence your most dangerous weapon?",
      "Ever notice why calm people always win arguments against angry people?"
    ],
    modernScenario: "Facing an aggressive remark from a coworker or stranger and responding with calm, unbothered stillness that disarms the room.",
    visualStyle: 'Unshakable composed individual with calm steady gaze in an atmospheric boardroom with moody warm side lighting, 9:16 vertical 8k',
    outroPattern: "Master your reaction, own your peace. Follow this channel for mental strength."
  },
  {
    lessonId: 'qa_stop_caring_opinions',
    theme: 'How to Stop Caring What People Think?',
    angle: 'Question & Simple Answer: The 10-Second Truth That Frees You From Other People\'s Opinions',
    philosophicalPrinciple: 'Freedom from social validation — recognizing that other people\'s judgments are fleeting and irrelevant to your real worth.',
    narrativeStructure: 'Core Question -> The 10-Second Truth -> Everyday Low-Language Reality Check -> Inner Freedom Protocol',
    hookPatterns: [
      "How do you stop caring what people say about you behind your back?",
      "Why do we spend so much time worrying about the opinions of people we do not even respect?",
      "Want to know how to stop feeling embarrassed in front of strangers in 10 seconds?"
    ],
    modernScenario: "Overcoming social anxiety and self-consciousness when starting a new venture or speaking in public.",
    visualStyle: 'Confident figure walking calmly through a blurred busy modern street at golden hour, sharp depth of field, 9:16 vertical 8k',
    outroPattern: "Live for your character, not their applause. Follow this channel for daily fortitude."
  },
  {
    lessonId: 'qa_why_we_overthink',
    theme: 'Why Do You Overthink Everything at Night?',
    angle: 'Question & Simple Answer: Why Your Brain Invents Fake Problems & The Simple Fix',
    philosophicalPrinciple: 'Grounding in present reality — replacing catastrophic imagination with tangible physical action.',
    narrativeStructure: 'Late-Night Question -> The Brain Alarm Trap -> The 2-Minute Physical Reset -> Mental Calm',
    hookPatterns: [
      "Why do you stay awake at night worrying about things that never actually happen?",
      "Why does your brain make small problems look ten times bigger right before you fall asleep?",
      "How can you turn off racing thoughts when you are trying to sleep?"
    ],
    modernScenario: "Lying awake staring at the ceiling catastrophizing tomorrow, using a simple 2-minute paper dump to sleep peacefully.",
    visualStyle: 'Dark moody minimalist bedroom with warm bedside lamp, hand closing a notebook in peaceful relief, 9:16 vertical 8k',
    outroPattern: "Silence the noise and master your mind. Follow this channel for mental strength."
  },
  {
    lessonId: 'qa_start_small_habits',
    theme: 'Why Do You Quit Good Habits So Fast?',
    angle: 'Question & Simple Answer: The 2-Minute Habit Rule That Beats Laziness Every Single Day',
    philosophicalPrinciple: 'Micro-consistency over macro-delusion — small daily actions compound into unshakeable life transformations.',
    narrativeStructure: 'Relatable Question -> The Motivation Myth -> The 2-Minute Rule in Simple English -> Unstoppable Growth',
    hookPatterns: [
      "Why do you start new habits with huge excitement and quit just 3 days later?",
      "Why is it so hard to stay consistent with exercise or reading, and how do you fix it today?",
      "How can doing just 2 minutes of work a day change your entire life?"
    ],
    modernScenario: "Breaking out of the cycle of starting and quitting fitness or study routines by using ultra-simple 2-minute daily minimums.",
    visualStyle: 'Clean modern desk with single hourglass sand timer, focused morning sunlight, pristine minimalist atmosphere, 9:16 vertical 8k',
    outroPattern: "Start small, never quit. Follow this channel for daily self-mastery."
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

const ROTATING_VIRAL_OUTROS = [
  "Follow @TheStoicArchitect to build unshakeable mental armor every single day.",
  "You may never see this channel again — follow now for daily discipline and mental clarity.",
  "Tap follow on @TheStoicArchitect to master your mind and conquer daily chaos.",
  "Don't lose this wisdom — follow this channel to elevate your mindset every morning.",
  "Follow @TheStoicArchitect today for daily Stoic focus and personal mastery.",
  "You might never see this channel again — follow for daily fortitude and resilience.",
  "Follow @TheStoicArchitect if you are committed to becoming 1% stronger every day.",
  "Join @TheStoicArchitect today and become indestructible against life's chaos."
];

/**
 * Resolve dynamic channel call-to-actions with high-retention rotating viral patterns
 */
function resolveOutroPattern(pattern, channelHandle = '@thestoicarchitect-n4b') {
  const cleanHandle = channelHandle.startsWith('@') ? channelHandle : `@${channelHandle}`;
  const randomIndex = Math.floor(Math.random() * ROTATING_VIRAL_OUTROS.length);
  const baseOutro = ROTATING_VIRAL_OUTROS[randomIndex];
  return baseOutro.replace('@TheStoicArchitect', cleanHandle);
}

/**
 * Build rich system and user prompts for multi-model AI generators that enforce
 * CLEAR, CONVERSATIONAL, AND HIGHLY UNDERSTANDABLE SPOKEN SCRIPTWRITING.
 */
function buildStoicPromptForSlot(slotArchetype, recentHistory, slotIndex = 0, channelHandle = '@thestoicarchitect-n4b') {
  const recentTitles = (recentHistory || []).slice(0, 12).map(h => `"${h.topic}"`).join(', ');
  const cleanHandle = channelHandle.startsWith('@') ? channelHandle : `@${channelHandle}`;
  const resolvedOutro = resolveOutroPattern(slotArchetype.outroPattern, cleanHandle);

  const systemPrompt = `You are a master viral scriptwriter and YouTube director for the Modern Stoicism & Mental Strength channel (${cleanHandle}).
CHANNEL GOAL: Deliver practical, high-impact modern stoicism, emotional discipline, and mental fortitude in clear, spoken-conversational English.
AUDIENCE: Everyday normal people dealing with stress, difficult people, self-doubt, burnout, and daily distractions.

CRITICAL YOUTUBE SHORTS ALGORITHM RETENTION RULES (32-42 SECONDS TOTAL):
1. RUNTIME & PACING: Exactly 6 high-impact slides (slideIndex 0 to 5). Each slide MUST have 18 to 25 punchy spoken words (110-140 words total).
2. SLIDE 0 (ANTI-SWIPE HOOK): Zero pleasantries or historical fluff! Start directly with an intense pattern-interrupt question or shocking stat in under 12 words.
3. SLIDE 1 (THE PSYCHOLOGICAL TRAP): Why most people react impulsively and hand over their power.
4. SLIDE 2 (THE STOIC MINDSET SHIFT): The core mental principle in plain modern language.
5. SLIDE 3 (THE TACTICAL DAILY PROTOCOL): Concrete physical/mental action to execute immediately.
6. SLIDE 4 (SOVEREIGN BENEFIT): Why this response makes you completely untouchable.
7. SLIDE 5 (INFINITE RETENTION LOOP & OUTRO): Golden law + short CTA + seamless bridge phrase that connects grammatically right back into Slide 0!

UNIFIED VISUAL IDENTITY (9:16 Vertical 8k Cinematic):
- All 6 visual prompts MUST share the same aesthetic: ${slotArchetype.visualStyle}
- Lighting: Warm amber rim lighting, dark moody obsidian slate background, sharp 35mm anamorphic portrait depth of field.

TARGET THEME & ANGLE:
- Theme: ${slotArchetype.theme}
- Angle: ${slotArchetype.angle}
- Avoid recent titles: [${recentTitles || 'None'}]

OUTPUT FORMAT: Return strictly a valid JSON object matching the schema below.
CRITICAL: Output EXACTLY 6 slides (slideIndex 0 to 5).

{
  "title": "High-CTR Title Under 55 Chars #Shorts",
  "theme": "${slotArchetype.theme}",
  "angle": "${slotArchetype.angle}",
  "hook": "${slotArchetype.hookPatterns[slotIndex % slotArchetype.hookPatterns.length]}",
  "description": "Practical breakdown of ${slotArchetype.theme} and mental strength.\\n\\n#Shorts #Discipline #Motivation #MentalStrength #SelfControl #Mindset #Stoicism #PersonalGrowth",
  "tags": ["#Shorts", "#Discipline", "#Motivation", "#MentalStrength", "#SelfControl", "#Stoicism", "#Mindset", "#PersonalGrowth"],
  "slides": [
    {
      "slideIndex": 0,
      "text": "Shocking hook or burning question with zero greetings (18-22 words)...",
      "visual": "Calm professional in sharp dark suit standing unshakable in a busy city street, cinematic 9:16 vertical 8k amber rim lighting"
    },
    {
      "slideIndex": 1,
      "text": "The psychological trap beginners fall into explained simply (18-22 words)...",
      "visual": "Solitary composed figure unmoved amidst chaotic motion blur of city crowd, 9:16 vertical 8k deep shadows and golden highlights"
    },
    {
      "slideIndex": 2,
      "text": "The core Stoic mental shift in plain modern English (18-22 words)...",
      "visual": "Atmospheric dramatic portrait of focused thinker with calm steely expression, 9:16 vertical 8k warm side lighting"
    },
    {
      "slideIndex": 3,
      "text": "The tactical step-by-step action to take right now (18-22 words)...",
      "visual": "Close-up perspective of steady hands writing calmly in a leather journal under warm light, 9:16 vertical 8k"
    },
    {
      "slideIndex": 4,
      "text": "Why this makes your character and peace untouchable (18-22 words)...",
      "visual": "Confident individual pausing calmly in atmospheric boardroom with moody warm side lighting, 9:16 vertical 8k"
    },
    {
      "slideIndex": 5,
      "text": "Golden rule + follow ${cleanHandle} + seamless bridge back to slide 0 (18-22 words)...",
      "visual": "Sharp silhouette of disciplined person walking purposefully through morning mist with gold rim lighting, 9:16 vertical 8k"
    }
  ]
}`;

  const userPrompt = `Generate a fresh, viral, high-retention 6-slide Modern Stoic Short storyboard for Slot ${slotIndex + 1} of 4.
Theme: "${slotArchetype.theme}". Angle: "${slotArchetype.angle}". Modern Scenario: "${slotArchetype.modernScenario}".
MANDATE: Output EXACTLY 6 slides (slideIndex 0 to 5) with 18-25 words per slide (32-42s runtime). Output strictly valid JSON.`;

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
    description: `Comprehensive modern breakdown of ${slotArchetype.theme} and mental strength.\n\n#Shorts #Discipline #Motivation #MentalStrength #SelfControl #Mindset #Stoicism #PersonalGrowth #Confidence`,
    tags: ["#Shorts", "#Discipline", "#Motivation", "#MentalStrength", "#SelfControl", "#Stoicism", "#Mindset", "#PersonalGrowth"],
    slides: [
      {
        slideIndex: 0,
        text: `When life tests your character and throws chaos in your path, your immediate reaction is the only thing in this world you truly own. Why do most people surrender their peace so easily?`,
        visual: `Cinematic vertical 9:16 shot, ${slotArchetype.visualStyle}, atmospheric cinematic lighting, dark slate and amber color tone, 8k resolution`
      },
      {
        slideIndex: 1,
        text: `Most people operate on automatic pilot. When traffic slows down, when someone is rude, or when plans collapse, they immediately react with panic, anger, and helpless frustration.`,
        visual: `Cinematic vertical 9:16 shot matching ${slotArchetype.visualStyle}, close angle, rich slate gray shadows with warm amber rim light, 8k resolution`
      },
      {
        slideIndex: 2,
        text: `The core Stoic principle is simple: external events have zero power to hurt you until you judge them as bad. Your mind alone decides whether an obstacle breaks you or builds you.`,
        visual: `Cinematic vertical 9:16 shot matching ${slotArchetype.visualStyle}, solitary contemplative figure in sharp focus, slate stone texture and golden highlights, 8k`
      },
      {
        slideIndex: 3,
        text: `When unexpected adversity strikes you today, institute a strict ten-second pause. Do not speak, do not send that angry text, and do not make emotional decisions in the heat of the moment.`,
        visual: `Cinematic vertical 9:16 shot matching ${slotArchetype.visualStyle}, intense focused perspective, atmospheric depth, cinematic slate and golden amber tones, 8k`
      },
      {
        slideIndex: 4,
        text: `Ask yourself one objective question: Is this situation within my direct control, or is it outside my control? If you cannot change it, worrying about it is completely useless.`,
        visual: `Cinematic vertical 9:16 shot matching ${slotArchetype.visualStyle}, close-up of steady hands writing in dark leather notebook under warm lamp, 8k`
      },
      {
        slideIndex: 5,
        text: `Redirect every drop of your energy into what you can control right now: your effort, your discipline, your kindness, and your relentless commitment to doing the work.`,
        visual: `Cinematic vertical 9:16 shot matching ${slotArchetype.visualStyle}, powerful solid architectural composition, deep slate and warm amber illumination, 8k`
      },
      {
        slideIndex: 6,
        text: `When you master this daily habit, you become emotionally indestructible. Life's storms will rage around you, but the fortress inside your mind will remain completely calm and centered.`,
        visual: `Cinematic vertical 9:16 shot matching ${slotArchetype.visualStyle}, dramatic sunrise lighting breaking through dark slate clouds, golden rays, 8k resolution`
      },
      {
        slideIndex: 7,
        text: `Silence the noise, master your internal dialogue, and ${resolvedOutro}`,
        visual: `Cinematic vertical 9:16 shot matching ${slotArchetype.visualStyle}, confident thinker looking towards horizon at dawn, warm amber and obsidian tones, 8k`
      }
    ]
  };
}

/**
 * Build rich prompt for 15-chapter 15-20 min Stoic Masterclass video
 */
function buildStoicDeepDivePrompt(archetype, recentHistory = [], channelHandle = '@thestoicarchitect-n4b') {
  const cleanHandle = channelHandle.startsWith('@') ? channelHandle : `@${channelHandle}`;
  const recentTitles = (recentHistory || []).slice(0, 15).map(h => `"${h.topic || h.title}"`).join(', ');
  const resolvedOutro = resolveOutroPattern(archetype.outroPattern, cleanHandle);

  const systemPrompt = `You are a master Stoic philosopher, psychologist, and long-form documentary scriptwriter for the channel (${cleanHandle}).
CHANNEL GOAL: Deliver deep, practical, spoken-conversational modern Stoic wisdom that transforms everyday lives.
AUDIENCE: Normal everyday people seeking unshakeable discipline, emotional mastery, and mental fortitude.

LONG-FORM MASTERCLASS REQUIREMENTS (15 CHAPTERS / 15-20 MINUTES):
1. EXACTLY 15 COMPREHENSIVE CHAPTERS (SLIDES 0 TO 14):
   - Each slide represents an in-depth teaching section (~100-130 words of natural, wise, spoken-word narration).
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
      "text": "Detailed 100-130 words spoken narration...",
      "visual": "16:9 widescreen 8k cinematic atmospheric shot with warm amber and deep slate tones..."
    }
  ]
}`;

  const userPrompt = `Generate a complete 15-chapter 15-20 min Masterclass script on "${archetype.theme}". Angle: "${archetype.angle}". Avoid recent topics: [${recentTitles || 'None'}]. Return strictly valid JSON.`;

  return { systemPrompt, userPrompt };
}

/**
 * High-quality deterministic fallback for 15-Chapter Stoic Masterclass
 */
function synthesizeDeterministicStoicDeepDiveStoryboard(archetype, topicTitle, channelHandle = '@thestoicarchitect-n4b') {
  const cleanHandle = channelHandle.startsWith('@') ? channelHandle : `@${channelHandle}`;
  const resolvedOutro = resolveOutroPattern(archetype ? archetype.outroPattern : '', cleanHandle);
  const arch = archetype || STOIC_ARCHETYPES[0];
  const title = topicTitle && topicTitle.length > 5 ? topicTitle : `${arch.theme} - The Complete Stoic Masterclass`;

  const chapters = [
    { title: 'The Modern Trap: Why We Lose Our Peace', text: `In a world full of noise, notifications, and endless demands, most people live in a constant state of reaction. They let external events dictate their mood, their focus, and their self-worth. Stoicism is not about suppressing your emotions; it is the ancient art of reclaiming your sovereignty. When you master your mind, nothing outside can shake your foundation.` },
    { title: 'The Dichotomy of Control: The Golden Rule', text: `Epictetus taught that life is divided into two categories: things you control, and things you do not. You control your thoughts, your daily habits, and your responses. You do not control the economy, other people, or past mistakes. The moment you stop pouring energy into things outside your control, ninety percent of your anxiety instantly evaporates.` },
    { title: 'The Sovereign Pause: Mastering Reaction', text: `Between every stimulus and your reaction, there is a small pocket of space. In that space lies your freedom. When someone cuts you off, insults you, or ruins your plans, pause for ten seconds. Take a deep breath. Let reason take the wheel before emotion causes you to say or do something you will regret.` },
    { title: 'The Illusion of Approval: Escaping People-Pleasing', text: `Seeking validation from others is like handing them the keys to your happiness. When you depend on compliments to feel good, insults will easily destroy you. Marcus Aurelius reminded himself every morning that the opinions of others say everything about their character and nothing about his own.` },
    { title: 'Amor Fati: Loving What Happens', text: `Amor Fati means loving your fate, whatever it brings. When plans collapse or hardships strike, a weak mind complains and asks why me. A Stoic asks: what does this teach me right now? Every obstacle is raw fuel for character development. You do not merely survive difficulty; you use it to grow stronger.` },
    { title: 'The Non-Negotiable Contract: Discipline Over Mood', text: `Motivation is an unreliable friend. It arrives with excitement and disappears when the work gets difficult. Discipline is a non-negotiable contract you sign with yourself. You show up, you study, you build, and you train regardless of whether you feel like it. Consistency is the only true separator.` },
    { title: 'Silence as Power: Defeating Hostility', text: `When someone tries to provoke you with disrespect, reacting with anger proves they found your weak spot. Silence, delivered with calm eye contact and steady composure, exposes their aggression as childish and weak. True strength is quiet; weakness is loud and reactive.` },
    { title: 'The Laboratory of Solitude: Building in the Dark', text: `Many people fear being alone because they cannot stand the quiet of their own thoughts. But solitude is the laboratory where your strongest self is built. Use your private hours to read, meditate, refine your skills, and build a fortress that no sudden storm can knock down.` },
    { title: 'Conquering Impulse: The 10-Minute Rule', text: `Cheap dopamine is everywhere, from endless scrolling to impulse spending. Every time you surrender to an impulsive urge, you teach your brain that your willpower cannot be trusted. Use the ten-minute rule: when a craving hits, wait ten minutes. Most cravings fade when forced to face deliberate delay.` },
    { title: 'Evidence-Based Self-Trust: Keeping Promises', text: `You cannot fake real confidence. Affirmations in the mirror will not give you genuine self-trust. Genuine confidence is built on a stack of undeniable proof: waking up on time, finishing what you started, and keeping the small promises you made to yourself when no one was watching.` },
    { title: 'Modern Scenario: Navigating Daily Chaos', text: `Consider a day when everything seems to go wrong at work or at home. Deadlines clash, plans fall apart, and people are difficult. Instead of spiraling, treat the entire day as an obstacle course designed specifically to test your composure. Smile at the resistance and execute one clear step at a time.` },
    { title: 'The Morning & Evening Audit: Daily Mental Hygiene', text: `Begin your morning by setting your mental armor. Prepare your mind for difficult people and unexpected delays. End your night with a calm three-question audit: What did I do well today? Where did I lose control? How can I respond better tomorrow? Continuous reflection creates continuous growth.` },
    { title: 'Memento Mori: The Ultimate Clarity Filter', text: `Remembering that your time on this earth is finite is not morbid; it is the ultimate tool for clarity. When you realize how short life is, you immediately stop wasting precious hours arguing over petty slights, holding grudges, or worrying about things that will not matter next year.` },
    { title: 'The Inner Citadel: Becoming Indestructible', text: `Your mind is your ultimate fortress. External circumstances can take your money, your comfort, or your reputation, but no one can take your virtue, your discipline, or your peace unless you willingly surrender them. Protect your inner citadel with relentless daily practice.` },
    { title: 'The 30-Day Action Blueprint & Conclusion', text: `Commit to practicing these principles for the next thirty days. Speak less, listen more, pause before reacting, and execute your daily duties with quiet excellence. Control your mind, own your destiny. ${resolvedOutro}` }
  ];

  return {
    title: title,
    theme: arch.theme,
    angle: arch.angle,
    description: `Comprehensive 15-Chapter Masterclass on ${arch.theme}.\n\nTimestamps:\n` +
      chapters.map((c, i) => `${String(Math.floor(i * 1.2)).padStart(2, '0')}:00 Chapter ${i + 1}: ${c.title}`).join('\n') +
      `\n\n#Stoicism #Mindset #Discipline #MentalStrength #SelfControl`,
    tags: ["#Stoicism", "#Mindset", "#Discipline", "#MentalStrength", "#SelfControl"],
    slides: chapters.map((c, idx) => ({
      slideIndex: idx,
      chapterTitle: c.title,
      text: c.text,
      visual: `16:9 widescreen 8k photorealistic modern cinematic studio setting with deep dark slate background, warm golden amber rim lighting, razor-sharp focus`
    }))
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
  buildStoicDeepDivePrompt,
  synthesizeDeterministicStoryboard,
  synthesizeDeterministicStoicDeepDiveStoryboard
};

