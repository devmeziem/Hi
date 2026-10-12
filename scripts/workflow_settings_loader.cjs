#!/usr/bin/env node

/**
 * ==============================================================================
 * Central Workflow Voice, Audio & Model Settings Loader
 * ==============================================================================
 * Automatically loads settings from `workflow_voice_settings.env` (or JSON),
 * parsing pitch, speech rate, voice volume, BGM volume, and AI models for each
 * automated workflow running in GitHub Actions and Node.js runners.
 *
 * Can be edited directly in GitHub at `workflow_voice_settings.env`
 * or overridden via environment variables.
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');

const DEFAULTS = {
  archie: {
    voiceId: 'en-US-ChristopherNeural',
    pitchHz: 0,
    speechRate: 1.00,
    voiceVolume: 1.35,
    bgmVolume: 0.25,
    bgmStyle: 'Upbeat Science Groove & Calm Acoustic',
    aiModel: 'gemini-2.5-flash'
  },
  stoic: {
    voiceId: 'en-US-AndrewNeural',
    pitchHz: -15,
    speechRate: 0.94,
    voiceVolume: 1.35,
    bgmVolume: 0.25,
    bgmStyle: 'Calm Emotional Piano & Ambient Strings',
    aiModel: 'gemini-2.5-flash'
  },
  finance: {
    voiceId: 'en-US-GuyNeural',
    pitchHz: -5,
    speechRate: 1.02,
    voiceVolume: 1.35,
    bgmVolume: 0.26,
    bgmStyle: 'Sovereign Capital & Deep Suspense Pulse',
    aiModel: 'gemini-2.5-flash'
  },
  cinema: {
    voiceId: 'en-US-AndrewMultilingualNeural',
    pitchHz: -10,
    speechRate: 0.96,
    voiceVolume: 1.35,
    bgmVolume: 0.26,
    bgmStyle: 'Dark Cello Ostinato & Historical Tension',
    aiModel: 'gemini-2.5-flash'
  },
  teen: {
    voiceId: 'en-US-ChristopherNeural',
    pitchHz: 4,
    speechRate: 1.08,
    voiceVolume: 1.40,
    bgmVolume: 0.26,
    bgmStyle: 'Rising Tension Swell & Cinematic Focus Beats',
    aiModel: 'gemini-2.5-flash'
  }
};

let cachedSettings = null;

function loadWorkflowSettings() {
  if (cachedSettings) return cachedSettings;

  const result = JSON.parse(JSON.stringify(DEFAULTS));

  // Search candidate paths for the settings file
  const candidateFiles = [
    path.join(process.cwd(), 'workflow_voice_settings.env'),
    path.join(process.cwd(), '.github', 'workflow_voice_settings.env'),
    path.join(process.cwd(), 'workflow_voice_settings.json')
  ];

  for (const f of candidateFiles) {
    if (fs.existsSync(f)) {
      try {
        if (f.endsWith('.json')) {
          const json = JSON.parse(fs.readFileSync(f, 'utf8'));
          for (const key of Object.keys(json)) {
            if (result[key]) {
              result[key] = { ...result[key], ...json[key] };
            }
          }
        } else {
          // Parse .env format
          const lines = fs.readFileSync(f, 'utf8').split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx <= 0) continue;
            const envKey = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');

            // Inject into process.env if not already set
            if (!process.env[envKey]) {
              process.env[envKey] = val;
            }

            // Map env vars to specific channels
            if (envKey.startsWith('ARCHIE_')) mapEnvToChannel(result.archie, envKey.replace('ARCHIE_', ''), val);
            if (envKey.startsWith('STOIC_')) mapEnvToChannel(result.stoic, envKey.replace('STOIC_', ''), val);
            if (envKey.startsWith('FINANCE_') || envKey.startsWith('FIN_')) mapEnvToChannel(result.finance, envKey.replace(/^FIN(ANCE)?_/, ''), val);
            if (envKey.startsWith('CINEMA_') || envKey.startsWith('MOVIE_')) mapEnvToChannel(result.cinema, envKey.replace(/^(CINEMA|MOVIE)_/, ''), val);
            if (envKey.startsWith('TEEN_') || envKey.startsWith('MINDRUSH_')) mapEnvToChannel(result.teen, envKey.replace(/^(TEEN|MINDRUSH)_/, ''), val);
          }
        }
      } catch (err) {
        console.warn(`[Workflow Settings Loader] Notice reading ${f}: ${err.message}`);
      }
    }
  }

  // Allow direct environment overrides (e.g. CLI or GitHub Actions secret / env)
  for (const ch of ['archie', 'stoic', 'finance', 'cinema', 'teen']) {
    const prefix = ch.toUpperCase();
    if (process.env[`${prefix}_VOICE_ID`]) result[ch].voiceId = process.env[`${prefix}_VOICE_ID`].trim();
    if (process.env[`${prefix}_PITCH_HZ`]) result[ch].pitchHz = parseInt(process.env[`${prefix}_PITCH_HZ`], 10);
    if (process.env[`${prefix}_SPEECH_RATE`]) result[ch].speechRate = parseFloat(process.env[`${prefix}_SPEECH_RATE`]);
    if (process.env[`${prefix}_VOICE_VOLUME`]) result[ch].voiceVolume = parseFloat(process.env[`${prefix}_VOICE_VOLUME`]);
    if (process.env[`${prefix}_BGM_VOLUME`]) result[ch].bgmVolume = parseFloat(process.env[`${prefix}_BGM_VOLUME`]);
    if (process.env[`${prefix}_AI_MODEL`]) result[ch].aiModel = process.env[`${prefix}_AI_MODEL`].trim();
  }

  cachedSettings = result;
  return result;
}

function mapEnvToChannel(targetObj, key, val) {
  if (key === 'VOICE_ID') targetObj.voiceId = val;
  if (key === 'PITCH_HZ') targetObj.pitchHz = parseInt(val, 10);
  if (key === 'SPEECH_RATE') targetObj.speechRate = parseFloat(val);
  if (key === 'VOICE_VOLUME') targetObj.voiceVolume = parseFloat(val);
  if (key === 'BGM_VOLUME') targetObj.bgmVolume = parseFloat(val);
  if (key === 'BGM_STYLE') targetObj.bgmStyle = val;
  if (key === 'AI_MODEL') targetObj.aiModel = val;
}

/**
 * Returns voice and audio parameters for a workflow key:
 * 'archie' | 'stoic' | 'finance' | 'cinema' | 'teen'
 */
