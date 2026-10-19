#!/usr/bin/env node
/**
 * ONE background bed helper — no multi scene-sound systems.
 * Prefer real track from audio_asset_manager; else generate audible pad.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function makeBgm(outPath, durationSec, volume = 0.30) {
  durationSec = Math.max(5, Number(durationSec) || 20);
  // Try real music asset manager
  try {
    const { resolveRealMusicTrack } = require('./audio_asset_manager.cjs');
    if (typeof resolveRealMusicTrack === 'function') {
      const track = resolveRealMusicTrack({ channel: 'general', durationSec });
      if (track && track.path && fs.existsSync(track.path)) {
        execSync(
          `ffmpeg -y -i "${track.path}" -t ${durationSec} -af "volume=${volume},afade=t=in:d=0.8,afade=t=out:st=${Math.max(0, durationSec - 1.5)}:d=1.5" -ar 44100 -ac 2 "${outPath}"`,
          { stdio: 'pipe' }
        );
        if (fs.existsSync(outPath) && fs.statSync(outPath).size > 2000) return outPath;
      }
    }
  } catch (_) {}

  // Audible dual-tone pad (not silent)
  execSync(
    `ffmpeg -y -f lavfi -i "sine=frequency=110:duration=${durationSec}" -f lavfi -i "sine=frequency=165:duration=${durationSec}" -f lavfi -i "sine=frequency=220:duration=${durationSec}" -filter_complex "[0:a][1:a][2:a]amix=inputs=3:duration=first,lowpass=f=800,highpass=f=60,volume=${volume}" -ar 44100 -ac 2 "${outPath}"`,
    { stdio: 'pipe' }
  );
  if (!fs.existsSync(outPath) || fs.statSync(outPath).size < 1000) {
    throw new Error('BGM generation failed');
  }
  return outPath;
}

function mixVoiceAndBgm(voicePath, bgmPath, outPath, voiceVol = 1.4, bgmVol = 1.0) {
  execSync(
    `ffmpeg -y -i "${voicePath}" -i "${bgmPath}" -filter_complex "[0:a]volume=${voiceVol}[v];[1:a]volume=${bgmVol}[b];[v][b]amix=inputs=2:duration=first:dropout_transition=2,alimiter=limit=0.95" -ar 44100 -ac 2 "${outPath}"`,
    { stdio: 'pipe' }
  );
  return outPath;
}

module.exports = { makeBgm, mixVoiceAndBgm };
