/**
 * Emotional Impact Long-Form Video Engine
 * Channel Targets:
 * - Channel 2: The Stoic Architect (Stoic / Mindset)
 * - Channel 3: MindRush (Teenager / Youth Discipline)
 *
 * Implements the Viral Multi-Slide Emotional Contrast Format:
 * - Slide 1-3: Brutal, relatable juxtapositions ("You can [do everything right] and still [face heartbreak/loss/defeat]")
 * - Slide 4: The Cold Reality Check ("Life does not care about your feelings or effort alone...")
 * - Slide 5: The Existential Pivot ("So why try? Because surrender is guaranteed defeat. Effort guarantees you die without regret.")
 * - Slide 6 (Ending Screen): Pure Black Blank Screen with Fin-Channel Card Aesthetics (but dark),
 *   displaying the Backup Quote, Philosopher/Author, and Channel Watermark.
 * - Soundtrack: Emotional, melancholic soft piano accompaniment.
 */

const fs = require('fs');
const path = require('path');

const STOIC_EMOTIONAL_NARRATIVES = [
  {
    theme: "effort_vs_outcome",
    title: "Why Effort Doesn't Guarantee Victory",
    slides: [
      {
        line1: "You can study 12 hours a day",
        highlight: "and still fail the exam.",
        line2: "You can give someone your purest loyalty,",
        highlight2: "and still be betrayed."
      },
      {
        line1: "You can train your body every single day",
        highlight: "and still fall sick.",
        line2: "You can be the most dedicated worker,",
        highlight2: "and get replaced in 60 seconds."
      },
      {
        line1: "You can sacrifice your entire youth building",
        highlight: "and still watch the market wipe it out.",
        line2: "The world owes you zero guarantees",
        highlight2: "just because you bled for it."
      },
      {
        line1: "Life doesn't care about your tears.",
        highlight: "It only tests your ability to endure chaos",
        line2: "and fate outside your control."
      },
      {
        line1: "So why keep standing? Why keep trying?",
        highlight: "Because quitting is the only true defeat.",
        line2: "Effort doesn't guarantee an easy life.",
        highlight2: "It guarantees you will never look in the mirror with regret."
      }
    ],
    backupQuote: {
      quote: "You have power over your mind — not outside events. Realize this, and you will find strength.",
      author: "Marcus Aurelius",
      title: "Roman Emperor & Stoic Philosopher",
      reference: "Meditations, Book IV"
    }
  },
  {
    theme: "loneliness_of_discipline",
    title: "The Silent Cost of Self-Mastery",
    slides: [
      {
        line1: "You can stay home every weekend working,",
        highlight: "and watch people who party get ahead.",
        line2: "You can tell the complete truth,",
        highlight2: "and still be labeled the villain."
      },
      {
        line1: "You can pour your soul into loving someone,",
        highlight: "and still become a stranger to them.",
        line2: "You can solve everyone's problems in silence,",
        highlight2: "and have no one check on you."
      },
      {
        line1: "External rewards do not track goodness.",
        highlight: "The wicked often feast while the disciplined starve.",
        line2: "If you want fairness from reality,",
        highlight2: "you will die bitter."
      },
      {
        line1: "So why choose the harder road?",
        highlight: "Because cheap pleasure rots the soul.",
        line2: "True sovereignty is wanting nothing",
        highlight2: "that fate can take from you."
      },
      {
        line1: "Your dignity is not for sale.",
        highlight: "Master what you control: your discipline, your mind,",
        line2: "and your unbreakable silence."
      }
    ],
    backupQuote: {
      quote: "Difficulties strengthen the mind, as labor does the body. A man is as wretched as he has convinced himself he is.",
      author: "Seneca",
      title: "Stoic Statesman & Dramatist",
      reference: "Letters from a Stoic (Epistulae Morales)"
    }
  },
  {
    theme: "amor_fati",
    title: "Accepting the Uncontrollable Fire",
    slides: [
      {
        line1: "You can plan your entire decade down to the day,",
        highlight: "and one accident erases it all.",
        line2: "You can protect your peace with boundaries,",
        highlight2: "and grief will still breach your door."
      },
      {
        line1: "You can be completely blameless,",
        highlight: "and still lose everything you cherish.",
        line2: "Fate does not negotiate with human plans.",
        highlight2: "The wheel turns without your permission."
      },
      {
        line1: "The weak cry out: 'Why did this happen to me?'",
        highlight: "The strong ask: 'How will I transform this fire?'",
        line2: "What happens to you is external.",
        highlight2: "Who you become is entirely yours."
      },
      {
        line1: "Do not demand that things happen as you wish.",
        highlight: "Wish that they happen as they do,",
        line2: "and you will go on in peace."
      },
      {
        line1: "Endure and renounce.",
        highlight: "The fire does not consume the gold;",
        line2: "it burns away the dross.",
        highlight2: "Stand unmoved."
      }
    ],
    backupQuote: {
      quote: "He is a wise man who does not grieve for the things which he has not, but rejoices for those which he has.",
      author: "Epictetus",
      title: "Former Slave & Stoic Master",
      reference: "Discourses & Enchiridion"
    }
  },
  {
    theme: "unshakeable_resolve",
    title: "The Law of the Unbroken Mind",
    slides: [
      {
        line1: "You can give 100% of your energy to a dream,",
        highlight: "and wake up with zero followers and zero money.",
        line2: "You can help someone stand on their feet,",
        highlight2: "and watch them kick away your ladder."
      },
      {
        line1: "People will forget your sacrifices in a minute.",
        highlight: "The world will test your breaking point repeatedly.",
        line2: "If your peace depends on applause,",
        highlight2: "you are already a prisoner."
      },
      {
        line1: "Expect treason from false friends.",
        highlight: "Expect silence from those you saved.",
        line2: "Expect fate to test your knees.",
        highlight2: "None of it changes your duty."
      },
      {
        line1: "So why wake up at 5 AM again?",
        highlight: "Because a lion does not beg for meat.",
        line2: "You are not here to be comfortable.",
        highlight2: "You are here to become indomitable."
      },
      {
        line1: "Lock your eyes on the horizon.",
        highlight: "Do what duty demands, without complaint,",
        line2: "and leave the rest to the gods."
      }
    ],
    backupQuote: {
      quote: "The impediment to action advances action. What stands in the way becomes the way.",
      author: "Marcus Aurelius",
      title: "Emperor of Rome",
      reference: "Meditations, Book V.20"
    }
  }
];

