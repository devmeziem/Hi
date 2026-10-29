#!/usr/bin/env node
/**
 * Stoic anti-spam + design/image rotation — applied before each generate run.
 */
const fs = require('fs');
const path = require('path');

const TARGET = path.join(process.cwd(), 'scripts', 'generate_stoic_quote_reel.cjs');
if (!fs.existsSync(TARGET)) {
  console.error('[stoic-rotate] missing generate_stoic_quote_reel.cjs');
  process.exit(0);
}

let t = fs.readFileSync(TARGET, 'utf8');
const backup = t;

// Helpers as plain string (no nested template hell)
const HELPERS = [
  'function normalizeStoicQuote(q) {',
  "  return String(q || '').toLowerCase()",
  "    .replace(/[\u201C\u201D\"']/g, '')",
  "    .replace(/[^a-z0-9\\s]/g, ' ')",
  "    .replace(/\\s+/g, ' ').trim();",
  '}',
  'function jaccardTokens(a, b) {',
  '  const A = new Set(normalizeStoicQuote(a).split(" ").filter(function(w){return w.length>2;}));',
  '  const B = new Set(normalizeStoicQuote(b).split(" ").filter(function(w){return w.length>2;}));',
  '  if (!A.size || !B.size) return 0;',
  '  var inter = 0; A.forEach(function(x){ if (B.has(x)) inter++; });',
  '  return inter / (A.size + B.size - inter);',
  '}',
  'function loadStoicQuoteHistory() {',
  '  var paths = [path.join(process.cwd(),"stoic_quote_history.json"), path.join(process.cwd(),"data","stoic_quote_history.json"), path.join(process.cwd(),"test_artifacts","stoic_history_cache.json")];',
  '  var out = [];',
  '  paths.forEach(function(p){ try { if (!fs.existsSync(p)) return; var j=JSON.parse(fs.readFileSync(p,"utf8")); var arr=Array.isArray(j)?j:(j.entries||j.quotes||j.history||[]); arr.forEach(function(e){ var q=e.quote||e.topic||e.text||""; if(q) out.push(String(q)); }); } catch(e){} });',
  '  return out.slice(-50);',
  '}',
  'function isQuoteTooSimilar(quote, history, threshold) {',
  '  threshold = threshold == null ? 0.52 : threshold;',
  '  var n = normalizeStoicQuote(quote);',
  '  for (var i=0;i<history.length;i++){ if (normalizeStoicQuote(history[i])===n) return true; if (jaccardTokens(quote, history[i])>=threshold) return true; }',
  '  return false;',
  '}',
  'function stoicLayoutIndex(quote) {',
  '  var s = normalizeStoicQuote(quote); var h=0;',
  '  for (var i=0;i<s.length;i++) h = (h*31 + s.charCodeAt(i)) >>> 0;',
  '  return h % 5;',
  '}',
  'function buildRotatedStoicOverlaySvg(opts) {',
  '  var quoteLines=opts.quoteLines, fontSize=opts.fontSize, lineHeight=opts.lineHeight;',
  '  var authorFontSize=opts.authorFontSize, credFontSize=opts.credFontSize;',
  '  var author=opts.author, credentials=opts.credentials||"", layoutIndex=opts.layoutIndex, escapeXml=opts.escapeXml;',
  '  var numLines=quoteLines.length;',
  '  var quoteBlockHeight=(numLines-1)*lineHeight;',
  '  var quoteTspans=quoteLines.map(function(line,idx){ return "<tspan x=\\"540\\" dy=\\""+(idx===0?0:lineHeight)+"\\">"+escapeXml(line)+"</tspan>"; }).join("\\n        ");',
  '  var layouts=[',
  '    {name:"classic_center",quoteStartY:Math.max(820,1000-Math.round(quoteBlockHeight/2)),mark:true,markColor:"#f59e0b",textColor:"#ffffff",font:"Georgia, serif",divider:true,vignetteY:620},',
  '    {name:"lower_third",quoteStartY:Math.max(1100,1280-Math.round(quoteBlockHeight/2)),mark:false,markColor:"#e2e8f0",textColor:"#f8fafc",font:"Georgia, serif",divider:true,vignetteY:900},',
  '    {name:"ivory_soft",quoteStartY:Math.max(860,1040-Math.round(quoteBlockHeight/2)),mark:true,markColor:"#fde68a",textColor:"#fef3c7",font:"Georgia, serif",divider:false,vignetteY:680},',
  '    {name:"bold_sans",quoteStartY:Math.max(840,1020-Math.round(quoteBlockHeight/2)),mark:false,markColor:"#38bdf8",textColor:"#ffffff",font:"Arial Black, DejaVu Sans, sans-serif",divider:true,vignetteY:640},',
  '    {name:"mid_cyan",quoteStartY:Math.max(900,1100-Math.round(quoteBlockHeight/2)),mark:true,markColor:"#22d3ee",textColor:"#ecfeff",font:"Georgia, serif",divider:true,vignetteY:720}',
  '  ];',
  '  var L=layouts[layoutIndex%layouts.length];',
  '  var quoteBottomY=L.quoteStartY+quoteBlockHeight;',
  '  var dividerY=quoteBottomY+36;',
  '  var authorY=dividerY+(L.divider?44:28);',
  '  var credY=authorY+32;',
  '  var markXml=L.mark?("<text x=\\"540\\" y=\\""+(L.quoteStartY-42)+"\\" font-family=\\"Georgia, serif\\" font-size=\\"78\\" font-weight=\\"900\\" fill=\\""+L.markColor+"\\" fill-opacity=\\"0.9\\" text-anchor=\\"middle\\" filter=\\"url(#textGlow)\\">\\u201C</text>"):"";',
  '  var divXml=L.divider?("<line x1=\\"400\\" y1=\\""+dividerY+"\\" x2=\\"680\\" y2=\\""+dividerY+"\\" stroke=\\""+L.markColor+"\\" stroke-width=\\"2.2\\" stroke-linecap=\\"round\\" stroke-opacity=\\"0.8\\" />"):"";',
  '  return "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 1080 1920\\" width=\\"1080\\" height=\\"1920\\">"+',
  '    "<defs><filter id=\\"textGlow\\" x=\\"-30%\\" y=\\"-30%\\" width=\\"160%\\" height=\\"160%\\"><feDropShadow dx=\\"0\\" dy=\\"3\\" stdDeviation=\\"10\\" flood-color=\\"#000000\\" flood-opacity=\\"1.0\\" /></filter>"+',
  '    "<linearGradient id=\\"cinematicVignette\\" x1=\\"0\\" y1=\\"0\\" x2=\\"0\\" y2=\\"1\\"><stop offset=\\"0%\\" stop-color=\\"#000000\\" stop-opacity=\\"0\\" /><stop offset=\\"30%\\" stop-color=\\"#020617\\" stop-opacity=\\"0.5\\" /><stop offset=\\"100%\\" stop-color=\\"#000000\\" stop-opacity=\\"0.96\\" /></linearGradient></defs>"+',
  '    "<rect x=\\"0\\" y=\\""+L.vignetteY+"\\" width=\\"1080\\" height=\\""+(1920-L.vignetteY)+"\\" fill=\\"url(#cinematicVignette)\\" />"+markXml+',
  '    "<text x=\\"540\\" y=\\""+L.quoteStartY+"\\" font-family=\\""+L.font+"\\" font-size=\\""+fontSize+"\\" font-weight=\\"900\\" fill=\\""+L.textColor+"\\" text-anchor=\\"middle\\" filter=\\"url(#textGlow)\\">"+quoteTspans+"</text>"+divXml+',
  '    "<text x=\\"540\\" y=\\""+authorY+"\\" font-family=\\"system-ui, sans-serif\\" font-size=\\""+authorFontSize+"\\" font-weight=\\"700\\" fill=\\"#e2e8f0\\" text-anchor=\\"middle\\">\\u2014 "+escapeXml(author)+"</text>"+',
  '    "<text x=\\"540\\" y=\\""+credY+"\\" font-family=\\"system-ui, sans-serif\\" font-size=\\""+credFontSize+"\\" font-weight=\\"500\\" fill=\\"#94a3b8\\" text-anchor=\\"middle\\">"+escapeXml(credentials)+"</text></svg>";',
  '}',
  ''
].join('\n');