function getWorkflowVoiceSettings(rawKey = '') {
  const settings = loadWorkflowSettings();
  const norm = String(rawKey || '').toLowerCase().trim();

  let chKey = 'cinema';
  if (['archie', 'tech', 'ch3', 'cartoon'].includes(norm)) chKey = 'archie';
  else if (['stoic', 'ch2', 'philosophy'].includes(norm)) chKey = 'stoic';
  else if (['finance', 'fin', 'ch1', 'bones_ceo'].includes(norm)) chKey = 'finance';
  else if (['cinema', 'movie', 'ch4', 'documentary', 'driftreel'].includes(norm)) chKey = 'cinema';
  else if (['teen', 'ch5', 'mindrush', 'motivation'].includes(norm)) chKey = 'teen';

  const cfg = settings[chKey] || settings.cinema;

  // Format EdgeTTS rate string (e.g. '-6%', '+8%')
  const rateDiff = Math.round((cfg.speechRate - 1.0) * 100);
  const edgeRate = `${rateDiff >= 0 ? '+' : ''}${rateDiff}%`;

  // Format EdgeTTS pitch string (e.g. '-15Hz', '+4Hz')
  const edgePitch = `${cfg.pitchHz >= 0 ? '+' : ''}${cfg.pitchHz}Hz`;

  return {
    ...cfg,
    workflowKey: chKey,
    edgeRate,
    edgePitch
  };
}

module.exports = {
  loadWorkflowSettings,
  getWorkflowVoiceSettings,
  DEFAULTS
};
