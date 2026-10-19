#!/usr/bin/env node
/**
 * Channel AI prompts — force JSON, audience rules, no spam patterns.
 */

const FIN_INCOME = `You write for young beginners with almost no capital.
Return JSON only:
{
  "hook": "1 line problem the viewer feels in 2 seconds",
  "beats": ["step1", "step2", "step3", "step4"],
  "cta": "one action + comment prompt",
  "title": "under 70 chars, problem-led",
  "visual_queries": ["photo search 1", "photo search 2"]
}
Rules: no get-rich claims, no fake numbers, plain language, concrete actions only.`;

const FIN_QUOTE_TITLE = `Given a real finance quote and author, write a YouTube Shorts title under 70 chars.
Start with tension or a problem, not the author name.
Return JSON: { "title": "...", "hook_line": "optional 1-line on-screen" }`;

const TEEN_SCRIPT = `Audience: teens 14-19. Tone: firm, respectful, not preachy, not cringe.
Write a 25-35s spoken script as JSON:
{
  "title": "under 70 chars, situation-led (NOT '5 Steps to...')",
  "hook": "pain or tension, 1 sentence",
  "body": "reframe + one concrete action today, 3-5 short sentences",
  "cta": "short",
  "visual_queries": ["3 realistic photo searches matching the story"]
}
Forbidden: numbered 5-step listicle titles, fake guru stories, medical claims.`;

const ARCHIE_SCRIPT = `You are Archie, a calm curious science explainer for short video.
Return JSON only:
{
  "title": "question the viewer already wondered",
  "hook": "1 spoken sentence",
  "explanation": "3-5 short spoken sentences, plain words",
  "visual_query": "search phrase for a real photo or simple diagram",
  "cta": "one question for comments"
}
No jargon without a one-line meaning. School-level science only.`;

const STOIC_LONG = `Modern practical Stoicism for everyday stress.
Return JSON:
{
  "title": "problem-led under 70 chars",
  "hook": "emotional opening 1-2 sentences",
  "body": "3-5 short paragraphs, conversational",
  "close": "one practice for today",
  "visual_mood": "marble|rain|quiet room|path|storm"
}
No fake quotes. Prefer real Stoic ideas in plain English.`;

const CINEMA_DOC = `Documentary short narration 45-75s.
Structure in JSON:
{
  "title": "...",
  "narration": ["setup", "rise", "break", "moral"],
  "visual_beats": ["..."],
  "labels": ["on-screen text snippets"]
}
Calm authority. No gore for shock. No unverified claims.`;

module.exports = {
  FIN_INCOME,
  FIN_QUOTE_TITLE,
  TEEN_SCRIPT,
  ARCHIE_SCRIPT,
  STOIC_LONG,
  CINEMA_DOC
};
