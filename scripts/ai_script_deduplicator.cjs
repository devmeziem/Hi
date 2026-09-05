/**
 * AI Script Deduplication Engine
 * 
 * Performs multi-layered AI and semantic similarity evaluation on generated scripts
 * against channel history (Firestore & local manifests) to ensure 0% repetitive or spammy content.
 */

const https = require('https');

/**
 * Stop words for text normalization
 */
const STOP_WORDS = new Set([
  'the', 'and', 'for', 'that', 'this', 'with', 'you', 'your', 'from', 'are', 'was',
  'what', 'when', 'why', 'how', 'all', 'any', 'can', 'will', 'have', 'has', 'had',
  'but', 'not', 'they', 'them', 'their', 'there', 'here', 'into', 'just', 'more',
  'most', 'some', 'than', 'then', 'out', 'over', 'also', 'about', 'like', 'were',
  'been', 'being', 'shorts', 'viral', 'trending', 'today', 'video', 'every', 'day'
]);

/**
 * Tokenize and normalize text into meaningful word shingles
 */
function extractSignificantShingles(text, shingleSize = 2) {
  const words = String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));

  const shingles = new Set();
  for (let i = 0; i <= words.length - shingleSize; i++) {
    shingles.add(words.slice(i, i + shingleSize).join('_'));
  }
  return { words: new Set(words), shingles };
}

/**
 * Calculate Jaccard similarity between two sets
 */
