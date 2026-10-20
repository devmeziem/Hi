#!/usr/bin/env node
/** Shared content system apply — also ensures YouTube AI synthetic flag (soft). */
try {
  require('./apply_youtube_ai_flag.cjs');
} catch (e) {
  console.warn('[apply-all] ai-flag soft skip', e.message);
}
try {
  require('./restore_youtube_dispatcher_ai.cjs');
} catch (e) {
  console.warn('[apply-all] yt restore soft skip', e.message);
}
console.log('[apply-all] content system hooks done');
