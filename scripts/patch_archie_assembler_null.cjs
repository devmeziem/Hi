#!/usr/bin/env node
/** Fix null channelWatermark.toUpperCase crash; drop heavy watermark if null */
const fs = require('fs');
const path = require('path');
const p = path.join(process.cwd(), 'scripts', 'cartoon_audio_assembler.cjs');
if (!fs.existsSync(p)) process.exit(0);
let t = fs.readFileSync(p, 'utf8');
const bad = `const channelWatermark = getVerifiedChannelHandle('ch3');
  let vfFilters = [];

  // 1. Channel Watermark Pill (Top of video)
  vfFilters.push(\`drawtext=text='ARCHIE EXPLAINS • \${channelWatermark.toUpperCase()}':x=(w-text_w)/2:y=90:fontsize=22:fontcolor=white@0.95:box=1:boxcolor=black@0.75:boxborderw=12\`);`;
const good = `const channelWatermark = getVerifiedChannelHandle('ch3') || '@bonesceo';
  let vfFilters = [];

  // Optional light label only if handle exists (no hard crash)
  if (channelWatermark) {
    const safeWm = String(channelWatermark).replace(/'/g, "").slice(0, 24);
    // User preference: minimize watermark noise — skip drawtext brand pill
    console.log('[Audio/Media Engine] watermark skipped (handle=', safeWm, ')');
  }`;
if (t.includes("channelWatermark.toUpperCase()")) {
  t = t.replace(
    /const channelWatermark = getVerifiedChannelHandle\('ch3'\);[\s\S]*?vfFilters\.push\(`drawtext=text='ARCHIE EXPLAINS[^`]*`\);/,
    good
  );
  fs.writeFileSync(p, t);
  console.log('[patch-archie] fixed null watermark');
} else {
  console.log('[patch-archie] no change');
}
