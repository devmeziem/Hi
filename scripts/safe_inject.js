/** Shared helper: inject a require line AFTER shebang (never before). */
function injectRequireAfterShebang(source, requireLine) {
  if (!source || source.includes(requireLine.trim())) return source;
  const lines = source.split('\n');
  if (lines[0] && lines[0].startsWith('#!')) {
    // insert after shebang (+ optional blank)
    let i = 1;
    if (lines[i] === '') i++;
    lines.splice(i, 0, requireLine);
    return lines.join('\n');
  }
  return requireLine + '\n' + source;
}

module.exports = { injectRequireAfterShebang };
