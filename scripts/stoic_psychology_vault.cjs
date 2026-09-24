/**
 * Stoic & World Scholars Psychology Impact Content Vault
 *
 * Elite curation of psychological, power, and philosophical quotes that challenge human nature:
 * - Niccolò Machiavelli (The Prince, Power Dynamics, Control vs Illusion)
 * - Arthur Schopenhauer (Truth Stages, Solitude, Freedom, Human Will)
 * - Carl Jung (Shadow Work, Unconscious Drives, Self-Acceptance)
 * - Robert Greene (The 48 Laws of Power, Laws of Human Nature, Emotional Sovereignty)
 * - Friedrich Nietzsche (Will to Power, Self-Ownership, The Abyss)
 * - Fyodor Dostoevsky (Conscience, Conscious Suffering, Individuality)
 * - Sigmund Freud (Unexpressed Emotions, Fear of Freedom, Subconscious Drives)
 * - Franz Kafka (Obsessions, Inner Freedom, Existential Truth)
 * - Marcus Aurelius (Internal Citadel, Dichotomy of Control, Indifference to Praise)
 * - Seneca the Younger (Suffering in Imagination, Valuing Time, Calamity)
 * - Epictetus (Self-Mastery as Only Freedom, Response Over Event)
 * - Sun Tzu (Psychological Warfare, Conquering Without Fighting)
 * - Blaise Pascal (Inability to Sit Alone in a Room)
 * - Baltasar Gracián (Worldly Wisdom, Strategic Mystery)
 * - Søren Kierkegaard (Anxiety of Freedom)
 * - Dr. Viktor Frankl (The Space Between Stimulus and Response)
 */

const https = require('https');

