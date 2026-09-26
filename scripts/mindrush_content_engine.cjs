/**
 * MindRush Dynamic Content Engine & Confrontation Vault
 *
 * Implements User Directives:
 * 1. Insultive throwback in common daily spoken words (roasting the naysayer/hater).
 * 2. Exactly ONE uncommon/rare power word, with definition provided for the video description.
 * 3. Clear Framing: Protagonist is talking back / clapping back at the toxic naysayer (never insulting the viewer).
 * 4. Integrates live dynamic AI auto-fetching via Gemini SDK / OpenRouter / Groq.
 */

const fs = require('fs');
const path = require('path');

// 1. Curated Library of Raw 15-Second Naysayer Confrontations & Insultive Clackbacks
const CURATED_15S_CONFRONTATIONS = [
  {
    id: 'mindrush_conf_1',
    format: 'naysayer_clapback',
    speaker1Label: 'The Broke Critic',
    speaker1Text: 'You look miserable locked in your room grinding on a Friday night while we are out partying.',
    speaker2Label: 'How I Clapped Back',
    speaker2Line1: 'Waking up broke with a hangover isn\'t winning—I built an',
    speaker2Highlight: 'INDEFATIGABLE',
    speaker2Line2: 'machine while you beg your parents for rent money.',
    rareWord: 'INDEFATIGABLE',
    rareWordDefinition: 'Persisting tirelessly without giving up or becoming fatigued.',
    theme: 'tireless_grit'
  },
  {
    id: 'mindrush_conf_2',
    format: 'naysayer_clapback',
    speaker1Label: 'The Couch Skeptic',
    speaker1Text: 'You really think you\'re special with your gym pass and your little alarm clock?',
    speaker2Label: 'My Answer to Him',
    speaker2Line1: 'Moving from the bed to the couch is your only daily milestone—I forged an',
    speaker2Highlight: 'INVIOLABLE',
    speaker2Line2: 'work ethic while you watched my highlights from the cheap seats.',
    rareWord: 'INVIOLABLE',
    rareWordDefinition: 'Never to be broken, infringed, or dishonored; completely untouchable.',
    theme: 'unbreakable_will'
  },
  {
    id: 'mindrush_conf_3',
    format: 'naysayer_clapback',
    speaker1Label: 'The Toxic Hater',
    speaker1Text: 'You act like you\'re above everyone now just because you stopped hanging out with us.',
    speaker2Label: 'Me Talking Back',
    speaker2Line1: 'I didn\'t change, I just quit drinking away my potential—I kept my',
    speaker2Highlight: 'EQUILIBRIUM',
    speaker2Line2: 'while you stayed complaining in the exact same spot.',
    rareWord: 'EQUILIBRIUM',
    rareWordDefinition: 'A state of perfect mental balance, composure, and emotional calm.',
    theme: 'mental_balance'
  },
  {
    id: 'mindrush_conf_4',
    format: 'naysayer_clapback',
    speaker1Label: 'The Sneering Doubter',
    speaker1Text: '99% of people who try this fail. Your little hustle is honestly embarrassing to watch.',
    speaker2Label: 'Putting Him In His Place',
    speaker2Line1: 'Giving up before you even step onto the field is your specialty—I possess an',
    speaker2Highlight: 'INEXORABLE',
    speaker2Line2: 'drive that makes your pathetic excuses completely irrelevant.',
    rareWord: 'INEXORABLE',
    rareWordDefinition: 'Impossible to stop, prevent, or turn aside; relentless.',
    theme: 'relentless_drive'
  },
  {
    id: 'mindrush_conf_5',
    format: 'naysayer_clapback',
    speaker1Label: 'The 2 AM Doomscroller',
    speaker1Text: 'You look exhausted waking up at 5 AM, nobody cares how hard you make life for yourself.',
    speaker2Label: 'How I Answered',
    speaker2Line1: 'Scrolling TikTok until your brain rots is your whole life—I took a',
    speaker2Highlight: 'SURREPTITIOUS',
    speaker2Line2: 'lead while you slept away your twenties in the dark.',
    rareWord: 'SURREPTITIOUS',
    rareWordDefinition: 'Done secretly, stealthily, or without attracting public attention.',
    theme: 'stealth_advantage'
  },
  {
    id: 'mindrush_conf_6',
    format: 'naysayer_clapback',
    speaker1Label: 'The Fake Friend',
    speaker1Text: 'You\'re going to burn out and end up with zero friends because you\'re obsessed.',
    speaker2Label: 'Me Clapping Back',
    speaker2Line1: 'Surrounding myself with cowards who only celebrate distractions is worse—your',
    speaker2Highlight: 'PUSILLANIMOUS',
    speaker2Line2: 'mindset would have kept me broke and trapped forever.',
    rareWord: 'PUSILLANIMOUS',
    rareWordDefinition: 'Lacking courage, timid, faint-hearted, or cowardly.',
    theme: 'fearless_standard'
  },
  {
    id: 'mindrush_conf_7',
    format: 'naysayer_clapback',
    speaker1Label: 'The Weekend Partier',
    speaker1Text: 'Working on a Saturday night? You have zero personality outside of working out and studying.',
    speaker2Label: 'Talking Back to the Naysayer',
    speaker2Line1: 'Flexing rented bottles on maxed-out credit cards isn\'t a personality—I have a',
    speaker2Highlight: 'BELLIGERENT',
    speaker2Line2: 'hunger for winning that terrifies lazy people like you.',
    rareWord: 'BELLIGERENT',
    rareWordDefinition: 'Aggressively determined, fiercely combative, or fighting without retreat.',
    theme: 'combative_discipline'
  },
  {
    id: 'mindrush_conf_8',
    format: 'naysayer_clapback',
    speaker1Label: 'The Envious Gossip',
    speaker1Text: 'Look at him trying to act all mysterious online, who does he think he is?',
    speaker2Label: 'How I Roasted Him',
    speaker2Line1: 'Whispering about winners is the only workout your jaw gets—my',
    speaker2Highlight: 'PERVICACIOUS',
    speaker2Line2: 'focus stays locked on results while you beg for gossip.',
    rareWord: 'PERVICACIOUS',
    rareWordDefinition: 'Stubbornly persistent, obstinate, and refusing to bend to outside pressure.',
    theme: 'stubborn_persistence'
  },
  {
    id: 'mindrush_conf_9',
    format: 'naysayer_clapback',
    speaker1Label: 'The Comfort-Zone Addict',
    speaker1Text: 'Just relax bro, life is too short to work 12 hours a day, stop trying so hard.',
    speaker2Label: 'My Direct Response',
    speaker2Line1: 'Dying average with a pile of regret is your life plan—I am',
    speaker2Highlight: 'RECALCITRANT',
    speaker2Line2: 'against every lazy habit that turned you into a spectator.',
    rareWord: 'RECALCITRANT',
    rareWordDefinition: 'Obstinately defiant of authority, convention, or mediocrity.',
    theme: 'defiance_of_mediocrity'
  },
  {
    id: 'mindrush_conf_10',
    format: 'naysayer_clapback',
    speaker1Label: 'The Arrogant Skeptic',
    speaker1Text: 'People from around here never make it big, keep your feet on the ground before you drop.',
    speaker2Label: 'How I Silenced Him',
    speaker2Line1: 'Using your hometown as an excuse to stay broke is pathetic—I showed',
    speaker2Highlight: 'MAGNANIMOUS',
    speaker2Line2: 'pity by letting you talk while I bought the entire block.',
    rareWord: 'MAGNANIMOUS',
    rareWordDefinition: 'Generous or forgiving, especially toward a rival or someone less powerful.',
    theme: 'sovereign_triumph'
  }
];