if (!t.includes('function normalizeStoicQuote')) {
  const marker = 'async function resolveScholarPortrait';
  const idx = t.indexOf(marker);
  if (idx > 0) {
    t = t.slice(0, idx) + HELPERS + '\n' + t.slice(idx);
    console.log('[stoic-rotate] helpers injected');
  }
}

// Hard dedup
if (!t.includes('isQuoteTooSimilar(chosen.quote')) {
  const oldPick =
    "const chosen = customChosen || await selectDeduplicatedCandidate('stoic', WORLD_SCHOLARS_QUOTES, q => q.quote, q => q.author);";
  const newPick = [
    "let chosen = customChosen || await selectDeduplicatedCandidate('stoic', WORLD_SCHOLARS_QUOTES, q => q.quote, q => q.author);",
    '  if (!customChosen) {',
    '    const hist = loadStoicQuoteHistory();',
    '    let tries = 0;',
    '    while (isQuoteTooSimilar(chosen.quote, hist, 0.48) && tries < 12) {',
    "      console.warn('[Stoic Dedup] REJECT similar quote:', String(chosen.quote).slice(0, 60));",
    '      const pool = WORLD_SCHOLARS_QUOTES.filter(q => !isQuoteTooSimilar(q.quote, hist.concat([chosen.quote]), 0.48));',
    '      if (!pool.length) break;',
    '      chosen = pool[Math.floor(Math.random() * pool.length)];',
    '      tries++;',
    '    }',
    '    if (isQuoteTooSimilar(chosen.quote, hist, 0.55)) {',
    "      console.warn('[Stoic Dedup] forcing least-overlap pick');",
    '      let best = chosen; let bestScore = 1;',
    '      for (const q of WORLD_SCHOLARS_QUOTES) {',
    '        const score = hist.length ? Math.max.apply(null, hist.map(h => jaccardTokens(q.quote, h))) : 0;',
    '        if (score < bestScore) { bestScore = score; best = q; }',
    '      }',
    '      chosen = best;',
    '    }',
    '  }'
  ].join('\n');
  if (t.includes(oldPick)) {
    t = t.replace(oldPick, newPick);
    console.log('[stoic-rotate] hard dedup wired');
  } else {
    console.warn('[stoic-rotate] pick line not found — check generator');
  }
}

