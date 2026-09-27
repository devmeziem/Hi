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
    speaker1Label: 'The Dismissive Teacher',
    speaker1Text: 'You will never amount to anything because your test scores aren\'t high enough.',
    speaker2Label: 'Why We Stand With You',
    speaker2Line1: 'Grading human potential on a standardized bubble sheet is your limitation—I have an',
    speaker2Highlight: 'INDOMITABLE',
    speaker2Line2: 'curiosity and fire that your grading rubric could never measure.',
    rareWord: 'INDOMITABLE',
    rareWordDefinition: 'Impossible to subdue, defeat, or discourage; having an unconquerable spirit.',
    theme: 'unconquerable_potential'
  },
  {
    id: 'mindrush_conf_2',
    format: 'naysayer_clapback',
    speaker1Label: 'The Comparing Relative',
    speaker1Text: 'Why can\'t you be obedient and get straight A\'s like your cousin does?',
    speaker2Label: 'How We Answered Them',
    speaker2Line1: 'Measuring my unique worth against someone else\'s script won\'t break my focus—I forged an',
    speaker2Highlight: 'INVIOLABLE',
    speaker2Line2: 'standard tailored to the real future I am building with my own hands.',
    rareWord: 'INVIOLABLE',
    rareWordDefinition: 'Never to be broken, infringed, or dishonored; completely untouchable.',
    theme: 'unshakable_individuality'
  },
  {
    id: 'mindrush_conf_3',
    format: 'naysayer_clapback',
    speaker1Label: 'The Fake Friend Group',
    speaker1Text: 'You think you\'re better than us just because you study alone on Friday nights now?',
    speaker2Label: 'Me Talking Back',
    speaker2Line1: 'Staying trapped in gossip and distraction was your choice—I took a',
    speaker2Highlight: 'SURREPTITIOUS',
    speaker2Line2: 'lead to master high-value skills we both know you\'re too scared to chase.',
    rareWord: 'SURREPTITIOUS',
    rareWordDefinition: 'Done quietly, stealthily, or without seeking loud outside attention.',
    theme: 'silent_advancement'
  },
  {
    id: 'mindrush_conf_4',
    format: 'naysayer_clapback',
    speaker1Label: 'The Out-of-Touch Critic',
    speaker1Text: 'Your generation is soft, distracted, and lazy. You have no real work ethic.',
    speaker2Label: 'Standing Up For Our Generation',
    speaker2Line1: 'Mistaking our silent burnout for laziness was your mistake—I possess an',
    speaker2Highlight: 'INDEFATIGABLE',
    speaker2Line2: 'drive that will shatter every outdated rule you ever forced on us.',
    rareWord: 'INDEFATIGABLE',
    rareWordDefinition: 'Persisting tirelessly without giving up or becoming fatigued.',
    theme: 'tireless_rebellion'
  },
  {
    id: 'mindrush_conf_5',
    format: 'naysayer_clapback',
    speaker1Label: 'The Toxic Doubter',
    speaker1Text: 'You look exhausted trying to teach yourself code and business. Just give up and fit in.',
    speaker2Label: 'Why We Never Fold',
    speaker2Line1: 'Surrendering to a predictable, boring life will never be my destiny—I have an',
    speaker2Highlight: 'INEXORABLE',
    speaker2Line2: 'hunger for true independence that makes your doubts completely powerless.',
    rareWord: 'INEXORABLE',
    rareWordDefinition: 'Impossible to stop, prevent, or turn aside; relentless.',
    theme: 'relentless_purpose'
  },
  {
    id: 'mindrush_conf_6',
    format: 'naysayer_clapback',
    speaker1Label: 'The Hallway Gossip',
    speaker1Text: 'Look at them trying so hard to act all focused, nobody even notices you.',
    speaker2Label: 'Our Answer To The Hater',
    speaker2Line1: 'Seeking temporary applause from people who don\'t care is your trap—my',
    speaker2Highlight: 'PERVICACIOUS',
    speaker2Line2: 'mindset is locked on personal excellence, not your validation.',
    rareWord: 'PERVICACIOUS',
    rareWordDefinition: 'Stubbornly persistent, obstinate, and refusing to bend to outside peer pressure.',
    theme: 'peer_immunity'
  },
  {
    id: 'mindrush_conf_7',
    format: 'naysayer_clapback',
    speaker1Label: 'The School Skeptic',
    speaker1Text: 'If it\'s not taught in the textbook, it isn\'t useful for your real life.',
    speaker2Label: 'Breaking The Mold With You',
    speaker2Line1: 'Memorizing obsolete facts to pass a 40-minute test won\'t build the future—I kept my',
    speaker2Highlight: 'EQUILIBRIUM',
    speaker2Line2: 'while building modern capabilities that schools are terrified to acknowledge.',
    rareWord: 'EQUILIBRIUM',
    rareWordDefinition: 'A state of perfect mental balance, composure, and emotional calm.',
    theme: 'sovereign_intelligence'
  },
  {
    id: 'mindrush_conf_8',
    format: 'naysayer_clapback',
    speaker1Label: 'The Comfort-Zone Friend',
    speaker1Text: 'Why skip the hangout? Life is about chilling now, you take things way too seriously.',
    speaker2Label: 'Why We Protect Our Fire',
    speaker2Line1: 'Waking up five years from now filled with regret is your gamble—I am',
    speaker2Highlight: 'RECALCITRANT',
    speaker2Line2: 'against the comfortable habits that trick young minds into settling for mediocrity.',
    rareWord: 'RECALCITRANT',
    rareWordDefinition: 'Obstinately defiant of authority, convention, or peer pressure.',
    theme: 'defiance_of_apathy'
  }
];

// 2. High-Aura 5-Second Youth Empowerment Wisdom (Solidarity, Truth, Clarity)
const CURATED_5S_WISDOM = [
  {
    id: 'mindrush_5s_1',
    line1: "They call you lazy.",
    line2: "They never saw your",
    line3: "2 AM silent battles.",
    author: "MindRush Solidarity",
    theme: "validation"
  },
  {
    id: 'mindrush_5s_2',
    line1: "A letter on paper",
    line2: "will never measure",
    line3: "your internal fire.",
    author: "MindRush Truth",
    theme: "worth"
  },
  {
    id: 'mindrush_5s_3',
    line1: "You're not behind.",
    line2: "You're just waking up",
    line3: "to your real power.",
    author: "MindRush Rise",
    theme: "awakening"
  },
  {
    id: 'mindrush_5s_4',
    line1: "Protect your vision.",
    line2: "The ones who doubted",
    line3: "already surrendered.",
    author: "MindRush Shield",
    theme: "sovereignty"
  },
  {
    id: 'mindrush_5s_5',
    line1: "We stand with you.",
    line2: "Let them whisper while",
    line3: "you build the future.",
    author: "MindRush Alliance",
    theme: "unity"
  },
  {
    id: 'mindrush_5s_6',
    line1: "Don't fit their mold.",
    line2: "You were created to",
    line3: "break their script.",
    author: "MindRush Fire",
    theme: "defiance"
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
