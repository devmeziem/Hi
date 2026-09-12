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

// Automatically sanitize token: strip surrounding quotes, strip leading 'Bearer ', trim whitespace
function sanitizeToken(raw) {
  if (!raw) return '';
  let token = String(raw).trim();
  token = token.replace(/^["']|["']$/g, '').trim();
  token = token.replace(/^Bearer\s+/i, '').trim();
  return token;
}

const BUFFER_API_KEY = sanitizeToken(RAW_BUFFER_API_KEY);

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
  try {
    // 1. Get organizations
    const orgsQuery = `query GetOrganizations {
      account {
        id
        email
        organizations {
          id
          name
        }
      }
    }`;

    const resOrgs = await fetch('https://api.buffer.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ query: orgsQuery })
    });

    const orgsText = await resOrgs.text();
    let orgsPayload = {};
    try {
      orgsPayload = JSON.parse(orgsText);
    } catch {
      return { ok: false, error: `Buffer non-JSON response (HTTP ${resOrgs.status}): ${orgsText.slice(0, 150)}` };
    }

    if (!resOrgs.ok || orgsPayload.errors?.length) {
      const errMsg = orgsPayload.errors ? orgsPayload.errors.map(e => e.message).join('; ') : `HTTP ${resOrgs.status}`;
      return { ok: false, error: errMsg };
    }

    const orgs = orgsPayload.data?.account?.organizations || [];
    const allChannels = [];

    // 2. Get channels for each organization
    for (const org of orgs) {
      const chQuery = `query GetChannels($organizationId: OrganizationId!) {
        channels(organizationId: $organizationId) {
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

      try {
        const resCh = await fetch('https://api.buffer.com', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ query: chQuery, variables: { organizationId: org.id } })
        });

        const chText = await resCh.text();
        const chPayload = JSON.parse(chText);
        const chList = chPayload?.data?.channels || [];
        for (const ch of chList) {
          allChannels.push({
            ...ch,
            orgName: org.name
          });
        }
      } catch (err) {
        // continue
      }
    }

    // 3. Fallback: if no channels from orgs, try root channels query
    if (allChannels.length === 0) {
      try {
        const rootChQuery = `query GetAllChannels {
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
        }`;
        const resRoot = await fetch('https://api.buffer.com', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ query: rootChQuery })
        });
        const rootText = await resRoot.text();
        const rootPayload = JSON.parse(rootText);
        const rootList = rootPayload?.data?.channels || [];
        for (const ch of rootList) {
          allChannels.push({ ...ch, orgName: 'Default Workspace' });
        }
      } catch {
        // continue
      }
    }

    return {
      ok: true,
      data: {
        account: {
          email: orgsPayload.data?.account?.email || '',
          channels: allChannels
        }
      }
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function queryRestProfiles(token) {
  // Method A: query param
  try {
    const res = await fetch(`https://api.bufferapp.com/1/profiles.json?access_token=${encodeURIComponent(token)}`);
    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list)) {
        return { ok: true, profiles: list, method: 'REST query param' };
      }
    }
  } catch {
    // try header next
  }

  // Method B: Authorization header
  try {
    const res = await fetch('https://api.bufferapp.com/1/profiles.json', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
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

  // Try GraphQL first
  const gqlResult = await queryGraphQLChannels(BUFFER_API_KEY);
  let allChannels = [];
  let userEmail = '';

  let authMode = '';

  if (gqlResult.ok && gqlResult.data?.account) {
    authMode = 'Modern GraphQL API (api.buffer.com)';
    userEmail = gqlResult.data.account.email || '';
    allChannels = (gqlResult.data.account.channels || []).map(ch => ({
      id: ch.id,
      name: ch.displayName || ch.name,
      service: (ch.service || '').toLowerCase(),
      isDisconnected: Boolean(ch.isDisconnected),
      isLocked: Boolean(ch.isLocked),
      orgName: ch.orgName || 'Workspace'
    }));
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
      console.error(`REST Attempt Error:    ${restResult.error || 'Unknown REST error'}\n`);
      console.log(`${colors.yellow}👉 Tips:${colors.reset}`);
      console.log(` 1. If you are using a token from another project, ensure it is active in your Buffer Account settings.`);
      console.log(` 2. You can generate a fresh API token anytime at https://publish.buffer.com or https://buffer.com/developers/api`);
      console.log(` 3. Make sure there are no accidental spaces or leading words like "Bearer " in your secret.\n`);
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
