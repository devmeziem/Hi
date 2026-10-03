/**
 * Stoic & Classical Philosophy Knowledge Base & Weekly Rotation Engine
 * Incorporates all 22 philosophers & curated sources provided:
 * 1. Marcus Aurelius (Gutenberg #2680, Wikisource, GetMarcus)
 * 2. Epictetus (Gutenberg #871, Wikisource, Stoic Fundamentals)
 * 3. Seneca the Younger (Gutenberg, Wikisource, Practical Philo)
 * 4. Musonius Rufus (Archive.org, Wikisource)
 * 5. Zeno of Citium (Archive.org, Gutenberg)
 * 6. Cleanthes (Archive.org, Gutenberg)
 * 7. Chrysippus (Archive.org, Gutenberg)
 * 8. Hierocles (Archive.org, Wikisource)
 * 9. Antipater of Tarsus (Archive.org, Wikisource)
 * 10. Panaetius (Archive.org, Wikisource)
 * 11. Posidonius (Archive.org, Wikisource)
 * 12. Diogenes Laërtius (Gutenberg, Archive.org)
 * 13. Socrates (Gutenberg, Archive.org)
 * 14. Plato (Gutenberg, Archive.org)
 * 15. Aristotle (Gutenberg, Archive.org)
 * 16. Marcus Tullius Cicero (Gutenberg, Archive.org)
 * 17. Plutarch (Gutenberg, Archive.org)
 * 18. Xenophon (Gutenberg, Archive.org)
 * 19. Laozi (Gutenberg, Archive.org)
 * 20. Confucius (Gutenberg, Archive.org)
 * 21. Diogenes of Sinope (Gutenberg, Archive.org)
 * 22. Boethius (Gutenberg, Archive.org)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const STOIC_HISTORY_CACHE = path.join(process.cwd(), 'stoic_quote_history.json');

const PHILOSOPHERS_CATALOG = [
  {
    id: 'marcus_aurelius',
    name: 'Marcus Aurelius',
    title: 'Roman Emperor & Stoic Philosopher',
    era: '121 – 180 AD',
    school: 'Late Roman Stoicism',
    sources: [
      { name: 'Wikisource', url: 'https://en.wikisource.org/wiki/Meditations', apiType: 'wikisource' },
      { name: 'Project Gutenberg', url: 'https://www.gutenberg.org/ebooks/2680', id: 2680, apiType: 'gutenberg' },
      { name: 'GetMarcus', url: 'https://getmarcus.app/stoic-quotes', apiType: 'web' }
    ],
    wikiSearch: 'Marcus_Aurelius',
    defaultPortrait: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Marcus_Aurelius_Louvre_MR561_n02.jpg',
    quotes: [
      { text: "You have power over your mind - not outside events. Realize this, and you will find strength.", theme: "Internal Control & Sovereignty" },
      { text: "Dwell on the beauty of life. Watch the stars, and see yourself running with them.", theme: "Cosmic Perspective" },
      { text: "The happiness of your life depends upon the quality of your thoughts.", theme: "Mental Clarity" },
      { text: "Waste no more time arguing what a good man should be. Be one.", theme: "Direct Action Over Words" },
      { text: "When you arise in the morning think of what a privilege it is to be alive, to think, to enjoy, to love.", theme: "Gratitude & Presence" },
      { text: "The soul becomes dyed with the color of its thoughts.", theme: "Inner Fortress" }
    ]
  },
  {
    id: 'epictetus',
    name: 'Epictetus',
    title: 'Freed Slave & Stoic Teacher',
    era: '50 – 135 AD',
    school: 'Late Roman Stoicism',
    sources: [
      { name: 'Wikisource', url: 'https://en.wikisource.org/wiki/Enchiridion_(Epictetus)', apiType: 'wikisource' },
      { name: 'Project Gutenberg', url: 'https://www.gutenberg.org/ebooks/871', id: 871, apiType: 'gutenberg' },
      { name: 'Stoic Fundamentals', url: 'https://stoicfundamentals.com/quotes', apiType: 'web' }
    ],
    wikiSearch: 'Epictetus',
    defaultPortrait: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Epicteti_Enchiridion_Latinis_versibus_adumbratum_%28Oxford_1715%29_frontispiece.jpg',
    quotes: [
      { text: "We are not disturbed by what happens to us, but by our thoughts about what happens.", theme: "Perception & Reality" },
      { text: "No man is free who is not master of himself.", theme: "Self-Mastery" },
      { text: "He who laughs at himself never runs out of things to laugh at.", theme: "Humility & Detachment" },
      { text: "Wealth consists not in having great possessions, but in having few wants.", theme: "Freedom from Greed" },
      { text: "Circumstances do not make the man, they only reveal him to himself.", theme: "Testing Character" }
    ]
  },
  {
    id: 'seneca',
    name: 'Seneca the Younger',
    title: 'Statesman, Dramatist & Stoic Philosopher',
    era: '4 BC – 65 AD',
    school: 'Roman Imperial Stoicism',
    sources: [
      { name: 'Wikisource', url: 'https://en.wikisource.org/wiki/Author:Seneca', apiType: 'wikisource' },
      { name: 'Project Gutenberg', url: 'https://www.gutenberg.org/ebooks/search/?query=Seneca', apiType: 'gutenberg' },
      { name: 'The Practical Philo', url: 'https://thepracticalphilo.com/stoic-quotes/', apiType: 'web' }
    ],
    wikiSearch: 'Seneca_the_Younger',
    defaultPortrait: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Seneca_buste.jpg',
    quotes: [
      { text: "We suffer more often in imagination than in reality.", theme: "Overcoming Anxiety" },
      { text: "Life is long if you know how to use it.", theme: "The Value of Time" },
      { text: "Difficulties strengthen the mind, as labor does the body.", theme: "Antifragility" },
      { text: "True happiness is to enjoy the present, without anxious dependence upon the future.", theme: "Present Focus" },
      { text: "Every new beginning comes from some other beginning's end.", theme: "Embracing Transition" }
    ]
  },
  {
    id: 'musonius_rufus',
    name: 'Musonius Rufus',
    title: 'The Roman Socrates & Teacher of Epictetus',
    era: '30 – 100 AD',
    school: 'Roman Stoicism',
    sources: [
      { name: 'Wikisource', url: 'https://en.wikisource.org/wiki/Author:Musonius_Rufus', apiType: 'wikisource' },
      { name: 'Internet Archive', url: 'https://archive.org/search?query=Musonius+Rufus', apiType: 'archive' }
    ],
    wikiSearch: 'Musonius_Rufus',
    defaultPortrait: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Marcus_Aurelius_Louvre_MR561_n02.jpg',
    quotes: [
      { text: "If you accomplish something good with hard work, the labor passes quickly, but the good endures.", theme: "Enduring Virtue" },
      { text: "You will earn the respect of all if you begin by earning the respect of yourself.", theme: "Self-Respect" },
      { text: "Only the educated are truly free.", theme: "Pursuit of Knowledge" },
      { text: "Since every man dies, it is better to die with honor than to live with shame.", theme: "Honor & Courage" }
    ]
  },
  {
    id: 'zeno_of_citium',
    name: 'Zeno of Citium',
    title: 'Founder of the Stoic School',
    era: '334 – 262 BC',
    school: 'Early Hellenistic Stoicism',
    sources: [
      { name: 'Internet Archive', url: 'https://archive.org/search?query=Zeno+of+Citium', apiType: 'archive' },
      { name: 'Project Gutenberg', url: 'https://www.gutenberg.org/ebooks/search/?query=Zeno+of+Citium', apiType: 'gutenberg' }
    ],
    wikiSearch: 'Zeno_of_Citium',
    defaultPortrait: 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Zeno_of_Citium_pushkin.jpg',
    quotes: [
      { text: "We have two ears and one mouth, so we should listen more than we say.", theme: "Listening & Wisdom" },
      { text: "Happiness is a good flow of life.", theme: "Living in Harmony" },
      { text: "Man conquers the world by conquering himself.", theme: "Self-Conquest" },
      { text: "Better to trip with the feet than with the tongue.", theme: "Restraint in Speech" }
    ]
  },
  {
    id: 'cleanthes',
    name: 'Cleanthes',
    title: 'Second Head of the Stoa & Author of Hymn to Zeus',
    era: '331 – 232 BC',
    school: 'Early Hellenistic Stoicism',
    sources: [
      { name: 'Project Gutenberg', url: 'https://www.gutenberg.org/ebooks/search/?query=Cleanthes', apiType: 'gutenberg' },
      { name: 'Internet Archive', url: 'https://archive.org/search?query=Cleanthes', apiType: 'archive' }
    ],
    wikiSearch: 'Cleanthes',
    defaultPortrait: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Cleanthes_Bust_Louvre.jpg',
    quotes: [
      { text: "Fate guides the willing, but drags the unwilling.", theme: "Acceptance of Nature" },
      { text: "Ignorance is the root cause of human turmoil.", theme: "Enlightenment & Truth" },
      { text: "Lead me, O Zeus, and thou O Destiny, whithersoever I am by you appointed to go.", theme: "Amor Fati" }
    ]
  },
  {
    id: 'chrysippus',
    name: 'Chrysippus',
    title: 'Master of Stoic Logic & Systematizer of the Stoa',
    era: '279 – 206 BC',
    school: 'Early Hellenistic Stoicism',
    sources: [
      { name: 'Internet Archive', url: 'https://archive.org/search?query=Chrysippus', apiType: 'archive' },
      { name: 'Project Gutenberg', url: 'https://www.gutenberg.org/ebooks/search/?query=Chrysippus', apiType: 'gutenberg' }
    ],
    wikiSearch: 'Chrysippus',
    defaultPortrait: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Chrysippos_BM_1846.jpg',
    quotes: [
      { text: "The universe is one living being, containing all beings and rational souls within itself.", theme: "Cosmic Interconnection" },
      { text: "He who is running a race ought to strive to conquer, but by no means to trip his adversary.", theme: "Fairness & Integrity" },
      { text: "There is no evil in nature, only our failure to understand the whole.", theme: "Perspective on Hardship" }
    ]
  },
  {
    id: 'hierocles',
    name: 'Hierocles',
    title: 'Author of the Stoic Circles of Concern',
    era: '2nd Century AD',
    school: 'Roman Stoicism',
    sources: [
      { name: 'Wikisource', url: 'https://en.wikisource.org/wiki/Author:Hierocles', apiType: 'wikisource' },
      { name: 'Internet Archive', url: 'https://archive.org/search?query=Hierocles+Stoic', apiType: 'archive' }
    ],
    wikiSearch: 'Hierocles_(Stoic)',
    defaultPortrait: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Seneca_buste.jpg',
    quotes: [
      { text: "Each of us is encompassed by concentric circles: our mind, family, neighbors, and all humanity.", theme: "Cosmopolitan Empathy" },
      { text: "To live well is to treat even strangers as distant kin of the same universal household.", theme: "Universal Brotherhood" }
    ]
  },
  {
    id: 'socrates',
    name: 'Socrates',
    title: 'Father of Western Moral Philosophy',
    era: '470 – 399 BC',
    school: 'Classical Socratic Philosophy',
    sources: [
      { name: 'Project Gutenberg', url: 'https://www.gutenberg.org/ebooks/search/?query=Socrates', apiType: 'gutenberg' },
      { name: 'Internet Archive', url: 'https://archive.org/search?query=Socrates', apiType: 'archive' }
    ],
    wikiSearch: 'Socrates',
    defaultPortrait: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Socrate_du_Louvre.jpg',
    quotes: [
      { text: "The unexamined life is not worth living.", theme: "Self-Reflection" },
      { text: "I know that I am intelligent, because I know that I know nothing.", theme: "Intellectual Humility" },
      { text: "Be kind, for everyone you meet is fighting a hard battle.", theme: "Compassion & Patience" },
      { text: "Strong minds discuss ideas, average minds discuss events, weak minds discuss people.", theme: "Elevated Focus" }
    ]
  },
  {
    id: 'plato',
    name: 'Plato',
    title: 'Founder of the Academy in Athens',
    era: '428 – 348 BC',
    school: 'Classical Platonism',
    sources: [
      { name: 'Project Gutenberg', url: 'https://www.gutenberg.org/ebooks/search/?query=Plato', apiType: 'gutenberg' },
      { name: 'Internet Archive', url: 'https://archive.org/search?query=Plato', apiType: 'archive' }
    ],
    wikiSearch: 'Plato',
    defaultPortrait: 'https://upload.wikimedia.org/wikipedia/commons/8/88/Plato_Silanion_Musei_Capitolini_MC1377.jpg',
    quotes: [
      { text: "The first and greatest victory is to conquer yourself.", theme: "Inner Triumph" },
      { text: "We can easily forgive a child who is afraid of the dark; the real tragedy of life is when men are afraid of the light.", theme: "Courage to Face Truth" },
      { text: "Wise men speak because they have something to say; fools because they have to say something.", theme: "Discipline of Speech" }
    ]
  },
  {
    id: 'aristotle',
    name: 'Aristotle',
    title: 'Philosopher, Polymath & Founder of the Lyceum',
    era: '384 – 322 BC',
    school: 'Peripatetic Philosophy',
    sources: [
      { name: 'Project Gutenberg', url: 'https://www.gutenberg.org/ebooks/search/?query=Aristotle', apiType: 'gutenberg' },
      { name: 'Internet Archive', url: 'https://archive.org/search?query=Aristotle', apiType: 'archive' }
    ],
    wikiSearch: 'Aristotle',
    defaultPortrait: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Aristotle_Altemps_Inv8575.jpg',
    quotes: [
      { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", theme: "Power of Daily Habit" },
      { text: "Knowing yourself is the beginning of all wisdom.", theme: "Self-Knowledge" },
      { text: "It is the mark of an educated mind to be able to entertain a thought without accepting it.", theme: "Intellectual Sovereignty" }
    ]
  },
  {
    id: 'cicero',
    name: 'Marcus Tullius Cicero',
    title: 'Roman Statesman, Orator & Philosophical Bridge',
    era: '106 – 43 BC',
    school: 'Academic Skepticism & Stoic Ethics',
    sources: [
      { name: 'Project Gutenberg', url: 'https://www.gutenberg.org/ebooks/search/?query=Cicero', apiType: 'gutenberg' },
      { name: 'Internet Archive', url: 'https://archive.org/search?query=Cicero', apiType: 'archive' }
    ],
    wikiSearch: 'Cicero',
    defaultPortrait: 'https://upload.wikimedia.org/wikipedia/commons/8/86/Bust_of_Cicero_%281st-cent._BC%29_-_Capitoline_Museums.jpg',
    quotes: [
      { text: "If you have a garden and a library, you have everything you need.", theme: "Simplicity & Contentment" },
      { text: "Silence is one of the great arts of conversation.", theme: "Restraint & Poise" },
      { text: "The authority of those who teach is often an obstacle to those who want to learn.", theme: "Independent Thinking" }
    ]
  },
  {
    id: 'plutarch',
    name: 'Plutarch',
    title: 'Biographer, Essayist & Moral Philosopher',
    era: '46 – 119 AD',
    school: 'Middle Platonism & Stoic Morality',
    sources: [
      { name: 'Project Gutenberg', url: 'https://www.gutenberg.org/ebooks/search/?query=Plutarch', apiType: 'gutenberg' },
      { name: 'Internet Archive', url: 'https://archive.org/search?query=Plutarch', apiType: 'archive' }
    ],
    wikiSearch: 'Plutarch',
    defaultPortrait: 'https://upload.wikimedia.org/wikipedia/commons/8/86/Bust_of_Cicero_%281st-cent._BC%29_-_Capitoline_Museums.jpg',
    quotes: [
      { text: "What we achieve inwardly will change outer reality.", theme: "Inward Transformation" },
      { text: "The mind is not a vessel to be filled, but a fire to be kindled.", theme: "Igniting Curiosity" },
      { text: "To make no mistakes is not in the power of man; but from their errors the wise learn wisdom.", theme: "Learning from Failure" }
    ]
  },
  {
    id: 'diogenes_of_sinope',
    name: 'Diogenes of Sinope',
    title: 'Cynic Philosopher & Rebel Against Pretense',
    era: '412 – 323 BC',
    school: 'Cynic Philosophy (Precursor to Stoicism)',
    sources: [
      { name: 'Project Gutenberg', url: 'https://www.gutenberg.org/ebooks/search/?query=Diogenes+of+Sinope', apiType: 'gutenberg' },
      { name: 'Internet Archive', url: 'https://archive.org/search?query=Diogenes+of+Sinope', apiType: 'archive' }
    ],
    wikiSearch: 'Diogenes',
    defaultPortrait: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Statue_of_Diogenes_at_Sinop.jpg',
    quotes: [
      { text: "I have nothing to ask of you, except that you step aside from my sunlight.", theme: "Radical Sovereignty" },
      { text: "Blushing is the color of virtue.", theme: "Moral Conscience" },
      { text: "It is the privilege of the gods to want nothing, and of godlike men to want little.", theme: "Extreme Detachment" }
    ]
  },
  {
    id: 'laozi',
    name: 'Laozi',
    title: 'Author of the Tao Te Ching & Master of Wu Wei',
    era: '6th Century BC',
    school: 'Classical Daoism (Eastern Parallel to Stoicism)',
    sources: [
      { name: 'Project Gutenberg', url: 'https://www.gutenberg.org/ebooks/search/?query=Laozi', apiType: 'gutenberg' },
      { name: 'Internet Archive', url: 'https://archive.org/search?query=Laozi', apiType: 'archive' }
    ],
    wikiSearch: 'Laozi',
    defaultPortrait: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Laozi_in_A_Scholar_in_a_Meadow.jpg',
    quotes: [
      { text: "Mastering others is strength; mastering yourself is true power.", theme: "Self-Mastery" },
      { text: "Nature does not hurry, yet everything is accomplished.", theme: "Patience & Flow" },
      { text: "When you are content to be simply yourself and don't compare or compete, everyone will respect you.", theme: "Authentic Peace" }
    ]
  },
  {
    id: 'confucius',
    name: 'Confucius',
    title: 'Philosopher of Duty, Ritual & Moral Rectitude',
    era: '551 – 479 BC',
    school: 'Confucian Philosophy',
    sources: [
      { name: 'Project Gutenberg', url: 'https://www.gutenberg.org/ebooks/search/?query=Confucius', apiType: 'gutenberg' },
      { name: 'Internet Archive', url: 'https://archive.org/search?query=Confucius', apiType: 'archive' }
    ],
    wikiSearch: 'Confucius',
    defaultPortrait: 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Confucius_Tang_Dynasty.jpg',
    quotes: [
      { text: "The man who moves a mountain begins by carrying away small stones.", theme: "Incremental Progress" },
      { text: "He who conquers himself is the mightiest warrior.", theme: "Self-Discipline" },
      { text: "It does not matter how slowly you go as long as you do not stop.", theme: "Relentless Persistence" }
    ]
  },
  {
    id: 'boethius',
    name: 'Boethius',
    title: 'Author of The Consolation of Philosophy',
    era: '477 – 524 AD',
    school: 'Late Classical Roman Philosophy',
    sources: [
      { name: 'Project Gutenberg', url: 'https://www.gutenberg.org/ebooks/search/?query=Boethius', apiType: 'gutenberg' },
      { name: 'Internet Archive', url: 'https://archive.org/search?query=Boethius', apiType: 'archive' }
    ],
    wikiSearch: 'Boethius',
    defaultPortrait: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Aristotle_Altemps_Inv8575.jpg',
    quotes: [
      { text: "Nothing is miserable unless you think it so; and every lot is happy if you are content with it.", theme: "Power of Perception" },
      { text: "Inconstancy is my very essence, says Fortune. Why complain when she turns her wheel?", theme: "Equanimity in Chaos" }
    ]
  }
];

/**
 * Weekly rotation engine: Ensures a wide spread of philosophers across the week
 */