const CURATED_PSYCHOLOGY_QUOTES = [
  // Niccolò Machiavelli
  {
    quote: "A wise prince should establish himself on that which is in his own control and not in that of others.",
    author: "Niccolò Machiavelli",
    credentials: "Author of The Prince • Diplomat & Political Philosopher",
    wikiSearch: "Niccolò_Machiavelli",
    directUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e2/Portrait_of_Niccol%C3%B2_Machiavelli_by_Santi_di_Tito.jpg",
    theme: "power",
    psychologicalConcept: "Internal locus of control & political sovereignty",
    communityQuestion: "What is one external opinion you need to immediately stop letting dictate your peace of mind?"
  },
  {
    quote: "Everyone sees what you appear to be, few experience what you really are.",
    author: "Niccolò Machiavelli",
    credentials: "Author of The Prince • Diplomat & Political Philosopher",
    wikiSearch: "Niccolò_Machiavelli",
    directUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e2/Portrait_of_Niccol%C3%B2_Machiavelli_by_Santi_di_Tito.jpg",
    theme: "psychology",
    psychologicalConcept: "Persona vs true self in human social dynamics",
    communityQuestion: "Do you focus more on managing how others perceive you, or building who you truly are in private?"
  },
  {
    quote: "The first method for estimating the intelligence of a ruler is to look at the men he has around him.",
    author: "Niccolò Machiavelli",
    credentials: "Author of The Prince • Diplomat & Political Philosopher",
    wikiSearch: "Niccolò_Machiavelli",
    directUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e2/Portrait_of_Niccol%C3%B2_Machiavelli_by_Santi_di_Tito.jpg",
    theme: "strategy",
    psychologicalConcept: "Social contagion & circle of influence",
    communityQuestion: "Are the 3 closest people in your daily circle raising your standards or draining your focus?"
  },
  {
    quote: "Whosoever desires constant success must change his conduct with the times.",
    author: "Niccolò Machiavelli",
    credentials: "Author of The Prince • Diplomat & Political Philosopher",
    wikiSearch: "Niccolò_Machiavelli",
    directUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e2/Portrait_of_Niccol%C3%B2_Machiavelli_by_Santi_di_Tito.jpg",
    theme: "discipline",
    psychologicalConcept: "Cognitive flexibility & behavioral adaptation",
    communityQuestion: "What outdated habit are you holding onto that no longer serves your current ambitions?"
  },

  // Arthur Schopenhauer
  {
    quote: "All truth passes through three stages. First, it is ridiculed. Second, it is violently opposed. Third, it is accepted as being self-evident.",
    author: "Arthur Schopenhauer",
    credentials: "Author of Studies in Pessimism • German Philosopher",
    wikiSearch: "Arthur_Schopenhauer",
    directUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b8/Schopenhauer.jpg",
    theme: "truth",
    psychologicalConcept: "The psychological lifecycle of paradigm shifts",
    communityQuestion: "What truth in your life are you currently resisting simply because it feels uncomfortable?"
  },
  {
    quote: "A man can be himself only so long as he is alone; if he does not love solitude, he will not love freedom.",
    author: "Arthur Schopenhauer",
    credentials: "Author of Studies in Pessimism • German Philosopher",
    wikiSearch: "Arthur_Schopenhauer",
    directUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b8/Schopenhauer.jpg",
    theme: "solitude",
    psychologicalConcept: "Authenticity requiring emotional detachment from crowd pressure",
    communityQuestion: "Can you spend 30 minutes in quiet solitude without reaching for your phone?"
  },
  {
    quote: "Talent hits a target no one else can hit; Genius hits a target no one else can see.",
    author: "Arthur Schopenhauer",
    credentials: "Author of Studies in Pessimism • German Philosopher",
    wikiSearch: "Arthur_Schopenhauer",
    directUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b8/Schopenhauer.jpg",
    theme: "mastery",
    psychologicalConcept: "Divergent thinking and perceptual mastery",
    communityQuestion: "What unique intuition do you have that everyone around you keeps doubting?"
  },
  {
    quote: "What a man is contributes much more to his happiness than what he has, or how he is regarded by others.",
    author: "Arthur Schopenhauer",
    credentials: "Author of Studies in Pessimism • German Philosopher",
    wikiSearch: "Arthur_Schopenhauer",
    directUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b8/Schopenhauer.jpg",
    theme: "sovereignty",
    psychologicalConcept: "Intrinsically generated peace vs extrinsic status traps",
    communityQuestion: "Are you investing more in your possessions, or in the depth of your own character?"
  },

  // Dr. Carl Jung
  {
    quote: "Until you make the unconscious conscious, it will direct your life and you will call it fate.",
    author: "Dr. Carl Jung",
    credentials: "Founder of Analytical Psychology • Psychiatrist",
    wikiSearch: "Carl_Jung",
    directUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Carl_Gustav_Jung_1910.jpg",
    theme: "psychology",
    psychologicalConcept: "Unconscious scripts & cognitive self-awareness",
    communityQuestion: "What recurring automatic reaction do you repeatedly mistake for 'fate'?"
  },
  {
    quote: "Thinking is difficult, that’s why most people judge.",
    author: "Dr. Carl Jung",
    credentials: "Founder of Analytical Psychology • Psychiatrist",
    wikiSearch: "Carl_Jung",
    directUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Carl_Gustav_Jung_1910.jpg",
    theme: "mastery",
    psychologicalConcept: "Heuristic shortcuts vs deep critical contemplation",
    communityQuestion: "When was the last time you suspended immediate judgment to truly understand someone's motive?"
  },
  {
    quote: "The most terrifying thing is to accept oneself completely.",
    author: "Dr. Carl Jung",
    credentials: "Founder of Analytical Psychology • Psychiatrist",
    wikiSearch: "Carl_Jung",
    directUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Carl_Gustav_Jung_1910.jpg",
    theme: "confidence",
    psychologicalConcept: "Shadow integration & total psychological self-confrontation",
    communityQuestion: "What flaw about yourself have you finally stopped trying to hide or rationalize?"
  },
  {
    quote: "Everything that irritates us about others can lead us to an understanding of ourselves.",
    author: "Dr. Carl Jung",
    credentials: "Founder of Analytical Psychology • Psychiatrist",
    wikiSearch: "Carl_Jung",
    directUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Carl_Gustav_Jung_1910.jpg",
    theme: "defense",
    psychologicalConcept: "Psychological projection as a mirror for personal shadow",
    communityQuestion: "What trait in someone else bothers you because it secretly mirrors something inside you?"
  },

  // Robert Greene
  {
    quote: "Always say less than necessary. When you are trying to impress people, the more you say, the more common you appear.",
    author: "Robert Greene",
    credentials: "Author of The 48 Laws of Power & Laws of Human Nature",
    wikiSearch: "Robert_Greene_(American_author)",
    theme: "power",
    psychologicalConcept: "Strategic mystery & verbal economy in status hierarchies",
    communityQuestion: "In which conversation today will you practice the discipline of saying less?"
  },
  {
    quote: "Master your emotions. If you cannot control your emotions, you cannot control your power, your money, or your life.",
    author: "Robert Greene",
    credentials: "Author of The 48 Laws of Power & Laws of Human Nature",
    wikiSearch: "Robert_Greene_(American_author)",
    theme: "discipline",
    psychologicalConcept: "Affective self-regulation and rational supremacy",
    communityQuestion: "What triggers you into losing emotional composure, and how will you disarm it?"
  },
  {
    quote: "Never outshine the master. All superiority is odious, but superiority over a master is fatal.",
    author: "Robert Greene",
    credentials: "Author of The 48 Laws of Power & Laws of Human Nature",
    wikiSearch: "Robert_Greene_(American_author)",
    theme: "strategy",
    psychologicalConcept: "Status threat dynamics in organizational hierarchies",
    communityQuestion: "Have you ever made someone in authority insecure without realizing it?"
  },
  {
    quote: "Do not leave your reputation to chance; it is your life’s artwork, craft it with ruthless discipline.",
    author: "Robert Greene",
    credentials: "Author of The 48 Laws of Power & Laws of Human Nature",
    wikiSearch: "Robert_Greene_(American_author)",
    theme: "mastery",
    psychologicalConcept: "Reputational capital & social architecture",
    communityQuestion: "What single quality do you want people to associate with your name when you leave the room?"
  },

  // Friedrich Nietzsche
  {
    quote: "No price is too high to pay for the privilege of owning yourself.",
    author: "Prof. Friedrich Nietzsche",
    credentials: "Chair of Classical Philology • University of Basel",
    wikiSearch: "Friedrich_Nietzsche",
    directUrl: "https://upload.wikimedia.org/wikipedia/commons/1/1b/Nietzsche187a.jpg",
    theme: "sovereignty",
    psychologicalConcept: "Radical autonomy vs herd conformity",
    communityQuestion: "What compromise are you making with other people's expectations that is costing your self-respect?"
  },
  {
    quote: "When you gaze long into an abyss, the abyss also gazes into you.",
    author: "Prof. Friedrich Nietzsche",
    credentials: "Chair of Classical Philology • University of Basel",
    wikiSearch: "Friedrich_Nietzsche",
    directUrl: "https://upload.wikimedia.org/wikipedia/commons/1/1b/Nietzsche187a.jpg",
    theme: "psychology",
    psychologicalConcept: "Psychological osmosis when confronting malevolence",
    communityQuestion: "Are you fighting your dark thoughts, or becoming consumed by them?"
  },
  {
    quote: "The surest way to corrupt a youth is to instruct him to hold in higher esteem those who think alike than those who think differently.",
    author: "Prof. Friedrich Nietzsche",
    credentials: "Chair of Classical Philology • University of Basel",
    wikiSearch: "Friedrich_Nietzsche",
    directUrl: "https://upload.wikimedia.org/wikipedia/commons/1/1b/Nietzsche187a.jpg",
    theme: "truth",
    psychologicalConcept: "Echo chamber dynamics and intellectual stagnation",
    communityQuestion: "Do you seek out people who challenge your assumptions or people who echo your comfort?"
  },
  {
    quote: "He who has a why to live can bear almost any how.",
    author: "Prof. Friedrich Nietzsche",
    credentials: "Chair of Classical Philology • University of Basel",
    wikiSearch: "Friedrich_Nietzsche",
    directUrl: "https://upload.wikimedia.org/wikipedia/commons/1/1b/Nietzsche187a.jpg",
    theme: "fortitude",
    psychologicalConcept: "Teleological purpose as an antidote to existential suffering",
    communityQuestion: "What purpose gives you strength when everything around you seems heavy?"
  },

  // Fyodor Dostoevsky
  {
    quote: "The man who has a conscience suffers whilst acknowledging his sin. That is his punishment.",
    author: "Fyodor Dostoevsky",
    credentials: "Author of Crime and Punishment • Russian Philosopher",
    wikiSearch: "Fyodor_Dostoevsky",
    directUrl: "https://upload.wikimedia.org/wikipedia/commons/7/78/Vasily_Perov_-_%D0%9F%D0%BE%D1%80%D1%82%D1%80%D0%B5%D1%82_%D0%A4.%D0%9C.%D0%94%D0%BE%D1%81%D1%82%D0%BE%D0%B5%D0%B2%D1%81%D0%BA%D0%BE%D0%B3%D0%BE_-_Google_Art_Project.jpg",
    theme: "conscience",
    psychologicalConcept: "Moral psychology & the inescapable burden of guilt",
    communityQuestion: "Is your conscience quiet today because you acted with integrity, or because you ignored it?"
  },
  {
    quote: "Pain and suffering are always inevitable for a large intelligence and a deep heart.",
    author: "Fyodor Dostoevsky",
    credentials: "Author of Crime and Punishment • Russian Philosopher",
    wikiSearch: "Fyodor_Dostoevsky",
    directUrl: "https://upload.wikimedia.org/wikipedia/commons/7/78/Vasily_Perov_-_%D0%9F%D0%BE%D1%80%D1%82%D1%80%D0%B5%D1%82_%D0%A4.%D0%9C.%D0%94%D0%BE%D1%81%D1%82%D0%BE%D0%B5%D0%B2%D1%81%D0%BA%D0%BE%D0%B3%D0%BE_-_Google_Art_Project.jpg",
    theme: "fortitude",
    psychologicalConcept: "High cognitive sensitivity coupled with emotional depth",
    communityQuestion: "Has your greatest struggle also been the source of your deepest understanding?"
  },
  {
    quote: "To go wrong in one's own way is better than to go right in someone else's.",
    author: "Fyodor Dostoevsky",
    credentials: "Author of Crime and Punishment • Russian Philosopher",
    wikiSearch: "Fyodor_Dostoevsky",
    directUrl: "https://upload.wikimedia.org/wikipedia/commons/7/78/Vasily_Perov_-_%D0%9F%D0%BE%D1%80%D1%82%D1%80%D0%B5%D1%82_%D0%A4.%D0%9C.%D0%94%D0%BE%D1%81%D1%82%D0%BE%D0%B5%D0%B2%D1%81%D0%BA%D0%BE%D0%B3%D0%BE_-_Google_Art_Project.jpg",
    theme: "sovereignty",
    psychologicalConcept: "Experiential learning through genuine individuality",
    communityQuestion: "Are you living a script written by someone else, or authoring your own path?"
  },

  // Sigmund Freud
  {
    quote: "Unexpressed emotions will never die. They are buried alive and will come forth later in uglier ways.",
    author: "Sigmund Freud",
    credentials: "Founder of Psychoanalysis • Neurologist",
    wikiSearch: "Sigmund_Freud",
    directUrl: "https://upload.wikimedia.org/wikipedia/commons/3/36/Sigmund_Freud%2C_by_Max_Halberstadt_%28cropped%29.jpg",
    theme: "subconscious",
    psychologicalConcept: "Repression and neurotic symptom emergence",
    communityQuestion: "What resentment or fear are you burying right now instead of resolving directly?"
  },
  {
    quote: "Out of your vulnerabilities will come your strength.",
    author: "Sigmund Freud",
    credentials: "Founder of Psychoanalysis • Neurologist",
    wikiSearch: "Sigmund_Freud",
    directUrl: "https://upload.wikimedia.org/wikipedia/commons/3/36/Sigmund_Freud%2C_by_Max_Halberstadt_%28cropped%29.jpg",
    theme: "confidence",
    psychologicalConcept: "Sublimation & post-traumatic psychological growth",
    communityQuestion: "Which past insecurity has actually forced you to develop your greatest skill?"
  },
  {
    quote: "Most people do not really want freedom, because freedom involves responsibility, and most people are frightened of responsibility.",
    author: "Sigmund Freud",
    credentials: "Founder of Psychoanalysis • Neurologist",
    wikiSearch: "Sigmund_Freud",
    directUrl: "https://upload.wikimedia.org/wikipedia/commons/3/36/Sigmund_Freud%2C_by_Max_Halberstadt_%28cropped%29.jpg",
    theme: "psychology",
    psychologicalConcept: "Fear of autonomy & flight into dependency",
    communityQuestion: "Are you truly seeking independence, or an excuse to avoid total accountability?"
  },

  // Marcus Aurelius
  {
    quote: "You have power over your mind, not outside events. Realize this, and you will find strength.",
    author: "Marcus Aurelius",
    credentials: "Roman Emperor & Stoic Philosopher • Meditations",
    wikiSearch: "Marcus_Aurelius",
    directUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Marcus_Aurelius_Glyptothek_Munich.jpg",
    theme: "sovereignty",
    psychologicalConcept: "Cognitive appraisal & internal attribution of control",
    communityQuestion: "Which outside noise or circumstance will you consciously stop worrying about today?"
  },
  {
    quote: "The soul becomes dyed with the color of its thoughts.",
    author: "Marcus Aurelius",
    credentials: "Roman Emperor & Stoic Philosopher • Meditations",
    wikiSearch: "Marcus_Aurelius",
    directUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Marcus_Aurelius_Glyptothek_Munich.jpg",
    theme: "discipline",
    psychologicalConcept: "Neuroplasticity through habitual internal monologue",
    communityQuestion: "What recurring thought will you replace with calm conviction today?"
  },
  {
    quote: "It never ceases to amaze me: we all love ourselves more than other people, but care more about their opinion than our own.",
    author: "Marcus Aurelius",
    credentials: "Roman Emperor & Stoic Philosopher • Meditations",
    wikiSearch: "Marcus_Aurelius",
    directUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Marcus_Aurelius_Glyptothek_Munich.jpg",
    theme: "psychology",
    psychologicalConcept: "Paradox of social validation vs self-love",
    communityQuestion: "Whose opinion did you care about today that has zero impact on your actual future?"
  },
  {
    quote: "Reject your sense of injury and the injury itself disappears.",
    author: "Marcus Aurelius",
    credentials: "Roman Emperor & Stoic Philosopher • Meditations",
    wikiSearch: "Marcus_Aurelius",
    directUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Marcus_Aurelius_Glyptothek_Munich.jpg",
    theme: "defense",
    psychologicalConcept: "Subjective interpretation determining emotional trauma",
    communityQuestion: "Can you drop a grudge today and realize that holding onto it only hurts you?"
  },

  // Seneca the Younger
  {
    quote: "We suffer more often in imagination than in reality.",
    author: "Seneca the Younger",
    credentials: "Roman Statesman, Dramatist & Stoic Moralist",
    wikiSearch: "Seneca_the_Younger",
    directUrl: "https://upload.wikimedia.org/wikipedia/commons/4/47/Pseudo-Seneca_Naples.jpg",
    theme: "mindset",
    psychologicalConcept: "Catastrophizing & anticipatory anxiety bias",
    communityQuestion: "What worst-case scenario have you been replaying that has never actually happened?"
  },
  {
    quote: "No man was ever wise by chance.",
    author: "Seneca the Younger",
    credentials: "Roman Statesman, Dramatist & Stoic Moralist",
    wikiSearch: "Seneca_the_Younger",
    directUrl: "https://upload.wikimedia.org/wikipedia/commons/4/47/Pseudo-Seneca_Naples.jpg",
    theme: "mastery",
    psychologicalConcept: "Deliberate cognitive cultivation over passive existence",
    communityQuestion: "What deliberate habit did you execute today to build real wisdom?"
  },
  {
    quote: "If a man knows not to which port he sails, no wind is favorable.",
    author: "Seneca the Younger",
    credentials: "Roman Statesman, Dramatist & Stoic Moralist",
    wikiSearch: "Seneca_the_Younger",
    directUrl: "https://upload.wikimedia.org/wikipedia/commons/4/47/Pseudo-Seneca_Naples.jpg",
    theme: "strategy",
    psychologicalConcept: "Goal clarity directing cognitive filters",
    communityQuestion: "What is your single most important priority for this quarter?"
  },

  // Epictetus
  {
    quote: "No man is free who is not master of himself.",
    author: "Epictetus",
    credentials: "Stoic Philosopher • Founder of the Nicopolis School",
    wikiSearch: "Epictetus",
    directUrl: "https://upload.wikimedia.org/wikipedia/commons/5/58/Epicteti_Enchiridion_Latinis_versibus_adumbratum_%281715%29_Epictetus.jpg",
    theme: "mastery",
    psychologicalConcept: "Inhibitory control as the only genuine human liberty",
    communityQuestion: "In which area of your life does your discipline need to match your ambition?"
  },
  {
    quote: "Small-minded people blame others. Average people blame themselves. The wise see all blame as foolishness.",
    author: "Epictetus",
    credentials: "Stoic Philosopher • Founder of the Nicopolis School",
    wikiSearch: "Epictetus",
    directUrl: "https://upload.wikimedia.org/wikipedia/commons/5/58/Epicteti_Enchiridion_Latinis_versibus_adumbratum_%281715%29_Epictetus.jpg",
    theme: "wisdom",
    psychologicalConcept: "Transcendence beyond reactive blame toward constructive action",
    communityQuestion: "Are you still looking for someone to blame for your present circumstances?"
  },
  {
    quote: "It's not what happens to you, but how you react to it that matters.",
    author: "Epictetus",
    credentials: "Stoic Philosopher • Founder of the Nicopolis School",
    wikiSearch: "Epictetus",
    directUrl: "https://upload.wikimedia.org/wikipedia/commons/5/58/Epicteti_Enchiridion_Latinis_versibus_adumbratum_%281715%29_Epictetus.jpg",
    theme: "defense",
    psychologicalConcept: "Cognitive reappraisal of external stimuli",
    communityQuestion: "How will you respond to the next inconvenience with total composure?"
  },

  // Sun Tzu
  {
    quote: "The supreme art of war is to subdue the enemy without fighting.",
    author: "Sun Tzu",
    credentials: "General, Strategist & Philosopher • The Art of War",
    wikiSearch: "Sun_Tzu",
    directUrl: "https://upload.wikimedia.org/wikipedia/commons/0/07/Sun_Tzu.jpg",
    theme: "strategy",
    psychologicalConcept: "Psychological deterrence & conflict resolution without kinetic friction",
    communityQuestion: "What conflict can you resolve today through calm diplomacy rather than aggression?"
  },
  {
    quote: "He will win who knows when to fight and when not to fight.",
    author: "Sun Tzu",
    credentials: "General, Strategist & Philosopher • The Art of War",
    wikiSearch: "Sun_Tzu",
    directUrl: "https://upload.wikimedia.org/wikipedia/commons/0/07/Sun_Tzu.jpg",
    theme: "strategy",
    psychologicalConcept: "Selective cognitive engagement and energy conservation",
    communityQuestion: "What pointless argument or drama are you choosing to walk away from right now?"
  },

  // Blaise Pascal
  {
    quote: "All of humanity's problems stem from man's inability to sit quietly in a room alone.",
    author: "Blaise Pascal",
    credentials: "Mathematician, Physicist & Philosopher • Pensées",
    wikiSearch: "Blaise_Pascal",
    directUrl: "https://upload.wikimedia.org/wikipedia/commons/7/79/Blaise_pascal.jpg",
    theme: "solitude",
    psychologicalConcept: "Divertissement (distraction) to avoid existential reckoning",
    communityQuestion: "When did you last spend an hour completely undistracted with your own thoughts?"
  },

  // Franz Kafka
  {
    quote: "I am a cage, in search of a bird.",
    author: "Franz Kafka",
    credentials: "Author of The Trial & The Metamorphosis",
    wikiSearch: "Franz_Kafka",
    directUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4c/Kafka1906_cropped.jpg",
    theme: "introspection",
    psychologicalConcept: "The unconscious yearning for an emotional anchor",
    communityQuestion: "What hidden expectation are you carrying that keeps you from feeling fulfilled?"
  },
  {
    quote: "Don't bend; don't water it down; rather, follow your most intense obsessions mercilessly.",
    author: "Franz Kafka",
    credentials: "Author of The Trial & The Metamorphosis",
    wikiSearch: "Franz_Kafka",
    directUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4c/Kafka1906_cropped.jpg",
    theme: "action",
    psychologicalConcept: "Uncompromising artistic and personal focus",
    communityQuestion: "What project or vision are you holding back on that deserves your ruthless devotion?"
  },

  // Dr. Viktor Frankl
  {
    quote: "Between stimulus and response there is a space. In that space is our power to choose our response.",
    author: "Dr. Viktor Frankl",
    credentials: "Neurologist & Psychiatrist • Man's Search for Meaning",
    wikiSearch: "Viktor_Frankl",
    directUrl: "https://upload.wikimedia.org/wikipedia/commons/2/29/Viktor_Frankl2.jpg",
    theme: "choice",
    psychologicalConcept: "Metacognitive gap between emotional trigger and behavior",
    communityQuestion: "When was the last time you paused in that space before reacting?"
  },
  {
    quote: "When we are no longer able to change a situation, we are challenged to change ourselves.",
    author: "Dr. Viktor Frankl",
    credentials: "Neurologist & Psychiatrist • Man's Search for Meaning",
    wikiSearch: "Viktor_Frankl",
    directUrl: "https://upload.wikimedia.org/wikipedia/commons/2/29/Viktor_Frankl2.jpg",
    theme: "defense",
    psychologicalConcept: "Radical acceptance and internal resilience",
    communityQuestion: "What unchangeable circumstance in your life requires you to adapt your internal mindset?"
  },

  // Søren Kierkegaard
  {
    quote: "Anxiety is the dizziness of freedom.",
    author: "Søren Kierkegaard",
    credentials: "Philosopher & Theologian • Concept of Anxiety",
    wikiSearch: "S%C3%B8ren_Kierkegaard",
    directUrl: "https://upload.wikimedia.org/wikipedia/commons/6/6b/Kierkegaard.jpg",
    theme: "freedom",
    psychologicalConcept: "Existential paralysis born from infinite possibility",
    communityQuestion: "Are you anxious because of too many obstacles, or the overwhelming responsibility to choose?"
  },

  // Baltasar Gracián
  {
    quote: "Leave people hungry. Even with physical thirst, it is a sign of good taste to leave people with a craving.",
    author: "Baltasar Gracián",
    credentials: "Author of The Art of Worldly Wisdom • Jesuit Philosopher",
    wikiSearch: "Baltasar_Graci%C3%A1n",
    theme: "influence",
    psychologicalConcept: "Strategic scarcity and the psychology of desire",
    communityQuestion: "Do you over-explain yourself, or do you leave a sense of mystery and restraint?"
  }
];