const TEEN_EMOTIONAL_NARRATIVES = [
  {
    theme: "teen_silent_grind",
    title: "When You Do Everything Right and Still Feel Invisible",
    slides: [
      {
        line1: "You can study until 2:00 AM every night,",
        highlight: "and still blank out on the exam paper.",
        line2: "You can be genuine to everyone in the group,",
        highlight2: "and still get left out of the weekend plans."
      },
      {
        line1: "You can show up to every single practice first,",
        highlight: "and still sit on the bench while others play.",
        line2: "You can try to fix your habits and cut off bad friends,",
        highlight2: "and end up eating lunch completely alone."
      },
      {
        line1: "You scroll social media and see people who don't care",
        highlight: "getting the attention, the friends, and the easy life.",
        line2: "And a voice whispers in your head:",
        highlight2: "'Why am I trying so hard when nobody notices?'"
      },
      {
        line1: "Here is the raw truth your school won't tell you:",
        highlight: "Nobody is coming to save you.",
        line2: "The scoreboard only tests your patience.",
        highlight2: "The silence is where your real character is forged."
      },
      {
        line1: "Do not stop. Do not fold.",
        highlight: "Discipline isn't about getting their applause.",
        line2: "It's about looking in the mirror five years from now",
        highlight2: "and respecting the monster you built in private."
      }
    ],
    backupQuote: {
      quote: "You have to build calluses on your brain just like you build calluses on your hands. Don't stop when you're tired; stop when you're done.",
      author: "David Goggins",
      title: "Ultra-Endurance Athlete & Navy SEAL",
      reference: "Can't Hurt Me: Master Your Mind"
    }
  },
  {
    theme: "teen_misunderstood_dreams",
    title: "They Laugh Because They Already Gave Up",
    slides: [
      {
        line1: "You tell your closest friends what you want to achieve,",
        highlight: "and they laugh in your face like it's a joke.",
        line2: "You put your heart into learning a new skill,",
        highlight2: "and your family tells you to 'just be realistic.'"
      },
      {
        line1: "You delete TikTok and start reading books,",
        highlight: "and they say you think you're 'better than everyone.'",
        line2: "You try to change your life,",
        highlight2: "and the people closest to you pull you back down."
      },
      {
        line1: "It hurts when the people you love don't believe in you.",
        highlight: "It makes you want to quit just to fit in again.",
        line2: "But understand this before you give up:",
        highlight2: "They don't hate your dream. They hate their own surrender."
      },
      {
        line1: "If you stay comfortable, you stay average.",
        highlight: "You have to be willing to be misunderstood for a season",
        line2: "to build a life that lasts a lifetime."
      },
      {
        line1: "Keep grinding in the shadows.",
        highlight: "Don't argue with them. Don't explain your vision.",
        line2: "Let your results make the noise.",
        highlight2: "Silence the room with execution."
      }
    ],
    backupQuote: {
      quote: "Those who dare to fail miserably can achieve greatly. When you want to succeed as bad as you want to breathe, then you will be successful.",
      author: "Eric Thomas",
      title: "World Renowned Motivational Speaker",
      reference: "The Secret to Success"
    }
  },
  {
    theme: "teen_relapse_and_rising",
    title: "When You Fall After Trying So Hard",
    slides: [
      {
        line1: "You stayed disciplined for 2 weeks straight,",
        highlight: "and then relapsed into your worst habits in one night.",
        line2: "The disgust hits you in the chest.",
        highlight2: "You feel like all your progress was fake."
      },
      {
        line1: "You see other people looking confident and happy,",
        highlight: "while you are fighting wars inside your own head.",
        line2: "You wonder if you are just broken,",
        highlight2: "if discipline just isn't built for you."
      },
      {
        line1: "Listen carefully: A relapse does not erase your strength.",
        highlight: "The only real defeat is choosing to stay down.",
        line2: "Every champion you admire",
        highlight2: "lost hundreds of invisible battles you never saw."
      },
      {
        line1: "Forgive yourself right now.",
        highlight: "Wash your face. Stand up. Reset the clock.",
        line2: "The person who falls seven times and stands up eight",
        highlight2: "is 100 times more dangerous than someone who never fell."
      },
      {
        line1: "This is your turning point.",
        highlight: "No more excuses. No more self-pity.",
        line2: "Lock back in.",
        highlight2: "Your future self is begging you not to quit today."
      }
    ],
    backupQuote: {
      quote: "It's not whether you get knocked down; it's whether you get up. The greatest glory in living lies not in never falling, but in rising every time we fall.",
      author: "Vince Lombardi",
      title: "Legendary Coach & Hall of Famer",
      reference: "What It Takes to Be Number One"
    }
  }
];

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Builds the narrative slides (Slides 1-5) with high contrast, readable typography
 * on a dark feathered gradient background.
 */
