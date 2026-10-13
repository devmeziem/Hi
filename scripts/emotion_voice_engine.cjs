#!/usr/bin/env node

/**
 * ==============================================================================
 * Emotion Voice & Human Cadence Synchronizer
 * ==============================================================================
 * Solves robotic/flat voiceovers by providing:
 * 1. Emotion-Driven Prosodic Analysis: Detects sentence-level intent (curious hook,
 *    dramatic revelation, deep explanation, warm outro) and shapes pitch/rate/inflection.
 * 2. Visual-Emotion Synchronization: Computes emotion timestamps and syncs Archie's
 *    in-video gestures (camera-pointing, open palms, questioning, explaining).
 * 3. Studio Human Vocal DSP Chain: Highpass pop filter, chest warmth EQ, anti-nasal
 *    cut, presence clarity boost, and studio tube compression for authentic human presence.
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Clean and humanize text for natural conversational flow
 */
function humanizeTextForSpeech(text, profile = 'educator') {
  if (!text) return '';

  let cleaned = String(text)
    .replace(/undefined/gi, '')
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/[#@*~_`^]/g, '')
    .replace(/\[.*?\]/g, '') // remove bracket tags
    .replace(/\s+/g, ' ')
    .trim();

  // Natural breathing pauses around rhetorical questions and dramatic reveals
  cleaned = cleaned
    .replace(/\s*—\s*/g, '... ')
    .replace(/\s*--\s*/g, '... ')
    .replace(/;\s*/g, ', ')
    .replace(/:\s*/g, '... ')
    .replace(/\s*\?\s*/g, '? ')
    .replace(/\s*\!\s*/g, '! ');

  // Add subtle micro-pauses after key conversational transition markers
  const transitions = [
    'In fact',
    'Here is why',
    'Notice how',
    'Because',
    'Think about it',
    'Suddenly',
    'Now watch this',
    'The crazy part is'
  ];

  for (const tr of transitions) {
    const reg = new RegExp(`\\b${tr}\\b(?!,)`, 'gi');
    cleaned = cleaned.replace(reg, `${tr},`);
  }

  return cleaned.trim();
}

/**
 * Detect emotion and map corresponding gesture for each sentence
 */
function detectSentenceEmotion(sentence, index, totalSentences) {
  const s = sentence.toLowerCase().trim();

  // First sentence is almost always the hook/question
  if (index === 0) {
    if (s.includes('?') || s.includes('ever') || s.includes('wonder') || s.includes('why') || s.includes('how')) {
      return {
        emotion: 'curious',
        energy: 'high',
        gesture: 'point_camera',
        expression: 'questioning',
        prosody: { rate: '+1%', pitch: '+2Hz' }
      };
    }
    return {
      emotion: 'hook',
      energy: 'high',
      gesture: 'point_camera',
      expression: 'questioning',
      prosody: { rate: '+0%', pitch: '+0Hz' }
    };
  }

  // Last sentence is CTA / outro
  if (index === totalSentences - 1) {
    return {
      emotion: 'warm_cta',
      energy: 'friendly',
      gesture: 'open_palms',
      expression: 'welcoming',
      prosody: { rate: '-2%', pitch: '-1Hz' }
    };
  }

  // Dramatic revelation / surprising fact
  if (
    s.includes('!') ||
    s.includes('crazy') ||
    s.includes('secret') ||
    s.includes('discover') ||
    s.includes('instant') ||
    s.includes('massive') ||
    s.includes('reaction') ||
    s.includes('millisecond')
  ) {
    return {
      emotion: 'revelation',
      energy: 'intense',
      gesture: 'open_palms',
      expression: 'excited',
      prosody: { rate: '-1%', pitch: '+1Hz' }
    };
  }

  // Specimen, physical evidence or step-by-step mechanism
  if (
    s.includes('inside') ||
    s.includes('structure') ||
    s.includes('microscopic') ||
    s.includes('surface') ||
    s.includes('temperature') ||
    s.includes('molecule') ||
    s.includes('physics')
  ) {
    return {
      emotion: 'specimen_evidence',
      energy: 'focused',
      gesture: 'point_right',
      expression: 'explaining',
      prosody: { rate: '-3%', pitch: '-2Hz' }
    };
  }

  // Thoughtful deep explanation
  return {
    emotion: 'explaining',
    energy: 'measured',
    gesture: 'hands_at_stomach',
    expression: 'talking',
    prosody: { rate: '-2%', pitch: '-2Hz' }
  };
}

/**
 * Builds an emotion-synced timeline of sentences, durations, and gestures
 */
function analyzeScriptEmotionTimeline(fullScriptText, totalSpokenDuration = 30.0) {
  const rawSentences = fullScriptText
    .match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g)
    ?.map(s => s.trim())
    ?.filter(Boolean) || [fullScriptText];

  const totalWords = fullScriptText.split(/\s+/).filter(Boolean).length || 1;
  const secondsPerWord = totalSpokenDuration / totalWords;

  let currentTime = 0.0;
  const timeline = [];

  for (let i = 0; i < rawSentences.length; i++) {
    const sent = rawSentences[i];
    const wordCount = sent.split(/\s+/).filter(Boolean).length;
    const duration = Math.max(1.5, wordCount * secondsPerWord);
    const emo = detectSentenceEmotion(sent, i, rawSentences.length);

    timeline.push({
      index: i,
      sentence: sent,
      wordCount,
      startTime: Number(currentTime.toFixed(2)),
      endTime: Number((currentTime + duration).toFixed(2)),
      duration: Number(duration.toFixed(2)),
      emotion: emo.emotion,
      gesture: emo.gesture,
      expression: emo.expression,
      prosody: emo.prosody
    });

    currentTime += duration;
  }

  return timeline;
}

