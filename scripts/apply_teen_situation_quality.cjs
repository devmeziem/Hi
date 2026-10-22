#!/usr/bin/env node
/**
 * Teen situation quality V2:
 * - Plain ASS captions (NO {\\kf} karaoke — those eat letters on libass/TikTok)
 * - Escape ASS specials; keep commas as normal text (never strip words)
 * - Synthetic BGM only (no Content ID)
 * - YouTube: refuse upload without dedicated CH5 / TEEN credentials
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const p = path.join(process.cwd(), 'scripts', 'generate_teen_situation_reel.cjs');
const yt = path.join(process.cwd(), 'scripts', 'youtube_channel_dispatcher.cjs');

if (fs.existsSync(p)) {
  let t = fs.readFileSync(p, 'utf8');
  if (!t.includes('TEEN_SIT_QUALITY_V2')) {
    const backup = t;

    // Full replace of buildCinemaStyleAss
    const newAss = `
function buildCinemaStyleAss(fullText, duration) {
  // TEEN_SIT_QUALITY_V2 — plain lines, no karaoke tags (prevents missing letters)
  function escAss(s) {
    return String(s)
      .replace(/\\{/g, '(')
      .replace(/\\}/g, ')')
      .replace(/\\n/g, ' ')
      .replace(/\\r/g, ' ');
  }
  const words = escAss(fullText)
    .split(/\\s+/)
    .filter(Boolean)
    .map((w) => w.toUpperCase());
  const wordsPerLine = 4;
  const totalMs = Math.round(Math.max(8, duration) * 1000);
  const msPerWord = words.length > 0 ? totalMs / words.length : 320;
  const formatAssTime = (ms) => {
    const totalSec = Math.floor(ms / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    const sec = totalSec % 60;
    const min = Math.floor((totalSec % 3600) / 60);
    const hr = Math.floor(totalSec / 3600);
    return hr + ':' + String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0') + '.' + String(cs).padStart(2, '0');
  };
  const lines = [];
  for (let i = 0; i < words.length; i += wordsPerLine) {
    const chunk = words.slice(i, i + wordsPerLine);
    const chunkStartMs = Math.round(i * msPerWord);
    const chunkEndMs = Math.min(totalMs, Math.round((i + chunk.length) * msPerWord + 180));
    // Plain text only — commas stay as commas; never {\\k} tags
    const text = chunk.join(' ');
    lines.push(
      'Dialogue: 0,' + formatAssTime(chunkStartMs) + ',' + formatAssTime(chunkEndMs) + ',CenterKaraoke,,0,0,0,,' + text
    );
  }
  return [
    '[Script Info]',
    'Title: MindRush Plain Captions',
    'ScriptType: v4.00+',
    'PlayResX: 1080',
    'PlayResY: 1920',
    'ScaledBorderAndShadow: yes',
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    // Alignment 2 = bottom-center; BorderStyle 1 outline (not opaque box that clips glyphs)
    'Style: CenterKaraoke,DejaVu Sans,46,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,4,1,2,70,70,200,1',
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
    lines.join('\\n')
  ].join('\\n');
}
`;

    if (/function buildCinemaStyleAss\([\s\S]*?\n\}\n\nasync function resolveVisual/.test(t)) {
      t = t.replace(/function buildCinemaStyleAss\([\s\S]*?\n\}\n\nasync function resolveVisual/, newAss + '\nasync function resolveVisual');
    } else if (/function buildCinemaStyleAss\(/.test(t)) {
      // broader replace until next function
      t = t.replace(/function buildCinemaStyleAss\([\s\S]*?\n\}(?=\n\n|\nasync function|\nfunction)/, newAss.trim());
    }

    // Strip any remaining kf karaoke injections
    t = t.replace(/`\{\\kf\$\{[^}]+\}\}\$\{[^`]+\} `/g, '`${String(w).toUpperCase()} `');
    t = t.replace(/kLine \+= `\{\\kf[^`]+`/g, "kLine += String(w).replace(/[{}]/g,'').toUpperCase() + ' '");

    // Synthetic BGM only
    if (t.includes('async function resolveBgm') && !t.includes('TEEN_SIT_QUALITY_V2_BGM')) {
      t = t.replace(
        /async function resolveBgm\([\s\S]*?\n\}/,
        `async function resolveBgm(query, durationSec) {
  // TEEN_SIT_QUALITY_V2_BGM — never stock music (Content ID)
  console.log('[Teen] BGM synthetic only; ignored query:', query);
  const out = path.join(ART, 'teen_synth_bgm.wav');
  const d = Math.max(12, Number(durationSec) || 30);
  const expr = '(0.07*sin(2*PI*130.81*t)+0.05*sin(2*PI*164.81*t)+0.04*sin(2*PI*196*t))*exp(-0.12*mod(t,3))';
  try {
    execSync('ffmpeg -y -f lavfi -i "aevalsrc=\'' + expr + '\':s=44100:d=' + d.toFixed(2) + '" -af "volume=0.32,afade=t=in:st=0:d=1,afade=t=out:st=' + (d - 1.2).toFixed(2) + ':d=1.1" -c:a pcm_s16le "' + out + '"', { stdio: 'pipe' });
  } catch (_) {
    execSync('ffmpeg -y -f lavfi -i sine=f=220:d=' + d.toFixed(2) + ' -af volume=0.04 "' + out + '"', { stdio: 'pipe' });
  }
  return out;
}`
      );
    }

    // Do not strip commas from spoken text — only control chars
    t = t.replace(
      /\.replace\(\/\[\{\}<>\]\/g, ''\)/g,
      ".replace(/[{}<>]/g, '') /* keep commas and letters */"
    );

    t = '/** TEEN_SIT_QUALITY_V2 */\n' + t;
    try {
      fs.writeFileSync(p, t);
      execSync(`node --check "${p}"`, { stdio: 'pipe' });
      console.log('[teen-sit-q] V2 OK — plain captions + synth BGM');
    } catch (e) {
      fs.writeFileSync(p, backup);
      console.warn('[teen-sit-q] reverted', e.message);
    }
  } else {
    console.log('[teen-sit-q] already V2');
  }
}

