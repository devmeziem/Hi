/**
 * Universal Style Rotation Engine
 * Teen / Stoic / Driftreel / Archie share the same pools so no channel looks identical every post.
 * Pick is deterministic per seed (quote/title/run id) so the same item doesn't flip mid-render.
 */
const crypto = require('crypto');

function hashSeed(s) {
  return crypto.createHash('sha1').update(String(s || Date.now())).digest('hex');
}
function pick(pool, seed, salt = '') {
  const h = hashSeed(String(seed) + '|' + salt);
  const n = parseInt(h.slice(0, 8), 16);
  return pool[n % pool.length];
}
function pickIndex(len, seed, salt = '') {
  const h = hashSeed(String(seed) + '|' + salt);
  return parseInt(h.slice(0, 8), 16) % len;
}

/** 10 fonts safe on GitHub ubuntu (liberation + dejavu + arial black fallbacks) */
const FONTS = [
  { name: 'Arial Black', family: 'Arial Black, DejaVu Sans, sans-serif', ass: 'Arial Black' },
  { name: 'Georgia', family: 'Georgia, serif', ass: 'Georgia' },
  { name: 'Impact', family: 'Impact, DejaVu Sans, sans-serif', ass: 'Impact' },
  { name: 'DejaVu Sans Bold', family: 'DejaVu Sans, sans-serif', ass: 'DejaVu Sans' },
  { name: 'Liberation Serif', family: 'Liberation Serif, serif', ass: 'Liberation Serif' },
  { name: 'Liberation Sans', family: 'Liberation Sans, sans-serif', ass: 'Liberation Sans' },
  { name: 'Courier New', family: 'Courier New, monospace', ass: 'Courier New' },
  { name: 'Trebuchet', family: 'Trebuchet MS, DejaVu Sans, sans-serif', ass: 'Trebuchet MS' },
  { name: 'Verdana', family: 'Verdana, DejaVu Sans, sans-serif', ass: 'Verdana' },
  { name: 'Palatino', family: 'Palatino Linotype, Liberation Serif, serif', ass: 'Palatino Linotype' }
];

/** 10 hook frameworks */
const HOOKS = [
  { id: 'did_you_know', label: 'Did you know?', open: (t) => `Did you know? ${t}` },
  { id: 'question', label: 'Direct question', open: (t) => `${t}` },
  { id: 'brutal_truth', label: 'Brutal truth', open: (t) => `Most people get this wrong. ${t}` },
  { id: 'number_lead', label: 'Number lead', open: (t) => `3 seconds. ${t}` },
  { id: 'contrast', label: 'Before/after', open: (t) => `Before this, everything felt harder. ${t}` },
  { id: 'story_seed', label: 'Story seed', open: (t) => `There's a quiet story behind this. ${t}` },
  { id: 'challenge', label: 'Challenge', open: (t) => `Try this once. ${t}` },
  { id: 'myth_bust', label: 'Myth bust', open: (t) => `Forget what you heard. ${t}` },
  { id: 'late_night', label: 'Late-night', open: (t) => `At 2 AM this hits different. ${t}` },
  { id: 'one_rule', label: 'One rule', open: (t) => `One rule changes it. ${t}` }
];

/** 10 soft fallback SFX / BGM search queries (no hard drums) */
const SFX_QUERIES = [
  'soft piano ambient instrumental no drums',
  'gentle piano pad atmospheric quiet',
  'minimal warm strings soft ambient',
  'calm cello piano reflection',
  'lofi soft keys no beat ambient',
  'distant piano rain soft room tone',
  'quiet synth pad emotional soft',
  'acoustic guitar soft ambient fingerstyle',
  'church soft organ pad distant',
  'wind chimes soft piano sparse'
];

/** 10 caption positions (ASS Alignment + MarginV) */
const CAPTION_POS = [
  { id: 'center', align: 5, marginV: 0, label: 'dead center' },
  { id: 'upper_center', align: 8, marginV: 280, label: 'upper third' },
  { id: 'lower_center', align: 2, marginV: 220, label: 'lower third' },
  { id: 'mid_high', align: 5, marginV: 120, label: 'slightly high center' },
  { id: 'mid_low', align: 5, marginV: -80, label: 'slightly low center' },
  { id: 'top_safe', align: 8, marginV: 160, label: 'top safe' },
  { id: 'bottom_safe', align: 2, marginV: 160, label: 'bottom safe' },
  { id: 'center_leftish', align: 5, marginV: 40, label: 'center soft' },
  { id: 'story_mid', align: 5, marginV: 200, label: 'story mid' },
  { id: 'hook_top', align: 8, marginV: 320, label: 'hook top' }
];