/**
 * Pro Broadcast Studio Vocal DSP Chain
 * Transforms raw TTS into human, warm, articulate studio microphone audio
 */
function applyStudioHumanVocalDsp(inputAudioPath, outputAudioPath, options = {}) {
  const warmthDb = options.warmthDb || '+2.2';
  const clarityDb = options.clarityDb || '+2.5';
  const deMudDb = options.deMudDb || '-1.8';
  const airSheenDb = options.airSheenDb || '+1.4';

  // FFmpeg filter graph for broadcast studio vocal warmth:
  // 1. highpass=f=75: eliminates microphone plosives and sub-bass rumble
  // 2. equalizer 190Hz: tube preamp chest resonance & vocal intimacy
  // 3. equalizer 520Hz: cuts nasal boxiness
  // 4. equalizer 3300Hz: human speech articulation clarity
  // 5. equalizer 10500Hz: silky studio condenser air sheen
  // 6. acompressor: smooth 2.8:1 soft-knee vocal leveling
  // 7. loudnorm: broadcast compliant loudness (EBU R128)
  const dspFilter = [
    'highpass=f=75',
    `equalizer=f=190:t=q:w=1.2:g=${warmthDb}`,
    `equalizer=f=520:t=q:w=1.4:g=${deMudDb}`,
    `equalizer=f=3300:t=q:w=1.1:g=${clarityDb}`,
    `equalizer=f=10500:t=q:w=0.8:g=${airSheenDb}`,
    'acompressor=threshold=-17dB:ratio=2.8:attack=12:release=110:makeup=2.0dB',
    'loudnorm=I=-16:TP=-1.5:LRA=9'
  ].join(',');

  const cmd = `ffmpeg -y -i "${inputAudioPath}" -af "${dspFilter}" -ar 44100 -ac 2 "${outputAudioPath}" 2>/dev/null`;

  try {
    execSync(cmd);
    if (fs.existsSync(outputAudioPath) && fs.statSync(outputAudioPath).size > 1000) {
      return true;
    }
  } catch (err) {
    // If complex filter fails, fall back to safe volume normalize
    try {
      execSync(`ffmpeg -y -i "${inputAudioPath}" -af "volume=1.25" -ar 44100 -ac 2 "${outputAudioPath}" 2>/dev/null`);
      return true;
    } catch {}
  }

  return false;
}

module.exports = {
  humanizeTextForSpeech,
  detectSentenceEmotion,
  analyzeScriptEmotionTimeline,
  applyStudioHumanVocalDsp
};
