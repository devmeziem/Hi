/**
 * MindRush Dynamic Content Engine & Confrontation Vault
 *
 * Generates personalized confrontations (Scene 1: Dismissive Fictional Entity / Persona + Toxic Insult)
 * against (Scene 3: Lethal Throwback Insult + Fix + Glowing Rare Word).
 *
 * Never uses generic "Public Opinion".
 * Integrates live dynamic AI auto-fetching with Gemini / fallback generator for infinite non-duplicate variety.
 */

const fs = require('fs');
const path = require('path');

// 1. Massive Curated Library of Personalized 15-Second Confrontations
const CURATED_15S_CONFRONTATIONS = [
  {
    id: 'mindrush_conf_1',
    format: 'doubt_execution',
    speaker1Label: 'The Bitter Roommate:',
    speaker1Text: 'You look miserable rotting alone in your room on a Friday night, we are out living our best youth.',
    speaker2Label: 'Me:',
    speaker2Line1: 'Waking up hungover with empty pockets on Sunday isn\'t living—I turned isolation into an',
    speaker2Highlight: 'EMPIRE',
    speaker2Line2: 'while you beg your parents for rent money.',
    theme: 'empire_building'
  },
  {
    id: 'mindrush_conf_2',
    format: 'doubt_execution',
    speaker1Label: 'The Guy Who Peaked at 18:',
    speaker1Text: 'You used to be cool, now you\'re just a boring antisocial robot with zero friends.',
    speaker2Label: 'The Reality:',
    speaker2Line1: 'Peaking in high school must be exhausting—I traded temporary clout for an',
    speaker2Highlight: 'UNTOUCHABLE',
    speaker2Line2: 'future you can neither reach nor comprehend.',
    theme: 'untouchable_status'
  },
  {
    id: 'mindrush_conf_3',
    format: 'doubt_execution',
    speaker1Label: 'The 9-to-5 Zombie:',
    speaker1Text: 'Why grind yourself to the bone? You\'ll just die anyway, stop trying so hard to be special.',
    speaker2Label: 'Cold Fact:',
    speaker2Line1: 'Trading 40 years for cubicle panic attacks was your choice—I engineered an',
    speaker2Highlight: 'ANOMALY',
    speaker2Line2: 'while you clock in to build someone else\'s dream.',
    theme: 'the_anomaly'
  },
  {
    id: 'mindrush_conf_4',
    format: 'doubt_execution',
    speaker1Label: 'The Couch Critic:',
    speaker1Text: 'You think you\'re Batman? You\'re just an insecure nobody with a gym pass and an alarm clock.',
    speaker2Label: 'The Slam:',
    speaker2Line1: 'Your biggest daily milestone is moving from the bed to the couch—I forged an',
    speaker2Highlight: 'INDOMITABLE',
    speaker2Line2: 'willpower while you watched my highlights from the cheap seats.',
    theme: 'indomitable_grit'
  },
  {
    id: 'mindrush_conf_5',
    format: 'doubt_execution',
    speaker1Label: 'The Broke Gossip:',
    speaker1Text: 'Look at him acting all mysterious on Instagram, he thinks he\'s the main character in an anime.',
    speaker2Label: 'Reality Check:',
    speaker2Line1: 'Whispering behind people\'s backs is the only workout your jaw gets—I generated',
    speaker2Highlight: 'COLOSSAL',
    speaker2Line2: 'proof while you talked about everyone who actually made it.',
    theme: 'colossal_proof'
  },
  {
    id: 'mindrush_conf_6',
    format: 'doubt_execution',
    speaker1Label: 'The Comfort-Zone Addict:',
    speaker1Text: 'Just relax bro, life is too short to work 14 hours, you look like a walking zombie.',
    speaker2Label: 'Me:',
    speaker2Line1: 'Scrolling TikTok 9 hours a day until your brain turns to mush isn\'t living—I turned discipline into an',
    speaker2Highlight: 'IMMUTABLE',
    speaker2Line2: 'weapon that will buy back my family\'s absolute freedom.',
    theme: 'immutable_freedom'
  },
  {
    id: 'mindrush_conf_7',
    format: 'doubt_execution',
    speaker1Label: 'The Jealous Ex-Friend:',
    speaker1Text: 'You changed so much, you think you\'re too good for the old crew just because you read books.',
    speaker2Label: 'The Truth:',
    speaker2Line1: 'I didn\'t change, I just stopped accepting mediocrity as a lifestyle—I constructed a',
    speaker2Highlight: 'FORTRESS',
    speaker2Line2: 'of results while you stayed complaining in the exact same spot.',
    theme: 'fortress_results'
  },
  {
    id: 'mindrush_conf_8',
    format: 'doubt_execution',
    speaker1Label: 'The Cynical Dropout:',
    speaker1Text: '99% of people fail at your age. Your little obsession is honestly embarrassing to watch.',
    speaker2Label: 'The Slam:',
    speaker2Line1: 'Accepting defeat before even stepping onto the field is your specialty—I created a',
    speaker2Highlight: 'RELENTLESS',
    speaker2Line2: 'standard that renders your pathetic odds completely irrelevant.',
    theme: 'relentless_standard'
  },
  {
    id: 'mindrush_conf_9',
    format: 'doubt_execution',
    speaker1Label: 'The Weekend Partier:',
    speaker1Text: 'Working out on a Saturday night? You have zero personality outside of lifting weights.',
    speaker2Label: 'Reality Check:',
    speaker2Line1: 'Flexing rented bottles on maxed-out credit cards isn\'t a personality—I carved an',
    speaker2Highlight: 'UNSHAKEABLE',
    speaker2Line2: 'body and mind while you paid to poison your organs.',
    theme: 'unshakeable_mind'
  },
  {
    id: 'mindrush_conf_10',
    format: 'doubt_execution',
    speaker1Label: 'The Fake Guru:',
    speaker1Text: 'You\'ll burn out in two months without my $997 shortcut system, you\'re doing it all wrong.',
    speaker2Label: 'Cold Fact:',
    speaker2Line1: 'Selling recycled cliches from your studio apartment won\'t save you—I deployed',
    speaker2Highlight: 'UNCOMPROMISING',
    speaker2Line2: 'effort that obliterates your cheap tricks every single morning.',
    theme: 'uncompromising_effort'
  },
  {
    id: 'mindrush_conf_11',
    format: 'doubt_execution',
    speaker1Label: 'Them:',
    speaker1Text: 'Nobody cares about your little routine, stop acting like you\'re on some sacred mission.',
    speaker2Label: 'Me:',
    speaker2Line1: 'They don\'t care now because they\'re asleep, but I am constructing an',
    speaker2Highlight: 'INVINCIBLE',
    speaker2Line2: 'legacy that will force them to pay attention later.',
    theme: 'invincible_legacy'
  },
  {
    id: 'mindrush_conf_12',
    format: 'doubt_execution',
    speaker1Label: 'The Armchair Philosopher:',
    speaker1Text: 'You don\'t need money or success to be happy, you\'re just trapped in a capitalist rat race.',
    speaker2Label: 'The Reality:',
    speaker2Line1: 'Romanticizing poverty because you\'re too lazy to build is pure delusion—I acquired',
    speaker2Highlight: 'SOVEREIGN',
    speaker2Line2: 'capability while you rationalized being completely powerless.',
    theme: 'sovereign_power'
  },
  {
    id: 'mindrush_conf_13',
    format: 'doubt_execution',
    speaker1Label: 'The Midnight Doomscroller:',
    speaker1Text: 'You look exhausted waking up at 5 AM, nobody is grading you on how miserable you make yourself.',
    speaker2Label: 'The Slam:',
    speaker2Line1: 'Sleeping until noon and complaining you have no time is your daily loop—I seized an',
    speaker2Highlight: 'UNYIELDING',
    speaker2Line2: 'head start while you drowned in useless blue light.',
    theme: 'unyielding_start'
  },
  {
    id: 'mindrush_conf_14',
    format: 'doubt_execution',
    speaker1Label: 'The Fair-Weather Circle:',
    speaker1Text: 'You never come out anymore, you\'re going to wake up at forty completely alone with your money.',
    speaker2Label: 'Cold Fact:',
    speaker2Line1: 'Surrounding myself with people who only celebrate distractions is worse than solitude—I forged a',
    speaker2Highlight: 'TITANIC',
    speaker2Line2: 'purpose that filters out fake friends automatically.',
    theme: 'titanic_purpose'
  },
  {
    id: 'mindrush_conf_15',
    format: 'doubt_execution',
    speaker1Label: 'The Discount Hustler:',
    speaker1Text: 'Why write code and lift heavy when you can just drop-ship and chill on the beach?',
    speaker2Label: 'Me:',
    speaker2Line1: 'Chasing cheap digital gimmicks until your account gets banned isn\'t freedom—I engineered a',
    speaker2Highlight: 'MONUMENTAL',
    speaker2Line2: 'foundation of real mastery that nobody can turn off.',
    theme: 'monumental_foundation'
  },
  {
    id: 'mindrush_conf_16',
    format: 'doubt_execution',
    speaker1Label: 'The Town Skeptic:',
    speaker1Text: 'People from this area don\'t make it big, keep your feet on the ground before you fall flat on your face.',
    speaker2Label: 'The Slam:',
    speaker2Line1: 'Using your zip code as a permanent excuse for being ordinary is pathetic—I unleashed an',
    speaker2Highlight: 'APEX',
    speaker2Line2: 'drive that refuses to be contained by your small horizons.',
    theme: 'apex_drive'
  }
];