/** 10 caption appear styles (ASS tags applied per line) */
const CAPTION_FX = [
  { id: 'karaoke_kf', tag: (cs) => `{\\kf${cs}}`, label: 'karaoke fill' },
  { id: 'fade_in', tag: () => '{\\fad(180,120)}', label: 'fade in/out' },
  { id: 'pop_scale', tag: () => '{\\fscx108\\fscy108\\t(0,160,\\fscx100\\fscy100)}', label: 'pop scale' },
  { id: 'blur_in', tag: () => '{\\blur2\\t(0,200,\\blur0)}', label: 'blur settle' },
  { id: 'slide_up', tag: () => '{\\move(540,980,540,920,0,220)}', label: 'slide up' },
  { id: 'slide_down', tag: () => '{\\move(540,860,540,920,0,220)}', label: 'slide down' },
  { id: 'type_alpha', tag: () => '{\\alpha&HFF&\\t(0,150,\\alpha&H00&)}', label: 'alpha type' },
  { id: 'bold_flash', tag: () => '{\\c&HFFFFFF&\\t(0,100,\\c&H00FFFF&\\t(100,200,\\c&HFFFFFF&))}', label: 'flash accent' },
  { id: 'soft_outline', tag: () => '{\\bord4\\shad2}', label: 'thick outline' },
  { id: 'plain_hold', tag: () => '', label: 'plain hold' }
];

/** 10 FFmpeg visual FX fragments (applied on image/video plates) */
const VISUAL_FX = [
  {
    id: 'kenburns_in',
    vf: "scale=1200:2133,zoompan=z='min(1.12,1.0+0.0004*on)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30",
    label: 'slow zoom in'
  },
  {
    id: 'kenburns_out',
    vf: "scale=1300:2311,zoompan=z='if(eq(on,1),1.12,max(1.0,1.12-0.00035*on))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30",
    label: 'slow zoom out'
  },
  {
    id: 'pan_right',
    vf: "scale=1400:1920,crop=1080:1920:x='(in_w-out_w)*t/5':y=0",
    label: 'pan right'
  },
  {
    id: 'pan_left',
    vf: "scale=1400:1920,crop=1080:1920:x='(in_w-out_w)*(1-t/5)':y=0",
    label: 'pan left'
  },
  {
    id: 'bw_grain',
    vf: 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,hue=s=0,eq=contrast=1.15,noise=alls=6:allf=t',
    label: 'B&W grain'
  },
  {
    id: 'old_tv',
    vf: 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,hue=s=0.35,eq=contrast=1.2:brightness=-0.03,noise=alls=10:allf=t',
    label: 'old TV'
  },
  {
    id: 'fade_pair',
    vf: 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fade=t=in:st=0:d=0.35,fade=t=out:st=4.4:d=0.4',
    label: 'fade in-out'
  },
  {
    id: 'soft_blur_edge',
    vf: "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=0.4",
    label: 'soft focus'
  },
  {
    id: 'high_contrast',
    vf: 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,eq=contrast=1.35:saturation=0.85',
    label: 'high contrast'
  },
  {
    id: 'vignette_push',
    vf: "scale=1180:2098,zoompan=z='min(1.08,1.0+0.0003*on)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=30,eq=brightness=-0.02:contrast=1.1",
    label: 'vignette push'
  }
];

/** Voice: same neural family, deeper bias + pace variants */
const VOICE_PROFILES = [
  { id: 'deep_slow', voice: 'en-US-AndrewNeural', rate: '-18%', pitch: '-28Hz' },
  { id: 'deep_steady', voice: 'en-US-AndrewNeural', rate: '-12%', pitch: '-25Hz' },
  { id: 'deep_firm', voice: 'en-US-ChristopherNeural', rate: '-14%', pitch: '-22Hz' },
  { id: 'deep_calm', voice: 'en-US-GuyNeural', rate: '-10%', pitch: '-20Hz' },
  { id: 'stoic_heavy', voice: 'en-US-AndrewNeural', rate: '-20%', pitch: '-30Hz' },
  { id: 'story_low', voice: 'en-US-ChristopherNeural', rate: '-16%', pitch: '-26Hz' },
  { id: 'teen_bold', voice: 'en-US-ChristopherNeural', rate: '-8%', pitch: '-15Hz' },
  { id: 'teen_deep', voice: 'en-US-AndrewNeural', rate: '-10%', pitch: '-18Hz' },
  { id: 'doc_ominous', voice: 'en-US-GuyNeural', rate: '-15%', pitch: '-24Hz' },
  { id: 'doc_clear', voice: 'en-US-ChristopherNeural', rate: '-6%', pitch: '-12Hz' }
];