/**
 * Curated Viral Psychology & Stoicism Hashtags for high CTR and algorithmic discoverability
 */
const VIRAL_PSYCHOLOGY_TAGS = [
  '#stoic',
  '#stoicism',
  '#psychology',
  '#mindset',
  '#motivation',
  '#quotes',
  '#wisdom',
  '#philosophy',
  '#shorts',
  '#darkpsychology',
  '#power',
  '#humanbehavior',
  '#mindsetshift',
  '#viral',
  '#discipline'
];

/**
 * Generate viral title with strong psychological hook
 */
function generatePsychologyViralTitle(scholar) {
  const psychologyHooks = [
    `The Cold Psychology of Human Nature — ${scholar.author} #Shorts`,
    `The 3 Stages of Truth — ${scholar.author} #Shorts`,
    `How Your Unconscious Dictates Your Life — ${scholar.author} #Shorts`,
    `Why Most People Suffer More in Their Minds — ${scholar.author} #Shorts`,
    `The Power Dynamic You Were Never Taught — ${scholar.author} #Shorts`,
    `Silence Your Ego Before It Destroys You — ${scholar.author} #Shorts`,
    `The Brutal Truth About Self-Control — ${scholar.author} #Shorts`,
    `Master Your Emotions Before They Master You — ${scholar.author} #Shorts`,
    `Never Disrespect Your Own Time — ${scholar.author} #Shorts`,
    `The Hardest Reality of Power — ${scholar.author} #Shorts`
  ];

  const seed = Math.abs(scholar.author.split('').reduce((a, c) => a + c.charCodeAt(0), 0) + scholar.quote.length);
  let baseTitle = psychologyHooks[seed % psychologyHooks.length];

  // Append core viral tags while keeping within YouTube 100 char limit
  const extraTags = ['#stoic', '#psychology', '#philosophy'];
  for (const tag of extraTags) {
    if (!baseTitle.includes(tag) && (baseTitle + ' ' + tag).length <= 98) {
      baseTitle += ' ' + tag;
    }
  }
  return baseTitle;
}

module.exports = {
  CURATED_PSYCHOLOGY_QUOTES,
  VIRAL_PSYCHOLOGY_TAGS,
  generatePsychologyViralTitle
};