// 2. High-Aura 5-Second Wisdom Punchlines (Non-Generic, Pure Punch)
const CURATED_5S_WISDOM = [
  {
    id: 'mindrush_5s_1',
    line1: "Kill your excuses.",
    line2: "Build undeniable",
    line3: "self-respect.",
    author: "MindRush Discipline",
    theme: "discipline"
  },
  {
    id: 'mindrush_5s_2',
    line1: "Nobody is coming to save you.",
    line2: "Become the monster",
    line3: "who solves it.",
    author: "MindRush Grit",
    theme: "sovereignty"
  },
  {
    id: 'mindrush_5s_3',
    line1: "Stay quiet.",
    line2: "Let your bank account",
    line3: "make the noise.",
    author: "MindRush Execution",
    theme: "silence"
  },
  {
    id: 'mindrush_5s_4',
    line1: "They laugh now.",
    line2: "They ask for advice",
    line3: "three years later.",
    author: "MindRush Foresight",
    theme: "inevitable"
  },
  {
    id: 'mindrush_5s_5',
    line1: "Discipline is expensive.",
    line2: "Regret is catastrophic.",
    line3: "Choose your tax.",
    author: "MindRush Focus",
    theme: "sacrifice"
  },
  {
    id: 'mindrush_5s_6',
    line1: "They want you soft.",
    line2: "Become physically and mentally",
    line3: "impossible to break.",
    author: "MindRush Armor",
    theme: "indomitable"
  },
  {
    id: 'mindrush_5s_7',
    line1: "Stop explaining your vision.",
    line2: "Build the proof",
    line3: "in obsidian silence.",
    author: "MindRush Stealth",
    theme: "stealth_grind"
  },
  {
    id: 'mindrush_5s_8',
    line1: "Pain is a down payment.",
    line2: "Greatness is the deed.",
    line3: "Pay it in full.",
    author: "MindRush Tenacity",
    theme: "payment"
  },
  {
    id: 'mindrush_5s_9',
    line1: "Never trade self-respect",
    line2: "for temporary validation.",
    line3: "Stay dangerous.",
    author: "MindRush Standard",
    theme: "standard"
  },
  {
    id: 'mindrush_5s_10',
    line1: "The crowd seeks comfort.",
    line2: "The wolf seeks the hunt.",
    line3: "Remember who you are.",
    author: "MindRush Predator",
    theme: "apex"
  }
];