// 2. High-Aura 5-Second Wisdom Punchlines (Punchy, Clean, Disciplined)
const CURATED_5S_WISDOM = [
  {
    id: 'mindrush_5s_1',
    line1: "Nobody is coming to save you.",
    line2: "Become the monster",
    line3: "who solves it.",
    author: "MindRush Grit",
    theme: "sovereignty"
  },
  {
    id: 'mindrush_5s_2',
    line1: "Kill your excuses.",
    line2: "Build undeniable",
    line3: "self-respect.",
    author: "MindRush Discipline",
    theme: "discipline"
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
  }
];

/**
 * Dynamically Auto-Fetch / Synthesize a Brand New 15s Confrontation using Active AI
 */
async function autoFetchDynamicConfrontation(recentQuotes = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const { GoogleGenAI } = require('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are the lead viral scriptwriter for MindRush (high-aura youth motivation).
Write 1 intense 15-second counter-slam debate where our protagonist brutally roasts a toxic naysayer / hater.

CRITICAL RULES:
1. "speaker1Label": A specific, toxic naysayer persona (e.g. "The Broke Critic", "The Couch Skeptic", "The Sneering Doubter", "The 2 AM Doomscroller").
2. "speaker1Text": An insulting, petty doubt attacking our protagonist's discipline (common daily words, max 16 words).
3. "speaker2Label": Must clearly show the protagonist is TALKING BACK AT THE NAYSAYER (e.g. "How I Clapped Back", "My Answer to the Naysayer", "Me Talking Back"). Never leave it ambiguous so viewer doesn't feel insulted!
4. "speaker2Line1": Raw insult roasting their lazy mediocrity using everyday street words (8-14 words).
5. "speaker2Highlight": EXACTLY ONE single uncommon/rare power word in UPPERCASE (e.g. "INDEFATIGABLE", "PUSILLANIMOUS", "BELLIGERENT", "INEXORABLE", "SURREPTITIOUS", "EQUILIBRIUM", "RECALCITRANT", "MAGNANIMOUS", "INVIOLABLE", "PERVICACIOUS").
6. "speaker2Line2": The lethal punchline throwing their insult right back at them (8-14 words).
7. "rareWordDefinition": A crystal-clear 1-sentence definition of the rare word for the video description.

Respond ONLY with clean valid JSON, no markdown:
{
  "speaker1Label": "The Couch Skeptic",
  "speaker1Text": "...",
  "speaker2Label": "How I Clapped Back",
  "speaker2Line1": "...",
  "speaker2Highlight": "WORD",
  "speaker2Line2": "...",
  "rareWord": "WORD",
  "rareWordDefinition": "...",
  "theme": "..."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { temperature: 0.85 }
    });

    const text = response.text || '';
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (parsed.speaker1Text && parsed.speaker2Highlight && parsed.speaker2Line1) {
      return {
        id: `mindrush_dyn_${Date.now()}`,
        format: 'naysayer_clapback',
        speaker1Label: parsed.speaker1Label || 'The Naysayer',
        speaker1Text: parsed.speaker1Text,
        speaker2Label: parsed.speaker2Label || 'How I Clapped Back',
        speaker2Line1: parsed.speaker2Line1,
        speaker2Highlight: parsed.speaker2Highlight.toUpperCase(),
        speaker2Line2: parsed.speaker2Line2,
        rareWord: (parsed.rareWord || parsed.speaker2Highlight).toUpperCase(),
        rareWordDefinition: parsed.rareWordDefinition || 'Persisting relentlessly despite all obstacles.',
        theme: parsed.theme || 'unapologetic_grind'
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
      config: { temperature: 0.85 }
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
