#!/usr/bin/env node
/**
 * ==============================================================================
 * Buffer Channel Discovery & ID Inspector
 * ==============================================================================
 * Connects to your Buffer account using your BUFFER_API_KEY and retrieves all
 * connected channels (Facebook Pages, Instagram Accounts/Reels, TikTok, etc.)
 * with their exact Channel IDs ready to copy into GitHub Secrets or .env.
 *
 * Usage:
 *   BUFFER_API_KEY="your_token" node scripts/list_buffer_channels.cjs
 * Or via GitHub Actions:
 *   Run workflow ".github/workflows/list-buffer-channels.yml"
 * ==============================================================================
 */

const BUFFER_API_KEY = String(process.env.BUFFER_API_KEY || '').trim();

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  bgBlue: '\x1b[44m\x1b[37m'
};

async function queryGraphQLChannels(token) {
  const query = `query GetAccountChannels {
    account {
      id
      email
      organizations {
        id
        name
        channels {
          id
          name
          displayName
          service
          serviceId
          avatar
          isDisconnected
          isLocked
        }
      }
    }
  }`;

  const res = await fetch('https://api.buffer.com', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ query })
  });

  const text = await res.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    return { ok: false, error: `Buffer returned non-JSON response (HTTP ${res.status}): ${text.slice(0, 200)}` };
  }

  if (!res.ok || payload.errors?.length) {
    const errMsg = payload.errors ? payload.errors.map(e => e.message).join('; ') : `HTTP ${res.status}`;
    return { ok: false, error: errMsg, payload };
  }

  return { ok: true, data: payload.data };
}

async function queryRestProfiles(token) {
  try {
    const res = await fetch(`https://api.bufferapp.com/1/profiles.json?access_token=${encodeURIComponent(token)}`);
    if (!res.ok) return { ok: false };
    const list = await res.json();
    if (Array.isArray(list)) {
      return { ok: true, profiles: list };
    }
  } catch {
    // ignore
  }
  return { ok: false };
}