/**
 * Dynamically Auto-Fetch / Synthesize a Brand New 15s Confrontation using Gemini SDK
 */
async function autoFetchDynamicConfrontation(recentQuotes = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const { GoogleGenAI } = require('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are the lead viral scriptwriter for MindRush (TikTok & YouTube Shorts motivation for teens and young grinders).
Write 1 short, ultra-viral 15-second counter-slam debate between a petty fictional persona and our gritty protagonist.

RULES:
1. "speaker1Label" MUST be a specific, funny or petty fictional persona / entity (e.g. "The Bitter Roommate:", "The Guy Who Peaked at 18:", "The 9-to-5 Zombie:", "The Broke Gossip:", "The Couch Critic:", "The Comfort-Zone Fiend:"). NEVER use "Public Opinion".
2. "speaker1Text": An insulting, condescending, toxic jab from them attacking our protagonist's discipline or grind (max 18 words).
3. "speaker2Label": "Me:" or "Reality Check:" or "The Slam:"
4. "speaker2Line1": An insult back that roasts their mediocrity and fixes our reality (8-14 words).
5. "speaker2Highlight": EXACTLY ONE single uppercase power word (e.g. "ANOMALY", "EMPIRE", "FORTRESS", "UNTOUCHABLE", "COLOSSAL", "INDOMITABLE", "TITANIC", "SOVEREIGN").
6. "speaker2Line2": The lethal punchline throwing their toxic insult right back at them (8-14 words).

Respond ONLY with clean valid JSON, no markdown, no code fences:
{
  "speaker1Label": "The Bitter Roommate:",
  "speaker1Text": "...",
  "speaker2Label": "Me:",
  "speaker2Line1": "...",
  "speaker2Highlight": "WORD",
  "speaker2Line2": "...",
  "theme": "..."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.85
      }
    });

    const text = response.text || '';
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (parsed.speaker1Text && parsed.speaker2Highlight && parsed.speaker2Line1) {
      return {
        id: `mindrush_dynamic_${Date.now()}`,
        format: 'doubt_execution',
        speaker1Label: parsed.speaker1Label || 'The Cynic:',
        speaker1Text: parsed.speaker1Text,
        speaker2Label: parsed.speaker2Label || 'Me:',
        speaker2Line1: parsed.speaker2Line1,
        speaker2Highlight: parsed.speaker2Highlight.toUpperCase(),
        speaker2Line2: parsed.speaker2Line2,
        theme: parsed.theme || 'relentless_grind'
      };
    }
  } catch (err) {
    console.warn(`[MindRush Content Engine] AI dynamic synthesis notice: ${err.message}`);
  }
  return null;
}