function buildNarrativeSlideSvg(slide, slideIndex, totalSlides, channelKey = 'stoic', width = 1080, height = 1920) {
  const accentColor = channelKey === 'stoic' ? '#f59e0b' : '#38bdf8';
  const badgeText = channelKey === 'stoic' ? '⚡ HARD TRUTH' : '⚡ REAL TALK';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <filter id="textGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="4" stdDeviation="12" flood-color="#000000" flood-opacity="1.0" />
        <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000000" flood-opacity="0.95" />
      </filter>
      <linearGradient id="narrativeVignette" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000000" stop-opacity="0.25" />
        <stop offset="35%" stop-color="#020617" stop-opacity="0.75" />
        <stop offset="65%" stop-color="#020617" stop-opacity="0.92" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.98" />
      </linearGradient>
    </defs>

    <!-- Deep cinematic vignette overlay for pure text readability -->
    <rect x="0" y="0" width="${width}" height="${height}" fill="url(#narrativeVignette)" />

    <!-- Top Beat Indicator / Step Badge -->
    <g transform="translate(540, 680)">
      <rect x="-140" y="-22" width="280" height="44" rx="22" fill="#000000" fill-opacity="0.65" stroke="${accentColor}" stroke-width="1.8" />
      <text x="0" y="6" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="900" fill="${accentColor}" letter-spacing="4" text-anchor="middle">
        ${badgeText} (${slideIndex}/${totalSlides})
      </text>
    </g>

    <!-- Main Juxtaposition Statement -->
    <text x="540" y="860" font-family="Georgia, serif" font-size="46" font-weight="900" fill="#f8fafc" text-anchor="middle" filter="url(#textGlow)">
      <tspan x="540" dy="0">${escapeXml(slide.line1)}</tspan>
    </text>

    <!-- Highlight Callout (Emotional Punch) -->
    <text x="540" y="970" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="900" fill="${accentColor}" text-anchor="middle" filter="url(#textGlow)" letter-spacing="0.5">
      <tspan x="540" dy="0">${escapeXml(slide.highlight)}</tspan>
    </text>

    <!-- Divider Bar -->
    <line x1="420" y1="1080" x2="660" y2="1080" stroke="${accentColor}" stroke-width="2.5" stroke-linecap="round" stroke-opacity="0.8" />

    <!-- Secondary Reality Statement (if present) -->
    ${slide.line2 ? `
    <text x="540" y="1170" font-family="Georgia, serif" font-size="42" font-weight="700" fill="#cbd5e1" text-anchor="middle" filter="url(#textGlow)">
      <tspan x="540" dy="0">${escapeXml(slide.line2)}</tspan>
    </text>` : ''}

    ${slide.highlight2 ? `
    <text x="540" y="1260" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="900" fill="#ffffff" text-anchor="middle" filter="url(#textGlow)">
      <tspan x="540" dy="0">${escapeXml(slide.highlight2)}</tspan>
    </text>` : ''}

    <!-- Subtle audio note -->
    <text x="540" y="1780" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="#64748b" letter-spacing="2" text-anchor="middle">
      🎵 Soft Emotional Piano · Listen Carefully
    </text>
  </svg>`;
}

/**
 * Builds the ending screen: Pure black blank screen with fin-channel card aesthetics (but dark),
 * displaying the Backup Quote, Author Credentials, and Channel Watermark.
 */
function buildEndingBlankQuoteCardSvg(backupQuote, channelKey = 'stoic', watermarkHandle = '', width = 1080, height = 1920) {
  const accentColor = channelKey === 'stoic' ? '#f59e0b' : '#38bdf8';
  const badgeTitle = channelKey === 'stoic' ? 'THE ANCIENT COMPASS' : 'THE UNBREAKABLE MINDSET';
  const defaultWatermark = channelKey === 'stoic' ? '@TheStoicArchitect' : '@MindRush';
  const activeWatermark = (watermarkHandle || defaultWatermark).toUpperCase();

  // Word wrap quote into clean lines
  const quoteWords = backupQuote.quote.split(/\s+/);
  const maxChars = backupQuote.quote.length > 100 ? 25 : 22;
  const lines = [];
  let cur = '';
  for (const w of quoteWords) {
    if ((cur + ' ' + w).trim().length > maxChars) {
      if (cur) lines.push(cur.trim());
      cur = w;
    } else {
      cur = (cur + ' ' + w).trim();
    }
  }
  if (cur) lines.push(cur.trim());

  const numLines = lines.length;
  const fontSize = numLines > 4 ? 40 : (numLines === 4 ? 46 : 52);
  const lineHeight = Math.round(fontSize * 1.45);
  const quoteTspans = lines.map((l, i) =>
    `<tspan x="540" dy="${i === 0 ? 0 : lineHeight}">${escapeXml(l)}</tspan>`
  ).join('\n        ');

  const blockHeight = (numLines - 1) * lineHeight;
  const quoteStartY = 960 - Math.round(blockHeight / 2);
  const dividerY = quoteStartY + blockHeight + 65;
  const authorY = dividerY + 55;
  const titleY = authorY + 38;
  const refY = titleY + 34;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <!-- Deep Obsidian Dark Gradients matching Fin Channel luxury card, but pitch black -->
      <linearGradient id="darkBlankBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#02040a" />
        <stop offset="50%" stop-color="#000000" />
        <stop offset="100%" stop-color="#02040a" />
      </linearGradient>

      <!-- Sleek Glowing Minimal Border identical to Fin Luxury Card -->
      <linearGradient id="cardBorderGlow" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.85" />
        <stop offset="35%" stop-color="#ffffff" stop-opacity="0.35" />
        <stop offset="70%" stop-color="${accentColor}" stop-opacity="0.65" />
        <stop offset="100%" stop-color="#020617" stop-opacity="0.4" />
      </linearGradient>

      <linearGradient id="innerCardBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#080c18" stop-opacity="0.96" />
        <stop offset="100%" stop-color="#020408" stop-opacity="0.99" />
      </linearGradient>

      <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="0" stdDeviation="16" flood-color="${accentColor}" flood-opacity="0.4" />
        <feDropShadow dx="0" dy="8" stdDeviation="24" flood-color="#000000" flood-opacity="0.9" />
      </filter>

      <filter id="textGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000000" flood-opacity="1.0" />
      </filter>
    </defs>

    <!-- 1. Pure Pitch Black Canvas Base -->
    <rect width="${width}" height="${height}" fill="url(#darkBlankBg)" />

    <!-- Subtle radial corner glow -->
    <circle cx="540" cy="960" r="650" fill="${accentColor}" fill-opacity="0.04" />

    <!-- 2. Dark Luxury Floating Card (Aesthetics from Fin Channel, but Dark) -->
    <rect x="70" y="520" width="940" height="980" rx="36" fill="url(#innerCardBg)" stroke="url(#cardBorderGlow)" stroke-width="2.5" filter="url(#goldGlow)" />

    <!-- Top Badge Inside Card -->
    <g transform="translate(540, 580)">
      <rect x="-190" y="-20" width="380" height="40" rx="20" fill="${accentColor}" fill-opacity="0.14" stroke="${accentColor}" stroke-width="1.5" />
      <circle cx="-160" cy="0" r="4.5" fill="${accentColor}" />
      <text x="5" y="6" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="900" fill="${accentColor}" letter-spacing="3.5" text-anchor="middle">
        ${badgeTitle}
      </text>
    </g>

    <!-- Stylized Elegant Quotation Mark -->
    <text x="540" y="${quoteStartY - 60}" font-family="Georgia, serif" font-size="110" font-weight="900" fill="${accentColor}" fill-opacity="0.75" text-anchor="middle" filter="url(#textGlow)">“</text>

    <!-- Complete High-Contrast Backup Quote Text -->
    <text x="540" y="${quoteStartY}" font-family="Georgia, serif" font-size="${fontSize}" font-weight="800" fill="#ffffff" text-anchor="middle" filter="url(#textGlow)">
      ${quoteTspans}
    </text>

    <!-- Accent Divider Bar in Warm Gold / Cyan -->
    <line x1="380" y1="${dividerY}" x2="700" y2="${dividerY}" stroke="${accentColor}" stroke-width="2" stroke-linecap="round" stroke-opacity="0.85" />

    <!-- Author Attribution -->
    <text x="540" y="${authorY}" font-family="system-ui, -apple-system, sans-serif" font-size="30" font-weight="900" fill="#f8fafc" letter-spacing="2" text-anchor="middle" filter="url(#textGlow)">
      — ${escapeXml(backupQuote.author)}
    </text>

    <!-- Author Title / Credentials -->
    <text x="540" y="${titleY}" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="700" fill="#cbd5e1" letter-spacing="1" text-anchor="middle">
      ${escapeXml(backupQuote.title)}
    </text>

    <!-- Work Citation / Reference -->
    ${backupQuote.reference ? `
    <text x="540" y="${refY}" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="500" fill="#94a3b8" letter-spacing="0.8" text-anchor="middle">
      ${escapeXml(backupQuote.reference)}
    </text>` : ''}

    <!-- 3. Channel Watermark at the Bottom of Card (User Mandate) -->
    <g transform="translate(540, 1435)">
      <rect x="-210" y="-18" width="420" height="36" rx="18" fill="#000000" fill-opacity="0.7" stroke="#334155" stroke-width="1.2" />
      <text x="0" y="5" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="800" fill="#f1f5f9" letter-spacing="2.8" text-anchor="middle">
        WATERMARK: ${escapeXml(activeWatermark)}
      </text>
    </g>

    <!-- Follow / Save CTA below card -->
    <text x="540" y="1660" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="800" fill="#94a3b8" letter-spacing="3" text-anchor="middle">
      SAVE THIS FOR WHEN YOU WANT TO QUIT
    </text>
  </svg>`;
}

function selectEmotionalNarrative(channelKey = 'stoic') {
  const pool = channelKey === 'stoic' ? STOIC_EMOTIONAL_NARRATIVES : TEEN_EMOTIONAL_NARRATIVES;
  const item = pool[Math.floor(Math.random() * pool.length)];
  return item;
}

module.exports = {
  STOIC_EMOTIONAL_NARRATIVES,
  TEEN_EMOTIONAL_NARRATIVES,
  selectEmotionalNarrative,
  buildNarrativeSlideSvg,
  buildEndingBlankQuoteCardSvg
};