async function main() {
  console.log(`\n${colors.bold}${colors.cyan}══════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}📡 BUFFER CHANNEL DISCOVERY & ID INSPECTOR${colors.reset}`);
  console.log(`   Scanning connected Facebook, Instagram, and TikTok accounts...`);
  console.log(`${colors.bold}${colors.cyan}══════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

  if (!BUFFER_API_KEY) {
    console.log(`${colors.red}${colors.bold}❌ ERROR: BUFFER_API_KEY is not provided!${colors.reset}\n`);
    console.log(`${colors.bold}👉 HOW TO GET YOUR BUFFER API KEY IN 60 SECONDS:${colors.reset}`);
    console.log(` 1. Log in to your Buffer account at ${colors.cyan}https://publish.buffer.com${colors.reset}`);
    console.log(` 2. Go to Settings or visit: ${colors.cyan}https://buffer.com/developers/api${colors.reset}`);
    console.log(` 3. Generate or copy your Access Token (e.g. 1/xxxx or personal token).`);
    console.log(` 4. Add it to GitHub:`);
    console.log(`    Repository -> Settings -> Secrets and variables -> Actions -> New secret`);
    console.log(`    Name:  ${colors.yellow}BUFFER_API_KEY${colors.reset}`);
    console.log(`    Value: ${colors.yellow}<paste your token here>${colors.reset}\n`);
    console.log(` 5. Then re-run this workflow! It will print all your channel IDs here.\n`);
    process.exit(1);
  }

  console.log(`Connecting to Buffer using provided token (${BUFFER_API_KEY.slice(0, 6)}...${BUFFER_API_KEY.slice(-4)})...`);

  // Try GraphQL first
  const gqlResult = await queryGraphQLChannels(BUFFER_API_KEY);
  let allChannels = [];
  let userEmail = '';

  if (gqlResult.ok && gqlResult.data?.account) {
    userEmail = gqlResult.data.account.email || '';
    const orgs = gqlResult.data.account.organizations || [];
    for (const org of orgs) {
      for (const ch of (org.channels || [])) {
        allChannels.push({
          id: ch.id,
          name: ch.displayName || ch.name,
          service: (ch.service || '').toLowerCase(),
          isDisconnected: Boolean(ch.isDisconnected),
          isLocked: Boolean(ch.isLocked),
          orgName: org.name
        });
      }
    }
  } else {
    // Fallback to classic REST API
    const restResult = await queryRestProfiles(BUFFER_API_KEY);
    if (restResult.ok && restResult.profiles) {
      allChannels = restResult.profiles.map(p => ({
        id: p.id || p._id,
        name: p.formatted_username || p.service_username || p.service,
        service: (p.service || '').toLowerCase(),
        isDisconnected: Boolean(p.disconnected),
        isLocked: Boolean(p.locked),
        orgName: 'Default Organization'
      }));
    } else {
      console.error(`\n${colors.red}${colors.bold}❌ Failed to authenticate with Buffer API!${colors.reset}`);
      console.error(`Details: ${gqlResult.error || 'Invalid credentials'}\n`);
      console.log(`${colors.yellow}Please make sure your BUFFER_API_KEY is valid and has read permissions.${colors.reset}\n`);
      process.exit(1);
    }
  }

  if (userEmail) {
    console.log(`${colors.green}✔ Authenticated as:${colors.reset} ${userEmail}\n`);
  }

  if (allChannels.length === 0) {
    console.log(`${colors.yellow}${colors.bold}⚠️ No connected channels found in your Buffer account!${colors.reset}\n`);
    console.log(`To connect your social pages:`);
    console.log(` 1. Visit: ${colors.cyan}https://publish.buffer.com/channels${colors.reset}`);
    console.log(` 2. Click "+ Connect Channel"`);
    console.log(` 3. Connect your:`);
    console.log(`    - Facebook Page`);
    console.log(`    - Instagram Business / Creator Account (for Reels)`);
    console.log(`    - TikTok Account`);
    console.log(` 4. Re-run this workflow to get your IDs.\n`);
    process.exit(0);
  }

  console.log(`${colors.bold}Found ${allChannels.length} total channel(s) in Buffer:\n${colors.reset}`);

  // Group by service
  const categorized = {
    facebook: [],
    instagram: [],
    tiktok: [],
    other: []
  };

  for (const ch of allChannels) {
    if (ch.service.includes('facebook')) categorized.facebook.push(ch);
    else if (ch.service.includes('instagram')) categorized.instagram.push(ch);
    else if (ch.service.includes('tiktok')) categorized.tiktok.push(ch);
    else categorized.other.push(ch);
  }

  // Display Table
  console.log(`┌────────────────────┬──────────────────────────────────────┬──────────────────────────────────────────┬───────────┐`);
  console.log(`│ ${colors.bold}PLATFORM${colors.reset}           │ ${colors.bold}ACCOUNT / PAGE NAME${colors.reset}                  │ ${colors.bold}BUFFER CHANNEL ID (COPY THIS)${colors.reset}            │ ${colors.bold}STATUS${colors.reset}    │`);
  console.log(`├────────────────────┼──────────────────────────────────────┼──────────────────────────────────────────┼───────────┤`);

  const printRow = (platform, name, id, status, isGood) => {
    const pStr = platform.padEnd(18).slice(0, 18);
    const nStr = name.padEnd(36).slice(0, 36);
    const idStr = id.padEnd(40).slice(0, 40);
    const sStr = (isGood ? `${colors.green}${status}${colors.reset}` : `${colors.red}${status}${colors.reset}`).padEnd(isGood ? 18 : 18);
    console.log(`│ ${pStr} │ ${nStr} │ ${colors.yellow}${idStr}${colors.reset} │ ${sStr} │`);
  };

  for (const ch of categorized.facebook) {
    const status = ch.isDisconnected ? 'Disconnected' : ch.isLocked ? 'Locked' : 'Active';
    printRow('Facebook Page', ch.name, ch.id, status, status === 'Active');
  }

  for (const ch of categorized.instagram) {
    const status = ch.isDisconnected ? 'Disconnected' : ch.isLocked ? 'Locked' : 'Active';
    printRow('Instagram (Reels)', ch.name, ch.id, status, status === 'Active');
  }

  for (const ch of categorized.tiktok) {
    const status = ch.isDisconnected ? 'Disconnected' : ch.isLocked ? 'Locked' : 'Active';
    printRow('TikTok Account', ch.name, ch.id, status, status === 'Active');
  }

  for (const ch of categorized.other) {
    const status = ch.isDisconnected ? 'Disconnected' : ch.isLocked ? 'Locked' : 'Active';
    printRow(ch.service.toUpperCase(), ch.name, ch.id, status, status === 'Active');
  }

  console.log(`└────────────────────┴──────────────────────────────────────┴──────────────────────────────────────────┴───────────┘\n`);

  console.log(`${colors.bold}${colors.cyan}══════════════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}📋 READY-TO-COPY GITHUB ACTIONS SECRETS${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}══════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);
  console.log(`You can add these optional channel IDs to your GitHub Repository Secrets:`);
  console.log(`(Go to: GitHub Repo -> Settings -> Secrets and variables -> Actions -> New repository secret)\n`);

  if (categorized.facebook.length > 0) {
    const activeFb = categorized.facebook.find(c => !c.isDisconnected && !c.isLocked) || categorized.facebook[0];
    console.log(`${colors.bold}1. Facebook Page ID:${colors.reset}`);
    console.log(`   Name:  ${colors.yellow}BUFFER_FACEBOOK_CHANNEL_ID${colors.reset}`);
    console.log(`   Value: ${colors.green}${activeFb.id}${colors.reset}  (${activeFb.name})\n`);
  } else {
    console.log(`${colors.dim}• No Facebook page found. Connect one in Buffer to enable Facebook auto-posting.${colors.reset}\n`);
  }

  if (categorized.instagram.length > 0) {
    const activeIg = categorized.instagram.find(c => !c.isDisconnected && !c.isLocked) || categorized.instagram[0];
    console.log(`${colors.bold}2. Instagram Page / Reels ID:${colors.reset}`);
    console.log(`   Name:  ${colors.yellow}BUFFER_INSTAGRAM_CHANNEL_ID${colors.reset}`);
    console.log(`   Value: ${colors.green}${activeIg.id}${colors.reset}  (${activeIg.name})\n`);
  } else {
    console.log(`${colors.dim}• No Instagram account found. Connect one in Buffer to enable Instagram Reels auto-posting.${colors.reset}\n`);
  }

  if (categorized.tiktok.length > 0) {
    const activeTt = categorized.tiktok.find(c => !c.isDisconnected && !c.isLocked) || categorized.tiktok[0];
    console.log(`${colors.bold}3. TikTok Channel ID:${colors.reset}`);
    console.log(`   Name:  ${colors.yellow}BUFFER_TIKTOK_CHANNEL_ID${colors.reset}`);
    console.log(`   Value: ${colors.green}${activeTt.id}${colors.reset}  (${activeTt.name})\n`);
  } else {
    console.log(`${colors.dim}• No TikTok account found. Connect one in Buffer to enable TikTok auto-posting.${colors.reset}\n`);
  }

  console.log(`${colors.bold}💡 Tip:${colors.reset} Even if you don't set these individual IDs, Archie's omnichannel dispatcher`);
  console.log(`automatically auto-discovers and posts to all active Facebook, Instagram, and TikTok channels!`);
  console.log(`${colors.bold}${colors.cyan}══════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);
}

main().catch(err => {
  console.error('[Error]:', err);
  process.exit(1);
});
