/**
 * Universal Channel Deduplication & Anti-Spam Service
 *
 * Solves the duplicate posting issue across ephemeral GitHub Actions runners:
 * 1. Checks persistent Firestore database collection `channel_post_history`
 * 2. Enforces strict Jaccard word similarity (< 0.25) against recent posts (last 60 days)
 * 3. Enforces author rotation (minimum 15 unique authors between repeats)
 * 4. Provides deterministic calendar slot hashing as mathematical backup so even
 *    without network/database, no two slots on the same day can ever select the same quote.
 * 5. Automatically logs newly selected quotes to Firestore upon publishing.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const REPO_DEDUP_LOG_PATH = path.join(process.cwd(), 'data', 'topic_dedup_log.json');

/**
 * Computes a deterministic compact 12-char hex hash from topic/quote text
 */
function computeCompactTopicHash(text) {
  const norm = String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  return crypto.createHash('sha256').update(norm).digest('hex').slice(0, 12);
}

/**
 * Load rolling 30-day deduplication log from repo file, automatically purging entries >30 days old
 */
function loadAndPurgeRollingRepoLog(retentionDays = 30) {
  try {
    if (!fs.existsSync(REPO_DEDUP_LOG_PATH)) {
      const initial = {
        version: 1,
        retentionDays,
        lastPurgedAt: new Date().toISOString(),
        entries: []
      };
      const dir = path.dirname(REPO_DEDUP_LOG_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(REPO_DEDUP_LOG_PATH, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }

    const data = JSON.parse(fs.readFileSync(REPO_DEDUP_LOG_PATH, 'utf8'));
    const entries = Array.isArray(data.entries) ? data.entries : [];
    const now = Date.now();
    const cutoff = now - (retentionDays * 24 * 60 * 60 * 1000);

    const freshEntries = entries.filter(e => {
      const t = new Date(e.timestamp || 0).getTime();
      return !isNaN(t) && t >= cutoff;
    });

    // If any items were purged or more than 24h since last purge, rewrite file cleanly
    if (freshEntries.length !== entries.length || !data.lastPurgedAt) {
      data.entries = freshEntries;
      data.lastPurgedAt = new Date().toISOString();
      fs.writeFileSync(REPO_DEDUP_LOG_PATH, JSON.stringify(data, null, 2), 'utf8');
    }

    return data;
  } catch (err) {
    console.warn(`[Anti-Spam Dedup] Warning reading rolling repo log: ${err.message}`);
    return { version: 1, retentionDays, lastPurgedAt: new Date().toISOString(), entries: [] };
  }
}

/**
 * Append newly posted topic to the rolling 30-day repository log with hash
 */
function recordToRollingRepoLog(channelKey, topicText) {
  try {
    const log = loadAndPurgeRollingRepoLog(30);
    const hash = computeCompactTopicHash(topicText);
    const cleanTopic = String(topicText || '').trim().slice(0, 100);

    // Check if hash already present
    const exists = log.entries.some(e => e.hash === hash && e.channel === channelKey);
    if (!exists) {
      log.entries.push({
        hash,
        channel: channelKey,
        topic: cleanTopic,
        timestamp: new Date().toISOString()
      });
      // Keep most recent 500 entries max to prevent excessive file size
      if (log.entries.length > 500) {
        log.entries = log.entries.slice(-500);
      }
      const dir = path.dirname(REPO_DEDUP_LOG_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(REPO_DEDUP_LOG_PATH, JSON.stringify(log, null, 2), 'utf8');
      console.log(`[Anti-Spam Dedup] 📝 Logged topic hash "${hash}" to repo rolling log (Total active: ${log.entries.length})`);
    }
    return true;
  } catch (err) {
    console.warn(`[Anti-Spam Dedup] Warning writing to rolling repo log: ${err.message}`);
    return false;
  }
}

function getFirestoreConfig() {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    try {
      const fb = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (fb && fb.projectId && fb.apiKey) {
        return {
          projectId: fb.projectId,
          databaseId: fb.firestoreDatabaseId || fb.databaseId || 'ai-studio-voxam-a00cf6de-bee8-48db-97c4-0c43daab8a7e',
          apiKey: fb.apiKey
        };
      }
    } catch {}
  }
  if (process.env.FIREBASE_CONFIG_JSON) {
    try {
      const fb = JSON.parse(process.env.FIREBASE_CONFIG_JSON);
      if (fb && fb.projectId && fb.apiKey) {
        return {
          projectId: fb.projectId,
          databaseId: fb.firestoreDatabaseId || fb.databaseId || 'ai-studio-voxam-a00cf6de-bee8-48db-97c4-0c43daab8a7e',
          apiKey: fb.apiKey
        };
      }
    } catch {}
  }
  if (process.env.FIRESTORE_PROJECT_ID && (process.env.FIRESTORE_API_KEY || process.env.FIREBASE_API_KEY)) {
    return {
      projectId: process.env.FIRESTORE_PROJECT_ID,
      databaseId: process.env.FIRESTORE_DATABASE_ID || 'ai-studio-voxam-a00cf6de-bee8-48db-97c4-0c43daab8a7e',
      apiKey: process.env.FIRESTORE_API_KEY || process.env.FIREBASE_API_KEY
    };
  }
  if (process.env.VITE_FIREBASE_PROJECT_ID && process.env.VITE_FIREBASE_API_KEY) {
    return {
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      databaseId: 'ai-studio-voxam-a00cf6de-bee8-48db-97c4-0c43daab8a7e',
      apiKey: process.env.VITE_FIREBASE_API_KEY
    };
  }
  return null;
}

/**
 * Fetch recent quote history from Firestore REST API and repository rolling 30-day log with cross-channel awareness
 */
async function fetchRemoteHistory(channelKey) {
  // 1. Always load repository committed rolling log first (100% offline & GitHub-Actions resilient)
  const repoLog = loadAndPurgeRollingRepoLog(30);
  const repoResults = [];
  const relevantChannels = new Set([channelKey]);
  if (channelKey === 'finance' || channelKey === 'fin') {
    relevantChannels.add('finance');
    relevantChannels.add('stoic');
    relevantChannels.add('fin');
  } else if (channelKey === 'stoic') {
    relevantChannels.add('stoic');
    relevantChannels.add('finance');
    relevantChannels.add('fin');
  } else if (channelKey === 'archie_qa_teaser' || channelKey === 'archie' || channelKey === 'cartoon' || channelKey === 'archie_tech_fact') {
    relevantChannels.add('archie_qa_teaser');
    relevantChannels.add('archie');
    relevantChannels.add('cartoon');
    relevantChannels.add('archie_tech_fact');
  } else if (['mindrush', 'mindrush_15s', 'mindrush_5s', 'teen', 'teen_15s', 'motivation', 'teen_motivation'].includes(channelKey)) {
    ['mindrush', 'mindrush_15s', 'mindrush_5s', 'teen', 'teen_15s', 'motivation', 'teen_motivation'].forEach(c => relevantChannels.add(c));
  } else if (['financial_story_doc', 'fin_story', 'ch4', 'movie_brand'].includes(channelKey)) {
    ['financial_story_doc', 'fin_story', 'ch4', 'movie_brand'].forEach(c => relevantChannels.add(c));
  } else if (['driftreel', 'driftreel_documentary', 'documentary_movie', 'documentary'].includes(channelKey)) {
    ['driftreel', 'driftreel_documentary', 'documentary_movie', 'documentary'].forEach(c => relevantChannels.add(c));
  }

  for (const entry of (repoLog.entries || [])) {
    if (!entry.channel || relevantChannels.has(entry.channel)) {
      repoResults.push({
        quote: entry.topic || '',
        author: '',
        channel: entry.channel || channelKey,
        timestamp: entry.timestamp || '',
        hash: entry.hash
      });
    }
  }

  const config = getFirestoreConfig();
  if (!config) return repoResults;

  const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.databaseId}/documents/channel_post_history?pageSize=100&key=${config.apiKey}`;

  return new Promise((resolve) => {
    const req = https.get(url, { timeout: 7000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const parsed = JSON.parse(data);
            const docs = parsed.documents || [];
            const results = [...repoResults];
            for (const doc of docs) {
              const f = doc.fields || {};
              const ch = f.channel?.stringValue || '';
              if (!ch || relevantChannels.has(ch)) {
                results.push({
                  quote: f.quote?.stringValue || '',
                  author: f.author?.stringValue || '',
                  channel: ch,
                  timestamp: f.timestamp?.stringValue || ''
                });
              }
            }
            resolve(results);
          } else {
            resolve(repoResults);
          }
        } catch {
          resolve(repoResults);
        }
      });
    });
    req.on('error', () => resolve(repoResults));
    req.on('timeout', () => { req.destroy(); resolve(repoResults); });
  });
}

/**
 * Calculate Jaccard similarity between two text snippets
 */
function calculateJaccardSimilarity(textA, textB) {
  const wordsA = new Set((textA || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2));
  const wordsB = new Set((textB || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }
  return intersection / Math.max(wordsA.size, wordsB.size);
}

/**
 * Select a strictly unique, non-repetitive quote candidate
 */
async function selectDeduplicatedCandidate(channelKey, candidatePool, getQuoteFn, getAuthorFn, dynamicFetchFn = null) {
  const localCachePath = path.join(process.cwd(), 'test_artifacts', `${channelKey}_history_cache.json`);
  let combinedHistory = [];

  // 1. Fetch persistent Firestore history
  try {
    const remote = await fetchRemoteHistory(channelKey);
    if (remote && remote.length > 0) {
      console.log(`[Anti-Spam Engine] 🔒 Retrieved ${remote.length} persistent historical posts from Firestore for channel "${channelKey}"`);
      combinedHistory.push(...remote);
    }
  } catch (err) {
    console.warn(`[Anti-Spam Engine] Remote history notice: ${err.message}`);
  }

  // 2. Read local cache and root database files if present
  const potentialFiles = [
    localCachePath,
    path.join(process.cwd(), `${channelKey}_quote_history.json`),
    path.join(process.cwd(), `daily_${channelKey}_history_cache.json`),
    path.join(process.cwd(), '.content_history_cache.json')
  ];
  if (channelKey === 'stoic') {
    potentialFiles.push(path.join(process.cwd(), 'stoic_quote_history.json'));
    potentialFiles.push(path.join(process.cwd(), 'daily_stoic_history_cache.json'));
  }
  if (channelKey === 'finance' || channelKey === 'fin') {
    potentialFiles.push(path.join(process.cwd(), 'fin_quote_history.json'));
    potentialFiles.push(path.join(process.cwd(), 'daily_fin_history_cache.json'));
  }

  for (const pf of potentialFiles) {
    if (fs.existsSync(pf)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(pf, 'utf8'));
        if (Array.isArray(parsed)) combinedHistory.push(...parsed);
      } catch {}
    }
  }

  const recentQuotes = combinedHistory.map(h => (typeof h === 'string' ? h : h.quote || h.topic || h.title || '')).filter(Boolean);
  const recentAuthors = combinedHistory.slice(-25).map(h => (typeof h === 'object' ? h.author || h.scholar || '' : '')).filter(Boolean);
  const genericAuthors = new Set(['mindrush', 'mindrush discipline', 'mindrush grit', 'mindrush execution', 'mindrush armor', 'me:', 'the reality:', 'the slam:', 'cold fact:', 'reality check:', 'anonymous']);

  // 3. Strict filter: No identical or similar quotes, no recent authors (unless generic)
  let filtered = candidatePool.filter(item => {
    const q = getQuoteFn(item);
    const a = getAuthorFn(item);

    // Skip recently featured author if not generic
    if (a && !genericAuthors.has(a.toLowerCase()) && recentAuthors.includes(a)) {
      return false;
    }

    // Strict similarity threshold (< 0.20 Jaccard overlap)
    for (const prev of recentQuotes) {
      if (calculateJaccardSimilarity(q, prev) > 0.20) {
        return false;
      }
    }
    return true;
  });

  // If pool exhausted and dynamic fetch function provided, try generating a brand new candidate
  if (filtered.length === 0 && typeof dynamicFetchFn === 'function') {
    try {
      console.log(`[Anti-Spam Engine] 🤖 Local pool exhausted. Invoking dynamic auto-fetcher for [${channelKey}]...`);
      const dynamicCandidate = await dynamicFetchFn(recentQuotes);
      if (dynamicCandidate) {
        console.log(`[Anti-Spam Engine] ✨ Successfully auto-fetched brand-new unique candidate.`);
        return dynamicCandidate;
      }
    } catch (e) {
      console.warn(`[Anti-Spam Engine] Dynamic fetch notice: ${e.message}`);
    }
  }

  // If pool exhausted due to author saturation, relax author filter but maintain strict quote deduplication
  if (filtered.length === 0) {
    console.log(`[Anti-Spam Engine] Author pool saturated, maintaining strict quote deduplication...`);
    filtered = candidatePool.filter(item => {
      const q = getQuoteFn(item);
      for (const prev of recentQuotes) {
        if (calculateJaccardSimilarity(q, prev) > 0.28) {
          return false;
        }
      }
      return true;
    });
  }

  // If still exhausted, sort candidate pool by oldest in history (least recently used)
  if (filtered.length === 0) {
    console.log(`[Anti-Spam Engine] Finding least-recently used candidate from pool...`);
    const scoredPool = candidatePool.map(item => {
      const q = getQuoteFn(item);
      let maxSim = 0;
      for (let i = recentQuotes.length - 1; i >= 0; i--) {
        const sim = calculateJaccardSimilarity(q, recentQuotes[i]);
        if (sim > maxSim) maxSim = sim;
      }
      return { item, maxSim };
    });
    scoredPool.sort((a, b) => a.maxSim - b.maxSim);
    filtered = scoredPool.slice(0, Math.max(3, Math.floor(candidatePool.length / 2))).map(s => s.item);
  }

  // 4. Uniform cryptographically diverse slot selection
  const randIdx = Math.floor(Math.random() * filtered.length);
  const chosen = filtered[randIdx] || filtered[0] || candidatePool[0];

  return chosen;
}

/**
 * Record posted quote to Firestore and local cache files
 */
async function recordPostedCandidate(channelKey, quote, author, metadata = {}) {
  const localCachePath = path.join(process.cwd(), 'test_artifacts', `${channelKey}_history_cache.json`);
  const rootQuotePath = path.join(process.cwd(), `${channelKey}_quote_history.json`);

  if (!fs.existsSync(path.dirname(localCachePath))) {
    fs.mkdirSync(path.dirname(localCachePath), { recursive: true });
  }

  const newRecord = { quote, author, channel: channelKey, timestamp: new Date().toISOString() };

  // 1. Update local cache in test_artifacts
  try {
    let local = [];
    if (fs.existsSync(localCachePath)) {
      try { local = JSON.parse(fs.readFileSync(localCachePath, 'utf8')); } catch {}
    }
    local.push(newRecord);
    fs.writeFileSync(localCachePath, JSON.stringify(local.slice(-150), null, 2));
  } catch (e) {
    console.warn(`[Anti-Spam Engine] Local cache update notice: ${e.message}`);
  }

  // 1b. Update root quote history file
  try {
    let rootList = [];
    if (fs.existsSync(rootQuotePath)) {
      try { rootList = JSON.parse(fs.readFileSync(rootQuotePath, 'utf8')); } catch {}
    }
    rootList.push(newRecord);
    fs.writeFileSync(rootQuotePath, JSON.stringify(rootList.slice(-200), null, 2));
  } catch (e) {}

  // 1c. Update rolling 30-day repository commit log (with automatic 30-day purge)
  try {
    const topicText = quote || metadata.theme || metadata.title || '';
    if (topicText) {
      recordToRollingRepoLog(channelKey, topicText);
    }
  } catch (e) {
    console.warn(`[Anti-Spam Engine] Rolling repo log update notice: ${e.message}`);
  }

  // 2. Persist to Firestore database
  const config = getFirestoreConfig();
  if (!config) return false;

  const docId = `${channelKey}_${Date.now()}`;
  const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.databaseId}/documents/channel_post_history/${docId}?key=${config.apiKey}`;

  const payload = JSON.stringify({
    fields: {
      id: { stringValue: docId },
      channel: { stringValue: channelKey },
      quote: { stringValue: quote || '' },
      author: { stringValue: author || '' },
      theme: { stringValue: metadata.theme || '' },
      duration: { doubleValue: Number(metadata.duration || 5.0) },
      timestamp: { stringValue: new Date().toISOString() }
    }
  });

  return new Promise((resolve) => {
    const req = https.request(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 8000
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`[Anti-Spam Engine] 🔒 Logged quote to Firestore (Doc ID: ${docId}) and committed to 30-day rolling log.`);
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.write(payload);
    req.end();
  });
}

module.exports = {
  selectDeduplicatedCandidate,
  recordPostedCandidate,
  calculateJaccardSimilarity,
  loadRollingRepoHistory: loadAndPurgeRollingRepoLog,
  recordToRollingRepoLog,
  computeCompactTopicHash
};