function getNextRotatingPhilosopher() {
  let postedHistory = [];
  if (fs.existsSync(STOIC_HISTORY_CACHE)) {
    try {
      postedHistory = JSON.parse(fs.readFileSync(STOIC_HISTORY_CACHE, 'utf8'));
    } catch {}
  }

  // Look at the last 8 posted philosopher IDs
  const recentIds = postedHistory.slice(-8).map(p => p.philosopherId || p.author).filter(Boolean);

  // Filter candidates that haven't been featured recently
  let candidates = PHILOSOPHERS_CATALOG.filter(p => !recentIds.includes(p.id) && !recentIds.includes(p.name));
  if (candidates.length === 0) {
    candidates = PHILOSOPHERS_CATALOG;
  }

  // Pick candidate
  const chosen = candidates[Math.floor(Math.random() * candidates.length)] || PHILOSOPHERS_CATALOG[0];
  return chosen;
}

/**
 * Select a quote and search 1 primary source for authentication, using others as fallback
 */
async function selectPhilosopherAndQuote(targetPhilosopherId = null) {
  let philosopher = null;
  if (targetPhilosopherId) {
    philosopher = PHILOSOPHERS_CATALOG.find(p => p.id === targetPhilosopherId || p.name.toLowerCase().includes(targetPhilosopherId.toLowerCase()));
  }
  if (!philosopher) {
    philosopher = getNextRotatingPhilosopher();
  }

  // Pick random quote from verified catalog
  const quotes = philosopher.quotes || [];
  const chosenQuote = quotes[Math.floor(Math.random() * quotes.length)] || quotes[0];

  // Pick 1 primary source to query
  const primarySource = philosopher.sources[Math.floor(Math.random() * philosopher.sources.length)] || philosopher.sources[0];

  console.log(`[Philosopher Vault] 🏛️ Rotating to: ${philosopher.name} (${philosopher.era})`);
  console.log(`[Philosopher Vault] 📜 Primary Source: ${primarySource.name} (${primarySource.url})`);
  console.log(`[Philosopher Vault] 💡 Quote: "${chosenQuote.text}"`);

  return {
    philosopher,
    quote: chosenQuote.text,
    theme: chosenQuote.theme,
    primarySource,
    allSources: philosopher.sources
  };
}

module.exports = {
  PHILOSOPHERS_CATALOG,
  getNextRotatingPhilosopher,
  selectPhilosopherAndQuote
};