function calculateJaccardSimilarity(setA, setB) {
  if (!setA.size || !setB.size) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

/**
 * Fast local syntactic and semantic deduplication
 */
function checkLocalSyntacticOverlap(candidateScriptText, recentScripts = []) {
  const candidate = extractSignificantShingles(candidateScriptText);
  let maxSimilarity = 0;
  let matchedTitle = '';
  let matchReason = '';

  // Known repetitive clichés to strictly ban
  const BANNED_CLICHES = [
    /depend on other people('?s)? praise/i,
    /seeking applause from spectators/i,
    /spectators who don'?t run/i,
    /love yourself more than others.*value their opinions/i,
    /why do you value other people/i,
    /lock(ing)? every cell in suspended animation/i,
    /defies ordinary physics/i
  ];

  for (const regex of BANNED_CLICHES) {
    if (regex.test(candidateScriptText)) {
      return {
        isDuplicate: true,
        similarityScore: 95,
        matchedTitle: 'Banned Cliché Pattern',
        reason: `Script contains known overused template phrase matching: ${regex.source}`
      };
    }
  }

  for (const prev of recentScripts) {
    const prevFullText = [
      prev.title || prev.topic || '',
      ...(Array.isArray(prev.slides) ? prev.slides.map(s => s.text || s.dialogue || '') : []),
      prev.description || ''
    ].join(' ');

    const prevAnalysis = extractSignificantShingles(prevFullText);
    const wordSim = calculateJaccardSimilarity(candidate.words, prevAnalysis.words);
    const shingleSim = calculateJaccardSimilarity(candidate.shingles, prevAnalysis.shingles);
    const combinedScore = (wordSim * 0.4 + shingleSim * 0.6) * 100;

    if (combinedScore > maxSimilarity) {
      maxSimilarity = combinedScore;
      matchedTitle = prev.title || prev.topic || 'Previous video';
      matchReason = `Shares ${Math.round(combinedScore)}% phrase and shingle overlap with "${matchedTitle}"`;
    }
  }

  return {
    isDuplicate: maxSimilarity >= 32, // Stricter threshold: anything above 32% similarity is rejected
    similarityScore: Math.round(maxSimilarity),
    matchedTitle,
    reason: matchReason || 'Unique vocabulary and structure'
  };
}

/**
 * Perform AI LLM Semantic Deduplication Evaluation
 */
async function evaluateScriptWithAi(candidateStoryboard, recentScripts = [], config = {}) {
  const candidateText = (candidateStoryboard.slides || [])
    .map(s => `Slide ${s.slideIndex ?? ''}: ${s.text || s.dialogue || ''}`)
    .join('\n');

  // 1. First run fast local syntactic check
  const localCheck = checkLocalSyntacticOverlap(
    (candidateStoryboard.title || '') + '\n' + candidateText,
    recentScripts
  );

  if (localCheck.isDuplicate) {
    return {
      isDuplicate: true,
      similarityScore: localCheck.similarityScore,
      reason: `[Local Syntactic Filter] ${localCheck.reason}`,
      provider: 'Local N-Gram Deduplicator'
    };
  }

  // If no recent scripts to compare against, local check is sufficient
  if (!recentScripts || recentScripts.length === 0) {
    return { isDuplicate: false, similarityScore: localCheck.similarityScore, reason: 'No prior history to compare.' };
  }

  // 2. Perform LLM semantic comparison if Cloudflare / Gemini / Groq is available
  const sampleHistory = recentScripts.slice(0, 5).map((p, idx) => {
    const slidesSummary = Array.isArray(p.slides) 
      ? p.slides.slice(0, 3).map(s => s.text || s.dialogue || '').join(' ')
      : (p.description || '');
    return `[Video ${idx + 1}] Title: "${p.title || p.topic}". Excerpt: "${slidesSummary.slice(0, 140)}"`;
  }).join('\n');

  const evalPrompt = `Compare this candidate YouTube script against the channel's recent 5 published videos to detect semantic duplicates, repetitive storytelling, or plagiarized points.

CANDIDATE SCRIPT:
Title: "${candidateStoryboard.title}"
Narration:
${candidateText}

RECENT CHANNEL HISTORY:
${sampleHistory}

EVALUATION RULES:
1. Is this candidate script virtually saying the same thing as any past video?
2. Does it re-use identical hooks, core philosophical arguments, or business steps?
3. If it is genuinely a distinct angle with unique narrative details, mark isDuplicate: false.

Return strictly raw JSON:
{
  "isDuplicate": boolean,
  "similarityScore": number (0 to 100),
  "reason": "short explanation of why it is unique or repetitive"
}`;

  // Attempt Cloudflare AI for evaluation if present
  const { accountId, apiToken } = config;
  if (accountId && apiToken) {
    try {
      const postData = JSON.stringify({
        messages: [
          { role: 'system', content: 'You are an editorial YouTube Shorts quality assurance director.' },
          { role: 'user', content: evalPrompt }
        ],
        max_tokens: 300
      });

      const aiRes = await new Promise((resolve) => {
        const req = https.request(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: 7000
        }, (res) => {
          let data = '';
          res.on('data', c => data += c);
          res.on('end', () => {
            if (res.statusCode === 200) {
              try {
                const j = JSON.parse(data);
                resolve({ success: true, content: j.result?.response || j.response });
              } catch (e) { resolve({ success: false }); }
            } else { resolve({ success: false }); }
          });
        });
        req.on('error', () => resolve({ success: false }));
        req.on('timeout', () => { req.destroy(); resolve({ success: false }); });
        req.write(postData);
        req.end();
      });

      if (aiRes.success && aiRes.content) {
        const match = aiRes.content.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          return {
            isDuplicate: Boolean(parsed.isDuplicate) || (Number(parsed.similarityScore) >= 40),
            similarityScore: Number(parsed.similarityScore) || localCheck.similarityScore,
            reason: `[AI Deduplicator] ${parsed.reason || 'Semantic similarity evaluation complete.'}`,
            provider: 'Cloudflare AI Deduplicator'
          };
        }
      }
    } catch {}
  }

  // Fallback to strict local syntactic check result
  return {
    isDuplicate: localCheck.isDuplicate,
    similarityScore: localCheck.similarityScore,
    reason: localCheck.reason,
    provider: 'Syntactic N-Gram Engine'
  };
}

module.exports = {
  checkLocalSyntacticOverlap,
  evaluateScriptWithAi
};