/**
 * Dynamically Auto-Fetch / Synthesize a Brand New 5s Wisdom Quote
 */
async function autoFetchDynamic5sWisdom() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const { GoogleGenAI } = require('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Write 1 ultra-punchy 5-second wisdom quote for MindRush youth motivation channel.
Format into 3 short razor-sharp lines. Line 2 should be the powerful action, Line 3 the punchline.

Respond ONLY with clean valid JSON, no markdown:
{
  "line1": "...",
  "line2": "...",
  "line3": "...",
  "author": "MindRush Discipline",
  "theme": "..."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.85
      }
    });

    const text = response.text || '';
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (parsed.line1 && parsed.line2 && parsed.line3) {
      return {
        id: `mindrush_5s_dyn_${Date.now()}`,
        line1: parsed.line1,
        line2: parsed.line2,
        line3: parsed.line3,
        author: parsed.author || 'MindRush',
        theme: parsed.theme || 'discipline'
      };
    }
  } catch (e) {
    console.warn(`[MindRush Content Engine] 5s AI synthesis notice: ${e.message}`);
  }
  return null;
}

module.exports = {
  CURATED_15S_CONFRONTATIONS,
  CURATED_5S_WISDOM,
  autoFetchDynamicConfrontation,
  autoFetchDynamic5sWisdom
};