/** Channel defaults for which voice pool slice to prefer */
const CHANNEL_VOICE_BIAS = {
  stoic: ['stoic_heavy', 'deep_slow', 'deep_steady', 'story_low'],
  teen: ['teen_deep', 'teen_bold', 'deep_firm', 'deep_calm'],
  driftreel: ['doc_ominous', 'story_low', 'deep_steady', 'doc_clear'],
  archie: ['teen_bold', 'doc_clear', 'deep_firm', 'deep_calm'],
  fin: ['deep_firm', 'deep_steady', 'doc_clear', 'teen_bold']
};

function selectStylePack(channel, seed) {
  const ch = String(channel || 'stoic').toLowerCase();
  const font = pick(FONTS, seed, 'font');
  const hook = pick(HOOKS, seed, 'hook');
  const sfx = pick(SFX_QUERIES, seed, 'sfx');
  const captionPos = pick(CAPTION_POS, seed, 'cappos');
  const captionFx = pick(CAPTION_FX, seed, 'capfx');
  const visualFx = pick(VISUAL_FX, seed, 'viz');

  const bias = CHANNEL_VOICE_BIAS[ch] || CHANNEL_VOICE_BIAS.stoic;
  const voiceId = pick(bias, seed, 'voice');
  const voice = VOICE_PROFILES.find((v) => v.id === voiceId) || VOICE_PROFILES[1];

  const pack = {
    channel: ch,
    seed: String(seed),
    font,
    hook,
    sfxQuery: sfx,
    captionPos,
    captionFx,
    visualFx,
    voice,
    // ASS style line (no box, outline only)
    assStyleName: 'RotatingCap',
    assStyleLine: buildAssStyleLine('RotatingCap', font, captionPos),
    summary: `${font.name} | ${hook.id} | ${captionPos.id} | ${captionFx.id} | ${visualFx.id} | ${voice.id}`
  };
  return pack;
}

function buildAssStyleLine(name, font, pos) {
  // Alignment, MarginL, MarginR, MarginV — BorderStyle 1 = outline only
  const size = 52;
  const align = pos.align || 5;
  const mv = Math.max(0, pos.marginV || 0);
  return `Style: ${name},${font.ass},${size},&H00FFFFFF,&H00000000,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,3.0,1.2,${align},60,60,${mv},1`;
}

/** Build rotating ASS dialogue block */
function buildRotatingAss(fullText, durationSec, pack) {
  const words = String(fullText || '')
    .replace(/\n/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const totalMs = Math.max(1200, Math.round(Number(durationSec) * 1000));
  const msPerWord = words.length ? totalMs / words.length : 300;
  const wordsPerLine = 3;

  const formatAssTime = (ms) => {
    const totalSec = Math.floor(ms / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    const sec = totalSec % 60;
    const min = Math.floor((totalSec % 3600) / 60);
    const hr = Math.floor(totalSec / 3600);
    return `${hr}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  };

  const fx = pack.captionFx || CAPTION_FX[0];
  const lines = [];
  for (let i = 0; i < words.length; i += wordsPerLine) {
    const chunk = words.slice(i, i + wordsPerLine);
    const start = Math.round(i * msPerWord);
    const end = Math.min(totalMs, Math.round((i + chunk.length) * msPerWord + 140));
    let body = '';
    for (const w of chunk) {
      const cs = Math.max(8, Math.round(msPerWord / 10));
      if (fx.id === 'karaoke_kf') body += `{\kf${cs}}${w.toUpperCase()} `;
      else body += `${fx.tag(cs)}${w.toUpperCase()} `;
    }
    lines.push(
      `Dialogue: 0,${formatAssTime(start)},${formatAssTime(end)},${pack.assStyleName || 'RotatingCap'},,0,0,0,,${body.trim()}`
    );
  }

  return `[Script Info]
Title: Rotating Captions
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
${pack.assStyleLine}

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${lines.join('\n')}
`;
}

module.exports = {
  FONTS,
  HOOKS,
  SFX_QUERIES,
  CAPTION_POS,
  CAPTION_FX,
  VISUAL_FX,
  VOICE_PROFILES,
  selectStylePack,
  buildRotatingAss,
  buildAssStyleLine,
  pick,
  pickIndex,
  hashSeed
};