// YouTube: teen must use CH5/TEEN secrets only — never fall back to Archie/Fin tokens
if (fs.existsSync(yt)) {
  let y = fs.readFileSync(yt, 'utf8');
  if (!y.includes('TEEN_NO_FALLBACK_YT')) {
    const backup = y;
    // Patch resolveCreds: for teen_motivation only use CH5/TEEN, no empty suffix fallback
    if (y.includes('function resolveCreds')) {
      y = y.replace(
        /function resolveCreds\(channelKey\) \{[\s\S]*?return \{[\s\S]*?YOUTUBE_REFRESH_TOKEN[\s\S]*?\};\n\}/,
        `function resolveCreds(channelKey) {
  // TEEN_NO_FALLBACK_YT
  const map = {
    cartoon_factory: ['CH3', 'TECH', ''],
    finance_saas: ['CH1', ''],
    motivation_stoicism: ['CH2', 'STOIC', ''],
    teen_motivation: ['CH5', 'TEEN'], // NO empty '' — do not steal default channel
    cinema_vanguard: ['CH4', 'CINEMA', '']
  };
  const suffixes = map[channelKey] || [''];
  for (const s of suffixes) {
    const idKey = s ? 'YOUTUBE_CLIENT_ID_' + s : 'YOUTUBE_CLIENT_ID';
    const secKey = s ? 'YOUTUBE_CLIENT_SECRET_' + s : 'YOUTUBE_CLIENT_SECRET';
    const refKey = s ? 'YOUTUBE_REFRESH_TOKEN_' + s : 'YOUTUBE_REFRESH_TOKEN';
    if (process.env[idKey] && process.env[refKey]) {
      return {
        clientId: process.env[idKey],
        clientSecret: process.env[secKey] || process.env.YOUTUBE_CLIENT_SECRET,
        refresh: process.env[refKey]
      };
    }
  }
  // Teen: never fall back to another brand's OAuth
  if (channelKey === 'teen_motivation') {
    return { clientId: null, clientSecret: null, refresh: null };
  }
  return {
    clientId: process.env.YOUTUBE_CLIENT_ID,
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
    refresh: process.env.YOUTUBE_REFRESH_TOKEN
  };
}`
      );
    }
    // uploadYouTubeShort: skip if no creds
    if (y.includes('async function uploadYouTubeShort') || y.includes('uploadYouTubeShort:')) {
      y = y.replace(
        /const targetKey = channelId \|\| 'cartoon_factory';/,
        `const targetKey = channelId || 'cartoon_factory';
    if (targetKey === 'teen_motivation') {
      const c = resolveCreds('teen_motivation');
      if (!c.clientId || !c.refresh) {
        console.warn('[yt] teen_motivation: no YOUTUBE_*_CH5 / YOUTUBE_*_TEEN secrets — SKIP upload (wrong-channel guard)');
        return { skipped: true, reason: 'no_teen_youtube_creds' };
      }
    }`
      );
    }
    try {
      fs.writeFileSync(yt, y);
      execSync(`node --check "${yt}"`, { stdio: 'pipe' });
      console.log('[yt] teen no-fallback OK');
    } catch (e) {
      fs.writeFileSync(yt, backup);
      console.warn('[yt] reverted', e.message);
    }
  } else {
    console.log('[yt] already guarded');
  }
}
