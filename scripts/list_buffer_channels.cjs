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

const RAW_BUFFER_API_KEY = String(process.env.BUFFER_API_KEY || '').trim();
const RAW_BUFFER_ORG_ID = String(process.env.BUFFER_ORGANIZATION_ID || '').trim();

// Automatically sanitize token: strip surrounding quotes, strip leading 'Bearer ', trim whitespace
function sanitizeToken(raw) {
  if (!raw) return '';
  let token = String(raw).trim();
  token = token.replace(/^["']|["']$/g, '').trim();
  token = token.replace(/^Bearer\s+/i, '').trim();
  return token;
}

const BUFFER_API_KEY = sanitizeToken(RAW_BUFFER_API_KEY);
const BUFFER_ORGANIZATION_ID = sanitizeToken(RAW_BUFFER_ORG_ID);

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

async function executeBufferGraphQL(token, query, variables = {}) {
  const res = await fetch('https://api.buffer.com', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ query, variables })
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
    return { ok: false, error: errMsg, payload, status: res.status };
  }

  return { ok: true, data: payload.data };
}

async function queryGraphQLChannels(token, directOrgId = '') {
  const allChannels = [];
  let userEmail = '';
  let organizationsFound = [];

  // If a direct organization ID is provided, query channels directly
  if (directOrgId) {
    console.log(`Using explicitly provided organization ID: ${directOrgId}`);
    organizationsFound = [{ id: directOrgId, name: 'Provided Organization' }];
  } else {
    // Step 1: Query user account and organizations (Buffer GraphQL hierarchy)
    const orgsQuery = `query GetBufferOrganizations {
      account {
        id
        email
        name
        organizations {
          id
          name
          channelCount
        }
      }
    }`;

    let orgsRes = await executeBufferGraphQL(token, orgsQuery);

    // If full account query fails, try minimal organizations query
    if (!orgsRes.ok) {
      const minimalQuery = `query GetBufferOrganizationsMinimal {
        account {
          organizations {
            id
            name
          }
        }
      }`;
      const minimalRes = await executeBufferGraphQL(token, minimalQuery);
      if (minimalRes.ok) {
        orgsRes = minimalRes;
      }
    }

    if (!orgsRes.ok) {
      return {
        ok: false,
        error: orgsRes.error,
        details: orgsRes.payload
      };
    }

    userEmail = orgsRes.data?.account?.email || '';
    organizationsFound = orgsRes.data?.account?.organizations || [];
  }

  if (organizationsFound.length === 0) {
    return {
      ok: true,
      channels: [],
      userEmail,
      organizations: []
    };
  }

  // Step 2: Fetch channels for each organization using the root channels query
  const channelsQuery = `query GetChannelsForOrg($input: ChannelsInput!) {
    channels(input: $input) {
      id
      name
      displayName
      service
      serviceId
      avatar
      isDisconnected
      isLocked
    }
  }`;

  for (const org of organizationsFound) {
    const chRes = await executeBufferGraphQL(token, channelsQuery, {
      input: { organizationId: org.id }
    });

    if (chRes.ok && Array.isArray(chRes.data?.channels)) {
      for (const ch of chRes.data.channels) {
        allChannels.push({
          id: ch.id,
          name: ch.displayName || ch.name,
          service: (ch.service || '').toLowerCase(),
          isDisconnected: Boolean(ch.isDisconnected),
          isLocked: Boolean(ch.isLocked),
          orgName: org.name
        });
      }
    } else if (chRes.error) {
      console.warn(`[Warning] Could not retrieve channels for organization ${org.name || org.id}: ${chRes.error}`);
    }
  }

  return {
    ok: true,
    channels: allChannels,
    userEmail,
    organizations: organizationsFound
  };
}

async function queryRestProfiles(token) {
  // Legacy REST API fallback (Only works for older legacy Buffer REST apps)
  try {
    const res = await fetch(`https://api.bufferapp.com/1/profiles.json?access_token=${encodeURIComponent(token)}`);
    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list)) {
        return { ok: true, profiles: list, method: 'REST query param' };
      }
    }
  } catch {}

  try {
    const res = await fetch('https://api.bufferapp.com/1/profiles.json', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list)) {
        return { ok: true, profiles: list, method: 'REST Bearer header' };
      }
    }
    const errText = await res.text();
    return { ok: false, error: `REST HTTP ${res.status}: ${errText.slice(0, 200)}` };
  } catch (err) {
    return { ok: false, error: err.message };
  }
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

  // Try Modern GraphQL first (using two-step Organization -> Channels query)
  const gqlResult = await queryGraphQLChannels(BUFFER_API_KEY, BUFFER_ORGANIZATION_ID);
  let allChannels = [];
  let userEmail = '';
  let authMode = '';

  if (gqlResult.ok) {
    authMode = 'Modern GraphQL API (api.buffer.com)';
    userEmail = gqlResult.userEmail || '';
    allChannels = gqlResult.channels || [];
  } else {
    // Fallback to classic REST API
    const restResult = await queryRestProfiles(BUFFER_API_KEY);
    if (restResult.ok && restResult.profiles) {
      authMode = `Classic REST API (api.bufferapp.com - via ${restResult.method})`;
      allChannels = restResult.profiles.map(p => ({
        id: p.id || p._id,
        name: p.formatted_username || p.service_username || p.service,
        service: (p.service || '').toLowerCase(),
        isDisconnected: Boolean(p.disconnected),
        isLocked: Boolean(p.locked),
        orgName: 'Default Workspace'
      }));
    } else {
      console.error(`\n${colors.red}${colors.bold}❌ Failed to authenticate with Buffer API!${colors.reset}`);
      console.error(`GraphQL Attempt Error: ${gqlResult.error || 'Unknown GraphQL error'}`);
      if (restResult.error) {
        console.error(`REST Attempt Notice:   ${restResult.error}`);
      }

      console.log(`\n${colors.yellow}${colors.bold}👉 WHY THIS HAPPENS & HOW TO RESOLVE IN 60 SECONDS:${colors.reset}`);
      console.log(` 1. ${colors.bold}Unverified Buffer Email Address:${colors.reset}`);
      console.log(`    Buffer's new GraphQL API strictly enforces that your account email is verified.`);
      console.log(`    Log in to ${colors.cyan}https://publish.buffer.com${colors.reset} -> Check if there is an "Unverified Email" notification banner.`);
      console.log(` 2. ${colors.bold}Personal Access Token vs Legacy App Client:${colors.reset}`);
      console.log(`    Buffer deprecated REST API keys on February 1, 2027 ("Public API tokens are not accepted for REST API access").`);
      console.log(`    Generate a fresh Personal Access Token at: ${colors.cyan}https://publish.buffer.com/settings/api${colors.reset}`);
      console.log(` 3. ${colors.bold}Optional Organization ID:${colors.reset}`);
      console.log(`    If your account belongs to a team or multiple organizations, you can provide:`);
      console.log(`    ${colors.yellow}BUFFER_ORGANIZATION_ID="your_org_id"${colors.reset} to query channels directly.`);
      console.log(` 4. Verify that your connected channels (Facebook Page, Instagram, TikTok) are active at:`);
      console.log(`    ${colors.cyan}https://publish.buffer.com/channels${colors.reset}\n`);
      process.exit(1);
    }
  }

  console.log(`${colors.green}✔ Authenticated successfully via: ${authMode}${colors.reset}`);
  if (userEmail) {
    console.log(`${colors.green}✔ Account email:${colors.reset} ${userEmail}\n`);
  } else {
    console.log('');
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