// Overlay rotation
if (!t.includes('buildRotatedStoicOverlaySvg({') && t.includes('const overlaySvg = `<svg')) {
  const start = t.indexOf('const overlaySvg = `<svg');
  const endMarker = 'fs.writeFileSync(overlaySvgPath, overlaySvg';
  const end = t.indexOf(endMarker, start);
  if (start > 0 && end > start) {
    const replacement = [
      'const _layoutIdx = stoicLayoutIndex(chosen.quote);',
      "  console.log('[Stoic Design] layout #', _layoutIdx);",
      '  const overlaySvg = buildRotatedStoicOverlaySvg({',
      '    quoteLines, fontSize, lineHeight, authorFontSize, credFontSize,',
      '    author: chosen.author, credentials: chosen.credentials || "",',
      '    layoutIndex: _layoutIdx, escapeXml',
      '  });',
      '  '
    ].join('\n');
    t = t.slice(0, start) + replacement + t.slice(end);
    console.log('[stoic-rotate] overlay rotation wired');
  }
}

// Image query pool
if (t.includes('marble bust museum lighting chiaroscuro')) {
  const re = /const queryVariations = \[[\s\S]*?\];\s*const pickedQuery = queryVariations\[visualVariant % queryVariations\.length\];/;
  if (re.test(t)) {
    t = t.replace(
      re,
      [
        'const queryVariations = [',
        '      `${scholar.author} classical marble bust museum chiaroscuro`,',
        '      `${scholar.author} oil painting portrait dark background`,',
        '      `${scholar.author} historical engraving black and white`,',
        '      `ancient roman statue profile dramatic shadow`,',
        '      `weathered stone philosopher bust side light`,',
        '      `renaissance portrait painting contemplative`,',
        '      `dark library candlelight books atmosphere`,',
        '      `foggy classical ruins columns silhouette`',
        '    ];',
        '    const pickedQuery = queryVariations[(visualVariant + Date.now()) % queryVariations.length];'
      ].join('\n')
    );
    console.log('[stoic-rotate] image query pool expanded');
  }
}

// Bust cache: sometimes force re-fetch
t = t.replace(
  /if \(fs\.existsSync\(portraitPath\) && fs\.statSync\(portraitPath\)\.size > 10000\) \{\s*console\.log\(`\[Scholar Portrait\] Using verified authentic portrait for \$\{scholar\.author\} \(Variant #\$\{visualVariant \+ 1\}\)`\);\s*return portraitPath;\s*\}/,
  'if (fs.existsSync(portraitPath) && fs.statSync(portraitPath).size > 10000 && Math.random() > 0.5) {\n    console.log(`[Scholar Portrait] cache hit variant #${visualVariant + 1}`);\n    return portraitPath;\n  }'
);

if (t === backup) {
  console.log('[stoic-rotate] no net change');
} else {
  fs.writeFileSync(TARGET, t);
  console.log('[stoic-rotate] wrote', TARGET);
}
console.log('[stoic-rotate] done');
